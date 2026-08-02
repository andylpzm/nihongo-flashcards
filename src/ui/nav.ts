// Sidebar Switcher Elements
export const menuVocabulary = document.getElementById('menu-vocabulary')!;
export const menuHiragana = document.getElementById('menu-hiragana')!;
export const menuKatakana = document.getElementById('menu-katakana')!;
export const menuStory = document.getElementById('menu-story')!;
export const menuStats = document.getElementById('menu-stats')!;

export const sectionVocabulary = document.getElementById('section-vocabulary')!;
export const sectionHiragana = document.getElementById('section-hiragana')!;
export const sectionKatakana = document.getElementById('section-katakana')!;
export const sectionStory = document.getElementById('section-story')!;
export const sectionStats = document.getElementById('section-stats')!;

export const btnBackToStory = document.getElementById('btn-back-to-story')!;

export type SectionName = 'vocabulary' | 'hiragana' | 'katakana' | 'story' | 'stats';

// Switch Sidebar sections
export function switchSection(sectionName: SectionName, activeMenuName?: SectionName): void {
  const menuName = activeMenuName || sectionName;
  menuVocabulary.classList.toggle('active', menuName === 'vocabulary');
  menuHiragana.classList.toggle('active', menuName === 'hiragana');
  menuKatakana.classList.toggle('active', menuName === 'katakana');
  menuStory.classList.toggle('active', menuName === 'story');
  menuStats.classList.toggle('active', menuName === 'stats');

  sectionVocabulary.classList.toggle('hidden', sectionName !== 'vocabulary');
  sectionHiragana.classList.toggle('hidden', sectionName !== 'hiragana');
  sectionKatakana.classList.toggle('hidden', sectionName !== 'katakana');
  sectionStory.classList.toggle('hidden', sectionName !== 'story');
  sectionStats.classList.toggle('hidden', sectionName !== 'stats');
}
