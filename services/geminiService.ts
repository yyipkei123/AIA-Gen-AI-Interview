
import { GoogleGenAI } from "@google/genai";
import { 
  getPrompts,
  DEFAULT_QUESTION_COUNT, 
  SUMMARY_PROMPT, 
  HINT_PROMPT_TEMPLATE,
  INTENT_PROMPT_TEMPLATE,
  MODEL_ANSWER_PROMPT_TEMPLATE,
  VOCAB_PROMPT_TEMPLATE,
  VISION_ANALYSIS_PROMPT
} from "../constants";
import { Message, ReportData, ScenarioMode } from "../types";

// Note: The API Key must be in the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = "gemini-2.5-flash"; // Using a stable flash model for low latency

export const generateInterviewResponse = async (
  history: Message[], 
  latestInput: string, 
  turnCount: number,
  scenario: ScenarioMode,
  resumeContext?: string, // Added parameter
  maxTurns: number = DEFAULT_QUESTION_COUNT,
  language: 'zh-HK' | 'en-US' = 'zh-HK'
): Promise<string> => {
  try {
    const historyText = history.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n');
    
    const promptSet = getPrompts(language);
    let systemInstruction = promptSet[scenario];
    
    // Inject Resume Context if provided
    if (resumeContext && resumeContext.trim().length > 0) {
        systemInstruction += `\n\n**CANDIDATE BACKGROUND INFO:**\n"${resumeContext}"\n\nINSTRUCTION: Use this background info to ask personalized questions relevant to their experience.`;
    }

    let turnInstruction = history.length === 0 
      ? "[SYSTEM: Start conversation]" 
      : turnCount >= maxTurns ? "[SYSTEM: FINAL Turn. Say goodbye.]" : `[SYSTEM: Turn ${turnCount} of ${maxTurns}]`;

    // Construct the prompt manually to preserve the exact structure the user designed
    const fullPrompt = `${systemInstruction}\n${turnInstruction}\n\nChat:\n${historyText}\n\nInput: "${latestInput}"\n\nReply:`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
    });

    let text = response.text || "";

    // --- AGGRESSIVE CLEANING LOGIC ---

    // 0. Initial trim
    text = text.trim();

    // 1. Remove Markdown bolding on speaker names (e.g. "**Interviewer**: Hello")
    // Replaces "**Name**:" with "Name:" to make step 2 easier
    text = text.replace(/^\*\*([^*]+)\*\*:/, "$1:");

    // 2. Remove specific speaker prefixes (Case Insensitive)
    // Matches "Interviewer:", "Cindy:", "Cindy Wong:", "Ms. Lau:", "Director Lau:", "Director", "System:", "AI", "Candidate"
    const prefixes = [
        "Interviewer", 
        "Cindy Wong", 
        "Cindy", 
        "Ms\\.?\\s*Lau", 
        "Director\\s*Lau", 
        "Director", 
        "System", 
        "AI",
        "Candidate"
    ];
    const prefixRegex = new RegExp(`^\\s*(${prefixes.join("|")})\\s*:\\s*`, "i");
    text = text.replace(prefixRegex, "");

    // 3. Remove bracketed system notes like [System: Turn 1] or (Smile)
    text = text.replace(/\[.*?\]/g, "").replace(/^\(.*?\)\s*/, "");

    // 4. Remove common conversational fillers at the start
    // Matches "嗯", "哦", "好的", "好", "收到" followed by optional punctuation (comma, period, etc.)
    // Examples: "嗯，..." -> "..." | "好的，..." -> "..."
    const fillerRegex = /^[\s\u3000]*(?:嗯|哦|好的|好|收到)[，,。．!！]\s*/;
    text = text.replace(fillerRegex, "");

    // 5. Final trim to remove any remaining whitespace/newlines
    return text.trim();

  } catch (error) {
    console.error("Gemini Interview Error:", error);
    throw error;
  }
};

export const generateInterviewReport = async (
  messages: Message[], 
  visionHistory?: string[], 
  language: 'zh-HK' | 'en-US' = 'zh-HK'
): Promise<ReportData> => {
  try {
    const historyText = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const langInstruction = language === 'en-US' ? 'English' : 'Traditional Chinese (Hong Kong)';
    let fullPrompt = `${SUMMARY_PROMPT.replace('{language}', langInstruction)}\n\nTranscript:\n${historyText}`;

    // Append Vision Analysis Logs if present
    if (visionHistory && visionHistory.length > 0) {
        const visionText = visionHistory.join('\n- ');
        fullPrompt += `\n\n**VISUAL ANALYSIS LOGS (From Camera):**\n- ${visionText}`;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    if (!response.text) throw new Error("Empty response from AI");
    
    return JSON.parse(response.text) as ReportData;
  } catch (error) {
    console.error("Gemini Report Error:", error);
    throw error;
  }
};

export const generateInterviewHints = async (lastQuestion: string, language: string = 'Cantonese'): Promise<string[]> => {
  try {
    const prompt = HINT_PROMPT_TEMPLATE
        .replace("{lastQuestion}", lastQuestion)
        .replace("{language}", language);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(text);
    
    if (Array.isArray(parsed)) {
        return parsed.slice(0, 3);
    }
    return [];
  } catch (error) {
    console.error("Gemini Hint Error:", error);
    throw error;
  }
};

export const generateQuestionIntent = async (lastQuestion: string, language: string = 'Cantonese'): Promise<string> => {
  try {
    const prompt = INTENT_PROMPT_TEMPLATE
        .replace("{lastQuestion}", lastQuestion)
        .replace("{language}", language);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text?.trim() || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Intent Error:", error);
    throw error;
  }
};

export const generateModelAnswer = async (lastQuestion: string, language: string = 'Cantonese'): Promise<string> => {
  try {
    const prompt = MODEL_ANSWER_PROMPT_TEMPLATE
        .replace("{lastQuestion}", lastQuestion)
        .replace("{language}", language);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text?.trim() || "Model answer unavailable.";
  } catch (error) {
    console.error("Gemini Model Answer Error:", error);
    throw error;
  }
};

export const generateKeyVocabulary = async (lastQuestion: string, language: string = 'Cantonese'): Promise<string[]> => {
  try {
    const prompt = VOCAB_PROMPT_TEMPLATE
        .replace("{lastQuestion}", lastQuestion)
        .replace("{language}", language);
    
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "[]";
    const parsed = JSON.parse(text);
    
    if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
    }
    return [];
  } catch (error) {
    console.error("Gemini Vocab Error:", error);
    throw error;
  }
};

export const analyzeUserSentiment = async (currentImageBase64: string, referenceImageBase64?: string): Promise<string> => {
  try {
    // Helper to strip prefix if present
    const clean = (b64: string) => b64.split(',')[1] || b64;
    
    const parts: any[] = [];

    // If a reference image is provided and differs from current (not the first frame), send both
    if (referenceImageBase64 && referenceImageBase64 !== currentImageBase64) {
        // Part 1: Reference
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: clean(referenceImageBase64)
            }
        });
        // Part 2: Current
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: clean(currentImageBase64)
            }
        });
    } else {
        // Just current image
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: clean(currentImageBase64)
            }
        });
    }

    // Add Prompt
    parts.push({ text: VISION_ANALYSIS_PROMPT });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: parts
      }
    });

    return response.text?.trim() || "Vision analysis failed.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};
