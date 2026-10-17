const { GoogleGenerativeAI } = require('@google/generative-ai');
const moment = require('moment');

const ALLOWED_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Utilities', 'Other'];

/**
 * Extracts structured expense details from a bill/receipt image buffer using Google Gemini Vision
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} mimeType - e.g. "image/jpeg", "image/png", "image/webp", "application/pdf"
 */
async function parseBillWithGemini(fileBuffer, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_GEMINI_API_KEY')) {
    // Helpful guidance when API key is not yet configured
    throw new Error(
      'GEMINI_API_KEY is not configured in expensify-backend/.env. Please get a free API key from https://aistudio.google.com/ and add it to your .env file as GEMINI_API_KEY=your_key_here.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Default to gemini-1.5-flash for speed and multimodal receipt understanding
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = genAI.getGenerativeModel({ modelOptions: { model: modelName }, model: modelName });

  const todayStr = moment().format('YYYY-MM-DD');

  const prompt = `
You are an expert financial receipt and invoice scanner.
Carefully examine this bill/receipt image and extract the essential expense details.

Return ONLY a valid JSON object with EXACTLY these keys:
{
  "title": "Store, merchant, vendor name or brief item description (e.g., 'Starbucks Coffee', 'Walmart Grocery', 'Uber Ride')",
  "amount": <number, the final total amount paid. Strip currency symbols like $, ₹, €, etc. Must be a positive numeric value>,
  "category": "<best fit category, MUST be exactly one of: Food, Travel, Shopping, Utilities, Other>",
  "date": "YYYY-MM-DD format (the purchase/invoice date printed on receipt. If not visible or unclear, use '${todayStr}')"
}

Important Rules:
1. Do not include any explanations, markdown code blocks, or conversational text. Return ONLY the raw JSON string.
2. For "category", select the most accurate match strictly from ["Food", "Travel", "Shopping", "Utilities", "Other"].
3. For "amount", extract the grand total / final balance paid.
`;

  const imagePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType: mimeType || 'image/jpeg',
    },
  };

  const result = await model.generateContent([prompt, imagePart]);
  const response = await result.response;
  let text = response.text().trim();

  // Clean markdown block if model included it
  if (text.startsWith('```json')) {
    text = text.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```/, '').replace(/```$/, '').trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    console.error('[GeminiService] Failed to parse JSON from response text:', text);
    throw new Error('Gemini response could not be parsed as valid JSON: ' + text.slice(0, 100));
  }

  // Sanitize and validate fields
  const title = (parsed.title || 'Scanned Expense').toString().trim().slice(0, 100);
  let amount = parseFloat(parsed.amount);
  if (isNaN(amount) || amount < 0) {
    amount = 0;
  }

  let category = (parsed.category || 'Other').toString().trim();
  // Capitalize first letter
  category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  if (!ALLOWED_CATEGORIES.includes(category)) {
    category = 'Other';
  }

  let date = parsed.date;
  if (!date || !moment(date, 'YYYY-MM-DD', true).isValid()) {
    date = todayStr;
  }

  return {
    title,
    amount: parseFloat(amount.toFixed(2)),
    category,
    date,
    rawExtracted: parsed,
  };
}

module.exports = {
  parseBillWithGemini,
};
