// Sidebar Switcher Elements
export const menuVocabulary = document.getElementById('menu-vocabulary')!;
export const menuHiragana = document.getElementById('menu-hiragana')!;
export const menuKatakana = document.getElementById('menu-katakana')!;
export const menuGallery = document.getElementById('menu-gallery')!;
export const menuStats = document.getElementById('menu-stats')!;

export const sectionVocabulary = document.getElementById('section-vocabulary')!;
// Hiragana, katakana and kanji are pages of one section now (ui/pager.ts),
// so they share a single element; which page shows is the pager's business.
export const sectionKana = document.getElementById('section-kana')!;
export const sectionGallery = document.getElementById('section-gallery')!;
export const sectionStats = document.getElementById('section-stats')!;

export type SectionName = 'vocabulary' | 'hiragana' | 'katakana' | 'kanji' | 'gallery' | 'stats';

// Switch Sidebar sections
export function switchSection(sectionName: SectionName, activeMenuName?: SectionName): void {
  const menuName = activeMenuName || sectionName;
  menuVocabulary.classList.toggle('active', menuName === 'vocabulary');
  menuHiragana.classList.toggle('active', menuName === 'hiragana');
  menuKatakana.classList.toggle('active', menuName === 'katakana');
  menuGallery.classList.toggle('active', menuName === 'gallery');
  menuStats.classList.toggle('active', menuName === 'stats');

  sectionVocabulary.classList.toggle('hidden', sectionName !== 'vocabulary');
  const isKana = sectionName === 'hiragana' || sectionName === 'katakana' || sectionName === 'kanji';
  sectionKana.classList.toggle('hidden', !isKana);

  // Which section is open, stamped on body so global chrome that lives
  // outside the sections (the proposal header) can scope itself. Without it
  // that header follows Browse mode onto the kana and gallery screens.
  document.body.classList.toggle('section-vocabulary', sectionName === 'vocabulary');
  // the binder runs edge to edge, which means dropping the page padding that
  // every other section wants - so it has to be scoped to this section
  document.body.classList.toggle('section-gallery', sectionName === 'gallery');
  sectionGallery.classList.toggle('hidden', sectionName !== 'gallery');
  sectionStats.classList.toggle('hidden', sectionName !== 'stats');
}
