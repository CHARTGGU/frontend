# 보조지표 추가: RSI · 볼린저밴드 · MACD · 매물대

작성일: 2026-06-13

## 목표

차트에 4종 보조지표를 추가한다. 전부 지표 알고리즘 직접 계산(lightweight-charts는 지표 0 제공) 후 차트/오버레이로 렌더한다. Toolbar의 기존 "준비중" 자리를 실제 토글로 교체한다.

| 지표 | 렌더 | 위치 | 파라미터(고정) |
|------|------|------|------|
| 볼린저밴드 (BB) | LineSeries ×3 (upper/middle/lower) | price pane 오버레이 | period 20, stdDev 2 |
| RSI | LineSeries + 30/70 기준선 | 별도 pane | period 14 (Wilder) |
| MACD | LineSeries ×2 + Histogram | 별도 pane | fast 12, slow 26, signal 9 |
| 매물대 (Volume Profile) | DOM 가로막대 오버레이 | price pane 우측 | bucket 24 |

## 설계 결정 (확정)

- **파라미터**: 업계 표준값 하드코딩. 설정 UI 없음. (나중에 확장 가능)
- **매물대**: 단순 가로막대만. POC 강조·밸류영역 없음.
- **실시간**: liveBar 미반영. 확정 candles만 반영 (기존 MA와 동일).
- **불변성**: 모든 상태 업데이트 새 객체/Set 생성.

## 컴포넌트별 설계

### 1. `lib/indicators.ts` — 순수 계산 함수

기존 `sma()` 패턴 유지. 전부 `Candle[]` 입력, lightweight-charts 데이터 타입 출력. 워밍업 구간(값 없는 앞부분)은 결과에서 제외.

```ts
// RSI — Wilder smoothing. 0~100.
export function rsi(candles: Candle[], period = 14): LineData[]

// 볼린저밴드 — middle=SMA(period), upper/lower = middle ± stdDev*σ.
// σ = 표본이 아닌 모집단 표준편차(period 윈도우).
export interface Bollinger { upper: LineData[]; middle: LineData[]; lower: LineData[]; }
export function bollinger(candles: Candle[], period = 20, mult = 2): Bollinger

// MACD — EMA(fast)-EMA(slow), signal=EMA(macd, signalPeriod), histogram=macd-signal.
export interface Macd {
  macd: LineData[];
  signal: LineData[];
  histogram: HistogramData[]; // color 부호별
}
export function macd(candles: Candle[], fast = 12, slow = 26, signal = 9): Macd

// 매물대 — [minLow, maxHigh] 구간 bucketCount 등분, 각 캔들 volume을
// 종가(close) 속한 버킷에 합산. 가시범위 캔들만 입력으로 받음.
export interface VolumeBucket { priceLow: number; priceHigh: number; volume: number; }
export function volumeProfile(candles: Candle[], bucketCount = 24): VolumeBucket[]

// EMA 헬퍼 (MACD 내부용, export).
export function ema(values: number[], period: number): number[]
```

계산 정확도 검증은 단위 테스트로 (아래 테스트 전략).

### 2. `lib/types.ts` — 지표 메타

```ts
export const OVERLAY_INDICATORS = ["bb"] as const;      // price pane 시리즈
export const PANE_INDICATORS = ["rsi", "macd"] as const; // 별도 pane
export const DOM_INDICATORS = ["volProfile"] as const;   // DOM 오버레이
export type IndicatorId = "bb" | "rsi" | "macd" | "volProfile";

export const INDICATOR_LABELS: Record<IndicatorId, string>; // 볼린저밴드/RSI/MACD/매물대
export const INDICATOR_PARAMS = { rsi: 14, bb: { period: 20, mult: 2 }, macd: {...}, volProfile: { bucket: 24 } };

// 색상 상수
export const BB_COLORS = { upper, middle, lower };
export const MACD_COLORS = { macd, signal, histUp, histDown };
export const RSI_COLOR; // + RSI_LEVELS = [30, 70]
```

### 3. `stores/chartStore.ts` — 토글 상태

```ts
activeIndicators: IndicatorId[];           // 기본 [] (전부 off)
toggleIndicator: (id: IndicatorId) => void; // 불변 add/remove
```

MA의 `activeMa`/`toggleMa`와 동일 패턴. (Set 대신 배열 — 기존 코드 일관성)

### 4. `ChartCanvas.tsx` — 시리즈 동기화

MA effect 패턴 복제. 각 지표마다 ref(Map 또는 단일) 보관, `activeIndicators`·`candles` 의존 effect에서 추가/해제·setData.

- **BB**: `LineSeries ×3` price pane(기본 pane 0). 활성 시 생성, 해제 시 `removeSeries`.
- **RSI**: 활성 시 새 pane 생성 → `LineSeries` setData. `createPriceLine`으로 30/70 점선 기준선. 해제 시 시리즈 제거(pane 자동 정리).
- **MACD**: 새 pane → `LineSeries ×2`(macd, signal) + `HistogramSeries`(histogram, 색상 부호별). 해제 시 제거.
- **pane 인덱스**: volume = pane 1 고정. RSI/MACD는 lightweight-charts가 `addSeries(type, opts, paneIndex)` 또는 신규 pane 자동 할당으로 처리. 활성 순서에 따라 pane 2,3 append. pane 높이 setHeight로 조정.

새 pane 동적 생성/제거는 lightweight-charts v5 API로 검증 필요 — 구현 시 PoC 확인(리스크).

### 5. 매물대 — DOM 오버레이

기존 `useChartOverlay`/`IndicatorOverlay`/`BackgroundLayer` 패턴 따름.

- 신규 컴포넌트 `features/skin/VolumeProfileOverlay.tsx` (또는 chart 쪽 오버레이).
- 가시 logical range → 해당 캔들 추출 → `volumeProfile(visibleCandles, 24)`.
- 각 버킷: y = `candleSeries.priceToCoordinate((priceLow+priceHigh)/2)`, 막대 너비 = `volume / maxVolume * maxWidthPx`. 차트 우측 정렬 절대배치 `<div>`.
- 갱신: `subscribeVisibleLogicalRangeChange` + `subscribeCrosshairMove` 불필요(범위만), `requestAnimationFrame` throttle.
- 좌표 `null`(가시영역 밖) → 해당 막대 숨김.
- `activeIndicators`에 `volProfile` 있을 때만 렌더.

### 6. `Toolbar.tsx` — 실제 토글

`IndicatorMenu`의 `SOON_INDICATORS` 하드코딩 placeholder 제거. MA 체크박스 UI와 동일하게 4개 지표 체크박스 추가. `activeIndicators`/`toggleIndicator` 연결. 색상 점은 대표색.

## 데이터 흐름

```
candles (store)
  ├─ ChartCanvas effect → indicators.ts 계산 → addSeries/setData (BB·RSI·MACD)
  └─ VolumeProfileOverlay → 가시범위 캔들 → volumeProfile() → DOM 막대
activeIndicators (store) ─ 토글 → 시리즈/오버레이 추가·제거
Toolbar 체크박스 → toggleIndicator()
```

## 에러 처리

- 계산 함수: `candles.length < period` → 빈 배열 반환 (기존 sma 패턴). throw 안 함.
- 매물대: 가시범위 캔들 0개 또는 maxVolume 0 → 막대 미렌더.
- 시리즈 ref null 가드 (마운트 전/언마운트).

## 테스트 전략

- **단위 테스트** (`lib/indicators.test.ts`): rsi/bollinger/macd/ema/volumeProfile 각각 알려진 입력→기대 출력. 표준 알고리즘이라 검증값 확보 용이.
  - RSI: 고전 Wilder 예제 데이터셋.
  - BB: 수기 계산 가능한 소규모 시계열.
  - MACD: EMA 수렴 검증.
  - volumeProfile: 버킷 경계·volume 합산 정확도.
- TDD: 계산 함수는 테스트 먼저(RED) → 구현(GREEN).
- 차트 렌더(시리즈 추가/제거)는 통합 수준 — 수동 확인 + 가능하면 effect 로직 분리 테스트.

## 범위 밖 (이번 작업 제외)

- 파라미터 설정 UI
- 매물대 POC·밸류영역·세션별 분리
- liveBar 실시간 지표 갱신
- 지표별 색상 커스터마이즈
- 골든/데드크로스, 일목균형표 등 Phase 2 잔여 지표

## 리스크

1. **lightweight-charts v5 동적 pane 생성/제거** — RSI/MACD pane을 토글마다 add/remove. v5 API 동작 구현 시 검증 필요. 실패 시 대안: pane 고정 예약 + 시리즈만 토글.
2. **매물대 DOM 합성** — PNG export(html-to-image)에 DOM 막대 포함되는지 확인(기존 오버레이 패턴 따르면 OK).
