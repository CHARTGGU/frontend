# ChartSkin

주식·코인 차트 위에 스킨(테마)을 입혀 나만의 트레이딩 뷰를 만드는 웹앱.
배경·캐릭터·말풍선 스킨으로 차트를 꾸미고, AI로 커스텀 스킨을 생성한다.

상세 기획/설계는 `docs/` 참고:
- `docs/feature_spec.md` — 피처 스펙 (Phase 1~3)
- `docs/mvp.md` — 1차 구현 계약 + 작업 분해(M0~M7)
- `docs/tech_stack.md` — 기술 설계, 라이브러리 경계, 리스크

## 기술 스택 (확정)

| 레이어 | 선택 |
|--------|------|
| 프레임워크 | **Next.js (App Router) + TypeScript** — 프론트+백엔드 단일 코드베이스 |
| 백엔드 | **Route Handlers (`app/api/*`)** — 서버리스 함수 (시세 프록시·키 보호·DB·AI) |
| 차트 | **lightweight-charts v5** (TradingView, Apache 2.0) |
| 스킨 렌더링 | **DOM 오버레이** (차트 위 절대배치 React) |
| 상태관리 | **Zustand** (`chartStore`, `skinStore`) |
| 스타일 | **Tailwind CSS** |
| PNG export | **html-to-image** |
| 드래그(에디터) | **dnd-kit** |

## MVP 범위 (1차 구현)

**포함**: Binance(암호화폐) 단독 · 캔들/거래량/MA(5·20·60·120)/기간선택/줌·스크롤·십자선 · 배경 스킨(번들 정적 1~2개) · 지표 스킨(최고/최저 자동감지·캐릭터·말풍선) · 스킨 적용/해제 · PNG 내보내기.

**제외(Backlog)**: 주식(미국/국내) · 마켓플레이스 · 이미지 업로드 · 유저별 저장 · 인증 · AI 생성 · MP4.

> MVP는 Binance klines 직접 호출(키 불필요+CORS 허용)이라 백엔드 거의 안 씀.
> 그래도 처음부터 Next 풀스택 — backlog(주식·AI·스킨공유) 들어오면 Route Handlers가 그대로 백엔드 → 마이그레이션 0.

## 작업 순서 (의존)

```
M0 셋업 (공통)
 ├─ A: M1 데이터(Binance) → M2 차트코어 ─┬─ M7 PNG (조기 PoC)
 └─ B: ──────────────────────────────────┴─ M3 좌표엔진 → M5 지표스킨 ┐
                                           M4 배경스킨 ───────────────┴─ M6 스킨전환 UI
```

## 아키텍처 핵심 (반드시 지킬 것)

### 1. 차트 = 클라이언트 컴포넌트
lightweight-charts·오버레이는 브라우저 전용 → `'use client'`, `dynamic(import, { ssr: false })`. SSR에서 차트 마운트 금지.

### 2. lightweight-charts v5 API
시리즈 생성은 `chart.addSeries(CandlestickSeries, opts)` 형식.
**v4의 `addCandlestickSeries()` 아님** — 예제 복붙 시 주의. `HistogramSeries`는 별도 pane(거래량).

### 3. 데이터 어댑터 레이어 (필수)
소스마다 캔들 포맷·타임존·심볼 체계 다름. 차트 입력 직전 통일 정규화:
```ts
interface Candle { time; open; high; low; close; volume }
// fromBinance(raw) → Candle[]
```
MA 등 지표는 **lightweight-charts가 0 제공** → 직접 계산(SMA) 후 `addSeries(LineSeries…)` 주입.

### 4. 배경 스킨 = 차트 투명화 + 뒤 레이어
```ts
chart.applyOptions({ layout: { background: { type: 'solid', color: 'transparent' } } });
```
차트 `z-index` 올리고 그 뒤에 절대배치 배경 `<div>`. 차트 좌표에 **연동하지 않으면** 스크롤·줌에 자동 고정.

### 5. 지표 스킨 = DOM 오버레이 (좌표 추적)
좌표 변환 → `transform: translate()`:
```ts
const y = candleSeries.priceToCoordinate(price);
const x = chart.timeScale().timeToCoordinate(time);
```
- 구독: `timeScale().subscribeVisibleLogicalRangeChange()` + `subscribeCrosshairMove()`
- 갱신은 `requestAnimationFrame` throttle — **view 변할 때 딱딱 따라붙는 기민함이 제품 완성도 핵심**
- 좌표 `null`(가시영역 밖) → 오버레이 숨김 처리

### 6. PNG 내보내기 = 합성 문제
`chart.takeScreenshot()`은 **캔버스만** → 배경·DOM 캐릭터 빠짐. 금지.
전체 컨테이너를 `html-to-image`로 캡처해 배경+차트+오버레이 한 장 합성. 외부 이미지 CORS 주의.
> ⚠️ "쉬워 보이는데 안 되는" 1순위 리스크 → **1주차 PoC로 검증**. 실패 시 수동 canvas 합성으로 선회.

## 폴더 구조

```
/app            # Next App Router (페이지 + api Route Handlers)
  /api          # 백엔드 (MVP는 거의 비어있음, backlog 대비)
/components     # 공용 UI
/features       # 도메인별 (chart, skin, marketplace…)
/stores         # Zustand (chartStore, skinStore)
/lib            # 어댑터·유틸·지표 계산
/assets/skins   # 번들 정적 스킨 이미지
```

## 코딩 규칙

- **불변성**: 객체 mutate 금지, 항상 새 객체 생성 (`{...obj, k}`).
- **작은 파일 다수** > 큰 파일 소수. 200~400줄 typical, 800 max. 함수 50줄 미만.
- **입력 검증**: 외부 데이터(API 응답·유저 입력)는 zod 등으로 검증.
- **에러 처리**: try/catch + 사용자 친화 메시지. `console.log` 잔존 금지.
- **시크릿**: 하드코딩 금지, env var. 시세/AI 키는 클라이언트 노출 금지 → Route Handler 경유.

## 신규 지표 스킨 (Phase 2)

골든/데드크로스(반짝임) · 일목균형표(구름 렌더, 가격 돌파 시 비행기 연출) · 지지선/저항선 · 매물대(Volume Profile). 전부 지표 알고리즘 직접 계산 → DOM 오버레이.

## 위젯 (지표 바인딩 X)

화면에 얹는 부가 요소: 뛰어다니는 고양이 캐릭터 · 차트 뉴스 마커.

## AI 커스텀 스킨 (Phase 3)

자연어 입력 → 배경/지표 아이콘 생성. Replicate/Stability/DALL·E (백엔드 프록시, 키 보호) + rembg(배경 제거, Python 별도 서비스).
