# popups/

팝업별 독립 폴더. 각 폴더 안에서 창 관리·HTML·JS 로직을 모두 관리합니다.

## 폴더 일람

| 폴더 | 설명 |
|------|------|
| `control-panel/` | 메인 녹화 컨트롤 패널 |
| `drawing/` | 녹화 중 화면 드로잉 오버레이 |
| `drawing/text-input/` | Rich Text 메모 팝업 (떠 있는 메모장, drawing 하위) |
| `drawing/canvas/` | (확장용) 별도 캔버스 팝업 (drawing 하위) |
| `history/` | 저장 영상 히스토리 목록 |
| `indicator/` | 모니터 상단 녹화 인디케이터 |
| `monitor-select/` | 멀티모니터 선택 팝업 |
| `settings/` | 녹화 설정 팝업 |
| `shared/` | 공통 UI 모듈 (MessageToast / MessageBox) |

## 각 폴더 구조

```
popups/<name>/
├── window.js       ← BrowserWindow 생성·관리
├── index.html      ← HTML 구조 + CSS (인라인 JS 없음)
├── index.js        ← 화면 로직 (DOM·이벤트·상태)
├── msg/index.js    ← 화면에 표시되는 모든 문자열 상수
└── __readme/       ← 해당 팝업 문서
```

`shared/` 폴더는 `window.js` 없이 JS 모듈만 제공합니다.

## 설계 원칙

- `window.js` : BrowserWindow API 전담, 렌더러 DOM 접근 금지
- `index.html` : `<style>` + 마크업만, 인라인 `<script>` 금지
- `index.js`  : DOM·이벤트·상태 전담, BrowserWindow API 필요 시 remote 사용
- `msg/index.js` : 하드코딩 문자열 금지, 모든 텍스트는 G_MSG 객체 참조

## IPC 통신 채널

| 발신 | 채널 | 수신 |
|------|------|------|
| `control-panel/index.js` | `ipcRenderer.send('rec-done-{sk}')` | `ipcMain` → `control-panel/window.js` |
| `control-panel/index.js` | `ipcRenderer.sendTo(indicatorWcId, 'indicator-update')` | `indicator/index.js` |
| `drawing/index.js` | `ipcRenderer.sendTo(panelWcId, 'drawing-closed')` | `control-panel/index.js` |
| `control-panel/index.js` | `ipcRenderer.sendTo(drawingWcId, 'drawing-keydown')` | `drawing/index.js` |
| `control-panel/window.js` | `win.webContents.send('theme-change', theme)` (전체 broadcast) | 각 팝업 `ipcRenderer.on('theme-change')` |
