# popups/control-panel/

**메인 녹화 컨트롤 패널.**

## 역할

- 녹화 시작 / 일시정지 / 재개 / 중지
- 실시간 타이머 표시 (일시정지 시 고정)
- 마이크 장치 연결 상태 상시 감지 및 표시, 녹화 중 ON/OFF 토글
- 히스토리·폴더·최근파일·드로잉·설정 팝업 연결
- 드로잉 창 단축키 IPC 포워딩

## 파일

| 파일 | 역할 |
|------|------|
| `window.js` | 패널 창 생성, 싱글턴, monitorIndex 계산, 전체 플로우 총괄, `setTheme()` 제공 |
| `index.html` | 레이아웃·스타일 (SVG 통합 헤더 버튼 포함) |
| `index.js` | 녹화 제어, 버튼 이벤트, 마이크 장치 감지, IPC 수신 |
| `msg/index.js` | 패널 내 모든 문자열 (영문) |

## 창 설정

- 위치: 녹화 모니터 정중앙 자동 배치
- 크기: 360 × 460 (min 320 × 400), `resizable: true`
- `alwaysOnTop: true`, `level: 'screen-saver'`

---

## 버튼 활성화 조건

| 버튼 | idle | recording | paused | stopping |
|------|------|-----------|--------|----------|
| 녹화 히스토리 | ✅ | ❌ | ❌ | ❌ |
| 저장 폴더 열기 | ✅ | ✅ | ✅ | ✅ |
| 최근 파일 재생 | ✅ | ❌ | ❌ | ❌ |
| 화면 드로잉 | ❌ | ✅ | ✅ | ❌ |
| 설정 | ✅ | ❌ | ❌ | ❌ |
| 마이크 | ※ 아래 참조 | | | |

---

## 마이크 버튼 상태

마이크 버튼은 **하드웨어 연결 여부** + **녹화 상태** 두 축으로 결정됩니다.

| 상태 | 조건 | 아이콘 | 라벨 | 활성화 |
|------|------|--------|------|--------|
| ① 장치 미연결 | `_micAvailable = false` | 취소선 마이크 | 마이크 없음 | ❌ |
| ② 장치 연결 + idle | `_micAvailable = true` + idle | 일반 마이크 | 마이크 OFF | ❌ |
| ③ 녹화 중 + OFF | 녹화/일시정지 | 일반 마이크 | 마이크 OFF | ✅ |
| ④ 녹화 중 + ON | 녹화/일시정지 | 펄스 애니메이션 | 마이크 ON | ✅ |

## 마이크 상태 표시줄

타이머 하단 `display-row` 에 항상 표시됩니다.

```
🖥  1920 × 1080  |  🎤 마이크 연결됨   ← 초록색 (연결 시)
🖥  1920 × 1080  |  🎤 마이크 없음     ← 흐린 색 (미연결 시)
```

---

## 키보드 단축키

### 녹화 제어 단축키

컨트롤 패널이 포커스를 가지고 있을 때 동작합니다.
`window.addEventListener('keydown')` + `SHORTCUT_MAP` 방식. **Electron `globalShortcut` 미사용.**

| 키 | 동작 | 활성 상태 |
|----|------|-----------|
| `F8` | 녹화 시작 | idle |
| `F9` | 녹화 종료 | recording / paused |

> 단축키 추가: `SHORTCUT_MAP` 에 `{ label, handler, states }` 항목만 등록하면 됩니다.
> ```js
> SHORTCUT_MAP['F10'] = { label: '일시정지', handler: togglePause, states: ['recording'] };
> ```

### 드로잉 도구 단축키 (IPC 포워딩)

드로잉 창은 `focusable: false`이므로 native `keydown`을 받지 못합니다.
컨트롤 패널이 포커스를 유지하면서 키 이벤트를 `drawing-keydown` IPC 채널로 전달합니다.

```
컨트롤 패널 keydown
  → SHORTCUT_MAP (F8/F9) 해당하면 직접 처리 후 return
  → isDrawingOpen() && !isComposing
  → drawingWc.send('drawing-keydown', { key, ctrlKey, ... })
      → 드로잉 창 ipcRenderer.on('drawing-keydown') → _handleShortcut()
```

드로잉 창에서 처리되는 단축키: `P` `L` `R` `C` `E` `T` `Ctrl+Z` `Esc`

---

## 마이크 장치 감지 방식

```
devicechange 이벤트  → 장치 변경 시 즉시 반응
setTimeout 재귀 1초  → 이벤트가 늦거나 누락 시 보완 (USB 복합 장치 대응)
```

- 앱 시작 시 `startMicWatch()` 1회 호출로 상시 동작
- 녹화 중 마이크 탈거 시: 팝업 없이 자동 OFF (`recorder.disableAudio()`)

---

## 주요 내부 함수 (index.js)

| 함수 | 역할 |
|------|------|
| `startRecording()` | recorder.start() 호출, 파일 감시 시작, 인디케이터 갱신 |
| `stopRecording()` | recorder.stop() 호출, 파일 저장 결과 처리, 히스토리 팝업 오픈 |
| `setUIStatus(status)` | 버튼 활성화·비활성화, 타이머 표시, 마이크 상태 갱신 |
| `_refreshMicButton()` | `_micAvailable` + `_status` + `_micOn` 3개 상태 종합해 마이크 버튼 한 번에 갱신 |
| `_sendToIndicator(data)` | `ipcRenderer.sendTo(indicatorWcId, 'indicator-update', data)` 래퍼 |
| `startMicWatch()` | setTimeout 재귀 1초 마이크 폴링 시작 |
| `stopMicWatch()` | 마이크 폴링 타이머 해제 |

---

## 테마 미리보기 폴링 (설정 팝업 연동)

설정 팝업에서 테마 선택 시 `store._themePreview` 에 값을 저장하면,
컨트롤 패널이 400ms 간격으로 감지해 즉시 반영합니다 (미리보기 fallback).
`screenRecord.setTheme()` IPC 브로드캐스트 방식도 병행 지원합니다.

> ⚠️ 테마 저장 기능이 현재 비활성화되어 있으므로 이 미리보기 경로는 대기 상태입니다.
