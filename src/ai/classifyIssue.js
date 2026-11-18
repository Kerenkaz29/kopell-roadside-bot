const { generateJSON } = require('./geminiClient');

const CATEGORIES = ['תקר', 'תאונה', 'נעילה', 'תקלה_מכנית', 'אחר'];

// Classifies a free-text description of what happened to the car into one of
// our known categories, plus a one-line human summary for the technician.
// Returns understood: false when the message doesn't actually describe a car
// problem (gibberish, an unrelated number, etc.) so the bot can ask again
// instead of silently treating it as a valid issue.
async function classifyIssue(text) {
  const systemPrompt = `את/ה חלק מבוט וואטסאפ לשירותי חילוץ דרכים של חברת Kopell, שעובדת מול חברות ביטוח ומטפלת בלקוחות שנתקעו עם הרכב (תקר, תאונה, נעילה, תקלה מכנית וכו'). תפקידך בשיחה: לקרוא את התיאור החופשי שהלקוח כתב על מה קרה לרכב. אם ההודעה באמת מתארת תקלה/בעיה ברכב (גם אם קצרה או לא מפורטת) - סווגי אותה לאחת מהקטגוריות: ${CATEGORIES.join(', ')}, ותני summary - משפט קצר וברור לטכנאי. אם ההודעה לא קשורה בכלל לתקלה ברכב (למשל מספר סתמי, מילה חסרת משמעות, שאלה אחרת) - סמני understood: false. החזירי JSON בפורמט {"understood": true/false, "category": "...", "summary": "..."}.`;

  try {
    const parsed = await generateJSON(systemPrompt, text);
    if (!parsed.understood) {
      return { understood: false };
    }
    return {
      understood: true,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'אחר',
      summary: parsed.summary || text,
    };
  } catch {
    return { understood: true, category: 'אחר', summary: text };
  }
}

module.exports = { classifyIssue, CATEGORIES };
