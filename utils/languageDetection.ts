const ES = ['el','la','los','las','yo','tú','él','ella','nosotros','ustedes','no','sí','de','en','por','para','con','estoy','estás','está','hola','buenos','buenas']
const PT = ['o','a','os','as','eu','você','ele','ela','nós','vocês','não','sim','de','em','por','para','com','estou','está','olá','bom','boa']
const FR = ['le','la','les','de','du','au','je','tu','il','elle','nous','vous']
const IT = ['il','lo','la','i','gli','le','io','tu','lui','lei','noi','voi']
const DE = ['der','die','das','und','ist','nicht','ich','du','er','sie','wir','ihr']
const EN = ['the','a','an','is','are','not','i','you','he','she','we','they']

function ratio(tokens: string[], dict: string[]) {
  let count = 0
  for (const t of tokens) { if (dict.includes(t)) count++ }
  return tokens.length ? count / tokens.length : 0
}

export function detectLanguageTolerant(text: string, targetLanguage: string, nativeLanguage: string) {
  const raw = (text || '').toLowerCase()
  const tokens = raw.replace(/[^\p{L}\p{N}\s¿¡’'-]/gu,' ').split(/\s+/).filter(Boolean)

  const map: Record<string,string[]> = {
    Spanish: ES, Portuguese: PT, French: FR, Italian: IT, German: DE, English: EN
  }
  const targetDict = map[targetLanguage] || []
  const nativeDict = map[nativeLanguage] || []

  const alvoRatio = ratio(tokens, targetDict)
  const nativoRatio = ratio(tokens, nativeDict)

  let classification: 'alvo'|'alvo_com_interferencia'|'nativo' = 'alvo'
  if (alvoRatio >= 0.3) classification = 'alvo'
  else if (nativoRatio > 0.7) classification = 'nativo'
  else classification = 'alvo_com_interferencia'

  const ambiguous = !(alvoRatio >= 0.3 || nativoRatio > 0.7)
  const interference_terms: string[] = []
  if (classification !== 'nativo') {
    for (const t of tokens) { if (nativeDict.includes(t) && !targetDict.includes(t)) interference_terms.push(t) }
  }

  return { classification, alvo_ratio: alvoRatio, nativo_ratio: nativoRatio, ambiguous, interference_terms, reasoning: '' }
}