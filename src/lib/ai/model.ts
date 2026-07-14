import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })

export const MODEL_DEFAULT = 'gemini-2.5-flash'

export function farmModel() {
  return google(MODEL_DEFAULT)
}
