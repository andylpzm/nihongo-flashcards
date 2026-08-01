// Initialize Web Speech API triggers
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Japanese Text-to-Speech execution
export function speakJapanese(text: string): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop current speech

    // Prioritize female Japanese voices across operating systems
    const voices = window.speechSynthesis.getVoices();
    const jaVoices = voices.filter((voice) => voice.lang.toLowerCase().includes('ja'));

    // Firefox/Zen Fallback: If no Japanese voice pack is installed on the host OS
    if (jaVoices.length === 0) {
      try {
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text)}`;
        const audio = new Audio(fallbackUrl);
        audio.play().catch((e) => console.warn('Google TTS fallback failed:', e));
      } catch (e) {
        console.warn('Could not play fallback audio:', e);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    // Known female voice keywords: Kyoko (macOS), Haruka/Ayumi (Windows), Siri, Google
    const femaleKeywords = ['kyoko', 'haruka', 'ayumi', 'siri', 'google', 'female'];

    let selectedVoice = jaVoices.find((voice) =>
      femaleKeywords.some((keyword) => voice.name.toLowerCase().includes(keyword))
    );

    // Fallback to any Japanese voice if no female voice matched
    if (!selectedVoice && jaVoices.length > 0) {
      selectedVoice = jaVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.8; // Slow down slightly for clarity
    window.speechSynthesis.speak(utterance);
  }
}
