const { generateJSON } = require('./geminiClient');

// Pulls a vehicle number and policy number out of free-form text, however the
// customer happens to phrase it. Returns nulls for whatever it can't find.
async function extractVehicleInfo(text) {
  const systemPrompt =
    'את/ה חלק מבוט וואטסאפ לשירותי חילוץ דרכים של חברת Kopell, שעובדת מול חברות ביטוח. בשלב הזה בשיחה הלקוח כבר שיתף על מה קרה לרכב ואת המיקום שלו, ועכשיו שלח הודעה חופשית עם מספר הרכב ומספר פוליסת הביטוח שלו. חלצי מהטקסט את שני הפרטים. החזירי JSON בפורמט {"vehicleNumber": "..." או null, "policyNumber": "..." או null}.';

  try {
    const parsed = await generateJSON(systemPrompt, text);
    return { vehicleNumber: parsed.vehicleNumber || null, policyNumber: parsed.policyNumber || null };
  } catch {
    return { vehicleNumber: text, policyNumber: null };
  }
}

module.exports = { extractVehicleInfo };
