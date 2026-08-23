// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { openImagePicker, type PickerConfig } from './imagePicker';
import { DEFAULT_POS } from '../state/imagePos';

function makeOverlay(): HTMLElement {
  document.body.innerHTML = `
    <div class="modal-overlay hidden" id="picker-modal-overlay">
      <div class="modal-sheet"><div class="modal-drag-handle"></div><div class="picker-body"></div></div>
    </div>`;
  return document.getElementById('picker-modal-overlay')!;
}

function config(over: Partial<PickerConfig> = {}): PickerConfig {
  return {
    target: 'avatar',
    title: 'Profile picture',
    frameAspect: 1,
    round: true,
    tileAspect: '1',
    columns: 4,
    allowPhoto: false,
    clearLabel: 'Remove picture',
    pictures: [{ id: 'a', kind: 'chapter', image: 'a.jpg', thumb: 'a.jpg', label: 'Picture 1' }],
    current: { image: '', pos: { ...DEFAULT_POS } },
    onSave: vi.fn(),
    onClear: vi.fn(),
    ...over,
  };
}

const click = (root: HTMLElement, sel: string): void => {
  root.querySelector<HTMLElement>(sel)!.click();
};

describe('openImagePicker', () => {
  let overlay: HTMLElement;
  beforeEach(() => {
    overlay = makeOverlay();
  });

  it('does not leave the previous target wired to the shared sheet', () => {
    // the avatar and the banner share one sheet. a listener left behind by the
    // first open still holds that target's config, so one tap on Save would
    // save both - which is the bug this guards.
    const avatar = config({ target: 'avatar' });
    openImagePicker(overlay, avatar);

    const banner = config({ target: 'banner', title: 'Banner', round: false });
    openImagePicker(overlay, banner);

    click(overlay, '[data-act="gallery"]');
    click(overlay, '.pk-tile');
    click(overlay, '[data-act="position"]');
    click(overlay, '[data-act="save"]');

    expect(banner.onSave).toHaveBeenCalledTimes(1);
    expect(avatar.onSave).not.toHaveBeenCalled();
  });

  it('clears only the target that is open', () => {
    const avatar = config({ target: 'avatar', current: { image: 'x.jpg', pos: { ...DEFAULT_POS } } });
    openImagePicker(overlay, avatar);
    const banner = config({
      target: 'banner',
      current: { image: 'y.jpg', pos: { ...DEFAULT_POS } },
    });
    openImagePicker(overlay, banner);

    click(overlay, '[data-act="clear"]');

    expect(banner.onClear).toHaveBeenCalledTimes(1);
    expect(avatar.onClear).not.toHaveBeenCalled();
  });

  it('offers a photo route only where one makes sense', () => {
    openImagePicker(overlay, config({ allowPhoto: true }));
    expect(overlay.querySelector('[data-act="photo"]')).not.toBeNull();

    openImagePicker(overlay, config({ allowPhoto: false }));
    expect(overlay.querySelector('[data-act="photo"]')).toBeNull();
  });

  it('offers nothing to clear when nothing is set', () => {
    openImagePicker(overlay, config({ current: { image: '', pos: { ...DEFAULT_POS } } }));
    expect(overlay.querySelector('[data-act="clear"]')).toBeNull();
  });

  it('filters the grid by category and keeps the selection across a switch', () => {
    openImagePicker(
      overlay,
      config({
        pictures: [
          { id: 'p1', kind: 'chapter', image: 'p1.jpg', thumb: '', label: 'Picture 1' },
          { id: 'c1', kind: 'cover', image: 'c1.jpg', thumb: '', label: 'Picture 2' },
          { id: 's1', kind: 'spread', image: 's1.jpg', thumb: '', label: 'Arc' },
        ],
      })
    );
    click(overlay, '[data-act="gallery"]');
    expect(overlay.querySelectorAll('.pk-tile')).toHaveLength(3);

    click(overlay, '[data-cat="cover"]');
    expect(overlay.querySelectorAll('.pk-tile')).toHaveLength(1);

    overlay.querySelector<HTMLElement>('.pk-tile')!.click();
    click(overlay, '[data-cat="all"]');
    expect(overlay.querySelector('.pk-tile.is-sel')).not.toBeNull();
  });
});
