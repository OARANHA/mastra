// src/lib/scheduling.ts

export interface Procedure {
  name: string
  keywords: string[]
  duration: number // minutes
  priceMin: number
  priceMax: number
}

export interface Slot {
  date: string // ISO date
  time: string // HH:mm format
  dateTime: string // ISO datetime
  available: boolean
}

/**
 * Odontology procedures database
 */
export const PROCEDURES: Procedure[] = [
  { name: 'Limpeza Dental (Profilaxia)', keywords: ['limpeza', 'profilaxia', 'polimento'], duration: 45, priceMin: 150, priceMax: 150 },
  { name: 'Tratamento de Canal (Endodontia)', keywords: ['canal', 'tratamento de canal', 'endodontia', 'fazer canal', 'preciso fazer canal', 'polpa'], duration: 90, priceMin: 800, priceMax: 1500 },
  { name: 'Clareamento Dental', keywords: ['clareamento', 'clarear', 'amarelo'], duration: 60, priceMin: 600, priceMax: 1200 },
  { name: 'Extração Dental', keywords: ['extração', 'extrair', 'arrancar'], duration: 30, priceMin: 200, priceMax: 400 },
  { name: 'Restauração', keywords: ['restauração', 'restaurar', 'obturação'], duration: 30, priceMin: 150, priceMax: 300 },
  { name: 'Aparelho Ortodôntico', keywords: ['aparelho', 'ortodôntico', 'alinhador'], duration: 60, priceMin: 3000, priceMax: 8000 },
  { name: 'Prótese Dental', keywords: ['prótese', 'coroa', 'ponte'], duration: 90, priceMin: 1500, priceMax: 5000 },
  { name: 'Implante Dental', keywords: ['implante', 'implantar'], duration: 120, priceMin: 2500, priceMax: 4000 },
  { name: 'Controle/Revisão', keywords: ['controle', 'revisão', 'retorno'], duration: 30, priceMin: 100, priceMax: 100 },
  { name: 'Extração de Siso', keywords: ['siso', 'dente do juízo'], duration: 60, priceMin: 400, priceMax: 800 },
  { name: 'Tratamento de Gengiva', keywords: ['gengiva', 'gengivite', 'periodontia'], duration: 60, priceMin: 300, priceMax: 600 },
  { name: 'Facetas Dentais', keywords: ['facetas', 'faceta', 'lente'], duration: 120, priceMin: 1000, priceMax: 3000 },
  { name: 'Tratamento de Sensibilidade', keywords: ['sensibilidade', 'sensível', 'dor frio'], duration: 30, priceMin: 150, priceMax: 300 },
  { name: 'Moldagem', keywords: ['moldagem', 'molde', 'impressão'], duration: 30, priceMin: 100, priceMax: 200 },
  { name: 'Avaliação/Consulta', keywords: ['avaliação', 'consulta', 'exame'], duration: 30, priceMin: 150, priceMax: 150 }
]

/**
 * Clinic working hours
 */
export const WORKING_HOURS = {
  weekdays: { start: '08:00', end: '18:00' }, // Mon-Fri
  saturday: { start: '08:00', end: '12:00' }, // Sat
  sunday: { start: null, end: null } // Closed
}

/**
 * Detect procedure from message
 */
export function detectProcedure(message: string): Procedure | null {
  const lower = message.toLowerCase()
  
  for (const procedure of PROCEDURES) {
    for (const keyword of procedure.keywords) {
      if (lower.includes(keyword)) {
        return procedure
      }
    }
  }
  
  return null
}

/**
 * Calculate available slots for a given date
 */
export function calculateSlots(startTime: string, duration: number, blockedSlots: string[] = []): Slot[] {
  const slots: Slot[] = []
  const [startHour, startMin] = startTime.split(':').map(Number)
  
  // Generate slots every 30 minutes
  for (let hour = startHour; hour < 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const slotTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      
      // Check if slot is not blocked
      if (!blockedSlots.includes(slotTime)) {
        slots.push({
          date: new Date().toISOString().split('T')[0],
          time: slotTime,
          dateTime: new Date(`${new Date().toISOString().split('T')[0]}T${slotTime}`).toISOString(),
          available: true
        })
      }
    }
  }
  
  // Return first 5 available slots
  return slots.slice(0, 5)
}

/**
 * Get available slots for a procedure (mock implementation)
 */
export function getAvailableSlots(clinicId: string, procedure?: string, date?: string): Slot[] {
  // Mock: Generate slots for today and next 2 days
  const slots: Slot[] = []
  const today = new Date()
  
  for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() + dayOffset)
    
    const dayOfWeek = date.getDay()
    const hours = dayOfWeek === 6 ? WORKING_HOURS.saturday : 
                  dayOfWeek === 0 ? WORKING_HOURS.sunday : 
                  WORKING_HOURS.weekdays
    
    if (hours.start && hours.end) {
      const [startHour] = hours.start.split(':').map(Number)
      const [endHour] = hours.end.split(':').map(Number)
      
      // Generate 3 slots per day
      const slotTimes = [
        `${String(startHour).padStart(2, '0')}:00`,
        `${String(startHour + 2).padStart(2, '0')}:30`,
        `${String(startHour + 4).padStart(2, '0')}:00`
      ].filter(t => {
        const [h] = t.split(':').map(Number)
        return h < endHour
      })
      
      for (const time of slotTimes.slice(0, 3)) {
        slots.push({
          date: date.toISOString().split('T')[0],
          time,
          dateTime: new Date(`${date.toISOString().split('T')[0]}T${time}`).toISOString(),
          available: true
        })
      }
    }
  }
  
  return slots.slice(0, 5)
}

/**
 * Format price range
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === max) {
    return `R$ ${min}`
  }
  return `R$ ${min}-${max}`
}

/**
 * Get procedure details by keyword match
 */
export function getProcedureDetails(message: string): { 
  procedure: Procedure | null
  priceRange: string
  duration: number
} {
  const procedure = detectProcedure(message)
  
  if (!procedure) {
    return {
      procedure: null,
      priceRange: 'R$ 150',
      duration: 30
    }
  }
  
  return {
    procedure,
    priceRange: formatPriceRange(procedure.priceMin, procedure.priceMax),
    duration: procedure.duration
  }
}
