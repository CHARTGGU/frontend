# ChartSkin

주식·코인 차트 위에 스킨(테마)을 입혀 나만의 트레이딩 뷰를 만드는 웹앱.
배경·캐릭터·말풍선 스킨으로 차트를 꾸미고, AI로 커스텀 스킨을 생성한다. (AI는 Phase 3)

현재 단계: **MVP 뼈대** — Binance(암호화폐) 단독, 캔들·거래량·MA 차트 + 배경/지표 스킨 + 마켓플레이스 + PNG 내보내기.

---

## 빠른 시작

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:3000)
```

> 포트 변경: `npm run dev -- -p 3001`

### 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` 타입 검사 |

요구: Node 18.18+ (Next.js 14). API 키·환경변수 **불필요** — Binance klines를 브라우저에서 직접 호출(키 불필요·CORS 허용).

---

## 기술 스택

| 레이어 | 선택 |
|--------|------|
| 프레임워크 | Next.js (App Router) + TypeScript |
| 차트 | lightweight-charts **v5** (TradingView, Apache 2.0) |
| 상태관리 | Zustand (`chartStore`, `skinStore`) |
| 스타일 | Tailwind CSS |
| 스킨 렌더링 | DOM 오버레이 (차트 위 절대배치) |
| PNG export | html-to-image |
| 입력 검증 | zod |

> ⚠️ lightweight-charts **v5** API: 시리즈 생성은 `chart.addSeries(CandlestickSeries, opts)`.
> v4의 `addCandlestickSeries()` 아님 — 예제 복붙 시 주의.

---

## 현재 동작 (MVP)

- **차트**: Binance 캔들 + 거래량(별도 pane) + MA(5/20/60/120). 줌·스크롤·십자선.
- **종목**: BTC/USDT · ETH/USDT 드롭다운 전환.
- **기간**: `1D`만 활성 (1m~4h는 준비중·비활성).
- **지표 메뉴**: MA 4개 토글 + RSI/볼린저/MACD "준비중" 자리.
- **과거 페이징**: 왼쪽 끝까지 스크롤하면 더 오래된 캔들 자동 로드.
- **실시간**: Binance `@kline` WebSocket으로 진행 캔들 갱신.
- **배경 스킨**: 차트 뒤 고정 레이어 + 투명도/맞춤 모드.
- **지표 스킨**: 감정 고양이 — 현재 보이는 범위의 최고/최저점에 캐릭터+말풍선 추적.
- **마켓플레이스**: VSCode 스타일 사이드바(배경/지표/위젯/세트 4 카테고리), 접기/펴기, 적용/해제.
- **PNG 내보내기**: 배경+차트+오버레이 한 장 합성 (2x).

---

## 폴더 구조

```
/app                  Next App Router
  /api                Route Handlers 자리 (Backlog: 주식·AI 프록시. MVP는 비어 있음)
  layout.tsx          루트 레이아웃
  page.tsx            AppShell을 dynamic(ssr:false)로 로드
/components/ui        공용 UI 프리미티브
/features
  AppShell.tsx        전체 화면 셸 (툴바 + 차트 + 사이드바)
  /chart              ChartView·ChartCanvas·Toolbar·useChartOverlay·ChartRefContext
  /skin               SkinSidebar·SkinCard·BackgroundLayer·IndicatorOverlay·CharacterMarker·presets
  /export             ExportButton·captureContext (PNG 합성)
/stores               chartStore(종목·기간·캔들·MA)·skinStore(배경·지표·투명도·fit)
/lib                  types·binance(REST+WS)·adapters(정규화)·indicators(SMA·최고/최저)
/public/skins         번들 SVG 샘플 (배경: 밤하늘·캔디 / 캐릭터: 고양이 happy·sad·neutral)
/docs                 기획·설계 문서 (아래 참고)
```

---

## 설계 문서 (docs/)

| 문서 | 내용 |
|------|------|
| [`docs/feature_spec.md`](docs/feature_spec.md) | 피처 스펙 (Phase 1~3 전체 로드맵) |
| [`docs/mvp.md`](docs/mvp.md) | 1차 구현 계약 + 작업 분해(M0~M7) |
| [`docs/tech_stack.md`](docs/tech_stack.md) | 기술 설계, 라이브러리 경계, 리스크 |
| [`CLAUDE.md`](CLAUDE.md) | 아키텍처 핵심 규칙 (반드시 숙지) |

---

## 아키텍처 핵심 (작업 전 반드시 숙지 — 상세는 CLAUDE.md)

1. **차트는 클라이언트 전용**: lightweight-charts·오버레이는 `'use client'` + `dynamic(ssr:false)`. SSR 마운트 금지.
2. **데이터 어댑터 레이어**: 소스 응답을 차트 입력 직전 통일 `Candle{time,open,high,low,close,volume}`로 정규화 (`lib/adapters.ts`). 신규 소스는 `fromXxx` 추가.
3. **MA 등 지표는 직접 계산**: lightweight-charts는 지표 0 제공 → `lib/indicators.ts`에서 계산 후 LineSeries 주입.
4. **배경 스킨 = 차트 투명화 + 뒤 레이어**: 차트 좌표에 연동 안 함 → 스크롤·줌에 자동 고정.
5. **지표 스킨 = DOM 오버레이**: `priceToCoordinate`/`timeToCoordinate`로 좌표 추적, rAF throttle 재배치 (`useChartOverlay`). 가시영역 밖(`null`)은 숨김.
6. **PNG = 합성**: `chart.takeScreenshot()` 금지(캔버스만). 전체 컨테이너를 html-to-image로 합성.

---

## 확장 지점 (팀원용)

| 하고 싶은 것 | 손댈 곳 |
|-------------|---------|
| 새 보조지표(RSI 등) 실동작 | `lib/indicators.ts` 계산 함수 + `Toolbar`의 "준비중" 항목 활성화 |
| 새 데이터 소스(주식 등) | `app/api/*` 프록시 Route Handler + `lib/adapters.ts`에 `fromXxx` |
| 새 배경/지표 스킨 | `features/skin/presets.ts`에 항목 추가 + `/public/skins`에 에셋 |
| 위젯·세트 카테고리 실동작 | `presets.ts`에서 `status: 'soon'` → `'available'` + 렌더 로직 |
| 샘플 SVG → 실이미지 교체 | `/public/skins/*` 파일 교체 (CORS 위해 동일 출처 유지) |

---

## 코딩 규칙

- **불변성**: 객체 mutate 금지, 항상 새 객체(`{...obj, k}`).
- **작은 파일 다수** > 큰 파일 소수 (200~400줄 typical, 함수 50줄 미만).
- **입력 검증**: 외부 데이터는 zod로 검증.
- **에러 처리**: try/catch + 사용자 친화 메시지. `console.log` 잔존 금지.
- **시크릿**: 하드코딩 금지. 시세/AI 키는 클라이언트 노출 금지 → Route Handler 경유.
