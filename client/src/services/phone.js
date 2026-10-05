// MOCK phone call. Real: server creates a Twilio call (twilio.calls.create) with <Gather input="speech"> and webhooks the answer back.
export async function placeCall(number){await new Promise(r=>setTimeout(r,1800));return {sid:'MOCK_CALL',to:number,mock:true};}
