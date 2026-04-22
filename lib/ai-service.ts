import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzeTradingPerformance(trades: any[]) {
  const prompt = `
    You are an expert trading psychologist and performance analyst. 
    Analyze the following trading history and provide:
    1. A summary of the trading style.
    2. Psychological patterns detected (e.g., revenge trading, over-leveraging).
    3. Three actionable tips for improvement.

    Trading Data:
    ${JSON.stringify(trades, null, 2)}
    
    Return the response in a structured format with headings.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini AI Analysis Error:", error);
    return "Failed to generate AI analysis. Please try again later.";
  }
}
