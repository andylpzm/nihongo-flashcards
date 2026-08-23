// one picker, two targets.
//
// the avatar and the banner differ in about five things - frame shape, tile
// shape, whether a phone photo is allowed, what clearing is called, and whether
// a size preview is useful. everything else (the sheet, the category tabs, the
// grid, the drag-and-zoom editor, the stored position model) is identical, so
// it lives here once and takes a config rather than being written twice.

import { createModal, type ModalController } from './modal';
import { placement, coverScale, MAX_SCALE, DEFAULT_POS, type ImagePos } from '../state/imagePos';
import type { PickableImage } from '../srs/gallery';

export type PickerTarget = 'avatar' | 'banner';

export interface PickerConfig {
  target: PickerTarget;
  title: string;
  /** aspect of the frame the picture ends up in: 1 for the avatar */
  frameAspect: number;
  round: boolean;
  /** css aspect-ratio for the grid tiles */
  tileAspect: string;
  columns: number;
  /** the avatar can come from the camera roll; the banner cannot */
  allowPhoto: boolean;
  /**
   * a live clone of the surface the picture ends up in, used as the editing
   * surface itself. the banner passes the profile card, so you position the
   * art behind the real avatar, name and fade rather than in a bare box.
   */
  preview?: { node: HTMLElement; frameSelector: string; width: number } | null;
  clearLabel: string;
  pictures: PickableImage[];
  current: { image: string; pos: ImagePos };
  onSave(image: string, pos: ImagePos, file: File | null): Promise<void> | void;
  onClear(): Promise<void> | void;
}

const CATEGORIES = [
  { key: 'all', label: 'All', kinds: null as string[] | null },
  { key: 'chapter', label: 'Pages', kinds: ['chapter'] },
  { key: 'cover', label: 'Covers', kinds: ['cover'] },
  { key: 'spread', label: 'Arc rewards', kinds: ['spread', 'custom'] },
];

const ICON = {
  camera:
    '<path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z"/>',
  gallery:
    '<path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14zM8.5 12.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/>',
  trash: '<path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>',
  person:
    '<path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5c0-3-4-5.5-9-5.5z"/>',
  move: '<path d="M13 6v5h5V9l3 3-3 3v-2h-5v5h2l-3 3-3-3h2v-5H6v2l-3-3 3-3v2h5V6H9l3-3 3 3h-2z"/>',
  reset: '<path d="M12 5V2L8 6l4 4V7a5 5 0 11-5 5H5a7 7 0 107-7z"/>',
  minus: '<path d="M19 13H5v-2h14v2z"/>',
  plus: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
  warn: '<path d="M12 2L1 21h22L12 2zm1 15h-2v-2h2v2zm0-4h-2V9h2v4z"/>',
};

const svg = (path: string): string => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;

/**
 * one modal per overlay, not one per open.
 *
 * createModal wires drag-to-dismiss every time it is called, so calling it on
 * each open stacks a fresh set of those handlers on the same element.
 */
const modals = new WeakMap<HTMLElement, { modal: ModalController; setOnClose(fn: () => void): void }>();

function modalFor(overlay: HTMLElement): { modal: ModalController; setOnClose(fn: () => void): void } {
  const existing = modals.get(overlay);
  if (existing) return existing;
  let onClose: () => void = () => {};
  const modal = createModal(overlay, { onClose: () => onClose() });
  const entry = { modal, setOnClose: (fn: () => void) => { onClose = fn; } };
  modals.set(overlay, entry);
  return entry;
}

/** listeners from the previous open, dropped before this one wires its own */
let liveListeners: AbortController | null = null;

export function openImagePicker(overlay: HTMLElement, config: PickerConfig): ModalController {
  const { modal, setOnClose } = modalFor(overlay);
  const body = overlay.querySelector<HTMLElement>('.picker-body');
  if (!body) return modal;
  const sheet: HTMLElement = body;

  // the sheet is shared between the avatar and the banner, so a listener left
  // behind by the previous open would still be holding that target's config -
  // and one tap on Save would then write both of them
  liveListeners?.abort();
  const listeners = new AbortController();
  liveListeners = listeners;
  const signal = listeners.signal;
  setOnClose(() => {
    revokeChosen();
    listeners.abort();
  });

  // a chosen photo lives as an object url only until the sheet closes
  let chosenFile: File | null = null;
  let chosenUrl = '';
  const revokeChosen = (): void => {
    if (chosenUrl) URL.revokeObjectURL(chosenUrl);
    chosenUrl = '';
    chosenFile = null;
  };

  let selected = config.current.image;
  let category = 'all';

  const counts = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const c of CATEGORIES) {
      out[c.key] = c.kinds
        ? config.pictures.filter((p) => c.kinds!.includes(p.kind)).length
        : config.pictures.length;
    }
    return out;
  };

  function showMenu(): void {
    const n = config.pictures.length;
    const hasCurrent = Boolean(config.current.image);
    sheet.innerHTML = `
      <div class="pk-head"><h3>${config.title}</h3></div>
      <div class="pk-current">
        <span class="pk-ring">${
          hasCurrent
            ? `<img src="${config.current.image}" alt="">`
            : `<span class="pk-blank">${svg(ICON.person)}</span>`
        }</span>
        <div>
          <b>${hasCurrent ? 'Your picture' : 'No picture yet'}</b>
          <span>${hasCurrent ? 'tap an option below to change it' : 'pick one and it shows on your card'}</span>
        </div>
      </div>
      ${
        config.allowPhoto
          ? `<button class="pk-opt" data-act="photo">
               <span class="pk-ic">${svg(ICON.camera)}</span>
               <span class="pk-txt"><b>Choose a photo</b><span>from your phone</span></span>
               <span class="pk-chev">›</span>
             </button>`
          : ''
      }
      <button class="pk-opt" data-act="gallery"${n === 0 ? ' disabled' : ''}>
        <span class="pk-ic">${svg(ICON.gallery)}</span>
        <span class="pk-txt"><b>Use a card I unlocked</b><span>${
          n === 0 ? 'finish a session to unlock your first' : `${n} available`
        }</span></span>
        ${n === 0 ? '' : '<span class="pk-chev">›</span>'}
      </button>
      ${
        hasCurrent
          ? `<button class="pk-opt pk-danger" data-act="clear">
               <span class="pk-ic">${svg(ICON.trash)}</span>
               <span class="pk-txt"><b>${config.clearLabel}</b><span>back to the silhouette</span></span>
             </button>`
          : ''
      }`;
  }

  function showGrid(): void {
    const c = counts();
    sheet.innerHTML = `
      <div class="pk-head"><button class="pk-back" data-act="menu" aria-label="Back">‹</button><h3>Your cards</h3></div>
      <p class="pk-sub">${config.pictures.length} unlocked</p>
      <div class="pk-tabs" role="tablist">
        ${CATEGORIES.map(
          (cat) =>
            `<button class="pk-tab${cat.key === category ? ' is-on' : ''}" role="tab" data-cat="${cat.key}">${cat.label}<i>${c[cat.key]}</i></button>`
        ).join('')}
      </div>
      <div class="pk-grid" style="--pk-cols:${config.columns};--pk-tile:${config.tileAspect}">
        ${visible()
          .map(
            (p) =>
              `<button class="pk-tile${p.image === selected ? ' is-sel' : ''}" data-img="${p.image}" aria-label="${p.label}">
                 <img src="${p.thumb || p.image}" alt="" loading="lazy">
               </button>`
          )
          .join('')}
      </div>
      <button class="pk-primary" data-act="position"${selected ? '' : ' disabled'}>Position it ›</button>`;
  }

  const visible = (): PickableImage[] => {
    const cat = CATEGORIES.find((c) => c.key === category);
    if (!cat?.kinds) return config.pictures;
    return config.pictures.filter((p) => cat.kinds!.includes(p.kind));
  };

  // ---- the editor -------------------------------------------------------
  let pos: ImagePos = { ...config.current.pos };
  let natural = { w: 0, h: 0 };

  function showEditor(src: string, isPhoto: boolean): void {
    sheet.innerHTML = `
      <div class="pk-head"><button class="pk-back" data-act="${isPhoto ? 'menu' : 'grid'}" aria-label="Back">‹</button><h3>Position</h3></div>
      <div class="pk-stage${config.round ? ' is-round' : ''}">
        ${
          config.preview
            ? '<div class="pk-cardwrap" id="pk-cardwrap"></div>'
            : `<div class="pk-frame" id="pk-frame" style="--pk-aspect:${config.frameAspect}">
                 <img id="pk-img" src="${src}" alt="">
                 <span class="pk-thirds"></span>
                 <span class="pk-hint">${svg(ICON.move)}Drag to move</span>
               </div>`
        }
      </div>
      ${
        config.round
          ? `<div class="pk-sizes">
               <span class="pk-mirror"><img id="pk-mirror" src="${src}" alt=""></span>
               <p>actual size on your<br>profile card &mdash; 70px</p>
             </div>`
          : ''
      }
      <div class="pk-zoom">
        ${svg(ICON.minus)}
        <input type="range" id="pk-range" min="100" max="${MAX_SCALE * 100}" value="100" aria-label="Zoom">
        ${svg(ICON.plus)}
        <button class="pk-reset" data-act="reset" aria-label="Reset to center">${svg(ICON.reset)}</button>
      </div>
      <button class="pk-primary" data-act="save">Save</button>`;

    if (config.preview) mountPreview(src);

    const img = sheet.querySelector<HTMLImageElement>('#pk-img')!;
    const range = sheet.querySelector<HTMLInputElement>('#pk-range')!;
    const ready = (): void => {
      natural = { w: img.naturalWidth, h: img.naturalHeight };
      if (pos.scale <= 0) pos = { ...pos, scale: minScale() };
      range.min = String(Math.round(minScale() * 100));
      range.value = String(Math.round(pos.scale * 100));
      render();
    };
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener('load', ready, { once: true });

    range.addEventListener('input', () => {
      pos = { ...pos, scale: Number(range.value) / 100 };
      render();
    }, { signal });
    attachDrag(sheet.querySelector<HTMLElement>('#pk-frame')!);
  }

  /**
   * drops the cloned card in and turns its own art area into the drag frame.
   *
   * built at the card's real width and then scaled as a whole - shrinking it
   * any other way changes the art's aspect, and then the crop set here is not
   * the crop the card shows.
   */
  function mountPreview(src: string): void {
    const preview = config.preview;
    const wrap = sheet.querySelector<HTMLElement>('#pk-cardwrap');
    if (!preview || !wrap) return;

    const card = preview.node;
    // a clone carries every id with it, and a duplicate id silently steals
    // getElementById from the real page underneath
    for (const el of card.querySelectorAll('[id]')) el.removeAttribute('id');
    card.removeAttribute('id');

    const frame = card.querySelector<HTMLElement>(preview.frameSelector);
    if (!frame) return;
    frame.innerHTML = `<img id="pk-img" src="${src}" alt=""><span class="pk-thirds"></span><span class="pk-hint">${svg(ICON.move)}Drag to move</span>`;
    frame.id = 'pk-frame';
    frame.classList.add('pk-frame', 'is-live');

    card.style.width = `${preview.width}px`;
    card.style.transformOrigin = 'top left';
    wrap.appendChild(card);

    const fit = wrap.clientWidth / preview.width;
    card.style.transform = `scale(${fit})`;
    // measured after scaling rather than multiplied out: rounding the product
    // down clips the card's own rounded corners off the bottom
    wrap.style.height = `${Math.ceil(card.getBoundingClientRect().height)}px`;
    previewFit = fit;
  }

  /** pointer deltas are in screen px; the scaled card needs them in its own */
  let previewFit = 1;

  const frameBox = (): { w: number; h: number } => {
    const frame = sheet.querySelector<HTMLElement>('#pk-frame');
    // content box, not the border box - a ring around the frame is not part of it
    return frame ? { w: frame.clientWidth, h: frame.clientHeight } : { w: 0, h: 0 };
  };

  const minScale = (): number => {
    const f = frameBox();
    return coverScale(natural.w, natural.h, f.w, f.h);
  };

  function render(): void {
    const f = frameBox();
    if (!f.w || !natural.w) return;
    const p = placement(pos, natural.w, natural.h, f.w, f.h);
    const img = sheet.querySelector<HTMLImageElement>('#pk-img');
    if (img) {
      img.style.width = `${p.width}px`;
      img.style.height = `${p.height}px`;
      img.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`;
    }
    const mirror = sheet.querySelector<HTMLImageElement>('#pk-mirror');
    if (mirror) {
      const box = mirror.parentElement!;
      const m = placement(pos, natural.w, natural.h, box.clientWidth, box.clientHeight);
      mirror.style.width = `${m.width}px`;
      mirror.style.height = `${m.height}px`;
      mirror.style.transform = `translate(calc(-50% + ${m.x}px), calc(-50% + ${m.y}px))`;
    }
  }

  function attachDrag(frame: HTMLElement): void {
    let dragging = false;
    let px = 0;
    let py = 0;
    frame.addEventListener('pointerdown', (e) => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      frame.classList.add('is-drag');
      frame.setPointerCapture(e.pointerId);
    }, { signal });
    frame.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const f = frameBox();
      const p = placement(pos, natural.w, natural.h, f.w, f.h);
      const mx = (p.width - f.w) / 2;
      const my = (p.height - f.h) / 2;
      const dx = (e.clientX - px) / previewFit;
      const dy = (e.clientY - py) / previewFit;
      if (mx > 0) pos = { ...pos, ox: clamp1(pos.ox + dx / mx) };
      if (my > 0) pos = { ...pos, oy: clamp1(pos.oy + dy / my) };
      px = e.clientX;
      py = e.clientY;
      render();
    }, { signal });
    // pointerup alone is not enough: ios cancels the pointer on a system
    // gesture or an incoming call and never sends one, leaving the picture
    // stuck to the finger
    const end = (): void => {
      dragging = false;
      frame.classList.remove('is-drag');
    };
    frame.addEventListener('pointerup', end, { signal });
    frame.addEventListener('pointercancel', end, { signal });
    window.addEventListener('blur', end, { signal });
  }

  const clamp1 = (v: number): number => Math.min(1, Math.max(-1, v));

  function showState(kind: 'busy' | 'error'): void {
    sheet.innerHTML =
      kind === 'busy'
        ? `<div class="pk-head"><h3>Your photo</h3></div>
           <div class="pk-state"><span class="pk-spin"></span><b>Preparing your photo</b><span>this stays on your phone</span></div>`
        : `<div class="pk-head"><button class="pk-back" data-act="menu" aria-label="Back">‹</button><h3>Your photo</h3></div>
           <div class="pk-state"><span class="pk-bad">${svg(ICON.warn)}</span><b>That card would not open</b>
             <span>Try a different one &mdash; JPEG, PNG and HEIC all work.</span></div>
           <button class="pk-primary" data-act="photo">Choose another</button>`;
  }

  async function pickPhoto(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      showState('busy');
      try {
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        revokeChosen();
        chosenFile = file;
        chosenUrl = URL.createObjectURL(file);
        pos = { ...DEFAULT_POS };
        showEditor(chosenUrl, true);
      } catch {
        showState('error');
      }
    }, { signal });
    input.click();
  }

  sheet.addEventListener('click', (e) => {
    // every screen here re-renders in place, which detaches the element that
    // was clicked. the modal's backdrop check runs afterwards and would then
    // see a target the sheet no longer contains, and close the whole picker.
    e.stopPropagation();
    const target = e.target as HTMLElement;
    const tab = target.closest<HTMLElement>('.pk-tab');
    if (tab) {
      category = tab.dataset.cat ?? 'all';
      showGrid();
      return;
    }
    const tile = target.closest<HTMLElement>('.pk-tile');
    if (tile) {
      selected = tile.dataset.img ?? '';
      for (const el of sheet.querySelectorAll('.pk-tile')) el.classList.toggle('is-sel', el === tile);
      sheet.querySelector<HTMLButtonElement>('.pk-primary')?.removeAttribute('disabled');
      return;
    }
    const act = target.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'menu') showMenu();
    else if (act === 'gallery') showGrid();
    else if (act === 'grid') showGrid();
    else if (act === 'photo') void pickPhoto();
    else if (act === 'reset') {
      pos = { scale: minScale(), ox: 0, oy: 0 };
      const range = sheet.querySelector<HTMLInputElement>('#pk-range');
      if (range) range.value = String(Math.round(pos.scale * 100));
      render();
    } else if (act === 'position') {
      pos = selected === config.current.image ? { ...config.current.pos } : { ...DEFAULT_POS };
      showEditor(selected, false);
    } else if (act === 'clear') {
      void Promise.resolve(config.onClear()).then(() => modal.close());
    } else if (act === 'save') {
      void Promise.resolve(config.onSave(chosenUrl || selected, pos, chosenFile)).then(() =>
        modal.close()
      );
    }
  }, { signal });

  showMenu();
  modal.open();
  return modal;
}
