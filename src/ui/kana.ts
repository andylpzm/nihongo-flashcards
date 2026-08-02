import { loadKana } from '../data/loader';
import { speakJapanese } from '../audio/tts';
import { state } from '../state/store';

// Standard Japanese Gojuon Row Layout Template
const gojuonLayout: (string | null)[] = [
  'a', 'i', 'u', 'e', 'o',
  'ka', 'ki', 'ku', 'ke', 'ko',
  'sa', 'shi', 'su', 'se', 'so',
  'ta', 'chi', 'tsu', 'te', 'to',
  'na', 'ni', 'nu', 'ne', 'no',
  'ha', 'hi', 'fu', 'he', 'ho',
  'ma', 'mi', 'mu', 'me', 'mo',
  'ya', null, 'yu', null, 'yo',
  'ra', 'ri', 'ru', 're', 'ro',
  'wa', null, null, null, 'wo',
  'n', null, null, null, null,
];

// Voiced (Dakuon/Handakuon) Row Layout Template (G, Z, D, B, P rows)
const voicedLayout: string[] = [
  'ga', 'gi', 'gu', 'ge', 'go',
  'za', 'ji', 'zu', 'ze', 'zo',
  'da', 'dji', 'dzu', 'de', 'do',
  'ba', 'bi', 'bu', 'be', 'bo',
  'pa', 'pi', 'pu', 'pe', 'po',
];

// Contracted (Yōon) Layout Template (3-column layout)
const combosLayout: string[] = [
  'kya', 'kyu', 'kyo',
  'sha', 'shu', 'sho',
  'cha', 'chu', 'cho',
  'nya', 'nyu', 'nyo',
  'hya', 'hyu', 'hyo',
  'mya', 'myu', 'myo',
  'rya', 'ryu', 'ryo',
  'gya', 'gyu', 'gyo',
  'ja', 'ju', 'jo',
  'bya', 'byu', 'byo',
  'pya', 'pyu', 'pyo',
];

// Render dynamic Interactive Syllabary Gojuon chart
export async function renderKanaGrid(type: 'hiragana' | 'katakana'): Promise<void> {
  const containerId = type === 'hiragana' ? 'hiragana-grid-container' : 'katakana-grid-container';
  const container = document.getElementById(containerId);
  if (!container) return;

  const kana = await loadKana();

  container.innerHTML = '';

  // Determine active tab state
  const activeTab = type === 'hiragana' ? state.activeHiraganaTab : state.activeKatakanaTab;

  let alphabet;
  let layout: (string | null)[];

  if (activeTab === 'basic') {
    alphabet = type === 'hiragana' ? kana.hiraganaAlphabet : kana.katakanaAlphabet;
    layout = gojuonLayout;
    container.classList.remove('combos-layout');
  } else if (activeTab === 'voiced') {
    alphabet = type === 'hiragana' ? kana.hiraganaVoiced : kana.katakanaVoiced;
    layout = voicedLayout;
    container.classList.remove('combos-layout');
  } else {
    alphabet = type === 'hiragana' ? kana.hiraganaCombos : kana.katakanaCombos;
    layout = combosLayout;
    container.classList.add('combos-layout');
  }

  layout.forEach((romaji) => {
    const cell = document.createElement('div');

    if (romaji === null) {
      cell.className = 'kana-grid-cell empty';
      cell.innerHTML = '';
    } else {
      const charData = alphabet.find((item) => item.romaji === romaji);
      if (charData) {
        cell.className = 'kana-grid-cell';
        cell.innerHTML = `
          <span class="kana-char" lang="ja">${charData.kana}</span>
          <span class="kana-romaji">${charData.romaji}</span>
        `;
        cell.title = `Pronounce ${charData.romaji}`;
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', `Pronounce ${charData.romaji}`);
        cell.tabIndex = 0;
        cell.addEventListener('click', () => {
          speakJapanese(charData.kana);
        });
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            speakJapanese(charData.kana);
          }
        });
      } else {
        cell.className = 'kana-grid-cell empty';
        cell.innerHTML = '';
      }
    }
    container.appendChild(cell);
  });
}
