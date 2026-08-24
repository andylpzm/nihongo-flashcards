// gallery section: saga -> arc -> chapters, with a full-screen viewer.
//
// thumbnails are small on purpose - the art is read by tapping to expand, not
// by squinting at a grid. locked pieces still show their shape and cost, since
// a visible goal motivates and a blank slot does not.

import { loadGallery } from '../data/loader';
import { buildGallery, progressToNext } from '../srs/gallery';
import type { ArcView, GalleryEntry, NextUp, PayoffEntry, SagaView } from '../srs/gallery';
import { getPointsState, hasSeen, loadProfile, markSeen, type SessionOutcome } from '../state/profile';
import { FeedbackAudio } from '../audio/feedback';
import { previewAll } from '../state/preview';
import { clearGalleryUnread } from './galleryBadge';
import { buildCard, cutRule, indexPictures, isLandscape, positionOf, refreshCuts } from './galleryCard';
import { mountTilt, type TiltHandle } from './cardTilt';
import { packGate, picturesReady, onPackChange } from './packPanel';

// connecting a pack mid-session fills the binder in rather than waiting for a
// tab switch. unconditional: the gate counts as drawn, and testing for it was
// the difference between the gate clearing and the gate sitting there.
onPackChange(() => {
  if (galleryBody) void renderGallery();
});

const galleryBody = document.getElementById('gallery-body');
const gallerySummary = document.getElementById('gallery-summary');


/** everything currently tappable, in display order - the viewer walks this */
interface ViewerItem {
  id: string;
  kind: string;
  image: string;
  thumb: string;
  label: string;
  sub: string;
}
let viewerItems: ViewerItem[] = [];
let viewerIndex = 0;
/** the profile as of this render, for deciding which cards are still wrapped */
let profile: Awaited<ReturnType<typeof loadProfile>> | null = null;

const isCover = (entry: GalleryEntry) => entry.kind === 'cover';
const pieceLabel = (entry: GalleryEntry) => `Card ${entry.index + 1}`;
const pieceDetail = (entry: GalleryEntry) =>
  isCover(entry)
    ? `Volume ${entry.volume} cover`
    : entry.volume
      ? `Chapter ${entry.chapter} · Volume ${entry.volume}`
      : `Chapter ${entry.chapter}`;

function thumb(entry: GalleryEntry, itemIndex: number, next: NextUp | null): string {
  const cover = isCover(entry);
  const land = isLandscape(entry.id, entry.kind);
  const slot = land ? ' is-land' : '';
  if (!entry.unlocked) {
    // the pocket you are working towards is outlined; a NEXT badge on top of
    // an already-highlighted pocket said the same thing twice
    const isNext = next?.entry.index === entry.index;
    // the next tile carries the same fill as the header bar, so the number up
    // top and the picture it buys are visibly the same thing
    const fill = isNext ? `<span class="g-tile-fill" style="height:${Math.round(next!.fraction * 100)}%"></span>` : '';
    // the total xp the picture costs, not what is left to earn. showing the
    // remainder made every arc look like it restarted near zero, because the
    // numbers shrink as you earn; the requirement is one continuous ladder.
    // .g-empty stands where the card would stand, and is sized by the same
    // rules - an empty pocket is the card's shape, not a box the size of the
    // gap it leaves
    return `<div class="g-slot is-locked${slot}${cover ? ' is-cover' : ''}${isNext ? ' is-next' : ''}">
      <span class="g-empty">
        ${fill}
        <span class="g-num">${entry.index + 1}</span>
        <span class="g-need">${entry.threshold.toLocaleString()}</span>
      </span>
    </div>`;
  }
  // an unseen picture stays wrapped. the mini card is NOT built for it - if the
  // art were sitting under a frosted pane it would flash for a frame when the
  // pane cleared, which is the spoiler this whole thing exists to avoid.
  const unseen = profile ? !hasSeen(profile, entry.id, positionOf(entry.id)) : false;
  return `<button class="g-slot${slot}${unseen ? ' is-wrapped' : ''}"
    data-item="${itemIndex}" data-card="${entry.id}"
    aria-label="${unseen ? 'New card, tap to reveal' : pieceLabel(entry)}"
    >${unseen ? frostPane() : ''}</button>`;
}

/** the card back: what a picture shows until it has been opened */
function frostPane(): string {
  return (
    '<span class="g-back">' +
    '<span class="g-back-wash"></span><span class="g-back-grain"></span>' +
    '<span class="g-back-ring"></span><span class="g-back-logo"></span>' +
    '</span>'
  );
}

/**
 * an arc is finished when every one of its pictures has been OPENED, not when
 * the points that unlocked them landed.
 *
 * the reward hangs off this. unlocking used to be enough, so the moment the
 * last piece was paid for the reward became tappable - and you could take it
 * before looking at a single card it was supposed to be the reward for.
 */
function arcFinished(arc: ArcView): boolean {
  return !!profile && arc.entries.every((e) => e.unlocked && hasSeen(profile!, e.id, positionOf(e.id)));
}

function payoffTile(payoff: PayoffEntry, arc: ArcView, itemIndex: number): string {
  if (!arcFinished(arc)) {
    // a covered frame: the shape the reward will occupy, veiled. reads as a
    // thing waiting to be uncovered rather than a notice.
    const left = arc.entries.filter((e) => !(e.unlocked && profile && hasSeen(profile, e.id, positionOf(e.id)))).length;
    return `<div class="g-slot is-locked is-reward${isLandscape(arc.id, payoff.kind) ? ' is-land' : ''}">
      <span class="g-empty">
        <span class="g-veil-mark">◈</span>
        <span class="g-veil-label">Arc reward</span>
        <span class="g-veil-count">${left} more</span>
      </span>
    </div>`;
  }
  const unseen = profile ? !hasSeen(profile, arc.id, positionOf(arc.id)) : false;
  return `<button class="g-slot g-payoff-slot${isLandscape(arc.id, payoff.kind) ? ' is-land' : ''}${
    unseen ? ' is-wrapped' : ''}"
    data-item="${itemIndex}" data-card="${arc.id}" aria-label="${arc.arc} reward">
    ${unseen ? frostPane() : ''}
  </button>`;
}

// which arc each picture belongs to. a reveal has to be able to ask whether it
// was the last one its arc was waiting for.
const arcOfPicture = new Map<string, ArcView>();

function arcBlock(arc: ArcView, next: NextUp | null): string {
  const tiles = arc.entries
    .map((entry) => {
      arcOfPicture.set(entry.id, arc);
      if (!entry.unlocked) return thumb(entry, -1, next);
      const i = viewerItems.length;
      viewerItems.push({
        id: entry.id,
        kind: entry.kind,
        image: entry.image,
        thumb: entry.thumb,
        label: pieceLabel(entry),
        sub: pieceDetail(entry),
      });
      return thumb(entry, i, next);
    })
    .join('');

  let payoff = '';
  if (arc.payoff) {
    let i = -1;
    if (arcFinished(arc)) {
      i = viewerItems.length;
      viewerItems.push({
        // an arc payoff is filed under the arc's own id, the same way the
        // framing tool numbered it
        id: arc.id,
        kind: arc.payoff.kind,
        image: arc.payoff.image,
        thumb: arc.payoff.thumb,
        label: arc.arc,
        sub: arc.payoff.kind === 'spread' ? 'Arc reward · double page spread' : 'Arc reward · volume cover',
      });
    }
    payoff = payoffTile(arc.payoff, arc, i);
  }

  return `<section class="g-arc${arc.complete ? ' is-complete' : ''}">
    <header class="g-arc-head">
      <div class="g-arc-title">
        <h3>${arc.arc}</h3>
      </div>
      <span class="g-count">${arc.unlockedCount}/${arc.total}</span>
    </header>
    <div class="g-bar"><i style="width:${arc.total ? (arc.unlockedCount / arc.total) * 100 : 0}%"></i></div>
    <div class="g-grid">${tiles}${payoff}</div>
  </section>`;
}

/**
 * only what has been reached is shown. everything past the current arc is a
 * single locked strip with no names or counts - seeing the whole structure up
 * front spoils both the story order and the surprise of what comes next.
 */
function sagaBlock(saga: SagaView, next: NextUp | null, state: RevealState): string {
  if (state.hiddenSagas.has(saga.id)) return '';

  const arcs = saga.arcs.filter((a) => !state.hiddenArcs.has(a.id));
  const hiddenHere = saga.arcs.length - arcs.length;

  // no saga heading: its count gave away how many pictures the saga holds, and
  // how many are still to come is the one thing the binder should not say
  return `<div class="g-saga">
    ${arcs.map((a) => arcBlock(a, next)).join('')}
    ${hiddenHere > 0 ? lockedStrip() : ''}
  </div>`;
}

function lockedStrip(): string {
  // the edge of what has been reached: ghost tiles receding into nothing, so it
  // reads as "more of these exist" without saying how many or what they are
  const ghosts = Array.from({ length: 6 }, (_, i) => `<span class="g-ghost" style="--i:${i}"></span>`).join('');
  return `<div class="g-locked-strip">
    <div class="g-ghost-row" aria-hidden="true">${ghosts}</div>
    <div class="g-locked-caption">
      <svg class="g-lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z"/></svg>
      <p>Keep studying to discover what comes next</p>
    </div>
  </div>`;
}

interface RevealState {
  hiddenArcs: Set<string>;
  hiddenSagas: Set<string>;
}

/**
 * an arc is shown once it has been reached: anything with an unlocked picture,
 * plus the one currently being worked on. a saga disappears entirely once none
 * of its arcs are visible.
 */
function computeReveal(view: SagaView[], next: NextUp | null): RevealState {
  const hiddenArcs = new Set<string>();
  const hiddenSagas = new Set<string>();
  let reached = true;

  for (const saga of view) {
    let anyVisible = false;
    for (const arc of saga.arcs) {
      const isCurrent = next ? arc.entries.some((e) => e.index === next.entry.index) : false;
      const started = arc.unlockedCount > 0;
      if (reached && (started || isCurrent || arc.complete)) {
        anyVisible = true;
        if (isCurrent) reached = false; // everything after the current arc is hidden
      } else {
        hiddenArcs.add(arc.id);
        reached = false;
      }
    }
    if (!anyVisible) hiddenSagas.add(saga.id);
  }
  return { hiddenArcs, hiddenSagas };
}

/** the header: points, what they are buying, and how far off it is */
function headerBlock(next: NextUp | null): string {
  // nothing left to earn, so there is nothing for a progress header to say.
  // "all 277 pictures found" was a whole card restating the saga and arc
  // counts sitting directly under it.
  if (!next) return '';
  // picture number rather than chapter/volume: the chapter it happens to be is
  // a spoiler about what is coming, and the number the user is chasing is the
  // position in the collection
  const label = `Card ${next.entry.index + 1}`;
  return `<div class="g-head">
    <div class="g-head-next">
      <span class="g-head-label">Next card</span>
      <span class="g-head-target">${label}</span>
    </div>
    <div class="g-head-bar"><i style="width:${Math.round(next.fraction * 100)}%"></i></div>
    <div class="g-head-nums">
      <span>${next.pointsInto.toLocaleString()} / ${next.to.toLocaleString()} xp</span>
      <span class="g-head-need">${next.pointsNeeded.toLocaleString()} xp to go</span>
    </div>
  </div>`;
}

export async function renderGallery(): Promise<void> {
  // opening the gallery is the thing the badge was waiting for
  clearGalleryUnread();
  if (!galleryBody) return;

  // no pictures, no binder. an empty gallery reads as a broken app, and the
  // counts would quietly spoil how much is still to come.
  if (!picturesReady()) {
    galleryBody.replaceChildren(packGate());
    if (gallerySummary) gallerySummary.innerHTML = '';
    viewerItems = [];
    return;
  }

  const sagas = await loadGallery();
  // card numbers come from position across the whole gallery, payoffs included
  indexPictures(sagas);
  const [{ summary }, profileNow] = await Promise.all([getPointsState(), loadProfile()]);
  profile = profileNow;
  const points = previewAll ? Number.MAX_SAFE_INTEGER : summary.total;
  const view = buildGallery(sagas, points);

  const next = progressToNext(sagas, points);
  // preview mode is for reviewing the art, so it shows everything
  const reveal = previewAll
    ? { hiddenArcs: new Set<string>(), hiddenSagas: new Set<string>() }
    : computeReveal(view, next);

  viewerItems = [];
  arcOfPicture.clear();
  galleryBody.innerHTML = view.map((sv) => sagaBlock(sv, next, reveal)).join('');

  if (gallerySummary) {
    gallerySummary.innerHTML = headerBlock(next);
  }

  galleryBody.querySelectorAll<HTMLElement>('[data-item]').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.classList.contains('is-wrapped')) revealSlot(el);
      else openViewer(Number(el.dataset.item));
    });
  });

  hydrateCards(galleryBody);
  // the mangaka's name is wider once Klee One arrives, which moves where the
  // bottom rule has to break
  document.fonts?.ready.then(() => {
    refreshCuts();
    galleryBody.querySelectorAll<HTMLElement>('.gc').forEach((c) => cutRule(c));
  });
}

/**
 * the first opening of a picture: the frost clears, then it goes straight to
 * full screen. the card underneath is built only now, so the art cannot show
 * for a frame before the reveal.
 */
async function revealSlot(slot: HTMLElement): Promise<void> {
  const id = slot.dataset.card;
  const item = viewerItems.find((v) => v.id === id);
  if (!id || !item) return;

  // the slot only fades. nothing is uncovered here - the whole point is that
  // the first sight of the picture is full screen, not a 100px thumbnail.
  slot.classList.add('is-opening');

  window.setTimeout(() => {
    const i = viewerItems.indexOf(item);
    if (i >= 0) openViewer(i, true);
  }, 240);

  await markSeen(id);
  if (profile && !profile.seenPictures.includes(id)) profile.seenPictures.push(id);

  // an arc is finished when its last picture has been LOOKED AT, not when the
  // points that bought it landed. announcing it at the end of the session told
  // you the arc was done while its final card was still sitting there wrapped.
  const arc = arcOfPicture.get(id);
  if (arc?.payoff && arc.entries.every((e) => e.unlocked && profile && hasSeen(profile, e.id, positionOf(e.id)))) {
    pendingArc = arc;
  }

  // the arc's reward tile is drawn from how many pictures are still unopened,
  // so it needs redrawing now that one fewer is. it waits for the viewer to
  // close: rebuilding the binder mid-reveal reshuffles viewerItems under the
  // arrows, and the payoff joining that list would shift every index after it.
  needsRedraw = true;

  // swap the frost for the real card while the viewer covers the screen, so the
  // binder is already correct when it closes
  window.setTimeout(() => {
    slot.classList.remove('is-wrapped', 'is-opening');
    slot.querySelector('.g-back')?.remove();
    if (!slot.dataset.filled) {
      slot.appendChild(buildCard(item, true));
      slot.dataset.filled = '1';
    }
  }, 700);
}

/**
 * fills the binder slots with real cards.
 *
 * 300 cards is a lot of DOM to build up front, and most of them are off screen
 * on a phone - so a slot only becomes a card when it is about to be seen.
 */
let slotWatcher: IntersectionObserver | null = null;
function hydrateCards(root: HTMLElement): void {
  slotWatcher?.disconnect();
  const byId = new Map(viewerItems.map((v) => [v.id, v]));

  const fill = (slot: HTMLElement): void => {
    if (slot.dataset.filled || slot.classList.contains('is-wrapped')) return;
    const item = byId.get(slot.dataset.card ?? '');
    if (!item) return;
    slot.dataset.filled = '1';
    slot.appendChild(buildCard(item, true));
  };

  slotWatcher = new IntersectionObserver(
    (entries, obs) => {
      for (const e of entries)
        if (e.isIntersecting) {
          fill(e.target as HTMLElement);
          obs.unobserve(e.target);
        }
    },
    { rootMargin: '400px 0px' }
  );
  root.querySelectorAll<HTMLElement>('.g-slot[data-card]').forEach((s) => slotWatcher!.observe(s));
}

/**
 * shows what a finished sitting unlocked.
 *
 * only a completed arc is announced. single pictures used to raise a toast as
 * well, which said the same thing as the count on the Gallery tab and then
 * vanished after three seconds whether it had been seen or not - the badge
 * waits until the pictures are actually looked at.
 */
/**
 * kept as the session's hand-off point, deliberately silent about arcs.
 *
 * finishing an arc is announced by the reveal of its last picture (see
 * revealSlot), not by the session that paid for it.
 */
export function announceSessionReward(_outcome: SessionOutcome): void {
  /* nothing to say here yet */
}

/** the arc payoff reveal: the one moment that gets an animation and a fanfare */
/**
 * an arc has been finished. it says so - it does NOT show the picture.
 *
 * this used to paint the payoff full screen the moment the session ended,
 * which spoiled the one card the whole tap-to-reveal ceremony was built for:
 * by the time you reached the binder you had already seen it. it also loaded
 * the artwork by file path, which does not exist once the pictures come from
 * a pack. it shows the card back instead, and the reveal waits in the gallery.
 */
function celebrateArc(arcName: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'arc-reveal';
  overlay.innerHTML = `
    <div class="arc-reveal-card">
      <div class="arc-reveal-back">${frostPane()}</div>
      <div class="arc-reveal-text">
        <span class="arc-reveal-kicker">Arc complete</span>
        <h3>${arcName}</h3>
        <p class="arc-reveal-hint">A reward is waiting in your gallery.</p>
        <button class="btn btn-primary arc-reveal-close">Continue</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));
  FeedbackAudio.playFanfare();

  const close = () => {
    overlay.classList.remove('is-open');
    setTimeout(() => overlay.remove(), 400);
  };
  overlay.querySelector('.arc-reveal-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}

// ---- viewer -------------------------------------------------------------

let viewerEl: HTMLElement | null = null;

function ensureViewer(): HTMLElement {
  if (viewerEl) return viewerEl;

  const el = document.createElement('div');
  el.className = 'g-viewer';
  el.innerHTML = `
    <div class="g-viewer-top">
      <button class="g-viewer-close" aria-label="Close">&times;</button>
    </div>
    <div class="g-viewer-stage"></div>
    <div class="g-viewer-nav">
      <button class="g-viewer-prev" aria-label="Previous">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14.5 5 7.5 12l7 7"/>
        </svg>
      </button>
      <button class="g-viewer-turn" aria-label="Turn the card upright" aria-pressed="false" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/>
          <path d="M20.5 3.6v5.2h-5.2"/>
        </svg>
      </button>
      <button class="g-viewer-bare" aria-label="Hide the card layout" aria-pressed="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M1.8 12S5.5 5 12 5s10.2 7 10.2 7-3.7 7-10.2 7S1.8 12 1.8 12Z"/>
          <circle cx="12" cy="12" r="3"/>
          <path class="g-eye-slash" d="M4 20 20 4"/>
        </svg>
      </button>
      <button class="g-viewer-next" aria-label="Next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M9.5 5 16.5 12l-7 7"/>
        </svg>
      </button>
    </div>`;
  document.body.appendChild(el);

  el.querySelector('.g-viewer-close')!.addEventListener('click', closeViewer);
  // strips the card back to art and border. it lives on the viewer, not the
  // card, so it survives paging to the next picture.
  el.querySelector('.g-viewer-bare')!.addEventListener('click', () => setBare(el, !el.classList.contains('is-bare')));
  // a landscape card in a portrait screen wastes most of the glass. turning it
  // upright trades the reading angle for roughly twice the picture.
  el.querySelector('.g-viewer-turn')!.addEventListener('click', () => setTurned(el, !el.classList.contains('is-turned')));
  el.querySelector('.g-viewer-prev')!.addEventListener('click', () => step(-1));
  el.querySelector('.g-viewer-next')!.addEventListener('click', () => step(1));
  // tapping the backdrop or the empty space around the image closes it
  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target === el || target.classList.contains('g-viewer-stage')) closeViewer();
  });

  // a firm pull down closes. sideways used to page, which fought the card
  // itself - the card tilts to a finger, so every drag across it was also a
  // half-committed page turn. the arrows page; the card is for handling.
  let sx = 0;
  let sy = 0;
  let tracking = false;
  el.addEventListener('pointerdown', (e) => {
    sx = e.clientX;
    sy = e.clientY;
    tracking = true;
  });
  el.addEventListener('pointerup', (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (dy > 90 && dy > Math.abs(dx)) closeViewer();
  });

  viewerEl = el;
  return el;
}

/**
 * strips the card back to art and border, or puts the layout back.
 *
 * every card starts with its layout on - a reveal of a bare card is not the
 * card, and it is the first sight of the picture that we would be spending.
 * so this is reset on every open and every page, never remembered.
 */
function setTurned(el: HTMLElement, on: boolean): void {
  el.classList.toggle('is-turned', on);
  const b = el.querySelector<HTMLButtonElement>('.g-viewer-turn');
  b?.setAttribute('aria-pressed', String(on));
  b?.setAttribute('aria-label', on ? 'Lay the card flat' : 'Turn the card upright');
}

function setBare(el: HTMLElement, on: boolean): void {
  el.classList.toggle('is-bare', on);
  const b = el.querySelector<HTMLButtonElement>('.g-viewer-bare');
  b?.setAttribute('aria-pressed', String(on));
  b?.setAttribute('aria-label', on ? 'Show the card layout' : 'Hide the card layout');
}

function showItem(index: number): void {
  const el = ensureViewer();
  viewerIndex = Math.max(0, Math.min(viewerItems.length - 1, index));
  const item = viewerItems[viewerIndex];
  if (!item) return;

  // before the card is built, so it is never seen bare even for a frame
  setBare(el, false);
  // the turn belongs to the card you turned, not to the viewer
  setTurned(el, false);
  const land = isLandscape(item.id, item.kind);
  el.querySelector<HTMLButtonElement>('.g-viewer-turn')!.hidden = !land;
  mountCard(el, item, veilNext);
  veilNext = false;
  el.querySelector<HTMLButtonElement>('.g-viewer-prev')!.disabled = nextRevealed(viewerIndex, -1) < 0;
  el.querySelector<HTMLButtonElement>('.g-viewer-next')!.disabled = nextRevealed(viewerIndex, 1) < 0;
}

// one card at a time: the previous one's tilt loop is released before the next
// is built, or every picture ever opened keeps a rAF running
let tilt: TiltHandle | null = null;
function mountCard(el: HTMLElement, item: ViewerItem, veiled = false): void {
  const stage = el.querySelector<HTMLElement>('.g-viewer-stage')!;
  tilt?.release();
  tilt = null;
  stage.innerHTML = '';
  stage.classList.toggle('is-land', isLandscape(item.id, item.kind));

  const frame = buildCard(item);
  stage.appendChild(frame);
  const card = frame.querySelector<HTMLElement>('.gc')!;

  if (veiled) {
    // the frame, the number, the logo all arrive intact - only the artwork is
    // under the light, and the light draws back off it
    const veil = document.createElement('span');
    veil.className = 'gc-veil';
    card.querySelector('.gc-win')?.appendChild(veil);

    // the shine goes on the CARD, not in the window with the veil: the light
    // has to cross the number, the wordmark and the author line too, or it
    // stops at the window's edge and leaves them sitting there unlit
    const shine = document.createElement('span');
    shine.className = 'gc-shine';
    card.appendChild(shine);

    // the bloom lives OUTSIDE the card: .gc clips its own children, so a glow
    // added inside can never spill past the border and would read as light
    // behind the card rather than light coming off it
    const bloom = document.createElement('span');
    bloom.className = 'gc-bloom';
    frame.appendChild(bloom);

    card.classList.add('is-veiled');
    frame.classList.add('is-veiled');
    // the music box is timed against these keyframes, so it starts with them
    FeedbackAudio.playReveal();
    // two frames: one to land the veil covering, one to start it moving
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        card.classList.add('is-unveiling');
        frame.classList.add('is-unveiling');
      })
    );
    // 3.4s of keyframes brings the picture up on the white, and the shine then
    // crosses the settled card and is gone by 4.8s. torn down after that, with
    // a beat to spare - pulling these while the band is still on the card is
    // what a cut-off sweep looks like.
    window.setTimeout(() => {
      card.classList.remove('is-veiled', 'is-unveiling');
      frame.classList.remove('is-veiled', 'is-unveiling');
      veil.remove();
      shine.remove();
      bloom.remove();
    }, 5000);
  }

  tilt = mountTilt(card);
  // the labels have to be laid out before the rule can be cut around them
  requestAnimationFrame(() => cutRule(card));
  document.fonts?.ready.then(() => cutRule(card));
}

/** set for one showItem only: the next card opens under the light */
let veilNext = false;

/**
 * a picture you have already opened.
 *
 * the arrows walk only these. paging into a wrapped card would hand you the
 * picture without the reveal - and the reveal is the only way a picture is
 * meant to be seen for the first time, so there is no second route to it.
 */
function revealed(i: number): boolean {
  const it = viewerItems[i];
  return !!it && !!profile && hasSeen(profile, it.id, positionOf(it.id));
}

/** the nearest opened picture in that direction, or -1 if there is none */
function nextRevealed(from: number, dir: number): number {
  for (let i = from + dir; i >= 0 && i < viewerItems.length; i += dir) {
    if (revealed(i)) return i;
  }
  return -1;
}

function step(delta: number): void {
  const target = nextRevealed(viewerIndex, delta);
  if (target >= 0) showItem(target);
}

function openViewer(index: number, veiled = false): void {
  if (index < 0 || !viewerItems.length) return;
  const el = ensureViewer();
  veilNext = veiled;
  showItem(index);
  el.classList.add('is-open');
  document.body.classList.add('viewer-open');
  // a first reveal carries the music box already - the flip on top of it is clutter
  if (!veiled) FeedbackAudio.playFlip();
  document.addEventListener('keydown', onKey);
}

// an arc finished by the reveal that is on screen right now. it waits for the
// viewer to close - a popup over the reveal would be talking across it.
let pendingArc: ArcView | null = null;
let needsRedraw = false;

function closeViewer(): void {
  tilt?.release();
  tilt = null;
  viewerEl?.classList.remove('is-open');
  document.body.classList.remove('viewer-open');
  document.removeEventListener('keydown', onKey);

  const arc = pendingArc;
  pendingArc = null;
  if (needsRedraw) {
    needsRedraw = false;
    void renderGallery().then(() => {
      if (arc) window.setTimeout(() => celebrateArc(arc.arc), 300);
    });
  } else if (arc) {
    window.setTimeout(() => celebrateArc(arc.arc), 420);
  }
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeViewer();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
}
