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
 * @file msg/monitor-select.js
 * @description monitor-select 팝업 메시지
 * TODO: wsUtil.getMsg() 연동 시 하드코딩 값을 교체합니다.
 */

let G_MSG;

module.exports = (() => {
    if (G_MSG) return G_MSG;
    G_MSG = {};

    // ── 에러 / 레이블 ────────────────────────────────────────────────────────
    G_MSG.M001 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "766"); // 오류
    G_MSG.M002 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "767"); // 화면
    G_MSG.M003 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "768"); // 주 모니터

    // ── HTML 정적 텍스트 ─────────────────────────────────────────────────────
    G_MSG.M004 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "769"); // 화면 선택
    G_MSG.M005 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "770"); // 녹화할 모니터를 선택하세요
    G_MSG.M006 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "771"); // 화면 정보를 불러오는 중...
    G_MSG.M007 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "772"); // 선택하기
    G_MSG.M008 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "773"); // 취소

    // ── 녹화 불가 안내 ───────────────────────────────────────────────────────
    G_MSG.M009 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "813"); // 녹화가 지원되지 않는 모니터입니다

    return G_MSG;
})();
