# drawing/ — 변경 히스토리

> 기준 폴더: `screen_record/popups/drawing/`
> 전체 통합 히스토리: `screen_record/__readme/HISTORY.md` 참조

---

## [BUG FIX] 다중 모니터·다른 배율 환경 드로잉 오버레이 커버리지 (2026-05-29)

### 증상

모니터별 배율이 다른 환경(예: 화면1 1920×1080@125%, 화면2 2560×1440@100%)에서
드로잉 오버레이가 모니터 전체를 덮지 못하고 일부 영역에서만 드로잉이 됩니다.
덮이지 않은 영역은 오버레이 창이 마우스 이벤트를 수신하지 못해 그리기가 불가합니다.

### 원인

`new BrowserWindow({ x, y, width, height })` 생성자에 `display.bounds`(DIP)를 직접
전달합니다. Windows per-monitor DPI 환경에서 Electron 14 는 생성자 시점에 창 크기를
창이 처음 뜨는 모니터(주 모니터)의 `scaleFactor` 로 환산한 뒤 대상 모니터로 이동하므로,
배율이 다른 대상 모니터에서는 창의 물리 크기/위치가 어긋납니다.

### 수정

| 파일 | 변경 |
|------|------|
| `window.js` | `did-finish-load` 콜백에 `win.setBounds(display.bounds)` 재적용 1줄 추가 |

`setBounds` 는 사각형이 놓이는 대상 디스플레이의 `scaleFactor` 로 정확히 환산하므로
모니터 전체를 덮도록 보정됩니다. 캔버스는 기존 `window 'resize'` 핸들러가 자동 재적합.

### 설계 메모

- `scaleFactor === 1`(단일 모니터·동일 배율) 환경에서는 같은 bounds 재적용이라 무해 — 기존 동작 동일
- 생성자 크기에 의존하지 않고 로드 후 명시 재적용 → 향후 모니터 추가/배율 변경에도 안전(확장성)

---

## [FEATURE] text-input — 기본 폰트 크기 28 + 밑줄 기능 추가 (2026-05-20)

| 파일 | 변경 |
|------|------|
| `text-input/index.html` | 기본 폰트 크기 `14 → 28`, 밑줄 CSS·버튼 추가 |
| `text-input/msg/index.js` | `G_MSG.M007U = '밑줄 (Ctrl+U)'` 추가 |
| `text-input/index.js` | `btnUnderline` 변수, click 핸들러, `_syncToolbarState` active 동기화 추가 |

---

## [BUG FIX] text-input — 폰트 드롭다운 커서 위치 미동기화 (2026-05-20)

`_syncToolbarState()` 에 `_syncFontDropdowns()` 를 추가하여 커서 이동 시
폰트 패밀리·크기 드롭다운이 자동 갱신됩니다.

---

## [UX] 팝업 헤더 디자인 통일 — text-input 통합 스타일 적용 (2026-05-20)

| 파일 | 변경 |
|------|------|
| `text-input/index.html` | `.btn-close` 통합 스타일 교체, `.header-icon` 신규, 메모 아이콘(연필 SVG) 추가 |

---

## [FEATURE] text-input 팝업 → Rich Text 메모 패드로 전환 (2026-05-20)

기존: 캔버스에 텍스트 박스 삽입 → IPC (`text-input-result`) 흐름  
변경: 독립적인 떠 있는 메모장. IPC 흐름 제거.

| 파일 | 변경 |
|------|------|
| `text-input/index.html` | 단순 textarea → Rich Text Editor 전면 개편 |
| `text-input/index.js` | IPC 송신 로직 전체 제거, RTE 서식 로직 교체 |
| `text-input/window.js` | 창 크기 460×300 → 500×400, 불필요 파라미터 제거 |
| `index.js` | `ipcRenderer.on('text-input-result', ...)` 핸들러 제거, `_openTextInputPopup` 파라미터 간소화 |

---

## [BUG FIX] 텍스트 편집 중 컨트롤 패널 첫 드래그 지연 보정 (2026-05-13)

`_tboxExitEdit()` 내 `document.body.focus()` 를 `drawWin.isFocused()` 로 가드.
blur 컨텍스트에서 호출 차단 → 패널 drag mouse capture 방해 해소.

---

## [BUG FIX] 드로잉 단축키 간헐적 무반응 — `_ensurePanelFocus()` 추가 (2026-05-13)

비텍스트 도구 `canvas mousedown` 시 패널 포커스 유실 여부를 `isFocused()` 로 확인,
유실된 경우 `panelWin.focus()` 자동 복원.

---

## [REFACTOR] z-order 재선언 로직 전면 단순화 (2026-05)

`_raisePanelOnTop`, `_forceRaisePanelOnTop`, `_raisePanel` 등 13곳의 불필요한
z-order 재선언 코드를 제거하고, 실제로 z-order가 변경되는 2곳에만 처리 집중.

- `openDrawingWindow()` → `panelWin.focus()` 1줄
- `_enableTextInputFocus()` → 패널 페이드 아웃/인 처리

---

## [BUG FIX] Electron 14 드로잉 오버레이 호환성 6건 수정 (2026-05)

상세 내용은 `screen_record/__readme/HISTORY.md` 의 `[BUG FIX] Electron 14` 항목 참조.

---

## [REFACTOR] text-input 팝업 분리 — drawWin 포커스 토글 구조적 제거 (2026-05-13)

> ⚠️ 이 구조는 이후 RTE 메모 패드 전환으로 다시 변경되었습니다.

drawWin `focusable` 토글 방식의 패널 드래그 충돌 버그 해결을 위해
텍스트 입력을 독립 BrowserWindow(`text-input/`)로 분리했습니다.
