# Use Init Pre-screen Event 설정

## 목적

U4A 어플리케이션 실행 시 UI가 구성되기 전에 `HANDLE_ON_INIT`을 호출할 수 있도록 설정하는 기능에 대해 설명한다.

해당 설정을 통해 어플리케이션 초기 실행 단계에서 필요한 사전 처리 로직을 수행할 수 있다.

---

## 주요 단계

### 1. 설정 팝업 호출

- `Use init pre-screen event` 설정을 위해 공통 팝업을 호출한다.
- 팝업 호출은 아래 경로의 공통 팝업 로직을 사용하여 처리한다.

```text
www\ws10_20\design\util\helpViewer.js
```

- 해당 공통 팝업을 통해 설정 대상 정보를 화면에 표시한다.

---

### 2. 라인 정보 전달

- 호출 시 전달받은 `Use init pre-screen event`에 해당하는 라인 정보를 팝업 파라메터로 전달한다.
- 전달된 라인 정보를 기준으로 현재 설정된 값을 팝업에 표현한다.

---

### 3. 설정 값 변경

- 사용자는 팝업에서 `Use init pre-screen event` 설정 값을 변경할 수 있다.
- 설정 값은 UI가 구성되기 전에 `HANDLE_ON_INIT` 호출 여부를 결정하는 데 사용된다.

---

### 4. 확인 버튼 선택 및 후속 처리

- 팝업에서 값을 설정한 뒤 확인 버튼을 선택하면 설정값 반영 처리가 수행된다.
- 확인 버튼 선택 시 아래 function을 호출한다.

```javascript
oAPP.fn.attrChangeProc
```

- 해당 function을 통해 attribute 입력값에 대한 후속 처리를 진행한다.

---

## 추가 정보

- `Use init pre-screen event` 설정은 U4A 어플리케이션 실행 초기 단계의 이벤트 호출 여부를 제어하는 설정이다.
- 해당 설정이 활성화되면 UI가 화면에 구성되기 전에 `HANDLE_ON_INIT`을 호출할 수 있다.
- attribute 값 변경 이후에는 `oAPP.fn.attrChangeProc`을 통해 관련 후속 로직이 일관되게 처리된다.
