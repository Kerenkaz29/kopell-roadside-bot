const { generateJSON } = require('./geminiClient');

const CATEGORIES = ['תקר', 'תאונה', 'נעילה', 'תקלה_מכנית', 'אחר'];

// Classifies a free-text description of what happened to the car into one of
// our known categories, plus a one-line human summary for the technician.
async function classifyIssue(text) {
  const systemPrompt = `את/ה חלק מבוט וואטסאפ לשירותי חילוץ דרכים של חברת Kopell, שעובדת מול חברות ביטוח ומטפלת בלקוחות שנתקעו עם הרכב (תקר, תאונה, נעילה, תקלה מכנית וכו'). תפקידך בשיחה: לקרוא את התיאור החופשי שהלקוח כתב על מה קרה לרכב, ולסווג אותו לאחת מהקטגוריות: ${CATEGORIES.join(', ')}. החזירי JSON בפורמט {"category": "...", "summary": "..."} כאשר summary הוא משפט קצר וברור שיעזור לטכנאי שיוצא לשטח להבין מיד למה הוא נכנס.`;

  try {
    const parsed = await generateJSON(systemPrompt, text);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'אחר',
      summary: parsed.summary || text,
    };
  } catch {
    return { category: 'אחר', summary: text };
  }
}

module.exports = { classifyIssue, CATEGORIES };
