// Templates only rearrange fields extracted from the document. They never add, change or infer doses/timings.
const W={after_meals:{en:'after food',hi:'खाने के बाद',gu:'જમ્યા પછી'},bedtime:{en:'at bedtime',hi:'सोने से पहले',gu:'સૂતા પહેલાં'}};
const T={
med:{en:t=>`Take ${t.name} ${t.dose}, ${W[t.when]?.en||''}.`,hi:t=>`${t.name} ${t.dose} लें, ${W[t.when]?.hi||''}।`,gu:t=>`${t.name} ${t.dose} લો, ${W[t.when]?.gu||''}.`},
test:{en:t=>`Get this test done: ${t.name}.`,hi:t=>`यह जाँच कराएँ: ${t.name}।`,gu:t=>`આ તપાસ કરાવો: ${t.name}.`},
diet:{en:t=>`Food rule: ${t.name}.`,hi:t=>`खाने का नियम: ${t.name}।`,gu:t=>`ખોરાકનો નિયમ: ${t.name}.`},
activity:{en:t=>`Activity: ${t.name}.`,hi:t=>`गतिविधि: ${t.name}।`,gu:t=>`પ્રવૃત્તિ: ${t.name}.`}};
export const simplify=(t,l)=>T[t.type][l](t);
export const SAY={q:{en:'Did you take your medicine?',hi:'क्या आपने अपनी दवा ली?',gu:'શું તમે તમારી દવા લીધી?'},
yes:{en:'Great. I have marked it as done.',hi:'बहुत अच्छा। मैंने इसे पूरा चिह्नित कर दिया।',gu:'ખૂબ સરસ. મેં તેને પૂર્ણ ગણ્યું છે.'},
no:{en:'Please take it as your doctor instructed. I will inform your caregiver.',hi:'कृपया डॉक्टर के बताए अनुसार दवा लें। मैं आपके देखभालकर्ता को सूचित करूँगा।',gu:'કૃપા કરીને ડૉક્ટરના કહ્યા મુજબ દવા લો. હું તમારા સંભાળ રાખનારને જણાવીશ.'},
retry:{en:'Sorry, I did not catch that. Please tap Yes or No.',hi:'क्षमा करें, समझ नहीं आया। कृपया हाँ या नहीं दबाएँ।',gu:'માફ કરશો, સમજાયું નહીં. કૃપા કરીને હા અથવા ના દબાવો.'}};
