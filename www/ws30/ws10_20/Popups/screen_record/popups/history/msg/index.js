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
 * @file msg/history.js
 * @description history 팝업 메시지
 * TODO: wsUtil.getMsg() 연동 시 하드코딩 값을 교체합니다.
 */

let G_MSG;

module.exports = (() => {
    if (G_MSG) return G_MSG;
    G_MSG = {};

    // ── 리스트 아이템 레이블 ─────────────────────────────────────────────────
    G_MSG.M001 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "735"); // 수정일시
    G_MSG.M002 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "736"); // 파일크기
    G_MSG.M003 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "737"); // 재생시간
    G_MSG.M004 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "738"); // 클릭하여 재생
    G_MSG.M005 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "739"); // 파일 위치 열기
    G_MSG.M006 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "740"); // 삭제

    // ── 다이얼로그 ───────────────────────────────────────────────────────────
    G_MSG.M007 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "741"); // 삭제 불가
    G_MSG.M008 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "742"); // 현재 녹화 중인 파일입니다.
    G_MSG.M009 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "743"); // 녹화를 먼저 중지한 후 삭제해 주세요.
    G_MSG.M010 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "744"); // 파일 삭제
    G_MSG.M011 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "745"); // 을(를) 삭제하시겠습니까?
    G_MSG.M012 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "746"); // 삭제된 파일은 복구할 수 없습니다.
    G_MSG.M013 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "747"); // 파일이 다른 프로그램에서 사용 중입니다. 프로그램을 닫은 후 다시 시도해 주세요.
    G_MSG.M014 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "748"); // 삭제 중 오류가 발생했습니다
    G_MSG.M015 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "749"); // 삭제 실패
    G_MSG.M016 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "750"); // 확인
    G_MSG.M017 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "751"); // 취소

    // ── 파일 감시 ────────────────────────────────────────────────────────────
    G_MSG.M018 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "752"); // 감시 불가
    G_MSG.M019 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "753"); // 감시 오류

    // ── HTML 정적 텍스트 ─────────────────────────────────────────────────────
    G_MSG.M020 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "754"); // 녹화 히스토리
    G_MSG.M021 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "755"); // 폴더 열기
    G_MSG.M022 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "756"); // 새로고침
    G_MSG.M023 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "757"); // 영상
    G_MSG.M024 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "758"); // 개
    G_MSG.M025 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "759"); // 총
    G_MSG.M026 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "760"); // 자동 갱신 중
    G_MSG.M027 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "761"); // 목록 불러오는 중...
    G_MSG.M028 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "762"); // 저장된 영상이 없습니다.
    G_MSG.M029 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "763"); // 닫기

    return G_MSG;
})();
