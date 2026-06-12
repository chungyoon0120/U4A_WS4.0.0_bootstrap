# popups/history/

**녹화 히스토리 목록.**
녹화 완료 후 자동으로 열리며, 해당 폴더의 `.webm` 파일을 목록으로 표시합니다.

## 파일

| 파일 | 역할 |
|------|------|
| `window.js` | 히스토리 창 생성, store에 `outputDir`·`newFilePath` 저장, 컨트롤 패널 기준 배치 |
| `index.html` | 그리드 카드 레이아웃 (썸네일 + 정보 + 버튼) |
| `index.js` | 파일 스캔, 썸네일 추출, `fs.watch` 감시, 수동 새로고침, 삭제 처리 |
| `msg/index.js` | 팝업 내 모든 문자열 (영문) |

---

## 썸네일 추출 방식

DOM 마운트된 숨김 `<video id="hiddenVideo">` 를 순차 재사용합니다.

```
canplay → currentTime = duration * 0.1 (10% 위치 seek)
  → seeked → rAF×2 + 150ms → canvas.drawImage() → 썸네일 src 주입
```

> canvas 캡처 방식(검은 화면 문제)을 폐기하고 `<video>` 직접 삽입 방식으로 교체됨.

---

## 파일 감시

- **`fs.watch`** — 폴더 변경 감지 시 1.2초 debounce 후 자동 갱신
- **수동 새로고침 버튼** — 강제 목록 갱신
- 두 방법을 병행 제공하여 `fs.watch` 이벤트가 누락되는 환경도 대응

---

## 삭제 처리

1. **현재 녹화 중인 파일**: `store.get('${sessionKey}_activeFilePath')` 와 비교하여 삭제 차단
2. **일반 파일 삭제**: `MessageBox.confirm()` 확인 후 `fs.unlink()`, 페이드아웃 애니메이션
3. **EBUSY 오류 (다른 앱 사용 중)**: `MessageBox.alert()` 로 안내

> OS 네이티브 `dialog` 는 완전히 제거되었습니다. 모든 메시지는 `shared/ui-message.js` 의 `MessageBox` 를 사용합니다.

---

## 싱글턴 + 크로스 프로세스 접근

`window.js` 에서 `store.set('${sessionKey}_historyWinId', win.id)` 로 저장.
이미 열려 있으면 기존 창을 `focus()` 로 활성화하고 새 창을 열지 않습니다.

---

## 창 배치

컨트롤 패널 기준으로 자동 배치됩니다.
- 패널 오른쪽에 공간이 충분하면 → 오른쪽
- 오른쪽이 화면 밖으로 넘치면 → 왼쪽

---

## 테마 연동

IPC `theme-change` 이벤트 수신 즉시 `document.body.classList.toggle('light', ...)` 반영.
기존 store 폴링(400ms) 방식과 이중화하여 이벤트 누락 시에도 정상 동작합니다.

---

## 버튼 기능

| 버튼 | 동작 |
|------|------|
| ▶ (재생) | OS 기본 앱으로 파일 열기 |
| 📁 (폴더 열기) | 파일 위치를 Explorer/Finder에서 열기 |
| 🗑 (삭제) | 확인 후 파일 삭제 + 목록에서 제거 |

---

## hover 미리보기

카드 위에 마우스를 올리면 `<video>` 가 muted 미리보기로 재생됩니다.
마우스를 벗어나면 즉시 정지하고 썸네일 프레임으로 복귀합니다.

---

## 버그 수정 이력

### [FIX 1] 한글 파일명 사용 시 DOMException
- **증상**: 파일명을 한글로 변경 후 히스토리 팝업 로딩 시 `Failed to execute 'querySelector' on 'Element': '#dur_%E3...' is not a valid selector` 오류
- **원인**: `createItem()` 내에서 재생 시간 span의 ID를 `dur_${encodeURIComponent(fileName)}` 으로 생성했는데, 한글이 `%XX` 형식으로 인코딩되어 CSS 셀렉터 문법 위반
- **수정**: span의 `id` 속성 제거, `item.querySelector('.dur-text')` 로 변경 (item 범위 내 유일 요소이므로 ID 불필요)

### [FIX 2] 파일명 변경 후 ERR_FILE_NOT_FOUND 콘솔 오류 반복
- **증상**: 폴더 열기 후 파일명 변경 시 `net::ERR_FILE_NOT_FOUND` 4회 반복 출력
- **원인**: `listEl.innerHTML = ''` 로 DOM을 지워도 Chromium 내부 미디어 네트워크 큐에 구(舊)파일 경로 재시도 요청이 남음
- **수정**: `_clearVideoSources()` 헬퍼 추가. `innerHTML = ''` 직전에 모든 video 요소를 `pause() → src='' → load()` 처리하여 네트워크 큐를 비움. 빈 목록 분기·일반 렌더링 분기 양쪽 모두 적용

### [FIX 3] fs.watch / setInterval 리소스 누수
- **증상 1**: watcher error 발생 시 `_watcher` 참조가 남아, 이후 `stopWatching()` 호출 시 깨진 watcher에 `.close()` 재호출 가능
- **수정 1**: `_watcher.on('error', ...)` 핸들러 내에서 `stopWatching()` 호출로 watcher 정리 보장
- **증상 2**: 테마 폴링 `setInterval` 의 ID를 저장하지 않아 창 닫힐 때 `clearInterval` 불가
- **수정 2**: `_themeTimer` 변수에 타이머 ID 저장, `beforeunload` 핸들러를 함수형으로 교체하여 `stopWatching()` + `clearInterval(_themeTimer)` 동시 처리

### [FIX 4] 한글 파일명 video ERR_FILE_NOT_FOUND
- **증상**: 파일명을 한글로 변경 후 히스토리 목록에서 `net::ERR_FILE_NOT_FOUND` 2회 출력
- **원인**: `createItem()` 에서 `file:///' + filePath.replace(/\\/g, '/')` 방식으로 URL을 수동 조립하면 한글 등 non-ASCII 문자가 raw로 들어감. Chromium이 이를 내부적으로 percent-encode하여 요청하지만 Electron 환경에서 해당 경로 resolve에 실패
- **수정**: Node.js 내장 `pathToFileURL(filePath).href` 로 교체. 처음부터 올바르게 percent-encode된 `file://` URL을 생성하므로 한글·공백·특수문자가 포함된 경로도 정상 로드됨
- **수정 파일**: `popups/history/index.js` — `require('url')` 추가(27번째 줄), `createItem()` 내 `fileUrl` 생성 1줄 교체
