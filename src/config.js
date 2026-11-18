require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

module.exports = {
  port: process.env.PORT || 3000,
  mongodbUri: required('MONGODB_URI'),
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: required('WHATSAPP_VERIFY_TOKEN', 'kopell_demo_verify_token'),
  },
  geminiApiKey: required('GEMINI_API_KEY'),
};
