# ChartSkin — 기술 설계 문서

> 기획서(`feature_spec.md`)의 피처를 **TradingView Lightweight Charts로 해결 가능한 영역**과
> **직접 구현해야 하는 영역**으로 나누고, 권장 기술 스택을 정리한 문서.

---

## 0. 라이브러리 선택 — 먼저 결정할 것

TradingView는 두 가지 차트 제품을 제공한다. 둘은 성격이 완전히 다르다.

| 제품 | 라이선스 | 렌더링 | 커스텀 오버레이 | 결론 |
|------|----------|--------|------------------|------|
| **Lightweight Charts** | Apache 2.0 (무료, OSS) | Canvas, 같은 DOM 트리 | DOM/Canvas 자유롭게 겹침 | ✅ **이 프로젝트에 적합** |
| Advanced Charting Library | 무료(신청·승인 필요) | **iframe 격리** | iframe 경계로 DOM 오버레이 사실상 불가 | ❌ 배경/캐릭터 스킨과 충돌 |

**핵심 근거**: 이 제품의 본질은 "차트 위·뒤에 이미지/캐릭터/말풍선을 겹치는 것".
Advanced Library는 차트가 iframe 안에 갇혀 있어, 외부 DOM을 차트 좌표에 맞춰 겹치기가 매우 어렵다.
Lightweight Charts는 차트가 우리 DOM 트리 안에 있고, 좌표 변환 API(`priceToCoordinate` 등)를 공개하므로
배경 레이어·캐릭터 오버레이를 자유롭게 합성할 수 있다.

→ **Lightweight Charts v5 채택.** (기획서 의도와도 일치)

---

## 1. 영역 구분 — 피처별 담당 + 필요 기술 스택

각 피처를 **누가 담당하는가**(라이브러리 vs 직접)로 나누고, **구현에 실제 필요한 기술 스택**까지 명시한다.

### 담당 범례
- 🟢 **Lib**: Lightweight Charts 기본 제공 (설정/API만 호출)
- 🟡 **Hybrid**: 라이브러리가 데이터/좌표만 주고, 로직·렌더링은 직접
- 🔴 **직접**: 라이브러리 무관, 전부 직접 구현

---

### Phase 1 — MVP

> ⚠️ **기획서 누락 — 데이터 파이프라인**: 기획서 Phase 1은 "TradingView 임베드"부터 시작하나,
> Lightweight Charts는 **시세 데이터를 0 제공**한다. 아래 1-0이 모든 차트 피처의 **선행 조건**이며
> 사실상 Phase 1의 최우선 작업이다. 이게 없으면 1-1 이하 전부 동작 불가.

| 피처 | 담당 | 필요 기술 스택 |
|------|:----:|---------------|
| 1-0 데이터 파이프라인 (선행 필수) | | |
| ㄴ거래소 REST 연동 (과거 캔들) | 🔴 | **Next.js API Route**(서버리스) + `fetch`/`axios`. 키 보호·CORS 우회. Binance만은 브라우저 직접 가능 |
| ㄴ어댑터/정규화 레이어 | 🔴 | TypeScript 어댑터 함수 (`fromBinance`/`fromKIS`…) → 통일 `Candle{time,o,h,l,c,v}` |
| ㄴ히스토리 캐싱 | 🔴 | **Redis**(Upstash 등) 또는 인메모리 LRU. 무료티어 레이트리밋 대응 |
| 1-1 차트 뷰어 | | |
| ㄴ캔들차트 + 거래량 | 🟢 | `lightweight-charts` **v5**: `addSeries(CandlestickSeries…)`, `addSeries(HistogramSeries…)`(별도 pane). ⚠️ v4의 `addCandlestickSeries` 아님 |
| ㄴ이동평균선 (5/20/60/120) | 🟡 | MA 계산: `technicalindicators` 또는 자체 SMA 함수 → `addSeries(LineSeries…)` 주입 |
| ㄴ기간 선택 (일/주/월/분봉) | 🟡 | 데이터 fetch/집계 로직 + Zustand 상태. 차트는 `setData` 갱신만 |
| ㄴ줌 / 스크롤 / 십자선 커서 | 🟢 | `lightweight-charts` 내장 (`crosshair`, `handleScroll`, `handleScale`) |
| ㄴ종목/마켓 검색 | 🔴 | React 검색 UI + 심볼 API (서버 프록시) |
| 1-2 사이드바 마켓플레이스 | 🔴 | React + Tailwind UI, Zustand 상태. 테마 목록은 **DB+API**(공유 데이터) |
| 1-3 배경 스킨 | | |
| ㄴ차트 뒤 이미지 레이어 (스크롤·줌 고정) | 🔴 | 차트 배경 투명화 + 절대배치 `<div>` 레이어 (CSS). ⚠️ §2-A |
| ㄴ투명도 슬라이더 / fit 모드 | 🔴 | CSS (`opacity`, `object-fit`) + React 컨트롤 |
| 1-4 지표 스킨 (핵심 난이도) | | |
| ㄴ가격 좌표 → 픽셀 좌표 변환 | 🟡 | `series.priceToCoordinate()` + `timeScale().timeToCoordinate()` (라이브러리 API) |
| ㄴ최고점/최저점 자동 감지 | 🔴 | TypeScript 데이터 분석 (min/max 스캔) |
| ㄴ캐릭터/말풍선 렌더 | 🔴 | **DOM 오버레이**(React 절대배치) 또는 Series Primitive. ⚠️ §2-B |
| ㄴ스크롤·줌 시 위치 재계산 | 🟡 | 라이브러리 이벤트 구독(`subscribeVisibleLogicalRangeChange`/`subscribeCrosshairMove`) + `requestAnimationFrame` throttle |
| 1-5 PNG 내보내기 | 🔴 | **`html-to-image`**(컨테이너 합성). `takeScreenshot()`은 캔버스만이라 불가. ⚠️ §2-C |

---

### Phase 2 — 스킨 시스템 고도화

| 피처 | 담당 | 필요 기술 스택 |
|------|:----:|---------------|
| 2-1 스킨 에디터 (드래그·말풍선·크기) | 🔴 | **dnd-kit**(드래그) + React 폼. 좌표 변환만 라이브러리 |
| 2-1 감정 이미지 업로드 / 내 스킨 저장 | 🔴 | 파일 업로드 + **S3/R2 스토리지** + 메타 **DB(PostgreSQL+Prisma)**. localStorage는 메타만 |
| 2-2 감정 반응 자동화 (등락률→표정) | 🔴 | TypeScript 로직 (기준기간 대비 등락률 계산) |
| 2-2 실시간 업데이트 (틱 수신) | 🟡 | **WebSocket**(거래소 직접 또는 자체 게이트웨이) → `series.update()` |
| 2-3 차트 색상 테마 (캔들/배경/그리드/MA) | 🟢 | `applyOptions` / `series.applyOptions` (라이브러리 전부 지원) |
| 2-4 애니메이션 스킨 (GIF/Lottie) | 🔴 | **lottie-react** + GIF. DOM 오버레이 렌더 |
| 2-5 비디오(MP4) 내보내기 | 🔴 | **MediaRecorder** + 오프스크린 canvas 합성, 무거우면 **ffmpeg.wasm**. ⚠️ §2-D |

---

### Phase 3 — AI 스킨 생성

| 피처 | 담당 | 필요 기술 스택 |
|------|:----:|---------------|
| 3-1 텍스트→배경 생성 | 🔴 | **Replicate / Stability / DALL·E** API (백엔드 프록시, 키 보호) + 비동기 큐 |
| 3-2 캐릭터 생성 + 감정 variant 3종 | 🔴 | 이미지 생성 API + 시드 고정 프롬프트 파이프라인 (Python 백엔드) |
| 3-2/3-3 배경 제거 (rembg) | 🔴 | **Python(FastAPI) + rembg** 자체호스팅, 또는 remove.bg API |
| 3-3 커스텀 업로드→스킨화 | 🔴 | 업로드 → 배경제거 → 포맷 변환 → S3 저장 |

**Phase 3 전체는 차트 라이브러리와 무관** — 별도 AI 백엔드(Python) 영역.

---

## 2. 라이브러리로 "안 되는" 핵심 난제 4가지 (설계 주의)

기획서 피처 중 라이브러리 경계를 넘어서는 부분. 여기서 아키텍처가 갈린다.

### §2-A. 배경 스킨 = "차트 투명화 + 뒤 레이어"
Lightweight Charts는 배경 이미지 옵션이 없다. 해결:
```ts
chart.applyOptions({
  layout: { background: { type: 'solid', color: 'transparent' } },
});
```
차트 컨테이너 `z-index`를 올리고, 그 **뒤에** 절대배치된 배경 `<div>`(image)를 둔다.
"스크롤·줌에 고정"은 오히려 쉬움 — 배경을 차트 좌표에 **연동하지 않으면** 자동으로 고정된다.

### §2-B. 지표 스킨 = "DOM 오버레이" 권장 (Series Primitive 아님)
두 가지 길:
- **(A) DOM 오버레이** ✅ 권장 — 캐릭터·말풍선·Lottie·GIF 같은 리치 콘텐츠에 유리. 차트 위 절대배치 레이어에 React 컴포넌트로 렌더, 좌표만 라이브러리에서 받아 `transform: translate()`.
- (B) Series Primitive (v4+ 플러그인 API) — 캔버스에 직접 그림. 단순 도형엔 빠르지만 이미지/애니메이션/HTML엔 부적합.

→ **DOM 오버레이 채택.** 좌표 갱신 패턴:
```ts
// 스크롤/줌/리사이즈마다 호출
const y = candleSeries.priceToCoordinate(targetPrice);
const x = chart.timeScale().timeToCoordinate(targetTime);
// → overlay.style.transform = `translate(${x}px, ${y}px)`
```
구독: `timeScale().subscribeVisibleLogicalRangeChange()` + `subscribeCrosshairMove()`.
부드러움 위해 `requestAnimationFrame`으로 배치 갱신 throttle.
⚠️ 좌표가 보이는 영역 밖이면 `null` 반환 → 오버레이 숨김 처리 필요.

### §2-C. PNG 내보내기 = "합성 문제"
`chart.takeScreenshot()`은 **차트 캔버스만** 반환 → 배경 이미지·DOM 캐릭터 빠짐.
해결: 전체 컨테이너를 `html-to-image`(또는 `html2canvas`)로 캡처해 배경+차트+오버레이를 한 장으로 합성.
캐릭터가 외부 이미지면 CORS 주의(서버 프록시 또는 동일 출처/`crossorigin`).

### §2-D. MP4 내보내기 = "합성 캔버스 녹화"
DOM 오버레이는 `MediaRecorder`로 직접 못 잡음.
패턴: 매 프레임 차트 캔버스 + 배경 + 오버레이를 오프스크린 `<canvas>`에 `drawImage`로 합성 → `canvas.captureStream()` → `MediaRecorder`로 MP4/WebM 녹화.
무거우면 `ffmpeg.wasm`로 프레임 시퀀스 인코딩. (Phase 2 후반, 비용 큼 — 우선순위 낮게)

---

## 3. 권장 기술 스택

> **원칙: 기획서는 "무엇"만 정한다. 스택은 그 피처를 실제로 굴리는 데 "필요한 것"에서 역산한다.**
> 기획서/feature_spec의 기술 가정(예: "백엔드 없음", "localStorage 저장")은 받아적지 않고,
> 아래 피처 요구로 검증한다. 가정이 피처와 충돌하면 **피처가 이긴다.**

### 3.0 피처 → 필연 기술 (역산)

| 기획서 피처 | 구현에 **강제되는** 것 | 그래서 필요한 스택 |
|------------|----------------------|-------------------|
| 미국/국내 주식 시세 (1-1) | Polygon·KIS·KRX 전부 **API 키** 필요 → 프론트 노출 불가 | **서버 프록시**(키 보호·CORS 우회) |
| 네이버 금융류 비공식 소스 | 브라우저 직접 fetch CORS 차단 | **서버 프록시** |
| AI 스킨 생성 (3-1~3-3) | Replicate/DALL·E **유료 키** → 노출 시 도용 | **서버 프록시** + 큐/비동기 |
| 배경 제거 rembg (3-2/3-3) | Python 전용 라이브러리 | **Python 백엔드** |
| 내 스킨 저장 (2-1) + AI/업로드 이미지 | 이미지 blob은 localStorage(~5MB) 즉시 초과 | **오브젝트 스토리지(S3/R2)** + 메타 DB |
| 마켓플레이스 공유 스킨 (1-2) | 여러 유저가 같은 테마 열람 = 서버 공유 데이터 | **DB + API** |
| 실시간 틱 (2-2) | 거래소 WebSocket 연결·재연결·정규화 | **WS 게이트웨이** |

→ **결론: "순수 프론트엔드 무백엔드"는 암호화폐 단독 MVP에서만 성립.**
> Binance klines는 키 불필요 + CORS 허용이라 브라우저 직접 호출 OK. 딱 거기까지.
> 주식·AI·스킨공유·저장이 들어오는 순간 **백엔드(최소 서버리스 함수)는 선택이 아니라 필연.**
> 권장: 처음부터 **Next.js (API Routes = 서버리스 함수)** 로 시작 → "서버 관리 없음" 유지하면서 키 프록시·DB·스토리지 확보.

### 프론트엔드
| 영역 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **Next.js (App Router) + TypeScript** | SSR로 마켓플레이스 SEO, API Routes로 BFF |
| 차트 | **lightweight-charts v5** | 위 분석 결론 |
| 상태관리 | **Zustand** | 적용 스킨/차트 설정 등 전역 상태 가볍게 |
| 스타일 | **Tailwind CSS** | 빠른 UI, 사이드바/카드 레이아웃 |
| 좌표 오버레이 | 커스텀 훅 `useChartOverlay` | `priceToCoordinate`/`timeToCoordinate` 래핑 |
| 드래그앤드롭(에디터) | **dnd-kit** | 캐릭터 위치 조정 |
| 애니메이션 스킨 | **lottie-react** + GIF | 2-4 |
| PNG 내보내기 | **html-to-image** | §2-C 합성 |
| MP4 내보내기 | MediaRecorder + (필요시) **ffmpeg.wasm** | §2-D |

### 백엔드
| 영역 | 선택 | 이유 |
|------|------|------|
| API 서버 | **Next API Routes** (초기) → 트래픽 증가 시 **NestJS** 분리 | 단순 시작, 확장 여지 |
| AI/이미지 처리 | **Python FastAPI** 별도 서비스 | rembg, 이미지 생성 API 래핑 |
| DB | **PostgreSQL + Prisma** | 스킨/테마/유저 메타데이터 |
| 스킨 이미지 저장 | **S3 / Cloudflare R2** | 정적 에셋, CDN |
| 인증 | **NextAuth (Auth.js)** | 소셜 로그인 |
| 실시간 | **WebSocket** (거래소 직접 구독 또는 자체 게이트웨이) | 2-2 틱 데이터 |

### 시장 데이터 소스
| 마켓 | 추천 소스 | 비고 |
|------|-----------|------|
| 암호화폐 | **Binance / Upbit REST + WebSocket** | 무료, 실시간 우수 |
| 국내 주식 | **한국투자증권 KIS Open API** | 무료, 실시간 시세·체결 |
| 미국 주식 | **Polygon / Finnhub / Alpha Vantage** | 무료 티어 레이트리밋 주의 |

> ⚠️ 데이터 소스마다 캔들 포맷·타임존·심볼 체계가 다름.
> **차트 입력 직전에 통일 포맷으로 정규화하는 어댑터 레이어** 필수 (`{ time, open, high, low, close, volume }`).

### AI 영역 (Phase 3)
| 영역 | 선택 |
|------|------|
| 이미지 생성 | Stability AI / Replicate / DALL·E (백엔드 프록시, 키 노출 금지) |
| 배경 제거 | **rembg**(Python, 자체 호스팅 무료) 또는 remove.bg API |
| 캐릭터 감정 variant | 동일 시드 + 프롬프트 변주 파이프라인 |

---

## 4. 추천 구현 순서

1. **데이터 어댑터 + 캔들/거래량 차트** (1-1) — 정규화 레이어부터. 모든 것의 기반.
2. **MA 계산 + 색상 테마** (1-1, 2-3) — 라이브러리 활용도 높고 빠른 성취.
3. **배경 스킨 레이어** (§2-A) — 합성 구조의 토대.
4. **좌표 오버레이 엔진** (§2-B) — 지표 스킨의 심장. 가장 공들일 곳.
5. **마켓플레이스 UI + 적용/해제** (1-2) — 위가 되면 "입히기" 연결.
6. **PNG 내보내기** (§2-C) — 합성 검증.
7. 스킨 에디터 → 실시간 → AI 순.

---

## 5. 핵심 리스크 요약

> `관련 피처` = 기획서 피처 번호 (1-0은 본 문서가 추가한 데이터 파이프라인).

| 리스크 | 관련 피처 | 영향 | 대응 |
|--------|----------|------|------|
| 줌/스크롤 시 오버레이 좌표 끊김 | 1-4, 2-1 | UX 핵심 손상 | rAF throttle, 영역 밖 숨김, 이벤트 구독 정확히 |
| **html-to-image가 canvas 빈 이미지로 캡처** | 1-5 | 핵심 가치(스킨 저장) 무산 | **1주차 PoC로 검증**, 실패 시 수동 canvas 합성(§2-D)으로 선회 |
| PNG에 스킨 누락 (캔버스만 캡처) | 1-5 | 배경·캐릭터 빠진 결과물 | `takeScreenshot` 금지, 컨테이너 합성(§2-C) |
| **MediaRecorder는 MP4 거의 불가** | 2-5 | "MP4" 약속 미이행 | 현실=WebM 녹화 → `ffmpeg.wasm` 트랜스코딩. 문서 "MP4" 표기 정정 |
| MP4 인코딩 성능 | 2-5 | 브라우저 부하 | 우선순위 후순위, 해상도/길이 제한 |
| 외부 이미지 CORS | 1-5, 2-5, 3-3 | 내보내기 실패 | 서버 프록시 / R2 동일출처 서빙, `crossorigin` |
| 데이터 소스 포맷·타임존 상이 | 1-0, 1-1 | 차트 깨짐 | 어댑터 레이어로 통일 정규화 |
| **무료티어 레이트리밋 → 트래픽서 막힘** | 1-0, 1-1 | 유저 늘면 시세 중단 | 서버 캐싱 + 유료 전환 비용 사전 인지 |
| **주식 시간축 갭(야간·주말·장마감)** | 1-1 | 분봉 왜곡/빈구간 | business-hours 처리 또는 거래시간만 인덱싱 (암호화폐는 무문제) |
| **인증 시점 누락** | 1-2, 2-1 | "내 스킨 저장"·공유 동작 불가 | auth(NextAuth)를 Phase 1 후반~2 초입에 편입 |
| **백엔드 MVP 과투자** | 1-0~ (전반) | 초기 과투자/지연 | 단계 도입: MVP=프록시만 → 저장 생기면 DB → AI 생기면 Python |

---

## 7. 기술 외 선결 과제 (제품 정책·법무)

리스크 표와 별개로 **코드로 못 푸는** 사안. 마켓플레이스 본질이라 미루면 안 됨.

| 과제 | 관련 피처 | 내용 |
|------|----------|------|
| **저작권·초상권** | 1-2, 1-3 | 연예인 사진(예: 기획서 "장원영")·저작 이미지를 **공유 마켓플레이스** 배포 시 침해. 로컬 사용과 공유는 법적으로 다름. → 공유 스킨은 본인 생성/업로드 + 신고·검수 정책 선결 |
| **AI 생성물 모더레이션** | 3-1, 3-2 | 부적절·저작권 침해 생성 차단 정책 |
| **Lightweight Charts attribution** | 1-1 | Apache 2.0이나 TradingView는 로고/링크 표기 요구. UI에 표기 자리 확보 |

---

## 6. 기획서 / feature_spec과 달라진 점

기획서·feature_spec의 기술 가정 중 **피처 구현과 충돌해 수정한 항목.** (이유: §3.0 역산)

| 항목 | 기획서/feature_spec | 본 문서 | 변경 이유 |
|------|--------------------|---------|-----------|
| **백엔드** | "없음 — 순수 프론트엔드" | **서버리스 백엔드 필수**(Next.js API Routes) | 주식 API 키·AI 키 프론트 노출 불가, CORS, 스킨 공유 DB. 암호화폐 단독 MVP만 무백엔드 성립 |
| **스킨 저장** | localStorage (JSON) | 이미지=**S3/R2 + DB**, localStorage는 메타만 | 업로드/AI 이미지 blob이 localStorage 5MB 즉시 초과 |
| **국내주식 소스** | 네이버 금융 / KRX 포털 | **KIS Open API**(또는 서버프록시 경유) | 네이버=비공식 스크래핑(CORS·ToS 위반), KRX=키 필요 → 어차피 백엔드 |
| **차트 버전** | Lightweight Charts **v4** | **v5 권장** (v4도 가능) | 신규 프로젝트는 최신 API·유지보수 유리. 문서 내 버전 통일 필요 |
| **스킨 렌더링** | Canvas 2D 오버레이 | **DOM 오버레이 권장** | Phase 2 Lottie/GIF/애니메이션이 DOM서 공짜. 단 export는 Canvas가 유리 → §2-B 트레이드오프 |
| **MA 등 지표** | (TradingView 제공 가정) | **직접 계산** 명시 | Lightweight Charts는 지표 0 제공, 렌더만 |
| **Phase 1 범위** | 차트 임베드부터 | **1-0 데이터 파이프라인 선행 추가** | 데이터 수급이 기획서에 누락. 모든 차트 피처의 전제 |

> 핵심: 기획서가 "보이는 피처"(차트·스킨) 위주라 **안 보이는 토대**(데이터 수급·키 보안·이미지 저장)가 빠지거나 과소평가됨.
> 위 7개는 선호가 아니라 **피처를 실제로 굴리려면 강제되는** 변경.
