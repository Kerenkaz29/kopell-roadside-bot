const { generateJSON } = require('./geminiClient');

// Decides whether a free-text message expresses a wish to cancel/close an
// already-open roadside assistance request, in any phrasing.
async function detectCancelIntent(text) {
  const systemPrompt =
    'את/ה חלק מבוט וואטסאפ לשירותי חילוץ דרכים. ללקוח יש קריאת שירות פתוחה כרגע, וטכנאי בדרך אליו. קראי את ההודעה הבאה וקבעי האם הלקוח מבקש לבטל/לסגור את הקריאה (בכל ניסוח - "בטלי", "לא צריך יותר", "תבטלי את זה" וכו׳), או שזו הודעה אחרת (כמו שאלת סטטוס). החזירי JSON בפורמט {"isCancel": true/false}.';

  try {
    const parsed = await generateJSON(systemPrompt, text || '');
    return Boolean(parsed.isCancel);
  } catch {
    return false;
  }
}

module.exports = { detectCancelIntent };
