import { GoogleGenAI, Type } from "@google/genai";
import { Provider, Message, ApiKeys } from '../types';
import { PROVIDER_MODELS, DEFAULT_SYSTEM_PROMPT } from '../constants';

interface AIResponse {
  reply: string;
  translation: string;
  feedback: {
    corrections: string[];
    praise: string;
    suggestions: string[];
    proficiencyScore: number;
    detectedErrors: string[];
  };
}

export const sendMessageToAI = async (
  messages: Message[],
  language: string,
  nativeLanguage: string,
  goals: string[],
  provider: Provider,
  apiKeys: ApiKeys
): Promise<AIResponse> => {
  // Prepare the system prompt with specific languages
  const systemPrompt = DEFAULT_SYSTEM_PROMPT
    .replace(/{{LANGUAGE}}/g, language)
    .replace(/{{NATIVE_LANGUAGE}}/g, nativeLanguage)
    .replace('{{GOALS}}', goals.join(', '));

  const lastUserMessage = messages[messages.length - 1].content;
  
  // Reinforce instructions in the final prompt to ensure compliance
  const reinforcement = `IMPORTANT: Reply in ${language}. Provide translation and feedback strictly in ${nativeLanguage}. Do not use English.`;

  const fullUserContent = `System Instruction: ${systemPrompt}\n\nConversation History:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser's latest message: ${lastUserMessage}\n\n${reinforcement}`;

  // --- GEMINI HANDLER ---
  if (provider === Provider.GEMINI) {
    if (!apiKeys.gemini) throw new Error("Gemini API Key is missing.");
    
    const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
    const modelId = PROVIDER_MODELS[Provider.GEMINI];

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: [
                { role: 'user', parts: [{ text: fullUserContent }] }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        reply: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        feedback: {
                            type: Type.OBJECT,
                            properties: {
                                corrections: { type: Type.ARRAY, items: { type: Type.STRING } },
                                praise: { type: Type.STRING },
                                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                                proficiencyScore: { type: Type.NUMBER },
                                detectedErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini");
        return JSON.parse(text) as AIResponse;

    } catch (error) {
        console.error("Gemini Error", error);
        throw error;
    }
  }

  // --- GENERIC OPENAI-COMPATIBLE HANDLER (Groq, OpenAI, DeepSeek) ---
  let baseUrl = '';
  let apiKey = '';
  let model = '';

  switch (provider) {
    case Provider.GROQ:
      baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
      apiKey = apiKeys.groq || '';
      model = PROVIDER_MODELS[Provider.GROQ];
      break;
    case Provider.OPENAI:
      baseUrl = 'https://api.openai.com/v1/chat/completions';
      apiKey = apiKeys.openai || '';
      model = PROVIDER_MODELS[Provider.OPENAI];
      break;
    case Provider.DEEPSEEK:
      baseUrl = 'https://api.deepseek.com/v1/chat/completions';
      apiKey = apiKeys.deepseek || '';
      model = 'deepseek-chat';
      break;
  }

  if (!apiKey) throw new Error(`${provider} API Key is missing.`);

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'system', content: reinforcement } // Inject reinforcement as a system reminder at the end
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content) as AIResponse;

  } catch (error) {
    console.error(`${provider} Error`, error);
    throw error;
  }
};