# core/

**프로세스 간 공유 모듈** 디렉토리.

| 파일 | 역할 |
|------|------|
| `store.js` | 런타임 상태 저장소. `remote.require` 로 Main 프로세스 단일 인스턴스 유지 |
| `settings-store.js` | 영구 설정 파일 저장소. `{userData}/settings/screen_record/settings.json` 관리 |
| `theme.js` | 테마 배경색 정의 및 BrowserWindow CSS 주입 유틸 |

---

## store.js 사용법

```js
const store = remote.require(path.join(__dirname, '../../core/store'));
store.set('key', value);
store.get('key', defaultValue);
store.has('key');            // boolean
store.del('key');
store.delByPrefix('prefix_');
store.snapshot();            // 전체 복사본 (디버깅용)
store.clear();               // 전체 초기화
```

> ⚠️ 반드시 `remote.require()` 를 통해 로드해야 합니다.
> Node.js 모듈 캐시 덕분에 모든 렌더러 창이 동일한 인스턴스를 공유합니다.

### 세션 키 네이밍 규칙

| 키 패턴 | 저장 위치 | 설명 |
|---------|-----------|------|
| `${sessionKey}_panelWinId` | `control-panel/window.js` | 패널 BrowserWindow.id |
| `${sessionKey}_panelWcId` | `control-panel/window.js` | 패널 webContents.id (IPC sendTo 용) |
| `${sessionKey}_indicatorWinId` | `control-panel/window.js` | 인디케이터 BrowserWindow.id |
| `${sessionKey}_indicatorWcId` | `indicator/window.js` | 인디케이터 webContents.id (IPC sendTo 용) |
| `${sessionKey}_drawWinId` | `drawing/window.js` | 드로잉 BrowserWindow.id |
| `${sessionKey}_historyWinId` | `history/window.js` | 히스토리 BrowserWindow.id |
| `${sessionKey}_settingsWinId` | `settings/window.js` | 설정 BrowserWindow.id |
| `${sessionKey}_config` | `control-panel/window.js` | 세션 초기화 설정 객체 |

> `BrowserWindow.id` 와 `webContents.id` 는 **다른 값**입니다.
> `BrowserWindow.fromId()` 는 `BrowserWindow.id` 를, `ipcRenderer.sendTo()` 는 `webContents.id` 를 사용합니다.

---

## settings-store.js 사용법

```js
const settingsStore = remote.require(path.join(__dirname, '../../core/settings-store'));
settingsStore.init(app.getPath('userData')); // 반드시 먼저 호출
const saved = settingsStore.load();
settingsStore.save({ ...saved, frameRate: 60 });
settingsStore.reset();        // 기본값으로 완전 초기화
settingsStore.hasSettings();  // 저장 파일 존재 여부 (boolean)
```

### 설정 저장 경로

```
{userData}/
  settings/
    screen_record/
      settings.json   ← 영구 설정 파일
```

디렉터리가 없으면 `init()` 시점에 **재귀적으로 자동 생성**합니다.

### 정합성 보장 (자동 복구)

`load()` 호출 시 아래 상황이 감지되면 파일을 기본값으로 덮어쓰고 DEFAULTS를 반환합니다.

| 상황 | 복구 여부 |
|------|-----------|
| 파일 미존재 (첫 실행) | 복구 없이 DEFAULTS 반환 |
| 파일 읽기 실패 (권한 등) | 기본값으로 복구 후 DEFAULTS 반환 |
| 유효하지 않은 JSON | 기본값으로 복구 후 DEFAULTS 반환 |
| 배열/null 등 비객체 값 | 기본값으로 복구 후 DEFAULTS 반환 |
| 필드 타입/enum 범위 오류 | 기본값으로 복구 후 DEFAULTS 반환 |

### 설정 기본값

| 키 | 기본값 | 설명 |
|----|--------|------|
| `frameRate` | `30` | fps |
| `videoBitsPerSecond` | `2500000` | bps |
| `videoFormat` | `'webm-h264'` | `'webm-vp9'` \| `'webm-vp8'` \| `'webm-h264'` |
| `outputDir` | `''` | 빈 문자열 = 시스템 Videos 폴더 |

> `theme` 키는 현재 비활성화(`settings-store.js` 주석 처리) 상태입니다.
> 테마는 `screenRecord.open({ theme })` 파라미터로 전달하며, `settingsStore`에 저장하지 않습니다.
> 향후 개인화 기능 복원 시 `[주석 처리]` 블록을 해제하면 됩니다.

---

## theme.js 사용법

```js
const { getThemeInfo, injectBgCss } = require('../../core/theme');

// 테마 정보 조회
const oThemeInfo = getThemeInfo('dark', 'panel');
// → { theme: 'dark', BGCOL: '#1d232a' }

// 팝업 실행 시 CSS 주입 (did-finish-load 콜백 내부)
win.webContents.on('did-finish-load', () => {
  injectBgCss(win, theme, 'panel');   // 컨트롤 패널, 설정
  // injectBgCss(win, theme, 'overlay'); // 모니터 선택, 히스토리
});

// 테마 변경 시 (이미 로드된 창)
injectBgCss(win, newTheme, 'panel');
```

### 팝업 타입별 배경색 variant

| 팝업 | variant | dark | light |
|------|---------|------|-------|
| 컨트롤 패널 | `panel` | `#1d232a` | `#eaecee` |
| 설정 | `panel` | `#1d232a` | `#eaecee` |
| 모니터 선택 | `overlay` | `#13131F` | `#F0F0F8` |
| 히스토리 | `overlay` | `#13131F` | `#F0F0F8` |
| indicator | — | transparent (CSS 주입 불필요) | transparent |
| drawing | — | transparent (CSS 주입 불필요) | transparent |
