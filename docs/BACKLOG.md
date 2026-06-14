# ChartSkin — Backlog

> 현재 구현 상태 정리. 최신화 필요 시 이 파일만 갱신.

---

## Done

### 데이터 레이어 (M1)
- [x] Binance REST 클라이언트 (`/api/v3/klines`) + zod 검증
- [x] `fromBinance` 어댑터 → `Candle{time,open,high,low,close,volume}`
- [x] 과거 캔들 페이징 (`loadOlder`)
- [x] WS 실시간 진행 캔들 (`subscribeKline`)
- [x] 로딩·에러 상태

### 차트 코어 (M2)
- [x] lightweight-charts v5 마운트 (`'use client'`, `ssr:false`) + 리사이즈
- [x] 캔들 + 거래량(별도 pane)
- [x] MA(5/20/60/120) SMA 계산 → LineSeries
- [x] 줌/스크롤/십자선
- [x] 차트 배경 투명화
- [x] (스펙 외) BB · RSI · MACD · 매물대(Volume Profile) 보조지표 토글

### 좌표 오버레이 엔진 (M3)
- [x] `useChartOverlay` (`priceToCoordinate`/`timeToCoordinate`)
- [x] 스크롤/줌/리사이즈 구독 → rAF throttle 재배치
- [x] 가시영역 밖(`null`) 숨김 처리

### 배경 스킨 (M4)
- [x] 프리셋 2개 (밤하늘, 캔디)
- [x] 투명도 슬라이더
- [x] fit 모드 (cover/contain/tile)
- [x] (스펙 외, Backlog 선반영) 커스텀 이미지 업로드 — IndexedDB + 다운스케일

### 지표 스킨 (M5)
- [x] 최고/최저점 자동 감지 (`detectHighLowInRange`)
- [x] 캐릭터(happy/sad) + 말풍선
- [x] 좌표 추적(스크롤·줌 따라 재배치)

### 스킨 전환 UI (M6)
- [x] 마켓플레이스 사이드바 (배경/지표/위젯/세트 카테고리)
- [x] 적용/해제 토글 → `skinStore`
- [x] localStorage persist (zustand persist)

### PNG 내보내기 (M7)
- [x] html-to-image 합성 (배경+차트+오버레이)
- [x] 2x 해상도
- [x] 다운로드 트리거

### 그 외
- [x] 위젯: 뛰어다니는 고양이 (`CatOverlay`, canvas)

---

## In Progress / Partial

- [ ] 종목 선택 — BTC/ETH **2개 고정**. 검색·`/exchangeInfo` 없음.
- [ ] 기간 선택 — **1d만 활성**. 1m/5m/15m/1h/4h 버튼은 존재하나 disabled("준비중").
- [ ] 캐릭터 표정 variant — `neutral` 타입은 정의됐지만 사용 안 됨 (감정 자동판정 로직 없음, 항상 happy=최고/sad=최저).
- [ ] PNG 해상도 옵션 — 스펙은 1x/2x인데 현재 2x 고정.

---

## Todo

### 데이터/차트
- [ ] 종목 검색 / 추가 종목
- [ ] 추가 interval (1m/5m/15m/1h/4h) 활성화

### 위젯 · 세트 테마
- [ ] 위젯: 뉴스 마커 (`status: "soon"`)
- [ ] 세트 테마 2종 (`status: "soon"`)

### 백엔드
- [ ] `app/api/*` Route Handlers (주식/AI 프록시 등 — MVP는 자리만)

### 지표 스킨 바인딩 확장 (2-1b)
- [ ] 매수/매도 지점 (사용자 지정)
- [ ] 골든크로스/데드크로스 (반짝임)
- [ ] 일목균형표 (구름 + 가격 돌파 시 비행기 연출)
- [ ] 지지선/저항선
- [ ] 매물대 바인딩 (현재 toolbar 보조지표로만 존재, 캐릭터 바인딩 아님)
- [ ] 사용자 정의 가격선

### Phase 2 — 스킨 시스템 고도화
- [ ] 스킨 에디터 (드래그앤드롭 위치 조정, 바인딩 선택, 말풍선 직접 입력, DIY 배경)
- [ ] 차트 색상 테마 (캔들/배경/그리드/MA 색상 커스터마이징)
- [ ] 애니메이션 스킨 (GIF/Lottie)
- [ ] 감정 반응 자동화 (등락률 기반 + 실시간 갱신)
- [ ] 비디오(MP4) 내보내기

### Phase 3 — AI 스킨 생성
- [ ] 텍스트 프롬프트 → 배경 스킨 생성
- [ ] 자연어 → 지표 아이콘/캐릭터 생성
- [ ] 커스텀 업로드 이미지 → 스킨화 (배경 제거 rembg, 현재는 배경 이미지로만 사용)

### 의도적 제외 (MVP 범위 외)
- [ ] 인증 / 유저별 저장 / DB
