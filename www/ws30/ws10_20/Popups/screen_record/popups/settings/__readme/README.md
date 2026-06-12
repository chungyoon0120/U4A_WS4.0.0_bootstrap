# popups/settings/

**녹화 설정 팝업.**

## 파일

| 파일 | 역할 |
|------|------|
| `window.js` | 싱글턴 창, `closeSettingsWindow()` / `isSettingsOpen()` 제공 |
| `index.html` | 드롭다운(품질) · 카드(포맷) 레이아웃. 테마 카드는 현재 주석 처리 |
| `index.js` | 설정 저장, 취소 시 원복, IPC theme-change 수신 |
| `msg/index.js` | 팝업 내 모든 문자열 (영문) |

## API

```js
const { openSettingsWindow, closeSettingsWindow, isSettingsOpen }
  = require('./popups/settings/window');
```

---

## 설정 항목별 동작

| 항목 | 저장 위치 | 반영 시점 |
|------|-----------|-----------|
| **프레임레이트** | `settingsStore` 영구 저장 | **다음 녹화 시작 시** |
| **비트레이트** | `settingsStore` 영구 저장 | **다음 녹화 시작 시** |
| **비디오 포맷** | `settingsStore` 영구 저장 | **다음 녹화 시작 시** |
| **테마** | ⚠️ 현재 비활성화 | — |

> ⚠️ 품질/포맷은 **녹화 중에는 변경 불가** (UI 잠금). idle 상태에서 저장 후 다음 녹화 시작부터 반영.

---

## 테마 관리 방식 (현재 구조)

### 설정 팝업 내 테마 저장 — 현재 비활성화

설정 팝업의 테마 변경 카드(세그먼트 컨트롤)는 현재 주석 처리되어 표시되지 않습니다.
`settings/index.js` 및 `settings-store.js` 의 테마 관련 코드도 `[주석 처리]` 태그와 함께 주석 처리되어 있습니다.

**복원 방법**: `settings/index.html`, `settings/index.js`, `core/settings-store.js` 의 `[주석 처리]` 태그 블록 해제

### 현재 테마 제어 방법 2가지

```
① screenRecord.open({ theme: 'dark' })   ← 팝업 최초 실행 시 테마 지정
② screenRecord.setTheme('dark')          ← 런타임 중 즉시 변경 (IPC 브로드캐스트)
```

---

## 품질/포맷 저장 흐름

```
saveSettings() 호출
  ① settingsStore.save({ frameRate, videoBitsPerSecond, videoFormat })
  ② sessionKey 있을 때:
     - status === 'idle'    → store.set(config.recordOptions) 즉시 갱신
     - status !== 'idle'    → 파일만 저장 (녹화 중 quality 값 미변경)
  ③ configVersion 증가 → control-panel onSettings() 콜백이 _recordOptions 갱신
```

control-panel 이 `_recordOptions` 를 갱신하면 이후 `recorder.start()` 호출 시 새 값 전달.

---

## UI 잠금 조건

녹화 중(`recording` / `paused`) 상태에서 설정 팝업을 열면:

- 프레임레이트·비트레이트 `<select>` → `disabled`
- 힌트 문구: `"Quality cannot be changed while recording."` (빨간색)
- 비디오 포맷 카드 → 클릭 가능하지만 `saveSettings()` 내부에서 세션 반영 생략

---

## 싱글턴 + 크로스 프로세스 접근

`window.js` 에서 창 생성 시 `store.set('${sessionKey}_settingsWinId', win.id)` 로 저장.
다른 프로세스에서 `BrowserWindow.fromId(store.get('${sessionKey}_settingsWinId'))` 로 접근 가능.
