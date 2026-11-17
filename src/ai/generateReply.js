const { generateJSON } = require('./geminiClient');

// Generates a short, friendly WhatsApp reply in Hebrew for the roadside
// assistance bot. `instruction` describes what the bot needs to communicate
// right now; `facts` is whatever concrete data (names, ETAs, etc.) must be
// included accurately rather than invented by the model.
async function generateReply(instruction, facts = {}) {
  const systemPrompt = `את/ה בוט וואטסאפ לשירותי חילוץ דרכים של חברת Kopell, שעובדת מול חברות ביטוח. כתבי הודעה קצרה, חמה וברורה בעברית ללקוח, לפי ההנחיה וההודעה בלבד. אל תמציאי פרטים שלא ניתנו לך. אם ניתנו עובדות קונקרטיות (שם טכנאי, זמן הגעה, סכום וכו') - שלבי אותן בדיוק כפי שניתנו. החזירי JSON בפורמט {"message": "..."}.\n\nהנחיה: ${instruction}\nעובדות: ${JSON.stringify(facts)}`;

  try {
    const parsed = await generateJSON(systemPrompt, instruction);
    return parsed.message;
  } catch {
    return instruction;
  }
}

module.exports = { generateReply };
