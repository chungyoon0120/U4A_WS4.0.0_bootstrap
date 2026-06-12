# shared/ui-message.js — 공통 UI 메시지 모듈

> 위치: `popups/shared/ui-message.js`  
> 작성일: 2026-05

---

## 개요

Electron `dialog` 모듈(OS 네이티브 팝업) 을 완전히 대체하는 **렌더러 인라인 메시지 모듈**입니다.  
SAP UI5 의 `MessageToast` / `MessageBox` 원리를 차용하여, 모든 녹화 팝업에서  
동일한 UX와 디자인을 제공합니다.

### 특징
- **테마 자동 추종** — 호스트 HTML 의 CSS 변수(`--bg`, `--surface`, `--accent`, `--danger` 등)를  
  직접 참조하므로 dark/light 전환 시 별도 처리 없이 즉시 반영됩니다.
- **Promise 기반** — `await` 로 버튼 클릭 결과를 동기 흐름처럼 처리할 수 있습니다.
- **키보드 지원** — Enter(기본 버튼), Escape(취소/첫 버튼)를 지원합니다.
- **애니메이션** — fade + scale 트랜지션으로 부드러운 등장/퇴장을 제공합니다.
- **의존성 없음** — Electron API, 외부 라이브러리 없이 순수 DOM 조작으로 동작합니다.

---

## 사용법

```javascript
const { MessageToast, MessageBox } = require('../../shared/ui-message');
// 또는 path.join 사용
const { MessageToast, MessageBox } = require(path.join(__dirname, '../shared/ui-message'));
```

---

## MessageToast

하단 중앙에 자동 소멸하는 알림을 표시합니다.

```javascript
// 기본 (type: 'info', duration: 2200ms)
MessageToast.show('불러오는 중...');

// 성공
MessageToast.show('설정이 저장되었습니다', { type: 'success' });

// 경고
MessageToast.show('녹화 중에는 변경할 수 없습니다', { type: 'warning', duration: 3000 });

// 오류
MessageToast.show('파일을 열 수 없습니다.', { type: 'error' });
```

### 옵션

| 옵션       | 타입     | 기본값   | 설명                          |
|------------|----------|----------|-------------------------------|
| `type`     | string   | `'info'` | `success` / `warning` / `error` / `info` |
| `duration` | number   | `2200`   | 자동 소멸까지 대기 시간 (ms)  |

---

## MessageBox

모달 다이얼로그를 표시하고 버튼 클릭 결과를 Promise 로 반환합니다.

### alert — 단순 알림

```javascript
await MessageBox.alert('소스 ID가 없습니다.', {
  title: '오류',
  type : 'error',
});
```

| 옵션     | 타입   | 기본값      | 설명       |
|----------|--------|-------------|------------|
| `title`  | string | `''`        | 제목       |
| `detail` | string | `''`        | 상세 텍스트 (message 아래 작은 글씨) |
| `type`   | string | `'info'`    | 아이콘/색상 결정 |
| `buttons`| string[] | `['확인']` | 버튼 레이블 (첫 번째만 사용) |

---

### confirm — 확인 / 취소

```javascript
const ok = await MessageBox.confirm('파일을 삭제하시겠습니까?', {
  title      : '파일 삭제',
  detail     : '삭제된 파일은 복구할 수 없습니다.',
  type       : 'warning',
  okLabel    : '삭제',
  cancelLabel: '취소',
});
if (ok) { /* 삭제 실행 */ }
```

| 옵션          | 타입   | 기본값    | 설명                        |
|---------------|--------|-----------|-----------------------------|
| `title`       | string | `''`      | 제목                        |
| `detail`      | string | `''`      | 상세 텍스트                 |
| `type`        | string | `'question'` | 아이콘/색상 결정          |
| `okLabel`     | string | `'확인'`  | 확인 버튼 레이블            |
| `cancelLabel` | string | `'취소'`  | 취소 버튼 레이블            |
| `defaultId`   | number | `0`       | Enter 키 기본 버튼 인덱스   |

반환값: `true` (확인 클릭) / `false` (취소 클릭 또는 Escape)

---

### show — 커스텀 버튼 (확장용)

```javascript
const idx = await MessageBox.show('저장하지 않고 닫으시겠습니까?', {
  title    : '확인',
  type     : 'question',
  buttons  : ['취소', '닫기'],
  defaultId: 0,
});
if (idx === 1) { window.close(); }
```

반환값: 클릭된 버튼의 인덱스 (number)

---

## 타입별 아이콘 / 색상

| type       | 아이콘     | 버튼 색상 (단독) | 버튼 색상 (마지막/action) |
|------------|-----------|-----------------|--------------------------|
| `success`  | 체크       | accent(파란)    | accent                   |
| `error`    | ×          | danger(빨간)    | danger                   |
| `warning`  | 삼각 경고  | accent          | danger                   |
| `info`     | ⓘ          | accent          | accent                   |
| `question` | ?          | accent          | accent                   |

---

## 버튼 스타일 규칙

```
버튼 1개 : error → danger(빨간), 그 외 → primary(파란)
버튼 2개+:
  마지막 버튼(action) : error|warning → danger, 그 외 → primary
  나머지 버튼(cancel) : 중립 스타일
```

---

## 적용 팝업

| 파일                                | 사용 API                            |
|-------------------------------------|-------------------------------------|
| `popups/control-panel/index.js`     | `MessageBox`                        |
| `popups/settings/index.js`          | `MessageToast`, `MessageBox`        |
| `popups/history/index.js`           | `MessageBox`                        |

---

## 확장 가이드

### 새 타입 추가

1. `ui-message.js` > `ICONS` 객체에 SVG 추가
2. `STYLES` 에 `.uim-dialog-icon.type-{NEW}` CSS 규칙 추가
3. (옵션) `_getButtonClass()` 에 색상 규칙 추가

### 토스트 위치 변경

`STYLES` 내 `.uim-toast-container` 의 `bottom`, `left`, `transform` 수정.

### 애니메이션 조정

- 토스트 : `.uim-toast` 의 `transition` 값 조정
- 다이얼로그 등장 : `.uim-dialog` 의 `transition` + `transform` 값 조정
- 다이얼로그 소멸 : `_closeDialog()` 내 `setTimeout` 딜레이 값 조정
