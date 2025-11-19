export function speakText(text: string, lang: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  const target = (lang || 'en-US').toLowerCase();
  const primary = target.split('-')[0];
  let voice = voices.find(v => v.lang && v.lang.toLowerCase() === target) ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith(primary)) ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) ||
    voices[0] || null;
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang || lang || 'en-US';
  utter.rate = 1;
  utter.pitch = 1;
  synth.cancel();
  synth.speak(utter);
  return utter;
}

