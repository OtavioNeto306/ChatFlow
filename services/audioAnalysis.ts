import { GoogleGenAI, Type } from '@google/genai'
import { Provider, ApiKeys } from '../types'
import { detectLanguageTolerant } from '../utils/languageDetection'

export interface AudioTranscription { transcript: string; warnings?: string[] }
export interface AudioAnalysisResponse { reply: string; translation: string; feedback: any }

export async function transcribeAudio(provider: Provider, apiKeys: ApiKeys, audio: Blob, model?: string): Promise<AudioTranscription> {
  switch (provider) {
    case Provider.OPENAI: {
      const key = apiKeys.openai || ''
      if (!key) throw new Error('OpenAI API Key is missing.')
      const form = new FormData()
      form.append('file', audio, 'audio.webm')
      form.append('model', model || 'whisper-1')
      try {
        const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form })
        if (!res.ok) {
          const status = res.status
          const text = await res.text().catch(() => '')
          if (status === 404 && apiKeys.groq) return await transcribeAudio(Provider.GROQ, apiKeys, audio, 'whisper-large-v3')
          let message = 'Falha na transcrição OpenAI'
          try { const j = JSON.parse(text); message = j?.error?.message || message } catch {}
          throw new Error(message)
        }
        const data = await res.json()
        return { transcript: data.text || '' }
      } catch (e) {
        if (apiKeys.groq) return await transcribeAudio(Provider.GROQ, apiKeys, audio, 'whisper-large-v3')
        throw e
      }
    }
    case Provider.GROQ: {
      const key = apiKeys.groq || ''
      if (!key) throw new Error('Groq API Key is missing.')
      const form = new FormData()
      form.append('file', audio, 'audio.webm')
      form.append('model', model || 'whisper-large-v3')
      try {
        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' }, body: form })
        if (!res.ok) {
          const status = res.status
          if ((status === 404 || status === 429) && apiKeys.gemini) return await transcribeAudio(Provider.GEMINI, apiKeys, audio, 'gemini-2.5-flash')
          throw new Error('Falha na transcrição Groq')
        }
        const data = await res.json()
        return { transcript: data.text || '' }
      } catch (e) {
        if (apiKeys.gemini) return await transcribeAudio(Provider.GEMINI, apiKeys, audio, 'gemini-2.5-flash')
        throw e
      }
    }
    case Provider.GEMINI: {
      const key = apiKeys.gemini || ''
      if (!key) throw new Error('Gemini API Key is missing.')
      const ai = new GoogleGenAI({ apiKey: key })
      const base64 = await blobToBase64(audio)
      const res = await ai.models.generateContent({
        model: model || 'gemini-2.5-flash',
        contents: [ { role: 'user', parts: [ { text: 'Transcreva o áudio a seguir e retorne somente o texto transcrito.' }, { inlineData: { mimeType: 'audio/webm', data: base64 } } ] } ]
      })
      const text = res.text || ''
      return { transcript: text.trim() }
    }
    case Provider.DEEPSEEK: {
      const key = apiKeys.deepseek || ''
      if (!key) throw new Error('DeepSeek API Key is missing.')
      if (apiKeys.groq) return await transcribeAudio(Provider.GROQ, apiKeys, audio, 'whisper-large-v3')
      throw new Error('Modelo de transcrição não disponível via browser para este provedor')
    }
    default:
      throw new Error('Provider not supported for audio')
  }
}

export async function analyzePronunciation(provider: Provider, apiKeys: ApiKeys, transcript: string, expectedSentence: string, language: string, nativeLanguage: string): Promise<AudioAnalysisResponse> {
  const assess = detectLanguageTolerant(transcript, language, nativeLanguage)
  const prompt = `Você é NoolaSpeak, tutor de pronúncia. Presuma que o aluno está tentando falar ${language}. Nunca peça para usar ${nativeLanguage}. Se houver interferência de ${nativeLanguage}, trate como erro de ${language}. Classificação: ${JSON.stringify(assess)}. Analise comparando com a frase esperada e retorne JSON: reply, translation, feedback { corrections[], praise, suggestions[], proficiencyScore, detectedErrors[], pronunciationScore, fluencyScore, phoneticErrors[], practiceSuggestions[], phraseComparisons[{expected, spoken, similarity}], audioQualityWarnings[], languageAssessment }. Explicações em ${nativeLanguage}.`
  const userContent = `Frase esperada: ${expectedSentence}\nTranscrição do aluno: ${transcript}`

  if (provider === Provider.GEMINI) {
    const key = apiKeys.gemini || ''
    if (!key) throw new Error('Gemini API Key is missing.')
    const ai = new GoogleGenAI({ apiKey: key })
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [ { role: 'user', parts: [{ text: `${prompt}\n\n${userContent}` }] } ],
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { reply: { type: Type.STRING }, translation: { type: Type.STRING }, feedback: { type: Type.OBJECT, properties: { corrections: { type: Type.ARRAY, items: { type: Type.STRING } }, praise: { type: Type.STRING }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }, proficiencyScore: { type: Type.NUMBER }, detectedErrors: { type: Type.ARRAY, items: { type: Type.STRING } }, pronunciationScore: { type: Type.NUMBER }, fluencyScore: { type: Type.NUMBER }, phoneticErrors: { type: Type.ARRAY, items: { type: Type.STRING } }, practiceSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }, phraseComparisons: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { expected: { type: Type.STRING }, spoken: { type: Type.STRING }, similarity: { type: Type.NUMBER } } } }, audioQualityWarnings: { type: Type.ARRAY, items: { type: Type.STRING } }, languageAssessment: { type: Type.OBJECT, properties: { classification: { type: Type.STRING }, alvo_ratio: { type: Type.NUMBER }, nativo_ratio: { type: Type.NUMBER }, ambiguous: { type: Type.BOOLEAN }, interference_terms: { type: Type.ARRAY, items: { type: Type.STRING } }, reasoning: { type: Type.STRING } } } } } } } }
    })
    const text = res.text
    if (!text) throw new Error('Empty response')
    return JSON.parse(text)
  }

  let baseUrl = ''
  let apiKey = ''
  let model = ''
  switch (provider) {
    case Provider.OPENAI: baseUrl = 'https://api.openai.com/v1/chat/completions'; apiKey = apiKeys.openai || ''; model = 'gpt-4o-mini'; break
    case Provider.GROQ: baseUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiKey = apiKeys.groq || ''; model = 'llama-3.3-70b-versatile'; break
    case Provider.DEEPSEEK: baseUrl = 'https://api.deepseek.com/v1/chat/completions'; apiKey = apiKeys.deepseek || ''; model = 'deepseek-chat'; break
  }
  if (!apiKey) throw new Error('API Key is missing.')
  const response = await fetch(baseUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: [ { role: 'system', content: prompt }, { role: 'user', content: userContent } ], response_format: { type: 'json_object' }, temperature: 0.3 }) })
  if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.error?.message || 'Falha na análise de pronúncia') }
  const data = await response.json()
  const content = data.choices[0]?.message?.content || '{}'
  return JSON.parse(content)
}

async function blobToBase64(b: Blob): Promise<string> { const reader = new FileReader(); return new Promise((resolve, reject) => { reader.onload = () => { const res = (reader.result as string).split(',')[1] || ''; resolve(res) }; reader.onerror = () => reject(reader.error); reader.readAsDataURL(b) }) }