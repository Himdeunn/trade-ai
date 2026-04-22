import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  try {
    // There is no direct listModels in the SDK for some versions, 
    // but we can try to use one and see if it works.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash");
  } catch (e: any) {
    console.log("Error with gemini-1.5-flash:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-pro");
  } catch (e: any) {
    console.log("Error with gemini-pro:", e.message);
  }
}

listModels();
