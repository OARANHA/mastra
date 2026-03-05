#!/bin/bash

echo "🧪 VoiceForge - Complete Test Suite"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3005"
PASSED=0
FAILED=0

# Check if server is running
echo -e "${YELLOW}🔍 Checking if server is running...${NC}"
if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server not running at $BASE_URL${NC}"
    echo "Please run: npm run dev"
    exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test 1: Webhook - Limpeza
echo -e "${YELLOW}Test 1: Webhook - Limpeza (Agendamento)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999001","message":"Quero agendar limpeza"}')
INTENT=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('intent', 'error'))" 2>/dev/null)
if [ "$INTENT" == "agendamento" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Intent: agendamento (Score: $(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('score', 0))" 2>/dev/null))"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Expected: agendamento, Got: $INTENT"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Webhook - Canal
echo -e "${YELLOW}Test 2: Webhook - Canal (Agendamento)${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999002","message":"Preciso fazer canal"}')
INTENT=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('intent', 'error'))" 2>/dev/null)
if [ "$INTENT" == "agendamento" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Intent: agendamento (Score: $(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('score', 0))" 2>/dev/null))"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Expected: agendamento, Got: $INTENT"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 3: Webhook - Preço
echo -e "${YELLOW}Test 3: Webhook - Preço${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999003","message":"Quanto custa clareamento?"}')
INTENT=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('intent', 'error'))" 2>/dev/null)
if [ "$INTENT" == "agendamento" ] || [ "$INTENT" == "preco" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Intent: $INTENT"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Expected: agendamento/preco, Got: $INTENT"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: Webhook - Emergência
echo -e "${YELLOW}Test 4: Webhook - Emergência${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{"clinicId":"test-clinic-1","from":"+5511999999004","message":"Tô com dor forte"}')
INTENT=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('intent', 'error'))" 2>/dev/null)
ESCALATED=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('escalated', False))" 2>/dev/null)
if [ "$INTENT" == "emergencia" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Intent: emergencia (Escalated: $ESCALATED, Score: $(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('score', 0))" 2>/dev/null))"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Expected: emergencia, Got: $INTENT"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 5: Dashboard Metrics
echo -e "${YELLOW}Test 5: Dashboard Metrics API${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/dashboard/metrics?clinicId=test-clinic-1&period=week")
ROI=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('roi', {}).get('multiple', 0))" 2>/dev/null)
CONVERSATIONS=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('conversations', {}).get('current', 0))" 2>/dev/null)
APPOINTMENTS=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('appointments', {}).get('current', 0))" 2>/dev/null)
if (( $(echo "$ROI > 5" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC} - ROI: ${ROI}x (Conversations: $CONVERSATIONS, Appointments: $APPOINTMENTS)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Expected ROI > 5, Got: ${ROI}x"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 6: Dashboard Daily
echo -e "${YELLOW}Test 6: Dashboard Daily API${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/dashboard/daily?clinicId=test-clinic-1&days=7")
DAYS=$(echo $RESPONSE | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('daily', [])))" 2>/dev/null)
if [ "$DAYS" -eq 7 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Days: 7"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - Expected: 7 days, Got: $DAYS"
    FAILED=$((FAILED + 1))
fi
echo ""

# Summary
echo "===================================="
echo -e "${YELLOW}📊 Test Summary${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Dashboard: $BASE_URL/dashboard"
    echo "Prisma Studio: http://localhost:5555"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review.${NC}"
    exit 1
fi
