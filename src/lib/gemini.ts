import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI GenAI instance
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fallback models in priority order as requested:
// 1. gemini-2.5-flash-lite
// 2. gemini-2.5-flash
// 3. gemini-3-flash-lite
// 4. gemini-3-flash
export const FALLBACK_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest'
];

interface GenerativeModelOptions {
  model: string;
  systemInstruction?: string;
  generationConfig?: any;
  safetySettings?: any;
}

// Global cache for the last successful model to prioritize it in subsequent calls
let globalLastSuccessfulModel: string | null = null;

/**
 * Returns a wrapped model object that conforms to the SDK's interface,
 * but transparently falls back to secondary models if the primary model fails.
 */
export function getGenerativeModelWithFallback(options: GenerativeModelOptions) {
  const preferredModel = options.model;
  
  // Create unique list of models starting with the preferred one,
  // then the rest of the fallback models.
  const modelsToTry = [
    preferredModel,
    ...FALLBACK_MODELS.filter(m => m !== preferredModel)
  ];

  return {
    generateContent: async (prompt: any) => {
      // Prioritize the last successful model if it's part of the allowed models for this call
      const orderedModels = globalLastSuccessfulModel && modelsToTry.includes(globalLastSuccessfulModel)
        ? [globalLastSuccessfulModel, ...modelsToTry.filter(m => m !== globalLastSuccessfulModel)]
        : modelsToTry;

      let lastError: any = null;
      for (const modelName of orderedModels) {
        try {
          console.log(`[Gemini Fallback] Attempting generateContent with model: ${modelName}`);
          const modelInstance = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: options.systemInstruction,
            generationConfig: options.generationConfig,
            safetySettings: options.safetySettings,
          });
          const result = await modelInstance.generateContent(prompt);
          globalLastSuccessfulModel = modelName; // Save successful model globally
          return result;
        } catch (error: any) {
          console.warn(`[Gemini Fallback] Failed generateContent on model ${modelName}:`, error?.message || error);
          lastError = error;
        }
      }
      throw lastError || new Error('All fallback models failed for generateContent.');
    },

    startChat: (chatOptions: any) => {
      let activeChatSession: any = null;
      let activeModelName: string | null = null;

      return {
        sendMessage: async (content: any) => {
          // If we already have an active chat session that succeeded previously, continue using it
          if (activeChatSession) {
            console.log(`[Gemini Fallback] Continuing chat with active model: ${activeModelName}`);
            return await activeChatSession.sendMessage(content);
          }

          // Prioritize the last successful model
          const orderedModels = globalLastSuccessfulModel && modelsToTry.includes(globalLastSuccessfulModel)
            ? [globalLastSuccessfulModel, ...modelsToTry.filter(m => m !== globalLastSuccessfulModel)]
            : modelsToTry;

          let lastError: any = null;
          for (const modelName of orderedModels) {
            try {
              console.log(`[Gemini Fallback] Attempting startChat -> sendMessage with model: ${modelName}`);
              const modelInstance = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: options.systemInstruction,
                generationConfig: options.generationConfig,
                safetySettings: options.safetySettings,
              });
              const chatSession = modelInstance.startChat(chatOptions);
              const result = await chatSession.sendMessage(content);
              
              // If successful, save this session and model name for subsequent calls!
              activeChatSession = chatSession;
              activeModelName = modelName;
              globalLastSuccessfulModel = modelName; // Save successful model globally
              return result;
            } catch (error: any) {
              console.warn(`[Gemini Fallback] Failed sendMessage on model ${modelName}:`, error?.message || error);
              lastError = error;
            }
          }
          throw lastError || new Error('All fallback models failed for sendMessage.');
        }
      };
    }
  };
}
