// MOCK AI/OCR layer. Replace bodies with real calls (OCR -> LLM with a strict "extract only, never add" schema).
import {DEMO_DOC,GLOSSARY} from '../data/demo.js';
export async function extractDocument(file){ // real: POST file to /api/extract
  await new Promise(r=>setTimeout(r,1800));
  return {...DEMO_DOC,title:`${file?.name||'Uploaded file'} — mock extraction (sample data)`};}
export async function explainTerm(term){ // real: LLM constrained to general definitions
  const hit=GLOSSARY[term.trim().toLowerCase()];
  return hit?{found:true,text:hit}:{found:false,text:'This term is not in the demo glossary. Please ask your doctor or pharmacist.'};}
