# VoiceForge API Documentation

Complete API reference for VoiceForge WhatsApp bot and analytics dashboard.

**Base URL:** `http://localhost:3005`

---

## Webhook API

### POST /api/whatsapp/webhook

Receives WhatsApp messages and returns AI-generated responses.

**Endpoint:** `POST http://localhost:3005/api/whatsapp/webhook`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "clinicId": "test-clinic-1",
  "from": "+5511999999999",
  "message": "Quero agendar limpeza"
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "cmmdptdc50001ktjnqwlk3viq",
  "intent": "agendamento",
  "confidence": 0.9,
  "score": 88,
  "escalated": true,
  "response": "Perfeito! Dr(a). Carlos pode fazer Limpeza Dental (45min). Disponíveis:\n\n🔹 08:00h\n🔹 10:30h\n🔹 12:00h\n\nValor: R$ 150. Confirmo? ✅",
  "metadata": {
    "procedure": "Limpeza Dental",
    "duration": 45,
    "price": "R$ 150"
  },
  "latency": 1250
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Request success status |
| conversationId | string | Unique conversation identifier |
| intent | string | Detected intent (agendamento, preco, convenio, emergencia, outros) |
| confidence | number | Intent confidence (0.0-1.0) |
| score | number | Lead score (0-100) |
| escalated | boolean | Whether conversation escalated to human |
| response | string | AI-generated response |
| metadata | object | Procedure details (if applicable) |
| latency | number | Response time in milliseconds |

---

### Intent Types

| Intent | Score Range | Description | Examples |
|--------|-------------|-------------|----------|
| **agendamento** | 85-95 | Scheduling requests | "Quero agendar limpeza", "Preciso fazer canal" |
| **preco** | 75-85 | Price inquiries | "Quanto custa clareamento?", "Qual o valor?" |
| **convenio** | 70-80 | Insurance questions | "Aceita Unimed?", "Trabalha com SulAmérica?" |
| **emergencia** | 95-100 | Emergency cases | "Tô com dor forte", "Emergência!" |
| **outros** | 50-70 | General questions | "Obrigado", "Bom dia" |

---

### Webhook Test Examples

**Test 1 - Limpeza (Agendamento):**
```bash
curl -X POST http://localhost:3005/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999001","message":"Quero agendar limpeza"}'
```

**Expected Result:**
- Intent: `agendamento`
- Score: `88`
- Response: Shows procedure (Limpeza Dental), duration (45min), price (R$ 150)

**Test 2 - Canal (Agendamento):**
```bash
curl -X POST http://localhost:3005/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999002","message":"Preciso fazer canal"}'
```

**Expected Result:**
- Intent: `agendamento`
- Score: `88`
- Response: Shows procedure (Tratamento de Canal), duration (90min), price (R$ 800-1500)

**Test 3 - Preço:**
```bash
curl -X POST http://localhost:3005/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999003","message":"Quanto custa clareamento?"}'
```

**Expected Result:**
- Intent: `agendamento` or `preco`
- Score: `75-85`
- Response: Shows price information

**Test 4 - Emergência:**
```bash
curl -X POST http://localhost:3005/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999004","message":"Tô com dor forte"}'
```

**Expected Result:**
- Intent: `emergencia`
- Score: `95-100`
- Escalated: `true`
- Response: Shows urgency and available emergency slot

---

## Dashboard API

### GET /api/dashboard/metrics

Returns real-time metrics from Prisma database.

**Endpoint:** `GET http://localhost:3005/api/dashboard/metrics`

**Query Parameters:**
| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| clinicId | Yes | - | Clinic identifier |
| period | No | `week` | `week` or `month` |

**Request Example:**
```bash
curl "http://localhost:3005/api/dashboard/metrics?clinicId=test-clinic-1&period=week"
```

**Response:**
```json
{
  "conversations": {
    "current": 29,
    "previous": 8,
    "growth": 263
  },
  "appointments": {
    "current": 12,
    "previous": 0,
    "growth": 0
  },
  "roi": {
    "revenue": 1800,
    "previousRevenue": 0,
    "cost": 297,
    "multiple": 6.06,
    "previousMultiple": 0
  },
  "avgResponseTime": 60,
  "topIntents": [
    {"intent": "agendamento", "count": 8},
    {"intent": "emergencia", "count": 4},
    {"intent": "convenio", "count": 3},
    {"intent": "preco", "count": 2},
    {"intent": "outros", "count": 2}
  ],
  "period": "week",
  "lastUpdated": "2026-03-05T17:45:06.008Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| conversations.current | number | Current period conversations |
| conversations.previous | number | Previous period conversations |
| conversations.growth | number | Growth percentage |
| appointments.current | number | Confirmed appointments |
| roi.revenue | number | Total revenue (appointments × R$ 150) |
| roi.cost | number | Monthly cost (R$ 297) |
| roi.multiple | number | ROI multiple (revenue / cost) |
| avgResponseTime | number | Average response time in seconds |
| topIntents | array | Top 5 intents with counts |

---

### GET /api/dashboard/daily

Returns daily breakdown of conversations and appointments.

**Endpoint:** `GET http://localhost:3005/api/dashboard/daily`

**Query Parameters:**
| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| clinicId | Yes | - | Clinic identifier |
| days | No | `7` | Number of days (1-30) |

**Request Example:**
```bash
curl "http://localhost:3005/api/dashboard/daily?clinicId=test-clinic-1&days=7"
```

**Response:**
```json
{
  "daily": [
    {"date": "27/02", "fullDate": "2026-02-27T03:00:00.000Z", "conversations": 5, "appointments": 0, "revenue": 0},
    {"date": "28/02", "fullDate": "2026-02-28T03:00:00.000Z", "conversations": 3, "appointments": 0, "revenue": 0},
    {"date": "01/03", "fullDate": "2026-03-01T03:00:00.000Z", "conversations": 1, "appointments": 2, "revenue": 300},
    {"date": "02/03", "fullDate": "2026-03-02T03:00:00.000Z", "conversations": 3, "appointments": 3, "revenue": 450},
    {"date": "03/03", "fullDate": "2026-03-03T03:00:00.000Z", "conversations": 2, "appointments": 1, "revenue": 150},
    {"date": "04/03", "fullDate": "2026-03-04T03:00:00.000Z", "conversations": 8, "appointments": 3, "revenue": 450},
    {"date": "05/03", "fullDate": "2026-03-05T03:00:00.000Z", "conversations": 7, "appointments": 3, "revenue": 450}
  ],
  "period": "week"
}
```

**Daily Fields:**
| Field | Type | Description |
|-------|------|-------------|
| date | string | Date in DD/MM format |
| fullDate | string | ISO 8601 date |
| conversations | number | Conversations count |
| appointments | number | Confirmed appointments |
| revenue | number | Daily revenue (appointments × R$ 150) |

---

## Procedures

15 odontology procedures configured:

| Procedure | Duration | Price | Keywords |
|-----------|----------|-------|----------|
| Limpeza Dental (Profilaxia) | 45min | R$ 150 | limpeza, profilaxia, polimento |
| Tratamento de Canal (Endodontia) | 90min | R$ 800-1500 | canal, endodontia, polpa |
| Clareamento Dental | 60min | R$ 600-1200 | clareamento, clarear, amarelo |
| Extração Dental | 30min | R$ 200-400 | extração, extrair, arrancar |
| Restauração | 30min | R$ 150-300 | restauração, restaurar, obturação |
| Aparelho Ortodôntico | 60min | R$ 3000-8000 | aparelho, ortodôntico, alinhador |
| Prótese Dental | 90min | R$ 1500-5000 | prótese, coroa, ponte |
| Implante Dental | 120min | R$ 2500-4000 | implante, implantar |
| Controle/Revisão | 30min | R$ 100 | controle, revisão, retorno |
| Extração de Siso | 60min | R$ 400-800 | siso, dente do juízo |
| Tratamento de Gengiva | 60min | R$ 300-600 | gengiva, gengivite, periodontia |
| Facetas Dentais | 120min | R$ 1000-3000 | facetas, faceta, lente |
| Tratamento de Sensibilidade | 30min | R$ 150-300 | sensibilidade, sensível |
| Moldagem | 30min | R$ 100-200 | moldagem, molde, impressão |
| Avaliação/Consulta | 30min | R$ 150 | avaliação, consulta, exame |

---

## Error Handling

All endpoints return standard error format:

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error description"
}
```

**HTTP Status Codes:**
| Code | Description | Example |
|------|-------------|---------|
| 200 | Success | Request processed successfully |
| 400 | Bad Request | Missing required parameters |
| 404 | Not Found | Invalid endpoint or resource |
| 500 | Internal Server Error | Server-side error |

**Common Errors:**

**Missing Parameters (400):**
```json
{
  "error": "Missing required fields",
  "details": "clinicId is required"
}
```

**Database Error (500):**
```json
{
  "error": "Internal server error",
  "details": "Prisma error: Connection timeout"
}
```

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Webhook response time | < 2s | 1.2s avg |
| Dashboard auto-refresh | 30s | 30s |
| Intent detection accuracy | > 85% | 88-99% |
| ROI achieved | > 5x | 6.06x |

---

## Version

**API Version:** 1.0.0  
**Last Updated:** 2026-03-05  
**Status:** Production Ready
