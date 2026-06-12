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
 * @file popups/drawing/msg/index.js
 * @description drawing 팝업 메시지 상수
 * TODO: wsUtil.getMsg() 연동 시 하드코딩 값을 교체합니다.
 */

var G_MSG;

module.exports = (function () {
  if (G_MSG) return G_MSG;
  G_MSG = {};

  // ── 도구 버튼 툴팁 ──────────────────────────────────────────────────────
  G_MSG.M001 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "703"); // 펜 (P)
  G_MSG.M002 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "704"); // 직선 (L)
  G_MSG.M003 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "705"); // 사각형 (R)
  G_MSG.M004 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "706"); // 원/타원 (C)
  G_MSG.M005 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "707"); // 지우개 (E)
  G_MSG.M006 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "708"); // 텍스트 박스 (T)

  // ── 슬라이더 ────────────────────────────────────────────────────────────
  G_MSG.M007 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "709"); // 굵기

  // ── 색상 팔레트 툴팁 ────────────────────────────────────────────────────
  G_MSG.M008 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "710"); // 빨강
  G_MSG.M009 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "711"); // 주황
  G_MSG.M010 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "712"); // 노랑
  G_MSG.M011 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "713"); // 초록
  G_MSG.M012 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "714"); // 파랑
  G_MSG.M013 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "715"); // 흰색
  G_MSG.M014 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "716"); // 커스텀 색상

  // ── 투명도 ──────────────────────────────────────────────────────────────
  G_MSG.M015 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "717"); // 투명도
  G_MSG.M016 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "718"); // 투명도 조절

  // ── 액션 버튼 툴팁 ──────────────────────────────────────────────────────
  G_MSG.M017 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "719"); // 실행취소 (Ctrl+Z)
  G_MSG.M018 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "720"); // 전체 지우기
  G_MSG.M019 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "721"); // 드로잉 종료

  return G_MSG;
}());
