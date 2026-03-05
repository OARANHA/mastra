// src/lib/templates.ts
import { IntentType } from '@/types/intent'

export interface TemplateVariables {
  clinicName?: string
  doctorName?: string
  availableSlots?: string
  basePrice?: string
  convenios?: string
  convenioName?: string
  emergencySlot?: string
  horarios?: string
  address?: string
  procedure?: string
  procedureName?: string
  procedureDuration?: string
  procedurePriceRange?: string
  slot1?: string
  slot2?: string
  slot3?: string
}

export interface Template {
  text: string
  variables: (keyof TemplateVariables)[]
}

export const templatesByIntent: Record<IntentType, Template[]> = {
  agendamento: [
    {
      text: "Ótimo! {procedureName} leva cerca de {procedureDuration}min. Temos horários:\n\n1️⃣ {slot1}\n2️⃣ {slot2}\n3️⃣ {slot3}\n\nInvestimento: {procedurePriceRange}. Qual prefere? 😊",
      variables: ['procedureName', 'procedureDuration', 'procedurePriceRange', 'slot1', 'slot2', 'slot3']
    },
    {
      text: "Perfeito! Dr(a). {doctorName} pode fazer {procedureName} ({procedureDuration}min). Disponíveis:\n\n{availableSlots}\n\nValor: {procedurePriceRange}. Confirmo? ✅",
      variables: ['doctorName', 'procedureName', 'procedureDuration', 'availableSlots', 'procedurePriceRange']
    },
    {
      text: "Excelente escolha! {procedureName} dura {procedureDuration}min. Horários:\n\n{availableSlots}\n\nInvestimento: {procedurePriceRange}. Qual o melhor? 📅",
      variables: ['procedureName', 'procedureDuration', 'availableSlots', 'procedurePriceRange']
    }
  ],
  preco: [
    {
      text: "Consulta a partir de R$ {basePrice}. Trabalhamos com convênios! Qual seu plano? 💳",
      variables: ['basePrice']
    },
    {
      text: "Valores partem de R$ {basePrice}. Aceita {convenios}. Posso agendar? 😊",
      variables: ['basePrice', 'convenios']
    }
  ],
  convenio: [
    {
      text: "Sim! Aceitamos {convenioName} 😊 Quer agendar consulta?",
      variables: ['convenioName']
    },
    {
      text: "Trabalhamos com {convenioName}! Qual procedimento precisa? 📋",
      variables: ['convenioName']
    }
  ],
  emergencia: [
    {
      text: "Entendo a urgência! {doctorName} pode te atender hoje às {emergencySlot}. Confirma? 🚨",
      variables: ['doctorName', 'emergencySlot']
    },
    {
      text: "Vou priorizar! Consigo encaixe às {emergencySlot}. Consegue vir? ⚠️",
      variables: ['emergencySlot']
    }
  ],
  informacao: [
    {
      text: "Atendemos {horarios}. Endereço: {address}. Posso agendar? 📍",
      variables: ['horarios', 'address']
    }
  ],
  outros: [
    {
      text: "Obrigado pela mensagem! 😊 Como posso ajudar você hoje?",
      variables: []
    }
  ]
}

export function generateTemplateResponse(intent: IntentType, variables: TemplateVariables): string {
  const templates = templatesByIntent[intent] || templatesByIntent.outros
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  let text = template.text
  Object.entries(variables).forEach(([key, value]) => {
    if (value) text = text.replace(new RegExp(`{${key}}`, 'g'), String(value))
  })
  
  return text
}
