# popups/indicator/

**녹화 중 모니터 인디케이터.**
대상 모니터 상단 중앙에 작은 뱃지 창으로 녹화 상태를 비침해적으로 표시합니다.

## 파일

| 파일 | 역할 |
|------|------|
| `window.js` | 뱃지 크기(340×60) 작은 창, 상단 중앙 배치, `screen-saver` alwaysOnTop, click-through, `setBounds` DPI 재적용 |
| `index.html` | 상단 중앙 pill 뱃지 CSS (테두리 기능 폐기) |
| `index.js` | IPC 수신 + requestAnimationFrame 타이머 렌더링 |
| `msg/index.js` | 상태 문자열 (영문) |

> ⚠️ 과거 "모니터 전체 테두리" 방식은 폐기됨. 전체 화면 투명 오버레이가
> 녹화 중 화면 떨림 + cross-DPI 위치 오차를 유발하여 작은 뱃지 창으로 전환했습니다.
> 자세한 내용은 `screen_record/__readme/HISTORY.md` (2026-05-29) 참조.

---

## 상태 갱신 방식

**구 방식 (제거됨):** `setInterval(updateUI, 500)` — store 폴링
**현재 방식:** IPC 이벤트 수신 + requestAnimationFrame

```
control-panel/index.js
  → ipcRenderer.sendTo(indicatorWcId, 'indicator-update', data)
        ↓
indicator/index.js
  → ipcRenderer.on('indicator-update') → applyState(data)
     - recording 상태 → _startRAF()  : rAF 루프로 타이머 로컬 렌더링 (60fps)
     - paused / idle  → _stopRAF()   : rAF 중지, IPC 수신 데이터로 정적 표시
```

폴링 없이 **상태 변경 즉각 반응** + **recording 중 부드러운 타이머 표시** 를 동시에 달성합니다.

---

## 상태별 UI

| 상태 | 테두리 | 뱃지 |
|------|--------|------|
| idle | 없음 | 숨김 |
| recording | **없음** | `● REC · M1 · 00:00:00` (rAF 타이머) |
| paused | **없음** | `● PAUSE · M1 · 타이머(고정)` |

> **[변경 이력]** recording 빨간 테두리(2026-05-20), paused 노란 테두리(2026-05-20) 순서로 제거됨.
> 현재 모든 상태에서 테두리 없이 상단 중앙 뱃지만으로 녹화 상태를 표시합니다.

---

## 창 특성

- `setIgnoreMouseEvents(true)` — 완전한 클릭 통과 (forward 없음)
- `setAlwaysOnTop(true, 'screen-saver')` — 드로잉 오버레이 위에 항상 표시
- `transparent: true` / `backgroundColor: '#00000000'` — 뱃지 외 완전 투명
- `focusable: false` — OS 포커스를 절대 가져오지 않음

---

## 테마 변경

IPC `theme-change` 이벤트 수신 시 `document.body.classList.toggle('light', ...)` 즉시 반영.
indicator 창은 transparent이므로 `injectBgCss()` 미사용.
