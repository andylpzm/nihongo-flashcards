// Sidebar Switcher Elements
export const menuVocabulary = document.getElementById('menu-vocabulary')!;
export const menuHiragana = document.getElementById('menu-hiragana')!;
export const menuKatakana = document.getElementById('menu-katakana')!;
export const menuStory = document.getElementById('menu-story')!;
export const menuStats = document.getElementById('menu-stats')!;

export const sectionVocabulary = document.getElementById('section-vocabulary')!;
// Hiragana, katakana and kanji are pages of one section now (ui/pager.ts),
// so they share a single element; which page shows is the pager's business.
export const sectionKana = document.getElementById('section-kana')!;
export const sectionStory = document.getElementById('section-story')!;
export const sectionStats = document.getElementById('section-stats')!;

export const btnBackToStory = document.getElementById('btn-back-to-story')!;

export type SectionName = 'vocabulary' | 'hiragana' | 'katakana' | 'kanji' | 'story' | 'stats';

// Switch Sidebar sections
export function switchSection(sectionName: SectionName, activeMenuName?: SectionName): void {
  const menuName = activeMenuName || sectionName;
  menuVocabulary.classList.toggle('active', menuName === 'vocabulary');
  menuHiragana.classList.toggle('active', menuName === 'hiragana');
  menuKatakana.classList.toggle('active', menuName === 'katakana');
  menuStory.classList.toggle('active', menuName === 'story');
  menuStats.classList.toggle('active', menuName === 'stats');

  sectionVocabulary.classList.toggle('hidden', sectionName !== 'vocabulary');
  const isKana = sectionName === 'hiragana' || sectionName === 'katakana' || sectionName === 'kanji';
  sectionKana.classList.toggle('hidden', !isKana);

  // Which section is open, stamped on body so global chrome that lives
  // outside the sections (the proposal header) can scope itself. Without it
  // that header follows Browse mode onto the kana and story screens.
  document.body.classList.toggle('section-vocabulary', sectionName === 'vocabulary');
  sectionStory.classList.toggle('hidden', sectionName !== 'story');
  sectionStats.classList.toggle('hidden', sectionName !== 'stats');
}
