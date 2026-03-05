// src/types/intent.ts

export type IntentType = 
  | 'agendamento'
  | 'preco'
  | 'convenio'
  | 'emergencia'
  | 'informacao'
  | 'outros'

export interface Intent {
  type: IntentType
  confidence: number  // 0.0 - 1.0
  entities: {
    procedure?: string      // 'limpeza', 'canal', 'clareamento'
    date?: string           // 'amanhã', 'segunda-feira'
    time?: string           // '14:00', 'tarde'
    insurance?: string      // 'Unimed', 'SulAmérica'
    urgency?: 'low' | 'medium' | 'high'
  }
}

export interface ConversationContext {
  clinicId: string
  patientPhone: string
  history: Message[]
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface QwenResponse {
  intent: Intent
  response: string
  score: number
  shouldEscalate: boolean
}
