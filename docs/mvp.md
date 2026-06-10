# ChartSkin — MVP 스펙 & 작업 분해

> 1차 구현 계약 문서. 전체 로드맵·기술 근거는 [`tech_stack.md`](./tech_stack.md) 참고.
> 핵심: **API 키 불필요 + 유저별 데이터 없음 → 순수 프론트엔드, 백엔드 0.**

---

## 1. MVP 범위

### 포함
| 영역 | 범위 |
|------|------|
| 데이터 | **Binance(암호화폐)만** — 키 불필요, 브라우저 직접 호출 |
| 차트 | 캔들·거래량·MA(5/20/60/120)·기간 선택·줌/스크롤/십자선 |
| 배경 스킨 | 앱 번들 정적 이미지 1~2개 + 투명도·fit 모드 |
| 지표 스킨 | 좌표 오버레이·최고/최저 자동감지·캐릭터·말풍선 |
| 스킨 전환 | 박아둔 스킨 적용·해제 토글 |
| 내보내기 | PNG (스킨 합성 포함) |

### 제외 (Backlog)
주식(키 필요) · 마켓플레이스 · 이미지 업로드 · 유저별 저장 · 인증 · AI 생성 · MP4
→ 부활 조건은 `tech_stack.md` §MVP/§Backlog 참고.

---

## 2. 기술 스택

```
React + TypeScript
Vite                      # 빌드 (순수 프론트라 Next 불필요)
lightweight-charts v5     # 차트
Zustand                   # 전역 상태 (적용 스킨·차트 설정)
Tailwind CSS              # 스타일
html-to-image             # PNG export
dnd-kit                   # (지표 스킨 위치 조정 — 필요 시)
```

> ⚠️ **프레임워크 주의**: backlog의 주식/AI가 곧 들어오면 백엔드(API Route) 필요 → 그때 **Next.js**로 시작했어야 마이그레이션 0.
> 당분간 차트·스킨만 갈 거라 Vite 채택. 주식 일정 잡히면 재검토.

> ⚠️ **lightweight-charts v5 API**: series 생성은 `chart.addSeries(CandlestickSeries, opts)` 형식.
> v4의 `addCandlestickSeries()` 아님 — 예제 복붙 시 주의.

---

## 3. 작업 분해 (기능 단위)

> 협업용. `[ ]` 체크박스 = 1 작업 단위. **의존**은 선행 작업, **담당**은 병렬 분담 제안(A=차트/데이터, B=스킨/UI).

### M0. 프로젝트 셋업  · 담당 공통 · 의존 없음
- [ ] Vite + React + TS 초기화
- [ ] Tailwind 설정
- [ ] 폴더 구조 (`/components`, `/features`, `/stores`, `/lib`, `/assets/skins`)
- [ ] Zustand 스토어 뼈대 (`chartStore`, `skinStore`)
- [ ] ESLint/Prettier

### M1. 데이터 레이어 (Binance)  · 담당 A · 의존 M0
- [ ] Binance REST 클라이언트 (`/api/v3/klines`)
- [ ] 응답 → 통일 `Candle{time,open,high,low,close,volume}` 어댑터
- [ ] 기간/심볼 파라미터 (interval: 1m/5m/15m/1h/1d…)
- [ ] 심볼 검색/선택 (목록은 일단 고정 또는 `/exchangeInfo`)
- [ ] 로딩·에러 상태

### M2. 차트 코어  · 담당 A · 의존 M1
- [ ] lightweight-charts v5 마운트 + 리사이즈 핸들
- [ ] 캔들 시리즈 + 거래량 히스토그램(별도 pane)
- [ ] MA 계산 함수(SMA 5/20/60/120) → 라인 시리즈 주입
- [ ] 기간 선택 UI ↔ 데이터 refetch ↔ `setData`
- [ ] 줌/스크롤/십자선 (라이브러리 옵션)
- [ ] 차트 배경 **투명화** (배경 스킨 레이어 깔 준비)

### M3. 좌표 오버레이 엔진 (핵심)  · 담당 B · 의존 M2
- [ ] 차트 위 절대배치 오버레이 레이어 컨테이너
- [ ] `useChartOverlay` 훅: `priceToCoordinate`/`timeToCoordinate` 래핑
- [ ] 스크롤/줌/리사이즈 구독(`subscribeVisibleLogicalRangeChange` 등) → rAF throttle 재배치
- [ ] 가시영역 밖(`null` 좌표) 숨김 처리
- [ ] (옵션) dnd-kit 위치 미세조정

### M4. 배경 스킨  · 담당 B · 의존 M2
- [ ] 정적 스킨 이미지 1~2개 번들(`/assets/skins`)
- [ ] 차트 뒤 절대배치 배경 레이어 (스크롤·줌에 고정)
- [ ] 투명도 슬라이더
- [ ] fit 모드 (cover/contain/tile)

### M5. 지표 스킨  · 담당 B · 의존 M3
- [ ] 최고점/최저점 자동 감지 (데이터 스캔)
- [ ] 캐릭터 이미지 + 말풍선 컴포넌트 (오버레이에 배치)
- [ ] 바인딩 포인트 → M3 좌표 변환 연결
- [ ] 말풍선 기본 텍스트

### M6. 스킨 전환 UI (사이드바)  · 담당 B · 의존 M4·M5
- [ ] 스킨 목록 카드 (썸네일+이름)
- [ ] 적용/해제 토글 → `skinStore`
- [ ] 현재 적용 스킨 표시
- [ ] (옵션) localStorage로 마지막 선택 유지

### M7. PNG 내보내기  · 담당 A · 의존 M4·M5 (⚠️ 조기 PoC 권장)
- [ ] **스파이크 먼저**: html-to-image로 [배경+차트canvas+오버레이] 한 장 합성 검증
- [ ] 실패 시 → 수동 canvas 합성으로 선회 (tech_stack §2-D)
- [ ] 해상도 1x/2x 옵션
- [ ] 다운로드 트리거

---

## 4. 권장 순서 & 병렬화

```
M0 (공통)
 ├─ A: M1 → M2 ─┬─ M7 (PNG, 조기 PoC)
 └─ B: ─────────┴─ M3 → M5 ─┐
                 M4 ─────────┴─ M6
```
- **M0 끝나면 A/B 병렬 가능.** A는 데이터·차트, B는 차트 마운트(M2) 나오면 스킨 레이어 착수.
- **M7(PNG 합성)은 리스크 1순위** → M4·M5 일부만 돼도 **1주차에 PoC**로 뚫을 것. "쉬워 보이는데 안 되는" 부류.
- M3(좌표 엔진)이 지표 스킨의 심장 — 여기 가장 공들임.

---

## 5. MVP 완료 기준 (DoD)

- [ ] 암호화폐 심볼 검색 → 캔들+거래량+MA 차트 표시
- [ ] 기간 전환 동작
- [ ] 배경 스킨 적용 + 투명도 조절, 스크롤/줌에 고정
- [ ] 지표 스킨(캐릭터+말풍선) 최고/최저점에 표시, 스크롤/줌 따라 추적
- [ ] 스킨 적용/해제 토글
- [ ] 스킨 입은 차트 PNG 저장 (배경·캐릭터 포함 확인)
