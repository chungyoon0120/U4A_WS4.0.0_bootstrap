module.exports = () => {

    const WSUTIL = parent.WSUTIL;
    const USERINFO = parent.getUserInfo();
    const LANGU = USERINFO.LANGU;
	
	//WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "345");
	
    const G_MSG = {};

    G_MSG.M001 = "새 탭이 감지되었습니다.";
    G_MSG.M002 = "개발 모드 브라우저 실행 중, 오류가 발생하였습니다!";
    G_MSG.M003 = "다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 바랍니다.";
    G_MSG.M004 = "현재 Workspace에 다른 프로세스가 실행 중입니다.";
    G_MSG.M005 = "어플리케이션 개발화면(WS20) 페이지에서만 동작하는 기능 입니다.";
    G_MSG.M006 = "선택한 UI는 현재 어플리케이션 영역이 아닙니다.";
    G_MSG.M007 = "어플리케이션 정보가 누락되었습니다.";
    G_MSG.M008 = "Display 모드에서는 디자인 트리 선택 동작이 되지 않습니다.";
    G_MSG.M009 = "선택한 UI의 상세정보를 가져오는 중입니다.";
    G_MSG.M010 = "잠시만 기다려주세요";
    G_MSG.M011 = "개발 모드 브라우저에서는 URL을 변경할 수 없습니다.";
    G_MSG.M012 = "개발 모드 브라우저는 새 탭을 지원하지 않습니다.";
    G_MSG.M013 = "사이드 패널 열기 시도 중, 오류가 발생하였습니다.";
    G_MSG.M014 = "";
    G_MSG.M015 = "";
    G_MSG.M016 = "";
    G_MSG.M017 = "";
    G_MSG.M018 = "";
    G_MSG.M019 = "";
    G_MSG.M020 = "";

    return G_MSG;
    
}