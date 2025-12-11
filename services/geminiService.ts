import { GoogleGenAI, Modality } from "@google/genai";
import { SolutionData } from "../types";

export const aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "StudenFlow-chan", an energetic, elite Computer Science tutor from the Cyber Academy! 🎓✨
Your students are uploading questions related to Computer Science and Technology.

RULES:
1. SUBJECT LOCK: You ONLY answer Computer Science, Programming, Networking, and Tech Hardware questions. If the user asks about Math (Calculus, pure Algebra without code), Biology, History, etc., politely refuse in character, saying that's not your specialty.
2. STRUCTURE:
   - Part 1: **The Solution**. 
     - **IF CODE IS REQUESTED**: Provide a **SPECIAL STRUCTURED CODE BLOCK** only. Return **ONLY** the code within a markdown code block (e.g., \`\`\`python ... \`\`\`). Do **NOT** include comments, explanations, or introductory text in this part. Just the raw, executable code.
     - **IF THEORY IS REQUESTED**: Provide a clean, professional, academic answer suitable for printing on an exam. Use clear steps and bullet points.
   - Part 2: **Sensei's Anime Corner**. 
     - **EXPLANATION**: This is where you explain the code or concept! Use fun, easy-to-understand analogies (e.g., comparing RAM to a backpack, CPU to a brain). Be enthusiastic! Use emojis!
3. FORMATTING: Use Markdown.
4. TONE: 
   - Part 1: Strict, minimal, professional. 
   - Part 2: High-energy, encouraging, "chunibyo" or "genki" style.

Goal: Part 1 is for copying/printing. Part 2 is for understanding.
`;

export const solveQuestion = async (
  questionText: string, 
  imageFile: File | null
): Promise<SolutionData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing!");
  }

  // Convert image to base64 if it exists
  let imagePart = null;
  if (imageFile) {
    const base64Data = await fileToGenerativePart(imageFile);
    imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: imageFile.type,
      }
    };
  }

  const parts: any[] = [];
  if (imagePart) parts.push(imagePart);
  if (questionText) parts.push({ text: questionText });

  if (parts.length === 0) {
    throw new Error("Please provide text or an image.");
  }

  try {
    // USE MODEL gemini-3-pro-preview IF IMAGE IS PRESENT (High IQ Image Analysis)
    // USE MODEL gemini-2.5-flash IF TEXT ONLY (Balanced)
    const modelName = imagePart ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';

    const response = await aiClient.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    const fullText = response.text || "Sorry, I couldn't generate a response.";

    // Simple splitting logic based on our requested structure
    const splitIndex = fullText.indexOf("**Sensei's Anime Corner**");
    
    let solution = fullText;
    let explanation = "";

    if (splitIndex !== -1) {
      solution = fullText.substring(0, splitIndex).trim();
      explanation = fullText.substring(splitIndex).trim();
    } else {
        const parts = fullText.split('---');
        if (parts.length > 1) {
             solution = parts[0];
             explanation = parts.slice(1).join('---');
        } else {
            solution = fullText;
            explanation = "Sensei is speechless with this complex query! (No specific simplified explanation generated)";
        }
    }

    return {
      rawMarkdown: fullText,
      solution,
      explanation
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to consult the Cyber Academy database! Please try again.");
  }
};

export const chatWithSensei = async (
    message: string, 
    history: any[], 
    useLite: boolean,
    useSearch: boolean
) => {
    // Default model
    let modelName = 'gemini-3-pro-preview';
    let tools: any = undefined;

    if (useSearch) {
        // Must use gemini-2.5-flash for search grounding per request
        modelName = 'gemini-2.5-flash';
        tools = [{ googleSearch: {} }];
    } else if (useLite) {
        modelName = 'gemini-2.5-flash-lite';
    }

    const chat = aiClient.chats.create({
        model: modelName,
        history: history,
        config: {
            systemInstruction: "You are StudenFlow-chan. Keep responses concise, helpful, and anime-styled. If using Lite mode, be very brief. If using Search, synthesize the results clearly.",
            tools: tools
        }
    });

    return await chat.sendMessage({ message });
};

export const generateSpeech = async (text: string): Promise<string> => {
    // Limit text length to avoid timeouts/limits for TTS if necessary, 
    // but the API handles decent chunks.
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Could not generate speech.");
    
    return base64Audio;
};

async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}