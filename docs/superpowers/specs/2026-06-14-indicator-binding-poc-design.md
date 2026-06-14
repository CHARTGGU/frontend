# 추가 지표 바인딩 — 후보 PoC 플레이그라운드 설계

> 골든/데드크로스(MA20×MA60)·매물대 벽돌 시각화를 **MZ 차트꾸미기** 톤으로 구현하기 위한
> 후보 탐색 단계. 여러 비주얼 후보를 실제 차트 위에 렌더하는 PoC 페이지(`/poc`)를 띄워
> 사용자가 브라우저에서 직접 보고 고른다. **본 적용(스킨 토글 승격)은 선택 후 별도 작업.**

## 목표 / 범위

### 이번 산출물 (In scope)
- `/poc` 라우트: 후보 7종을 스위처로 전환하며 실제 차트 위에 렌더.
- 결정적 캔들 fixture: 골든크로스·데드크로스·뚜렷한 POC가 항상 화면에 보이게 baked.
- 바인딩 계산 함수 2종 + 단위 테스트(TDD).
- 후보 컴포넌트 7종 (크로스 4 + 벽돌 3).

### 제외 (Out of scope, 후속)
- 선택된 후보를 본 `IndicatorOverlay`/`skinStore` 토글/`presets`로 승격 — 사용자가 PoC에서 고른 뒤 별도 spec.
- 고양이 캐릭터 재활용 (명시적으로 안 함).

## 깔(스타일) 원칙
- 컨셉: MZ 차트꾸미기 — 재밌고 눈에 띄고, 지표를 **직관적으로 인지**하게.
- 기존 좌표 엔진 재활용: `useChartOverlay`의 `toCoord(time, price)` + 차트 ref. 스크롤·줌 추적, `null` 좌표 숨김.
- 모든 모션은 CSS keyframe (의존성 추가 없음).

---

## 후보 정의

### 골든/데드크로스 (MA20 × MA60)
| id | 컨셉 | 비주얼 | 모션 |
|----|------|--------|------|
| C1 | 만화 폭발 임팩트 | 교차점 코믹 폭발 💥 + 밈자막 "골든크로스 떴다🔥" / "데드크로스 💀" | pop-in scale + shake |
| C2 | 네온 파동 사이렌 | 교차점서 네온 링 확산 + 글리치 텍스트 "GOLDEN CROSS" | radial pulse (확산 fade) |
| C3 | 예능 도장 "쾅" | 비스듬히 찍히는 도장 "골든각" / "데드각" | 회전 + 바운스 settle |
| C4 | 이모지 분수 | 골든 🚀💎🙌 / 데드 📉💀 파티클 분출 | particle burst (rise+fade) |

- 골든 = MA20이 MA60 **위로** 교차, 데드 = **아래로** 교차.
- 색: 골든=금/그린 계열, 데드=레드 계열.

### 매물대 벽돌 (Volume Profile)
| id | 컨셉 | 비주얼 |
|----|------|--------|
| B1 | 픽셀/테트리스 벽돌 | 가격 버킷마다 도트 벽돌 막대, **POC 버킷=금색 + 더 높게** + "매물벽 ⛏️" 라벨 |
| B2 | 골드바 탑 | 버킷별 코인/골드바 더미, POC=금괴 타워 |
| B3 | HP 게이지 | 게임 체력바 가로막대, POC=풀충전 금색 |

- 막대 길이 = 버킷 volume 비율. 우측(가격축) 기준 가로 방향.
- POC = 최대 volume 버킷, 항상 강조.

---

## 데이터 — 결정적 Fixture

`lib/poc/fixtures.ts` — `POC_CANDLES: Candle[]` (~150봉).
- 엔지니어링: 초반 하락→MA20<MA60, 중반 반등 상승으로 **골든크로스 1회**, 후반 하락으로 **데드크로스 1회** 발생하게 close 시퀀스 구성.
- 특정 가격대에 volume 집중 → 뚜렷한 **POC 버킷**.
- 네트워크 의존 0 → PoC 항상 동일하게 재현. (실 Binance 데이터 사용 안 함 — 교차가 화면에 안 들어오는 flakiness 방지.)

---

## 계산 (`lib/indicators.ts`) — TDD

```ts
export interface Cross { time: UTCTimestamp; price: number; type: "golden" | "dead" }

/** fast/slow SMA 교차점 감지. 가시범위 [from,to] 내만. price = 교차 캔들의 slow MA값. */
export function detectCrossesInRange(
  candles: Candle[], from: number, to: number, fast = 20, slow = 60,
): Cross[]

export interface PocResult { buckets: VolumeBucket[]; pocIndex: number }

/** 가시범위 캔들 → volumeProfile() 재활용 → 전체 버킷 + 최대 volume 버킷 인덱스. */
export function detectPocInRange(
  candles: Candle[], from: number, to: number, bucketCount?: number,
): PocResult | null
```

- `detectCrossesInRange`: SMA(fast)·SMA(slow)를 time으로 정렬 → 두 MA가 겹치는 구간에서 `sign(maFast - maSlow)` 부호 전환 캔들 수집. 상승전환=golden, 하강전환=dead. [from,to] 필터.
- `detectPocInRange`: 기존 `volumeProfile()` 재활용(벽돌이 전체 버킷 필요) + argmax(volume).
- **테스트**(`indicators.test.ts`): 골든 1·데드 1 픽스처로 type/순서 검증, 동률·범위 밖·빈 입력 엣지. POC argmax·빈 입력 null.

---

## PoC 페이지 구조

```
app/poc/page.tsx                 'use client' 진입점. 후보 스위처 + 차트.
features/poc/
  PocChart.tsx                   lightweight-charts 마운트(fixture+MA20/MA60), ChartRefContext provide.
  PocSwitcher.tsx                크로스(none/C1~C4)·벽돌(none/B1~B3) 선택 버튼 바.
  candidates/
    CrossExplosion.tsx   (C1)
    CrossNeonPulse.tsx   (C2)
    CrossStamp.tsx       (C3)
    CrossEmojiBurst.tsx  (C4)
    BrickPixel.tsx       (B1)
    BrickGoldBar.tsx     (B2)
    BrickHpGauge.tsx     (B3)
```

- `PocChart`는 기존 `ChartRefContext`로 `chart`/`candleSeries` ref 노출 → 후보들이 `useChartOverlay` 그대로 사용(좌표 엔진 재활용).
- 크로스 후보: `detectCrossesInRange(fixture, visibleRange)` → 교차점마다 `toCoord` → 후보별 연출.
- 벽돌 후보: `detectPocInRange(fixture, visibleRange)` → 버킷별 `priceToCoordinate(mid)` → 막대 렌더, pocIndex 강조.
- 상태: page 로컬 `useState` (스토어 안 건드림). 크로스 1개 + 벽돌 1개 동시 선택 가능.

### 데이터 흐름
```
POC_CANDLES ─▶ PocChart(차트+MA20/60 마운트, ref provide)
                   │
        useChartOverlay(toCoord)  ◀─ visibleRange 구독(rAF throttle)
                   │
   ┌───────────────┼────────────────┐
   ▼               ▼                ▼
detectCrossesInRange         detectPocInRange
   │                              │
크로스 후보(C*)               벽돌 후보(B*)
```

## 에러/엣지
- fixture 고정이라 로드 실패 없음. 빈 버킷/교차 없음 → 후보는 아무것도 안 그림(렌더 생략).
- 좌표 `null`(범위 밖) → 해당 마커 숨김 (기존 규칙).
- 모션은 mount 시 1회 트리거 — 재배치(스크롤)마다 재발동 방지 위해 교차 id(time) 기준 key 고정.

## 테스트 전략
- **단위(vitest)**: `detectCrossesInRange`, `detectPocInRange` — TDD.
- **수동(PoC)**: `npm run dev` → `localhost:3000/poc` → 후보 전환하며 시각 확인. 사용자 선택이 곧 수용 기준.

## 완료 기준 (DoD)
- [ ] `localhost:3000/poc`서 크로스 후보 4종·벽돌 후보 3종 전부 전환·렌더됨.
- [ ] 골든/데드 교차점, POC 벽돌이 fixture에서 항상 보임.
- [ ] 스크롤·줌 시 좌표 추적(딱딱 따라붙음).
- [ ] indicators 테스트 그린, `typecheck` 통과.
- [ ] 사용자가 크로스·벽돌 후보를 각 1개 골라 다음(승격) 작업 지정.
