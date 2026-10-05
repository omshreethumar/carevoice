// Browser TTS/STT. Swap for Google/Azure TTS & Whisper STT later. Hindi/Gujarati voices depend on the device.
export const LANGS={en:{label:'English',code:'en-IN'},hi:{label:'हिन्दी',code:'hi-IN'},gu:{label:'ગુજરાતી',code:'gu-IN'}};
export const speak=(text,lang='en')=>new Promise(res=>{if(!('speechSynthesis' in window))return res(false);
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=LANGS[lang].code;u.rate=.9;u.onend=()=>res(true);u.onerror=()=>res(false);speechSynthesis.speak(u);});
export const listen=lang=>new Promise(res=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return res(null);
  const r=new SR();r.lang=LANGS[lang].code;r.onresult=e=>res(e.results[0][0].transcript);r.onerror=()=>res(null);r.onend=()=>res(null);try{r.start()}catch{res(null)}});
const YES=['yes','yeah','yep','ok','haan','han','ha','हाँ','हां','हा','હા','લીધી'],NO=['no','nope','nahi','nahin','नहीं','नही','ના','નથી','નહીં'];
export const parseYesNo=t=>{const w=(t||'').toLowerCase().split(/[\s,.!?]+/);return w.some(x=>NO.includes(x))?'no':w.some(x=>YES.includes(x))?'yes':null;};
