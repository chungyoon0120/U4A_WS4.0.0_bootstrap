# screen_record — 개발 히스토리

> 마지막 업데이트: 2026-05-29
> 기준 폴더: `screen_record/`
> Electron 14.2.9 · CommonJS · @electron/remote

---

## [REFACTOR/FIX] 인디케이터 전체 화면 오버레이 → 상단 중앙 뱃지 창 전환 (2026-05-29)

### 배경

녹화 중 화면 떨림, 그리고 인디케이터 위치 계산이 주/보조 모니터 구성에 따라
달라지는 문제가 있었습니다. 두 증상 모두 **모니터 전체를 덮는 투명 오버레이**가 원인:

- 전체 화면 투명 레이어가 녹화 중 매 프레임 재합성(DWM) → 화면 떨림
- cross-DPI(모니터별 다른 배율) 환경에서 전체 화면 창 크기/위치가 주 모니터 기준으로 환산되어 어긋남

테두리(border-ring) 표시는 이미 폐기된 상태라, 이 거대한 오버레이는 상단 중앙
뱃지 하나만을 위해 존재하고 있었습니다.

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/indicator/window.js` | 전체 화면 창 → 뱃지 크기(340×60) 작은 창. 대상 모니터 상단 중앙 좌표 계산 후 `setBounds` 로 DPI 재적용. 파일 헤더 주석 갱신 |
| `popups/indicator/__readme/README.md` | 동작 설명 갱신 |
| `__readme/HISTORY.md` | 이 항목 추가 |

`index.html`/`index.js` 는 변경 없음 — 뱃지가 이미 `top:0; left:50%` 로 뷰포트
중앙 기준이라 작은 창에서도 그대로 중앙 정렬됩니다.

### 효과 / 주의

- 전체 화면 재합성 제거 → **화면 떨림 해소**
- 작은 창이라 cross-DPI 위치 오차 영향 미미 → **주 모니터 구성과 무관하게 안정**
- `setContentProtection(true)` 가 뱃지 영역에만 적용되어 부작용 감소
- ⚠️ "모니터 전체 빨간 테두리" 기능은 폐기 확정. 향후 되살리려면 전체 화면 창을 별도로 둘 것

---

## [BUG FIX] 녹화 인디케이터 상단 중앙 뱃지 위치 오계산 (배율 모니터) (2026-05-29)

### 증상

배율이 다른 모니터에서 녹화 시, 상단 중앙에 떠야 할 인디케이터 뱃지가
한쪽으로 치우쳐 표시됩니다.

### 원인

인디케이터 창도 `popups/drawing/window.js` 와 동일하게 생성자에 `display.bounds`(DIP)를
직접 전달합니다. per-monitor DPI 환경에서 창의 물리 크기/위치가 어긋나, 뱃지의
CSS `left:50%`(창 기준 중앙)가 모니터 중앙과 일치하지 않습니다.

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/indicator/window.js` | `loadURL` 직후 `did-finish-load` 에 `win.setBounds(display.bounds)` 재적용 추가 — 창이 모니터 전체를 정확히 덮어 `left:50%` 가 모니터 중앙과 일치 |
| `__readme/HISTORY.md` | 이 항목 추가 |

### 설계 메모

- 직전 드로잉 오버레이 수정과 동일한 패턴 — 생성자 크기 대신 로드 후 명시 재적용
- `scaleFactor === 1`(단일 모니터·100%) 환경에서는 무해(기존 동작 동일)

---

## [BUG FIX] 모니터 해상도·배율 미고려로 녹화 영역 + 드로잉 영역 오계산 (2026-05-29)

### 증상

모니터별 배율이 다른 환경(예: 화면1 1920×1080@125%, 화면2 2560×1440@100%)에서

1. 드로잉 오버레이가 모니터 전체를 덮지 못해 일부 영역 밖으로 그리기가 안 됨
2. 배율 모니터 녹화 시 실제 해상도보다 작게(다운스케일) 저장됨

### 원인

시스템이 두 좌표계를 환산 없이 혼용했습니다.

- `display.bounds` = **DIP(논리 픽셀)** — 배율이 적용된 값 (125% → 1920×1080 이 1536×864)
- 화면 캡처(`desktopCapturer`) = **물리 픽셀** = `bounds × scaleFactor`

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/drawing/window.js` | `did-finish-load` 에 `win.setBounds(display.bounds)` 재적용 추가 — 대상 디스플레이 scaleFactor 로 재환산되어 오버레이가 모니터 전체를 덮음 |
| `recorder.js` | `maxW/maxH` 를 물리 픽셀(`bounds × scaleFactor`)로 환산 — 배율 모니터에서 네이티브 해상도로 캡처 |
| `popups/drawing/__readme/HISTORY.md` | 드로잉 오버레이 항목 추가 |
| `__readme/HISTORY.md` | 이 항목 추가 |

### 설계 메모

- `scaleFactor` 미제공/`1`(100%·단일 모니터) 환경에서는 양쪽 모두 기존 동작과 완전히 동일 — 무해
- store 는 Display 객체를 참조 그대로 보관하므로 `scaleFactor` 가 보존됨 → 추가 전달 작업 불필요
- `recorder.js` 의 비트레이트 옵션은 변경하지 않음. 배율 모니터에서 캡처 해상도가 커지는 만큼 파일 용량이 늘 수 있음(필요 시 옵션에서 별도 조정)

---

## [FEATURE] 텍스트 메모 팝업 — 기본 폰트 크기 28 변경 + 밑줄 기능 추가 (2026-05-20)

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/drawing/text-input/index.html` | 기본 크기 `14 → 28` (trigger 텍스트 + selected 옵션), 밑줄 CSS + 버튼 추가 |
| `popups/drawing/text-input/msg/index.js` | `G_MSG.M007U = '밑줄 (Ctrl+U)'` 추가 (기존 키 번호 유지) |
| `popups/drawing/text-input/index.js` | `btnUnderline` 변수, `_initTexts` title, click 핸들러, `_syncToolbarState` active 동기화 추가 |
| `__readme/HISTORY.md` | 이 항목 추가 |

### 설계 메모

- Ctrl+U 단축키: contenteditable 에서 브라우저가 natively 처리하므로 별도 keydown 핸들러 불필요
- `_syncToolbarState` 가 `selectionchange` 경로를 통해 active 상태를 자동 동기화하므로 Ctrl+U 사용 시에도 버튼 상태가 올바르게 갱신됨
- 기존 M007(취소선) 키 번호를 유지하고 M007U 신규 키 추가 — 기존 메시지 참조 코드 영향 없음

---

## [BUG FIX] 텍스트 메모 팝업 — 폰트 패밀리·크기 드롭다운 커서 위치 미동기화 (2026-05-20)

### 배경

텍스트 메모 팝업에서 서로 다른 폰트 크기·패밀리로 입력된 텍스트 위에 커서를 이동해도
툴바 드롭다운(폰트 패밀리, 폰트 크기)이 커서 위치에 맞게 갱신되지 않는 문제가 있었습니다.

예) 10pt → 30pt 순서로 입력 후, 10pt 텍스트를 클릭해도 크기 드롭다운이 30으로 유지됨.

### 원인

`_syncToolbarState()` 가 Bold/Italic/Strike 만 동기화하고
폰트 패밀리·크기 드롭다운 갱신 로직이 없었습니다.

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/drawing/text-input/index.js` | **수정** — `_syncFontDropdowns()` 신규 추가, `_syncToolbarState()` 에서 호출 |
| `__readme/HISTORY.md` | 이 항목 추가 |

**변경 없음:** `.html` 파일, 다른 모든 팝업

### 동작 원리

```
selectionchange 이벤트 (기존)
  → _syncToolbarState()
      → Bold/Italic/Strike active 동기화 (기존)
      → _syncFontDropdowns() [신규]
           · queryCommandValue('fontName')  → 폰트 패밀리 드롭다운 selected + value 갱신
           · getComputedStyle(el).fontSize  → 폰트 크기 드롭다운 selected + value 갱신
           · 목록에 없는 크기도 숫자로 표시
```

> 기존 `selectionchange` 경로를 그대로 사용하므로 마우스 클릭, 방향키, 드롭다운 선택 후
> 모든 커서 이동 시나리오에서 자동으로 드롭다운이 갱신됩니다.

---

## [UX] 팝업 헤더 디자인 통일 — 닫기/최소화 버튼 및 제목 아이콘 통합 (2026-05-20)

### 배경

각 팝업의 헤더 영역이 파일마다 다른 디자인 언어를 사용하고 있었습니다.

- **control-panel**: macOS 스타일 컬러 원형 버튼 (`#FF5F57` / `#FEBC2E`) + 텍스트 문자 (`—` / `✕`)
- **monitor-select, settings, history**: SVG X 아이콘 + 투명 원형 버튼 (hover → danger red)
- **drawing/text-input**: 완전히 다른 구조 (`.header` 클래스, 사각 버튼, 아이콘 없음)

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/control-panel/index.html` | **수정** — `.win-btn` 스타일 macOS 버블 → SVG 통합 스타일 교체, 버튼 HTML 교체 |
| `popups/drawing/text-input/index.html` | **수정** — `.btn-close` 통합 스타일 교체, `.header-icon` 신규 추가, 메모 아이콘 HTML 삽입 |
| `__readme/HISTORY.md` | 이 항목 추가 |

**변경 없음:** `monitor-select`, `settings`, `history` (이미 통합 스타일), 모든 `.js` 파일

### 통합 버튼 스타일 기준 (전 팝업 공통)

```
닫기 버튼 : 26px 원형, 투명 배경, SVG X 아이콘, hover → var(--danger) 배경 + 흰색 아이콘
최소화 버튼: 26px 원형, 투명 배경, SVG 가로 선 아이콘, hover → var(--surface2) 배경 + text1
```

### 제목 아이콘 기준 (전 팝업 공통)

```
22×22px, border-radius: 6px
background: linear-gradient(135deg, var(--accent), #E94560)
내부 SVG: 흰색, 팝업 기능을 나타내는 아이콘
```

> **drawing/text-input** 추가 아이콘: 연필(✏) SVG — 메모/텍스트 입력 기능을 직관적으로 표현

---

## [FEATURE] text-input 팝업 → Rich Text 메모 패드로 전환 (2026-05-20)

### 변경 배경

기존 text-input 팝업은 드로잉 캔버스에 텍스트 박스(tbox)를 삽입하기 위한 입력 창이었습니다.
요구사항 변경으로 **녹화 중 화면에 띄우는 떠 있는 메모장**으로 역할이 바뀌었습니다.
메모 내용이 영상에 화면으로 기록되는 방식이므로 캔버스 삽입 IPC 흐름이 불필요해졌습니다.

### 변경 내용

| 파일 | 변경 내용 |
|------|-----------|
| `text-input/index.html` | 단순 textarea → Rich Text Editor 전면 개편 |
| `text-input/index.js` | IPC 송신 로직 전체 제거, RTE 서식 로직으로 교체 |
| `text-input/window.js` | 창 크기 460×300 → 500×400, drawWcId 등 불필요 파라미터 제거 |
| `text-input/msg/index.js` | RTE 툴바 항목으로 메시지 정리 |
| `drawing/index.js` | `_openTextInputPopup` 파라미터 간소화 + `closed` 이벤트 정리 추가. `ipcRenderer.on('text-input-result', ...)` 핸들러 전체 제거 |

### 아키텍처 변경 전/후

**변경 전 흐름:**
```
T 도구 드래그 → text-input 팝업 오픈
  └─ 사용자 텍스트 입력 → [확인]
       └─ ipcRenderer.sendTo(drawWcId, 'text-input-result', { confirmed, text, color })
            └─ drawing/index.js → tbox 캔버스에 생성
```

**변경 후 흐름:**
```
T 도구 드래그 → Rich Text 메모 팝업 오픈
  └─ 사용자 자유롭게 RTE 메모 작성 (폰트/크기/굵기/기울기/취소선/밑줄/색상)
       └─ [닫기] → 팝업 닫힘 (캔버스 아무 변화 없음)
```

### RTE 지원 서식

| 기능 | 구현 방식 |
|------|-----------|
| 폰트 패밀리 | `execCommand('fontName', ...)` |
| 폰트 크기 | `execCommand('fontSize', '7')` → `<font size="7">` 태그를 찾아 `style.fontSize`로 교체 |
| 굵게 | `execCommand('bold')` |
| 기울기 | `execCommand('italic')` |
| 취소선 | `execCommand('strikeThrough')` |
| 밑줄 | `execCommand('underline')` / Ctrl+U 브라우저 native 처리 |
| 글자 색상 | `execCommand('foreColor', ...)` + `<input type="color">` |

---

## [FEATURE] 모니터 선택 — 렌더링 기준 getSources → getAllDisplays 전환 (2026-05-20)

### 배경

`desktopCapturer.getSources()`가 Thunderbolt / USB-C 경로로 연결된 모니터를
Chromium 캡처 엔진 인식 한계로 반환하지 않아, 해당 모니터 카드가 팝업에 아예
표시되지 않는 문제가 있었습니다.

### 변경 내용

| 파일 | 변경 내용 |
|------|-----------|
| `popups/monitor-select/index.js` | 렌더링 루프를 `_sources.forEach` → `_displays.forEach` 전환. `findSourceForDisplay()` 신규 추가. `confirmSelect()` 로 함수명 변경 |
| `popups/monitor-select/index.html` | `.unsupported` 카드 CSS, `.unsupported-overlay` CSS 추가 |
| `popups/monitor-select/msg/index.js` | `M009` 추가 — "녹화가 지원되지 않는 모니터입니다" |

### 변경 전/후

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 카드 생성 기준 | `getSources()` | `getAllDisplays()` |
| Thunderbolt 모니터 | 카드 미표시 | 카드 표시 + 녹화 불가 안내 |
| sourceId 역할 | 카드 생성 기준 | display 매핑 전용 |

### sourceId 매칭 전략

```
1순위: src.display_id === String(display.id)   — Electron display_id 직접 매칭
2순위: display_id 없는 환경 + 개수 동일        — 인덱스 순서 매칭
미매칭: null → 비활성 카드 (클릭 불가 + 오버레이 안내)
```

---

## [UX] recording / paused 상태 모니터 테두리 제거 (2026-05-20)

### 변경 내용

| 파일 | 변경 내용 |
|------|-----------|
| `popups/indicator/index.html` | `.border-ring.recording` CSS 삭제, `@keyframes pulse-border` 삭제, `.border-ring.paused` CSS 삭제 |

### 변경 전/후

| 상태 | 변경 전 | 변경 후 |
|------|---------|---------|
| recording | 빨간 5px 펄스 테두리 + 상단 뱃지 | 테두리 없음 + 상단 뱃지만 |
| paused | 노란 5px 테두리 + 상단 뱃지 | 테두리 없음 + 상단 뱃지만 |

---

## [FEATURE] 공통 UI 메시지 모듈 도입 — electron dialog 완전 제거 (2026-05-20)

### 배경

기존 코드에서 `electron.dialog` (OS 네이티브 팝업) 를 직접 사용하고 있었습니다.
네이티브 팝업은 팝업마다 다른 OS 스타일이 적용되어 테마와 무관하게 동작하고,
녹화 팝업 간 UX 일관성이 없었습니다.

### 변경 내용

| 파일 | 변경 |
|------|------|
| `popups/shared/ui-message.js` | **신규** — MessageToast / MessageBox 공통 모듈 |
| `popups/shared/__readme/README.md` | **신규** — 모듈 사용법 및 확장 가이드 |
| `popups/control-panel/index.js` | **수정** — `dialog` 제거, `MessageBox` 적용 |
| `popups/settings/index.js` | **수정** — `remoteDialog` + 자체 `showToast()` 제거, `MessageToast` / `MessageBox` 적용 |
| `popups/history/index.js` | **수정** — `dialog` 제거, `MessageBox` 적용 |

### 공개 API 요약

```javascript
const { MessageToast, MessageBox } = require(path.join(__dirname, '../shared/ui-message'));

// 자동소멸 토스트
MessageToast.show('설정이 저장되었습니다', { type: 'success' });

// 단순 알림
await MessageBox.alert('소스 ID가 없습니다.', { title: '오류', type: 'error' });

// 확인/취소
const ok = await MessageBox.confirm('삭제하시겠습니까?', {
  title: '파일 삭제', detail: '복구할 수 없습니다.',
  type: 'warning', okLabel: '삭제', cancelLabel: '취소',
});
```

---

## [FEATURE] setTheme() 공개 API 추가 — 런타임 테마 변경 (2026-05-12)

### 공개 API

```javascript
screenRecord.setTheme('light');
screenRecord.setTheme('dark');
```

### 동작 방식

```
screenRecord.setTheme(theme)
  → BrowserWindow.getAllWindows() 전체에 'theme-change' IPC 브로드캐스트
      ↓
  각 팝업 renderer (ipcRenderer.on('theme-change'))
      ↓
  document.body.classList.toggle('light', theme === 'light')
```

### 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `control-panel/window.js` | `setTheme()` 신규 추가, `setTheme` export 추가 |
| `control-panel/index.js` | `ipcRenderer.on('theme-change')` 추가 |
| `indicator/index.js` | `ipcRenderer.on('theme-change')` 추가 |
| `drawing/index.js` | `ipcRenderer.on('theme-change')` 추가 |
| `history/index.js` | `ipcRenderer.on('theme-change')` 추가 |
| `settings/index.js` | `ipcRenderer.on('theme-change')` 추가 |
| `index.js` | `setTheme` import 및 공개 API export 추가 |

---

## [REFACTOR] 테마 개인화 저장 비활성화 — open() 파라미터 기반으로 전환 (2026-05-12)

### 배경

솔루션 프로그램에서 자체 테마를 관리하며, `screenRecord.open({ theme })` 으로
테마를 전달하는 구조로 운영. 사용자가 설정 팝업에서 테마를 별도 저장하는 기능은
불필요하므로 주석 처리. 추후 개인화 기능 추가 시 주석 해제로 복원 가능.

### 변경 내용

| 파일 | 변경 내용 |
|------|-----------|
| `popups/settings/index.html` | 테마 변경 카드 전체 HTML 주석 처리 |
| `popups/settings/index.js` | 테마 관련 상태·함수·핸들러 주석 처리 |
| `core/settings-store.js` | `DEFAULTS.theme` 키 주석 처리 |

### 복원 방법

주석 처리된 모든 블록에 `[주석 처리]` 태그가 달려 있으며, 각 블록에 복원 가이드가 인라인 주석으로 포함되어 있음.

---

## [STYLE] 테마 base 색상 변경 (2026-05-12)

| 테마 | 이전 base | 변경 base |
|------|-----------|-----------|
| Dark  | `#13131F` (딥 퍼플-블랙) | `#1d232a` (쿨 블루-그레이) |
| Light | `#F0F0F8` (퍼플 틴트 화이트) | `#eaecee` (뉴트럴 시스템 그레이) |

### Dark Theme 팔레트 (`：root`)

| 변수 | 변경 후 | 역할 |
|------|---------|------|
| `--bg` | `#1d232a` | 최하위 배경 |
| `--surface` | `#242c35` | 카드·패널 배경 |
| `--surface2` | `#2b3441` | 인세트·호버 배경 |
| `--border` | `#374859` | 구분선·테두리 |
| `--text1` | `#dce6f0` | 본문 텍스트 |
| `--text2` | `#7890a4` | 보조 텍스트 |
| `--text3` | `#435264` | 비활성 텍스트 |

### Light Theme 팔레트 (`body.light`)

| 변수 | 변경 후 | 역할 |
|------|---------|------|
| `--bg` | `#eaecee` | 최하위 배경 |
| `--surface` | `#ffffff` | 카드·패널 배경 |
| `--surface2` | `#dde0e4` | 인세트·호버 배경 |
| `--border` | `#c4cad1` | 구분선·테두리 |
| `--text1` | `#1a2332` | 본문 텍스트 |
| `--text2` | `#4a5a6b` | 보조 텍스트 |
| `--text3` | `#8595a3` | 비활성 텍스트 |

### 변경 파일

`control-panel/index.html`, `history/index.html`, `monitor-select/index.html`,
`settings/index.html`, `indicator/index.html`, `drawing/index.html`

---

## [FEATURE] isOpen() 공개 API 추가 (2026-05-12)

| 파일 | 변경 내용 |
|------|-----------|
| `popups/control-panel/window.js` | `isOpen()` 함수 추가 및 `module.exports` 포함 |
| `index.js` | `isOpen` import 추가 및 `module.exports` 노출 |

```javascript
if (screenRecord.isOpen()) {
  // 이미 실행 중 → 새로 열지 않음
} else {
  await screenRecord.open();
}
```

- 내부 `_sessions` Map을 직접 조회하므로 추가 상태 변수 없음
- 싱글턴 가드(`open()` 진입 차단)는 기존 그대로 유지

---

## [BUG FIX] 드로잉 단축키 간헐적 무반응 — 패널 포커스 유실 시 미복원 (2026-05-13)

### 문제

드로잉 창이 열린 상태에서 외부 앱을 클릭하면 컨트롤 패널이 포커스를 잃고,
다시 캔버스를 클릭해도 P/L/R/C/E/T/Ctrl+Z 단축키가 동작하지 않는 현상.

### 수정 내용

`drawing/index.js`에 `_ensurePanelFocus()` 헬퍼 함수 추가.
비텍스트 도구 `canvas mousedown` 시 패널 포커스가 없으면 자동 복원.

```
캔버스 mousedown (비텍스트 도구)
  → _ensurePanelFocus()
      → panelWin.isFocused() === false 일 때만 panelWin.focus()
```

---

## [BUG FIX] 텍스트 편집 중 녹화 컨트롤 패널 첫 드래그 지연 (2026-05-13)

### 수정 내용

- 텍스트 박스 편집 중 패널 헤더 영역을 누르면 드로잉 창이 proxy drag 로 패널을 직접 이동
- 우측 창 버튼 영역은 proxy drag 대상에서 제외
- `_tboxExitEdit()` 내 `document.body.focus()` 를 `drawWin.isFocused()` 로 가드 → blur 컨텍스트에서 호출 차단

---

## [REFACTOR] setInterval 전수 감사 — 폴링 → IPC 이벤트 전환 (2026-05-10)

| 파일 | 타이머 | 처리 결과 |
|------|--------|-----------|
| `control-panel/window.js` | `zOrderGuardTimer` 100ms | ❌ 제거 |
| `control-panel/window.js` | `pollTimer` 250ms | ❌ IPC 교체 |
| `indicator/index.js` | `setInterval(updateUI)` 500ms | ❌ IPC+RAF 교체 |
| `control-panel/index.js` | 바닥 `setInterval` 400ms | ⚠️ 부분 개선 (테마만 유지) |
| `history/index.js` | 테마 `setInterval` 400ms | ✅ 유지 (idle 조건부) |
| `drawing/index.js` | `_pollTimer` 80ms | ✅ 유지 (일시적, 마우스 이탈 감지) |
| `control-panel/index.js` | `startFileWatch` 300ms | ✅ 유지 (녹화 중만, Windows 신뢰성) |

---

## [FEATURE] 마이크 장치 연결 여부 감지 및 상태 표시 (2026-05-11)

### 마이크 버튼 상태 4단계

| 상태 | 조건 | 아이콘 | 활성화 |
|------|------|--------|--------|
| ① 장치 미연결 | `_micAvailable = false` | 취소선 마이크 | ❌ |
| ② 장치 연결 + idle | `_micAvailable = true` + idle | 일반 마이크 | ❌ |
| ③ 녹화 중 + OFF | 녹화/일시정지 | 일반 마이크 | ✅ |
| ④ 녹화 중 + ON | 녹화/일시정지 | 펄스 애니메이션 | ✅ |

### 감지 방식

```
devicechange 이벤트  → 장치 변경 시 즉시 반응
setTimeout 재귀 1초  → 이벤트가 늦거나 누락 시 보완 (USB 복합 장치 대응)
```

녹화 중 마이크 탈거 시: 팝업 없이 자동 OFF 처리 (`recorder.disableAudio()`)

---

## [FEATURE] 마이크 녹음 실시간 ON/OFF 토글 (2026-05-10)

### 핵심 설계: GainNode 기반 실시간 on/off

```
getUserMedia({audio:true})
       │
  MediaStreamSourceNode
       │
    GainNode ──── gain=0 (OFF) / gain=1 (ON)
       │
 MediaStreamAudioDestinationNode
       │
  audioTrack + videoTrack → combinedStream
       │
  MediaRecorder
```

- GainNode 값만 변경하면 실시간 on/off 가능 (스트림 재생성 불필요)
- 마이크 OFF 구간은 무음 오디오로 기록됨
- mimeType: `video/webm;codecs=vp9,opus` (오디오 코덱 opus 추가)

#### recorder.js 신규 API

```javascript
await recorder.enableAudio();   // 마이크 활성화 → { ok, reason? }
recorder.disableAudio();        // 마이크 비활성화 (gain=0)
recorder.getAudioStatus();      // 'on' | 'off'
```

---

## [REFACTOR] 텍스트 입력 구조 변경 — text-input 팝업 분리 (2026-05-13) [구 구조, 현재 RTE로 전환됨]

> ⚠️ 이 아키텍처는 이후 [text-input → Rich Text 메모 패드 전환]으로 다시 변경되었습니다.
> tbox 생성 IPC 흐름은 현재 동작하지 않습니다.

### 이전 아키텍처

```
drawWin (focusable:false 고정)
  ↓ 텍스트 도구 클릭/드래그
text-input 팝업 창 (독립 BrowserWindow)
  ↓ 확인(Ctrl+Enter) / 취소(Esc)
ipcRenderer.sendTo(drawWcId, 'text-input-result', { confirmed, text })
  ↓
drawWin: tbox 생성 + 배치 (오브젝트 모드)
```

---

## [BUG FIX] Electron 14 드로잉 오버레이 호환성 수정 (2026-05-10)

Electron 14 (Chromium 93)에서 투명 창 관련 버그 6건 수정.

| 이슈 | 원인 | 해결 |
|------|------|------|
| BUG-01 드로잉 전혀 안 됨 | `background: transparent` hit-test 제외 | body 배경 → `rgba(0,0,0,0.01)` |
| BUG-02 마우스 이벤트 미수신 | `setIgnoreMouseEvents` 기본값 `true` | 창 생성 후 + `did-finish-load` 후 두 번 명시 호출 |
| BUG-03 캔버스 클릭 시 배경 앱 선택 | `transparent + focusable:true` 충돌 | 드로잉 창 `focusable: false` 고정 |
| BUG-04 텍스트 첫 클릭 입력 안 됨 | `drawWin.focus()` 비동기 처리 | `content.focus()` → `setTimeout(50ms)` 이동 |
| BUG-05 편집 종료 후 단축키 무반응 | `blur()` 후 포커스 배경 앱으로 이동 | 컨트롤 패널에 명시적 포커스 반환 |
| BUG-06 드로잉 창 생성 시 단축키 무반응 | 창 생성 시 포커스 이탈 | `moveTop()` 직후 `panelWin.focus()` 추가 |

---

## [DESIGN] 핵심 설계 결정 사항

### [DESIGN-01] alwaysOnTop 옵션 대신 메소드 사용
Electron 버그로 생성 옵션 `alwaysOnTop: true` 불안정. 창 생성 후 메소드로 설정.
```javascript
win.setAlwaysOnTop(true, 'screen-saver');
```

### [DESIGN-02] 레이어 계층
```
normal       ← 일반 앱 (VSCode 등)
pop-up-menu  ← 드로잉 캔버스
screen-saver ← 컨트롤 패널 / 인디케이터
```
드로잉 토글 시 50ms 딜레이 후 컨트롤 패널 + 인디케이터 동시 재선언으로 z-order 유지.

### [DESIGN-03] 크로스 프로세스 싱글턴
모듈 레벨 `let _win`은 렌더러마다 독립 인스턴스 → store에 `win.id` 저장 →
`BrowserWindow.fromId(id)` 로 어디서든 접근.

### [DESIGN-04] focusable: false + IPC 키 포워딩
드로잉 창 `focusable: false` → 컨트롤 패널이 `keydown` 을 받아 `drawing-keydown` IPC로 전달.

### [DESIGN-05] 마우스 커서 떨림 방지
`forward: true` 제거 + `screen.getCursorScreenPoint()` 80ms 폴링으로 이탈 감지.

### [DESIGN-06] 패널 제외 좌표 계산
드로잉 창 = 모니터 전체 크기이므로 `e.clientX/Y` = 디스플레이 기준 상대좌표.
`panelBounds.x = getBounds().x - display.bounds.x` 로 상대좌표 저장.

### [DESIGN-07] 히스토리 썸네일
canvas 캡처 방식(검은 화면 문제) 폐기 → `<video src="file:///...">` 직접 삽입.
`loadedmetadata` → `currentTime = duration * 0.1` 으로 스틸컷.

### [DESIGN-08] 녹화 파일 삭제 감지 + 잠금
- 감지: `setInterval + fs.existsSync` 300ms 폴링 (Windows 신뢰성)
- 잠금: 녹화 시작 500ms 후 `fs.openSync(path, 'r')` 추가 핸들 보유 (Best-effort)

### [DESIGN-09] HTML/JS 완전 분리
모든 팝업의 `index.html`에 인라인 `<script>` 없음. `<script src="./index.js">` 마지막 줄만.

### [DESIGN-10] 텍스트 편집 진입 시 패널 Fade 처리
`drawWin.focus()` 호출 시 Win32 `SetForegroundWindow()` 가 TOPMOST 그룹 내 z-order를
역전시키는 문제를 패널 페이드 아웃 → z-order 처리 → 페이드 인으로 우회.
펜/도형 드로잉 중에는 전혀 실행되지 않음.
