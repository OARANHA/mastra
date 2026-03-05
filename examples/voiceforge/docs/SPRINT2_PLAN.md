# Sprint 2 Execution Plan - Day 2

**Date:** March 6, 2026  
**Duration:** 7 hours (9:00 - 18:00, 1h lunch break)  
**Target:** Complete 9/9 remaining User Stories (100% MVP)  
**Starting Point:** v0.5.0-sprint1  
**Goal Tag:** v1.0.0

---

## Executive Summary

Sprint 2 will complete the remaining 50% of MVP by implementing templates, persistence, notifications, authentication, multi-clinic support, and logging. Target is v1.0.0 release by 18:00.

**Total User Stories:** 9 | **Total Time:** 7 hours | **Average per US:** 46 minutes | **Target Velocity:** 1.3 US/hour

---

## Morning Session (9:00 - 12:00) - 3 hours

### US-005: Templates Preço (9:00 - 9:40) - 40 minutes
**Files:** `src/lib/templates.ts` (+30), `src/lib/qwen.ts`  
**Test:** `curl -X POST http://localhost:3005/api/whatsapp/webhook -d '{"message":"Quanto custa limpeza?"}'`  
**Acceptance:** Price template with 15 procedures, CTA for scheduling ✅

### US-007: Templates Convênio (9:40 - 10:20) - 40 minutes
**Files:** `src/lib/templates.ts` (+25), `src/lib/qwen.ts`  
**Test:** `curl -X POST -d '{"message":"Aceita Unimed?"}'`  
**Acceptance:** 6 insurance providers list, CTA for coverage ✅

### US-008: Templates Emergência (10:20 - 11:00) - 40 minutes
**Files:** `src/lib/templates.ts` (+35), `src/lib/scheduling.ts`  
**Test:** `curl -X POST -d '{"message":"Tô com dor forte"}'`  
**Acceptance:** Emergency slots (next 2h), urgency prioritization ✅

### US-012: Persistência Conversas (11:00 - 12:00) - 1 hour
**Files:** `src/app/api/whatsapp/webhook/route.ts` (+60)  
**Test:** Send message → Verify Prisma (conversation + 2 messages)  
**Acceptance:** All messages saved with intent/score metadata ✅

---

## Afternoon Session (14:00 - 18:00) - 4 hours

### US-013: Confirmação Agendamento (14:00 - 15:30) - 1.5h
**Files:** `src/app/api/whatsapp/webhook/route.ts` (+80), `src/lib/scheduling.ts` (+40)  
**Test:** "Quero agendar" → "08:00" → Appointment created  
**Acceptance:** Multi-step flow, Prisma appointment with status 'confirmed' ✅

### US-014: Notificações WhatsApp (15:30 - 16:30) - 1 hour
**Files:** `src/integrations/baileys.ts` (+50), `webhook/route.ts` (+20)  
**Test:** Complete flow → Baileys message sent  
**Acceptance:** Confirmation template with all details ✅

### US-015: Admin Auth (16:30 - 17:00) - 30 minutes
**Files:** `src/app/api/auth/[...nextauth]/route.ts` (NEW), `src/middleware.ts` (NEW)  
**Test:** Dashboard without auth → redirect to /login  
**Acceptance:** NextAuth configured, middleware protects /dashboard ✅

### US-016: Multi-clinic (17:00 - 17:30) - 30 minutes
**Files:** `src/app/dashboard/page.tsx` (+30), `ClinicSelector.tsx` (NEW)  
**Test:** Switch clinic → data updates  
**Acceptance:** Selector component, filters by clinicId ✅

### US-017: Logs (17:30 - 18:00) - 30 minutes
**Files:** `webhook/route.ts` (+30), Prisma Log model  
**Test:** Send message → Check Logs table in Prisma Studio  
**Acceptance:** All webhooks logged with intent/score ✅

---

## Final (18:00 - 18:30)

### US-018: Deployment Docs + Tag v1.0.0
**Files:** `docs/DEPLOYMENT.md` (NEW), `README.md` (update)  
**Tag:** `git tag -a v1.0.0 -m "MVP Complete: 18/18 US"`  
**Acceptance:** v1.0.0 tagged and pushed ✅

---

## Day 2 Timeline

| Time | User Story | Duration | Status |
|------|------------|----------|--------|
| 9:00 - 9:40 | US-005: Templates Preço | 40min | ⏳ |
| 9:40 - 10:20 | US-007: Templates Convênio | 40min | ⏳ |
| 10:20 - 11:00 | US-008: Templates Emergência | 40min | ⏳ |
| 11:00 - 12:00 | US-012: Persistência Conversas | 1h | ⏳ |
| 12:00 - 14:00 | **LUNCH BREAK** | 2h | - |
| 14:00 - 15:30 | US-013: Confirmação Agendamento | 1.5h | ⏳ |
| 15:30 - 16:30 | US-014: Notificações WhatsApp | 1h | ⏳ |
| 16:30 - 17:00 | US-015: Admin Auth | 30min | ⏳ |
| 17:00 - 17:30 | US-016: Multi-clinic | 30min | ⏳ |
| 17:30 - 18:00 | US-017: Logs | 30min | ⏳ |
| 18:00 - 18:30 | US-018: Deployment + Tag v1.0.0 | 30min | ⏳ |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Baileys not connected | Medium | Use mock for notifications |
| Database issues | Low | Have reset script ready |
| Time overrun | Medium | Prioritize US-005,007,008,012,013 (core) |

---

## Success Criteria

- [ ] All 9 US completed
- [ ] All tests passing
- [ ] Tag v1.0.0 created
- [ ] Documentation updated
- [ ] Production ready

---

**Prepared by:** Amelia (Dev Agent) | **Date:** March 5, 2026 | **Version:** v0.5.0 → v1.0.0 (target)
