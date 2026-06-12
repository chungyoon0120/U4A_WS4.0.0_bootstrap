# screen_record

Electron 14.x 기반 **화면 녹화 모듈**.  
CommonJS · `@electron/remote` · `contextIsolation: false`

---

## 빠른 시작

```js
const screenRecord = require('./screen_record');

// 녹화 패널 열기
const result = await screenRecord.open({ outputDir: 'C:\\record', theme: 'dark' });
// result = { filePath, fileName, duration(ms), fileSize(bytes), display } 또는 null (취소)

// 현재 열려 있는지 확인
console.log(screenRecord.isOpen()); // true / false

// 테마 런타임 변경 (녹화 중에도 즉시 적용)
screenRecord.setTheme('light');
screenRecord.setTheme('dark');

// 모든 팝업 강제 종료
screenRecord.close();
```

---

## 공개 API

| 함수 | 반환 | 설명 |
|------|------|------|
| `open(params?)` | `Promise<result\|null>` | 컨트롤 패널 오픈 및 녹화 흐름 시작 |
| `isOpen()` | `boolean` | 현재 팝업이 열려 있으면 `true` |
| `setTheme(theme)` | `void` | 열려 있는 모든 팝업 테마 즉시 변경 |
| `close()` | `void` | 모든 팝업 강제 종료 |

### `open()` 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `outputDir` | `string` | `''` | 저장 경로. 빈 문자열이면 시스템 Videos 폴더 |
| `theme` | `'dark'\|'light'` | `'dark'` | 초기 테마 |
| `parentWin` | `BrowserWindow\|null` | 호출 창 자동 감지 | 부모 창. `null` 전달 시 연결 비활성화 |
| `recordOptions` | `Object` | — | 추가 녹화 옵션 (아래 참조) |

#### `recordOptions` 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `frameRate` | `number` | `30` | fps |
| `videoBitsPerSecond` | `number` | `2500000` | bps |
| `timeslice` | `number` | `1000` | 청크 간격 (ms) |

---

## 폴더 구조

```
screen_record/
├── index.js                ← 공개 API (open / isOpen / setTheme / close)
├── recorder.js             ← MediaRecorder 녹화 엔진 + AudioContext 마이크 믹싱
├── core/                   ← 프로세스 간 공유 모듈
│   ├── store.js            ← 런타임 상태 (remote.require 전용)
│   ├── settings-store.js   ← 영구 설정 (userData/settings/screen_record/settings.json)
│   └── theme.js            ← 배경색 정의 및 CSS 주입 유틸
└── popups/                 ← 기능별 팝업 (window · html · js · msg 묶음)
    ├── control-panel/      ← 메인 녹화 컨트롤
    ├── drawing/            ← 화면 드로잉 오버레이
    │   ├── canvas/         ← (확장용) 별도 캔버스 팝업
    │   └── text-input/     ← Rich Text 메모 팝업 (떠 있는 메모장)
    ├── history/            ← 저장 영상 히스토리
    ├── indicator/          ← 모니터 상단 녹화 인디케이터
    ├── monitor-select/     ← 멀티모니터 선택 팝업
    ├── settings/           ← 녹화 설정 팝업
    └── shared/             ← 공통 UI (MessageToast / MessageBox)
```

---

## main.js 필수 설정

```js
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();

// 메인 창
remoteMain.enable(win.webContents);

// screen_record 이 생성하는 모든 팝업에 자동 활성화 (필수)
app.on('browser-window-created', (_, window) => {
  remoteMain.enable(window.webContents);
});
```

---

## 영구 설정 저장 경로

```
{userData}/settings/screen_record/settings.json
```

사용자가 설정 팝업에서 변경·저장한 내용이 이 파일에 기록됩니다.

| 키 | 기본값 | 설명 |
|----|--------|------|
| `frameRate` | `30` | fps |
| `videoBitsPerSecond` | `2500000` | bps |
| `videoFormat` | `'webm-h264'` | `'webm-vp9'` \| `'webm-vp8'` \| `'webm-h264'` |
| `outputDir` | `''` | 빈 문자열 = 시스템 Videos 폴더 |

> ⚠️ `theme` 영구 저장 기능은 현재 비활성화 상태입니다.  
> 테마는 `screenRecord.open({ theme })` 파라미터 또는 `screenRecord.setTheme()` 로 관리합니다.  
> 향후 개인화 기능 복원 시 `settings/index.js`, `settings/index.html`, `settings-store.js` 의 `[주석 처리]` 태그 블록을 해제하면 됩니다.

> 품질/포맷 변경은 **다음 녹화 시작 시** 적용됩니다. 앱 재시작은 불필요합니다.
