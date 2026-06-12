# popups/monitor-select/

**멀티모니터 선택 팝업.**
모니터 2개 이상 연결 시 녹화 대상을 선택합니다. 단일 모니터 환경에서는 이 팝업 없이 자동 시작됩니다.

## 파일

| 파일 | 역할 |
|------|------|
| `window.js` | 선택 팝업 창, store로 결과 반환 |
| `index.html` | 모니터 썸네일 카드 그리드 |
| `index.js` | 소스 로드, 디스플레이 기준 렌더링, 선택 처리 |
| `msg/index.js` | UI 문자열 |

---

## 렌더링 기준 — getAllDisplays() 우선

카드 생성 기준은 `screen.getAllDisplays()` 입니다.
`desktopCapturer.getSources()`는 `sourceId` 매핑 전용으로만 사용합니다.

```
screen.getAllDisplays()        → 3개 (OS 등록 모니터 전체)
desktopCapturer.getSources()  → 2개 (Chromium 인식 소스)

결과:
  카드 1 (M1) — sourceId 매칭 ✅ 선택 가능
  카드 2 (M2) — sourceId 매칭 ✅ 선택 가능
  카드 3 (M3) — sourceId 없음 ❌ 녹화 불가 안내 표시
```

> 이전 방식(`getSources()` 기준 렌더링)에서는 Thunderbolt/USB-C 연결 모니터가 카드에 아예 나타나지 않는 문제가 있었습니다.
> 현재는 `getAllDisplays()` 기준으로 모든 모니터를 카드로 표시하고, 녹화 불가 모니터에는 안내 오버레이를 표시합니다.

---

## sourceId 매칭 전략 (`findSourceForDisplay()`)

| 순위 | 조건 | 처리 |
|------|------|------|
| 1 | `src.display_id === String(display.id)` | 정확 매칭 |
| 2 | display_id 없는 환경 + 개수 동일 | 인덱스 순서 매칭 |
| — | 매칭 실패 | `null` → 녹화 불가 카드 |

---

## 녹화 불가 카드 (`.unsupported`)

Thunderbolt / USB-C 연결 모니터 등 Chromium 캡처 엔진이 인식하지 못하는 경우
해당 카드에 `.unsupported-overlay` 를 표시합니다.

- "녹화가 지원되지 않는 모니터입니다" 안내 문구
- 클릭 이벤트 없어 선택 불가

> Thunderbolt 모니터의 `sourceId` 미발급은 Chromium 캡처 엔진의 GPU 경로 인식 한계로, 코드 레벨 우회 불가합니다.

---

## 반환값 (store 저장)

```js
// 선택 시
{ display: Electron.Display, sourceId: string, sourceName: string }

// 취소 시
null
```

---

## 창 크기

| 모니터 수 | 창 크기 |
|-----------|---------|
| 2개 | 560 × 324 |
| 3개 이상 | 800 × 324 |

---

## 단축키

| 키 | 동작 |
|----|------|
| `Enter` | 현재 선택 확인 |
| `Esc` | 취소 |
| 더블클릭 | 즉시 선택 |
