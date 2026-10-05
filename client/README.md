# CareVoice
`npm install && npm run dev`

Mocked integrations live in `src/services/`:
- `ai.js` – extraction + term explanation (swap for OCR + LLM using a strict extract-only schema)
- `voice.js` – browser TTS/STT (swap for cloud TTS/STT)
- `phone.js` – simulated call (swap for Twilio `calls.create` + `<Gather input="speech">`)

`src/data/demo.js` is FICTIONAL sample data. `src/data/i18n.js` only rearranges extracted fields; it never changes doses or timings.
Hindi/Gujarati phrases are static templates; have a native-speaker clinician review them before real use.

CareVoice helps patients understand healthcare instructions. It does not replace a doctor.
