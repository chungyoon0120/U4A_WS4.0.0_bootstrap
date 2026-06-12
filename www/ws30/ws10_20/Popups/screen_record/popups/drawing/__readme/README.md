# popups/drawing/

**화면 드로잉 오버레이.**
녹화 모니터 위에 투명 캔버스를 덮어 실시간으로 그림을 그립니다.

---

## 파일

| 파일 | 역할 |
|------|------|
| `window.js` | 모니터 전체 크기 투명 창 생성·소멸, `pop-up-menu` alwaysOnTop |
| `index.html` | 전체화면 캔버스 + 플로팅 툴바 |
| `index.js` | 드로잉 도구·색상·두께, 툴바 드래그, Undo 스택, 단축키 처리 |
| `text-input/` | **Rich Text 메모 팝업** (떠 있는 메모장, 별도 BrowserWindow) |
| `canvas/` | (확장용) 별도 캔버스 팝업 |

---

## ⚠️ Electron 14 호환성 이슈 및 적용된 해결책

> Electron 14 (Chromium 93) 기반에서 투명 오버레이 창을 다룰 때
> 최신 Electron과 동작이 다른 지점이 여러 곳 있습니다.
> **Electron 버전을 올리면 대부분 자연스럽게 해소됩니다.**

| 이슈 | 원인 | 해결 |
|------|------|------|
| 드로잉 전혀 안 됨 | `background: transparent` hit-test 제외 | body 배경 → `rgba(0,0,0,0.01)` |
| 마우스 이벤트 미수신 | `setIgnoreMouseEvents` 기본값 `true` | 창 생성 후 + `did-finish-load` 후 두 번 명시 호출 |
| 캔버스 클릭 시 배경 앱 선택 | `transparent + focusable:true` 충돌 | `focusable: false` 고정 |
| 텍스트 첫 클릭 입력 안 됨 | `drawWin.focus()` 비동기 처리 | `content.focus()` → `setTimeout(50ms)` 이동 |
| 편집 종료 후 단축키 무반응 | `blur()` 후 포커스 배경 앱으로 이동 | 컨트롤 패널에 명시적 포커스 반환 |
| 창 생성 시 단축키 무반응 | 창 생성 시 포커스 이탈 | `moveTop()` 직후 `panelWin.focus()` 추가 |

---

## Z-Order 설계 및 컨트롤 패널 Fade 처리

### Windows TOPMOST 그룹의 z-order 동작

Windows에서 `screen-saver`, `pop-up-menu` 레벨은 **모두 `HWND_TOPMOST`로 매핑**됩니다.
그룹 내 순서는 마지막으로 `SetWindowPos`를 호출한 창이 최상위가 됩니다.

### z-order가 실제로 변경되는 시점 (단 2곳)

| 시점 | 원인 |
|------|------|
| `openDrawingWindow()` 창 생성 | 새 창 생성 시 Windows가 z-order 변경 |
| `_enableTextInputFocus()` - `drawWin.focus()` | Win32 `SetForegroundWindow()` 호출 |

그 외 `setIgnoreMouseEvents()`, `focusable:false` 창 `mousedown` 등은 z-order를 변경하지 않습니다.

### 최종 해결책: 텍스트 편집 진입 시에만 패널 Fade

```
① 패널 페이드 아웃 (100ms)      ← 패널이 서서히 사라짐
② drawWin.setFocusable(true)    ← 이 시점부터 드로잉 창이 포커스 받을 수 있음
   drawWin.focus()               ← z-order 역전 (하지만 패널이 이미 안 보임)
   panelWin.setAlwaysOnTop(...)  ← z-order 즉시 복원
③ 패널 페이드 인  (150ms)       ← 패널이 서서히 나타남
```

**이 Fade는 `_enableTextInputFocus()` 에서만 발생하며, 펜/도형 드로잉 중에는 전혀 실행되지 않습니다.**

---

## 포커스 정책 요약

드로잉 창은 **항상 `focusable: false`** 입니다.

| 상황 | 포커스 위치 | 단축키 경로 |
|------|-------------|-------------|
| 일반 드로잉 (펜/도형) | 컨트롤 패널 | 패널 `keydown` → IPC → 드로잉 창 |
| 텍스트 편집 중 (구 구조) | 드로잉 창 (일시적 `setFocusable(true)`) | 드로잉 창 native `keydown` |
| 텍스트 편집 종료 | 컨트롤 패널 (명시적 반환) | 패널 `keydown` → IPC → 드로잉 창 |

---

## 단축키 아키텍처

드로잉 창은 `focusable: false`이므로 native `keydown`은 텍스트 편집 중일 때만 동작합니다.
그 외 상황에서는 **컨트롤 패널이 포커스를 유지**하고 키 이벤트를 IPC로 드로잉 창에 전달합니다.

```
[컨트롤 패널 keydown]
  ↓ SHORTCUT_MAP (F8/F9) 해당하면 패널이 직접 처리 후 return
  ↓ isDrawingOpen() && !isComposing
  ↓ drawingWc.send('drawing-keydown', { key, ctrlKey, ... })
        ↓
[드로잉 창 ipcRenderer.on('drawing-keydown')]
  ↓ _handleShortcut(keyInfo)
  ↓ DRAWING_SHORTCUT_MAP 조회 → 도구 전환 실행
```

### 드로잉 도구 단축키

| 키 | 동작 |
|----|------|
| `P` | 펜 도구 |
| `L` | 직선 도구 |
| `R` | 사각형 도구 |
| `C` | 원 도구 |
| `E` | 지우개 도구 |
| `T` | 텍스트 도구 (Rich Text 메모 팝업 열기) |
| `Ctrl+Z` | 실행 취소 |
| `Esc` | 드로잉 창 종료 |

> 단축키 추가: `drawing/index.js`의 `DRAWING_SHORTCUT_MAP`에 항목 등록

---

## Rich Text 메모 팝업 (text-input/)

녹화 중 화면에 설명 메모를 띄우기 위한 **떠 있는 메모장**입니다.
메모 내용은 드로잉 캔버스에 삽입되지 않으며, 화면에 표시된 채로 영상에 기록됩니다.

### 열기

툴바에서 **T (텍스트)** 아이콘 선택 후 화면을 드래그하거나 클릭하면 메모 팝업이 열립니다.

### 지원 서식

| 서식 | 위치 | 단축키 |
|------|------|--------|
| 폰트 패밀리 | 툴바 첫 번째 셀렉트 | — |
| 폰트 크기 | 툴바 두 번째 셀렉트 (기본 28) | — |
| 굵게 | **B** 버튼 | Ctrl+B |
| 기울기 | *I* 버튼 | Ctrl+I |
| 취소선 | ~~S~~ 버튼 | — |
| 밑줄 | U 버튼 | Ctrl+U |
| 글자 색상 | 색상 원 버튼 | — |

### 커서 위치별 드롭다운 동기화

`selectionchange` 이벤트 → `_syncToolbarState()` → `_syncFontDropdowns()` 순으로
폰트 패밀리·크기 드롭다운이 커서 위치에 맞게 자동 갱신됩니다.

### 닫기

헤더 오른쪽 **×** 버튼으로 닫습니다. 입력 내용은 저장되지 않습니다.

---

## 주요 함수 (index.js)

| 함수 | 설명 |
|------|------|
| `selectTool(tool)` | 도구 전환. 텍스트↔비텍스트 시 `pointerEvents` 관리 |
| `_enableTextInputFocus()` | 패널 페이드 아웃 → `setFocusable(true)` + `drawWin.focus()` → z-order 복원 → 패널 페이드 인 |
| `_disableTextInputFocus()` | `blur()` + `setFocusable(false)` + 패널 포커스 반환 |
| `_openTextInputPopup(geom)` | text-input 팝업 열기. `closed` 이벤트에서 `_pendingGeom` / `_pendingEditId` 자동 정리 |
| `_handleShortcut(keyInfo)` | 단축키 공통 처리. native keydown 및 IPC 수신 양쪽에서 호출 |
| `_ensurePanelFocus()` | 비텍스트 도구 mousedown 시 패널 포커스 유실 여부 확인 후 복원 |
| `closeDraw()` | 드로잉 창 종료. `ipcRenderer.sendTo(panelWcId, 'drawing-closed')` 송신 |
