# 파란공·흰구름 캐릭터 — 고저 지표 스킨 + 달리기 위젯

작성일: 2026-06-19

## 목표

사용자가 제공한 두 캐릭터(파란 공·흰 구름)를 ChartSkin에 통합한다.

1. **고가/저가 지표 스티커** — 감정 고양이(`ind-cat`)와 동일하게 기간 최고점/최저점에 자동으로 붙는 캐릭터 스킨. 각 캐릭터를 독립 스킨으로 제공(웃는 얼굴=최고점, 우는 얼굴=최저점).
2. **차트 위 달리기 위젯** — 블루볼이 캔들 고가 라인을 따라 좌우로 달리는 위젯. 기존 "뛰어다니는 고양이"는 그대로 두고 새 위젯으로 추가.

## 확정된 결정 (사용자 합의)

- 지표 스킨: **두 개**(파란공·흰구름), 각각 happy(최고점)/sad(최저점).
- 달리기 위젯: **블루볼 + 흰구름 듀오**(둘이 함께 달리는 경주 느낌). 고양이 위젯 유지.
- 달리기 모션: **영상에서 추출한 다리 사이클 프레임 교차 재생**(자연스러운 달리기).
  - 블루볼: `파란_볼도_뛰는_동영상_생성해줘.mp4`(240f/24fps/1280×720, 파란공+흰구름 듀오 레이스 영상)의 **왼쪽 절반**에서 추출 → 배경 제거.
  - 흰구름: `background_빼고_gif로_생성해줘.mp4`(240f/24fps/1280×720, 흰구름 단독)에서 추출 → 배경 제거.
- 선명함·캐릭터 인지성이 최우선 → 코드 드로잉이 아니라 **실제 이미지 컷아웃** 사용.

## 에셋

원본(클립보드 임시 파일)에서 가공하여 `public/skins/`에 저장.

| 산출물 | 출처 | 가공 |
|--------|------|------|
| `ball-happy.png` | 웃는 듀오 `010908` (1258×698, 트랙 배경) | 파란공 영역 크롭 → `rembg` 배경 제거 |
| `ball-sad.png` | 우는 듀오 `011934` (1130×564, 트랙 배경) | 파란공 영역 크롭 → `rembg` |
| `cloud-happy.png` | 웃는 듀오 `010908` | 흰구름 영역 크롭 → `rembg` |
| `cloud-sad.png` | 우는 듀오 `011934` | 흰구름 영역 크롭 → `rembg` |
| `ball-run-1..N.png` | mp4 `파란_볼도_뛰는_동영상_생성해줘.mp4` **왼쪽 절반(0–640px)** | 한 사이클 N프레임 추출 → 좌측 크롭 → `rembg` → **캐릭터별 공통 bbox 일괄 크롭** |
| `cloud-run-1..N.png` | mp4 `background_빼고_gif로_생성해줘.mp4` (체크무늬 배경) | 한 사이클 N프레임 추출 → `rembg` → **공통 bbox 일괄 크롭** |

(블루볼 영상은 좌=파란공/우=흰구름 듀오라, 좌측 절반만 크롭하면 파란공만 깨끗이 분리됨 — 검증 완료.)

### 도구 (검증 완료)

- `sips` — 크롭/트림.
- 프레임 추출 — 시스템 `ffmpeg` 없음. 임시 venv(`/tmp/cloudrun/venv`)에 `imageio` + `imageio-ffmpeg` 설치, `imageio.v2.get_reader(..., format="FFMPEG")`로 디코딩.
- 배경 제거 — 전역 `rembg` **CLI는 `filetype` 모듈 누락으로 깨짐**. 대신 `/opt/homebrew/bin/python3`의 rembg **Python API**(`from rembg import remove, new_session`) 사용. `onnxruntime`·`u2net.onnx`(~176MB, `~/.u2net/`) 캐시 정상. 한 프레임으로 깨끗한 분리 검증 완료.

### 지터 방지 (중요)

프레임마다 독립적으로 트림하면 캐릭터의 크기·중심·발 위치가 프레임마다 달라져 애니메이션 시 덜컹거린다.
→ 선택한 프레임들의 **알파 비투명 영역 union bbox**를 구해 **모든 프레임을 동일 박스로 크롭**한다.
블루볼 2프레임도 원본 크기가 달라(566×520 vs 498×476) **공통 캔버스에 가로 중앙·하단(발) 정렬**로 통일한다.

## Feature A — 지표 스킨 2개

기존 `IndicatorOverlay`가 이미 `findIndicatorSkin(indicatorSkinId)`로 스킨을 찾아
`skin.characters.happy`를 가시범위 최고점에, `skin.characters.sad`를 최저점에 배치한다.
**오버레이/스토어 로직 변경 없음** — `INDICATOR_SKINS` 프리셋에 데이터만 추가한다.

`features/skin/presets.ts`의 `INDICATOR_SKINS`에 추가:

```ts
{
  id: "ind-ball",
  name: "파란공",
  author: "ChartSkin",
  description: "기간 최고점엔 신난 파란공, 최저점엔 우는 파란공이 붙어요.",
  category: "indicator",
  binding: "price-extreme",
  status: "available",
  thumbnail: "/skins/ball-happy.png",
  characters: { happy: "/skins/ball-happy.png", sad: "/skins/ball-sad.png", neutral: "/skins/ball-happy.png" },
},
{
  id: "ind-cloud",
  name: "흰구름",
  ...
  characters: { happy: "/skins/cloud-happy.png", sad: "/skins/cloud-sad.png", neutral: "/skins/cloud-happy.png" },
},
```

- `neutral`은 `IndicatorSkin` 타입상 필수지만 `IndicatorOverlay`는 happy/sad만 사용 → happy 컷으로 채움(무해).
- 사이드바 적용/해제는 `category === "indicator"` 일반 분기(`applyIndicator`/`removeIndicator`)가 이미 커버 → **SkinSidebar 변경 없음**.

## Feature B — 달리기 위젯 (블루볼 + 흰구름 듀오)

### 컴포넌트 `features/chart/RunnerOverlay.tsx`

`CatOverlay`의 구조를 그대로 따른다(캔버스 1장, `ResizeObserver`, `requestAnimationFrame`,
`getYAtX`로 캔들 고가 라인 추적, `getXBounds`로 가시 플롯 범위 클램프, `smoothY` 보간).
차이점은 `drawCat` 호출을 **이미지 프레임 드로잉**으로 교체하고, **러너 2마리**를 그린다:

- 러너 정의(배열): `{ frames: string[]; offset: number; speedMul: number }`
  - 블루볼: `[ball-run-1..N]`
  - 흰구름: `[cloud-run-1..N]`
- 마운트 시 모든 프레임을 `Image` 객체로 프리로드.
- 러너별 x 위치를 독립 추적(시작 위치 `offset`·속도 `speedMul`를 살짝 다르게 → 앞서거니 뒤서거니 **경주 느낌**). 각자 `getXBounds` 범위에서 반사(좌우 왕복).
- 프레임 인덱스 = `Math.floor(now / FRAME_MS) % frames.length` (FRAME_MS ≈ 90~110ms).
- `ctx.drawImage`로 각 러너의 (x, groundY) 기준 중앙 하단 정렬, 목표 높이(예: 46px) 종횡비 유지 스케일.
- 진행 방향(`dir`)에 따라 `ctx.scale(dir, 1)` 좌우 반전(소스 기준 facing 정규화).
- 착지감용 미세 bob(`Math.sin(phase)` 상하 ±2px).
- 캔버스 방식이라 기존 고양이와 동일하게 `html-to-image` PNG 내보내기에 그대로 캡처됨.

props는 `CatOverlay`와 동일: `hostRef`, `getYAtX`, `getXBounds`.

### 스토어 `stores/skinStore.ts`

`catEnabled`/`toggleCat`와 동일 패턴으로 추가(persist 포함):
- 상태 `runnerEnabled: boolean` (초기 `false`)
- 액션 `toggleRunner: () => set((s) => ({ runnerEnabled: !s.runnerEnabled }))`

### 프리셋 `features/skin/presets.ts`

`WIDGET_SKINS`에 추가:
```ts
{
  id: "wg-running-duo",
  name: "달리기 경주",
  author: "ChartSkin",
  description: "파란공과 흰구름이 차트 캔들 고가 위를 경주하듯 달려요.",
  category: "widget",
  status: "available",
  thumbnail: "/skins/ball-run-1.png",
},
```

### 배선

- `features/chart/ChartCanvas.tsx`: 고양이 렌더(line 571) 옆에 동일 패턴 추가
  ```tsx
  {runnerEnabled && skinsVisible && (
    <RunnerOverlay hostRef={containerRef} getYAtX={getYAtX} getXBounds={getXBounds} />
  )}
  ```
  (`runnerEnabled`는 `useSkinStore`에서 구독)
- `features/skin/SkinSidebar.tsx`: cat과 동일하게 `applied`/`onApply`/`onRemove`에
  `skin.id === "wg-running-duo" → toggleRunner` 분기 추가.
- z-index: `Z_LAYER.cat`(=6)과 동일 레이어 재사용(둘 다 캔들 위 위젯). 필요 시 `runner: 6` 키 추가.

## 영향 없음 / 확인 사항

- PNG 내보내기: 캔버스 오버레이 → `html-to-image`가 `toDataURL`로 캡처(기존 고양이와 동일 경로).
- 지표 오버레이/스토어: Feature A는 데이터만 추가, 로직 무변경.
- 기존 "뛰어다니는 고양이"·다른 위젯: 영향 없음(독립 플래그).

## 작업 순서

1. 에셋 생성 → `public/skins/`:
   - 지표 4종: `ball-happy/sad`, `cloud-happy/sad` (듀오 원본 크롭 → rembg).
   - 러너: `ball-run-1..N`(블루볼 영상 좌측 크롭), `cloud-run-1..N`(흰구름 영상) — 추출 → rembg → 캐릭터별 공통 bbox 크롭.
2. Feature A: `INDICATOR_SKINS`에 스킨 2개 추가(오버레이 로직 무변경).
3. Feature B: `RunnerOverlay`(러너 2마리) → 스토어 `runnerEnabled`/`toggleRunner` → `WIDGET_SKINS` → ChartCanvas/SkinSidebar 배선.
4. 빌드/타입체크 + 수동 확인(스킨 적용·듀오 달리기·줌/스크롤 추적·PNG 내보내기).
