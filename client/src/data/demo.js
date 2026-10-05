// FICTIONAL SAMPLE DATA for demos only. Not a real patient or prescription.
export const DEMO_DOC={isDemo:true,title:'Sample Discharge Summary (DEMO)',
tasks:[
{id:'t1',time:'07:30',type:'test',name:'Fasting blood sugar test',raw:'Fasting blood glucose, morning.'},
{id:'t2',time:'08:00',type:'med',name:'Metformin',dose:'500 mg',when:'after_meals',raw:'Tab Metformin 500 mg BID p.c. (morning dose)'},
{id:'t3',time:'13:00',type:'diet',name:'Low-salt, low-sugar food',raw:'Diet: 2 g Na restriction, diabetic diet.'},
{id:'t4',time:'14:00',type:'med',name:'Aspirin',dose:'75 mg',when:'after_meals',raw:'Tab Aspirin 75 mg OD p.c.'},
{id:'t5',time:'17:00',type:'activity',name:'Gentle walk, 15 minutes',raw:'Light ambulation 15 min daily.'},
{id:'t6',time:'20:00',type:'med',name:'Metformin',dose:'500 mg',when:'after_meals',raw:'Tab Metformin 500 mg BID p.c. (evening dose)'},
{id:'t7',time:'21:00',type:'med',name:'Atorvastatin',dose:'20 mg',when:'bedtime',raw:'Tab Atorvastatin 20 mg HS'}],
appointments:[{id:'a1',title:'Cardiology follow-up',when:'7 days after discharge',raw:'F/U Cardiology OPD in 1 week.'}],
warnings:[{id:'w1',raw:'Return to ED if chest pain, dyspnea or syncope.',simple:'Go to emergency care right away if you have chest pain, trouble breathing, or you faint.'}]};
export const GLOSSARY={hypertension:'High blood pressure.',metformin:'A medicine that helps control blood sugar.',aspirin:'A medicine that helps stop blood from forming clots.',atorvastatin:'A medicine that helps lower cholesterol (fat in the blood).',bid:'Twice a day.',od:'Once a day.',hs:'At bedtime.',prn:'Only when needed, as your doctor said.','p.c.':'After food.',npo:'Nothing to eat or drink.',dyspnea:'Trouble breathing or shortness of breath.',syncope:'Fainting.',hypoglycemia:'Low blood sugar.','follow-up':'A repeat visit so the doctor can check your recovery.',cardiology:'The doctor team that looks after the heart.',ed:'Emergency department.',opd:'Outpatient clinic (no hospital stay).'};
