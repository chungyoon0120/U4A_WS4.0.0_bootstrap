'use strict';

const
    REMOTE = require('@electron/remote'),
    APP = REMOTE.app,
    PATH = require('path'),
    APPPATH = APP.getAppPath(),
    PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),
    WSUTIL = require(PATHINFO.WSUTIL);

    // 브라우저의 쿼리 스트링 정보
    const oQueryParams = WSUTIL.QueryString.parse(location.href);
    const BROWSKEY = oQueryParams.browserkey;
    const USERINFO = oQueryParams?.USERINFO || undefined;
    const SYSID = USERINFO?.SYSID || "";
    const LANGU = USERINFO?.LANGU  || "EN";

/**
 * @file control-panel/msg/index.js
 * @description control-panel 팝업 메시지
 * TODO: wsUtil.getMsg() 연동 시 하드코딩 값을 교체합니다.
 */

let G_MSG;

module.exports = (() => {
    if (G_MSG) return G_MSG;
    G_MSG = {};

    // ── 상태 레이블 ──────────────────────────────────────────────────────────
    G_MSG.M001 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "656"); // 대기 중
    G_MSG.M002 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "657"); // REC
    G_MSG.M003 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "658"); // PAUSED
    G_MSG.M004 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "659"); // 저장 중...
    G_MSG.M005 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "660"); // 녹화 시작
    G_MSG.M006 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "661"); // 녹화 중지

    // ── 버튼 툴팁 ────────────────────────────────────────────────────────────
    G_MSG.M007 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "662"); // 재개
    G_MSG.M008 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "663"); // 일시정지
    G_MSG.M009 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "664"); // 녹화 히스토리
    G_MSG.M010 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "665"); // 녹화 중에는 사용할 수 없습니다
    G_MSG.M011 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "666"); // 최근 파일 재생
    G_MSG.M012 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "667"); // 설정
    G_MSG.M013 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "668"); // 녹화 중에는 설정을 변경할 수 없습니다
    G_MSG.M014 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "669"); // 화면 드로잉
    G_MSG.M015 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "670"); // 녹화 시작 후 사용 가능
    G_MSG.M036 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "671"); // 드로잉 종료

    // ── 마이크 ───────────────────────────────────────────────────────────────
    G_MSG.M016 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "672"); // 마이크 없음
    G_MSG.M017 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "673"); // 마이크 장치가 연결되지 않았습니다
    G_MSG.M018 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "674"); // 마이크 ON
    G_MSG.M019 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "675"); // 마이크 끄기
    G_MSG.M020 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "676"); // 마이크 OFF
    G_MSG.M021 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "677"); // 마이크 켜기
    G_MSG.M022 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "678"); // 마이크 연결됨
    G_MSG.M023 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "679"); // 권한 요청 중...

    // ── 다이얼로그 ───────────────────────────────────────────────────────────
    G_MSG.M024 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "680"); // 녹화 파일 삭제됨
    G_MSG.M025 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "681"); // 녹화 중인 파일이 삭제되었습니다.
    G_MSG.M026 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "682"); // 녹화가 자동으로 중지되었습니다. 다시 녹화하려면 녹화 시작 버튼을 누르세요.
    G_MSG.M027 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "683"); // 확인
    G_MSG.M028 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "684"); // 오류
    G_MSG.M029 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "685"); // 화면 소스 ID가 없습니다.
    G_MSG.M030 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "686"); // 녹화 시작 실패
    G_MSG.M031 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "687"); // 저장 실패
    G_MSG.M032 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "688"); // 폴더 열기 실패
    G_MSG.M033 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "689"); // 저장 폴더가 없습니다.
    G_MSG.M034 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "690"); // 저장된 파일이 없습니다.
    G_MSG.M035 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "691"); // 파일 열기 실패
    G_MSG.M037 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "692"); // 마이크 오류
    G_MSG.M038 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "693"); // 마이크를 사용할 수 없습니다.
    G_MSG.M039 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "694"); // 마이크 권한을 허용하거나 마이크가 연결되어 있는지 확인하세요.
    G_MSG.M040 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "695"); // 녹화 종료
    G_MSG.M041 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "696"); // 녹화 중입니다. 중지하고 닫으시겠습니까?
    G_MSG.M042 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "697"); // 저장 없이 종료됩니다.
    G_MSG.M043 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "698"); // 취소
    G_MSG.M044 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "699"); // 닫기

    // ── HTML 정적 텍스트 ─────────────────────────────────────────────────────
    G_MSG.M045 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "700"); // 녹화 컨트롤
    G_MSG.M046 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "701"); // 저장 폴더 열기
    G_MSG.M047 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "702"); // 파일 저장 중...

    return G_MSG;
})();
