import { GoogleGenAI, Type } from "@google/genai";
import { Provider, Message, ApiKeys, TopicResponse } from '../types';
import { detectLanguageTolerant } from '../utils/languageDetection';
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
  const assessment = detectLanguageTolerant(lastUserMessage, language, nativeLanguage);

  // Reinforce instructions in the final prompt to ensure compliance
  const reinforcement = `IMPORTANT: Reply in ${language}. Provide translation and feedback strictly in ${nativeLanguage}. Do not use English. Always assume the user is attempting to speak ${language}. If interference from ${nativeLanguage} appears, treat it as errors of ${language}. Avoid telling the user to speak ${nativeLanguage}.`;

  const fullUserContent = `System Instruction: ${systemPrompt}\n\nConversation History:\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser's latest message: ${lastUserMessage}\n\nLanguage Assessment (tolerant): ${JSON.stringify(assessment)}\n\n${reinforcement}`;

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
                  pronunciationScore: { type: Type.NUMBER },
                  fluencyScore: { type: Type.NUMBER },
                  phoneticErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  practiceSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  phraseComparisons: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { expected: { type: Type.STRING }, spoken: { type: Type.STRING }, similarity: { type: Type.NUMBER } } } },
                  audioQualityWarnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                  languageAssessment: { type: Type.OBJECT, properties: { classification: { type: Type.STRING }, alvo_ratio: { type: Type.NUMBER }, nativo_ratio: { type: Type.NUMBER }, ambiguous: { type: Type.BOOLEAN }, interference_terms: { type: Type.ARRAY, items: { type: Type.STRING } }, reasoning: { type: Type.STRING } } },
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
          { role: 'system', content: `Language Assessment (tolerant): ${JSON.stringify(assessment)}` },
          { role: 'system', content: reinforcement }
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

export const getTopicSuggestions = async (
  language: string,
  nativeLanguage: string,
  proficiencyLevel: string,
  recentMessages: Message[],
  provider: Provider,
  apiKeys: ApiKeys
): Promise<TopicResponse> => {
  const prompt = `
You are NoolaSpeak, an adaptive language tutor.

Your task is to generate conversation topic suggestions based on:
- The user's native language: ${nativeLanguage}
- The language they are learning: ${language}
- Their proficiency level: ${proficiencyLevel} (Beginner, Intermediate, Advanced)
- Their recent conversation context: ${recentMessages.map(m => `${m.role}: ${m.content}`).join('\n').slice(-1000)}

REQUIREMENTS:

1. All suggested topics MUST be short, simple clickable phrases written in ${language} only.
   Examples:
   - "Hablar sobre mi rutina"
   - "Conversar sobre viajes y aeropuertos"
   - "Practicar compras en el supermercado"

2. Create 4 to 6 options that:
   - Are relevant to daily life
   - Match the user's proficiency
   - Help expand vocabulary naturally
   - Encourage role-play style conversations

3. For each suggestion, also generate a short explanation in ${nativeLanguage} that describes why this topic is useful for learning.

4. Output MUST be **valid JSON only**, using this structure:

{
  "topics": [
    {
      "label": "Topic name in ${language}",
      "description": "Explanation in ${nativeLanguage}"
    }
  ]
}

Do NOT include any extra text outside the JSON.
`;

  // --- GEMINI HANDLER ---
  if (provider === Provider.GEMINI) {
    if (!apiKeys.gemini) throw new Error("Gemini API Key is missing.");

    const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
    const modelId = PROVIDER_MODELS[Provider.GEMINI];

    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      return JSON.parse(text) as TopicResponse;

    } catch (error) {
      console.error("Gemini Error", error);
      throw error;
    }
  }

  // --- GENERIC OPENAI-COMPATIBLE HANDLER ---
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
          { role: 'user', content: prompt }
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
    return JSON.parse(content) as TopicResponse;

  } catch (error) {
    console.error(`${provider} Error`, error);
    throw error;
  }
};

interface CorrectionResponse {
  reply: string;
  translation: string;
  feedback: any;
}

export const sendCorrectionToAI = async (
  originalText: string,
  correctedText: string,
  language: string,
  nativeLanguage: string,
  provider: Provider,
  apiKeys: ApiKeys
): Promise<CorrectionResponse> => {
  const instructions = `Presuma que o aluno está tentando falar ${language}. Nunca peça para usar ${nativeLanguage}. Compare a frase original com a corrigida e explique claramente o erro e o motivo. Dê a frase final correta em ${language}. Retorne JSON válido com campos: reply, translation, feedback { correctionReview { original, corrected, explanation, finalCorrectSentence, diff[] }, corrections[], suggestions[], proficiencyScore, detectedErrors[] }.`
  const content = `Original: ${originalText}\nCorrigida: ${correctedText}\n${instructions}`

  if (provider === Provider.GEMINI) {
    if (!apiKeys.gemini) throw new Error('Gemini API Key is missing.')
    const ai = new GoogleGenAI({ apiKey: apiKeys.gemini })
    const modelId = PROVIDER_MODELS[Provider.GEMINI]
    const res = await ai.models.generateContent({
      model: modelId,
      contents: [ { role: 'user', parts: [{ text: content }] } ],
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { reply: { type: Type.STRING }, translation: { type: Type.STRING }, feedback: { type: Type.OBJECT, properties: { correctionReview: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, corrected: { type: Type.STRING }, explanation: { type: Type.STRING }, finalCorrectSentence: { type: Type.STRING }, diff: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { from: { type: Type.STRING }, to: { type: Type.STRING } } } } } }, corrections: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }, proficiencyScore: { type: Type.NUMBER }, detectedErrors: { type: Type.ARRAY, items: { type: Type.STRING } } } } } } }
    })
    const text = res.text
    if (!text) throw new Error('Empty response from Gemini')
    return JSON.parse(text)
  }

  let baseUrl = ''
  let apiKey = ''
  let model = ''
  switch (provider) {
    case Provider.GROQ: baseUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiKey = apiKeys.groq || ''; model = PROVIDER_MODELS[Provider.GROQ]; break
    case Provider.OPENAI: baseUrl = 'https://api.openai.com/v1/chat/completions'; apiKey = apiKeys.openai || ''; model = PROVIDER_MODELS[Provider.OPENAI]; break
    case Provider.DEEPSEEK: baseUrl = 'https://api.deepseek.com/v1/chat/completions'; apiKey = apiKeys.deepseek || ''; model = 'deepseek-chat'; break
  }
  if (!apiKey) throw new Error(`${provider} API Key is missing.`)
  const resp = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: [ { role: 'system', content: instructions }, { role: 'user', content } ], response_format: { type: 'json_object' }, temperature: 0.4 }) })
  if (!resp.ok) { const err = await resp.json().catch(() => ({})); throw new Error(err.error?.message || `API Error: ${resp.statusText}`) }
  const data = await resp.json()
  const out = data.choices[0].message.content
  return JSON.parse(out)
}
