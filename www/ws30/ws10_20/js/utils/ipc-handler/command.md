# Command

1. activate
  - active 할 시점에 호출됨

2. naviTo
  -  화면 전환 시 호출됨

3. appModeChange
  - 앱 모드 변경시 호출됨
  - EDIT <---> DISPLAY

4. logoff
- 로그 오프시 호출됨

5. execControllerClass
- 컨트롤러 클래스 관련 
- 파라미터에 'status' 정보 참고
  예) status: 'finish' 실행 종료

6. WS_MAIN_UI_UPDATED
- WS 처음 실행 또는 새창 실행 시 메인(WS10) 페이지 랜더링 완료 시점에 호출됨.