const axios = require('axios');
const config = require('../config');

const MODEL = 'gemini-3.5-flash-lite';

// Calls Gemini with a JSON-only response and returns the parsed object.
async function generateJSON(systemPrompt, userText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${config.geminiApiKey}`;

  const { data } = await axios.post(url, {
    contents: [{ parts: [{ text: `${systemPrompt}\n\nהודעת הלקוח: ${userText}` }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

module.exports = { generateJSON };
