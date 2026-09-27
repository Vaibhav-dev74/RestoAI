import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';
config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Converts a base64 string to a Gemini-compatible image object
 * @param {string} base64 - The image in base64 format (e.g., "data:image/jpeg;base64,...")
 * @returns {{ inlineData: { mimeType: string, data: string } }}
 */
const base64ToGeminiImage = (base64) => {
  const [, mimeType, data] = base64.match(/^data:(image\/\w+);base64,(.+)$/) || [];
  if (!mimeType || !data) throw new Error('Invalid base64 image format');
  return {
    inlineData: {
      mimeType,
      data
    }
  };
};

/**
 * Analyzes a plate image for cleanliness, portion size, and waste.
 * @param {string} base64Image - A base64 encoded image string.
 * @returns {Promise<Object>} - AI analysis result
 */
export const analyzePlateImage = async (base64Image) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imagePart = base64ToGeminiImage(base64Image);

  const prompt = `
You are a restaurant quality checker AI.

Analyze this plate image and return:

- portionSize: "too much" | "ideal" | "too little"
- cleanliness: "clean" | "messy"
- visibleWaste: true | false
- notes: a short summary (20 words max)

Respond in JSON only.
`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            imagePart
          ]
        }
      ]
    });

    const text = result.response.text().trim();

    // Ensure valid JSON is parsed
    const json = JSON.parse(text.startsWith('```json') ? text.replace(/```json|```/g, '') : text);
    return json;
  } catch (err) {
    console.error('Gemini Vision error:', err.message);
    throw new Error('Image analysis failed');
  }
};
