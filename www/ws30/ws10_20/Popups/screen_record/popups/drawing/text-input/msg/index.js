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
 * @file popups/drawing/text-input/msg/index.js
 * @description drawing/text-input 팝업 (Rich Text 메모) 메시지 상수
 * TODO: wsUtil.getMsg() 연동 시 하드코딩 값을 교체합니다.
 */

var G_MSG;

module.exports = (function () {
  if (G_MSG) return G_MSG;
  G_MSG = {};

  // ── 헤더 ─────────────────────────────────────────────────────────────────
  G_MSG.M001 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "722"); // 메모

  // ── 에디터 플레이스홀더 ──────────────────────────────────────────────────
  G_MSG.M002 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "723"); // 메모를 입력하세요

  // ── 툴바 tooltip ─────────────────────────────────────────────────────────
  G_MSG.M003 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "724"); // 폰트
  G_MSG.M004 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "725"); // 글자 크기
  G_MSG.M005 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "726"); // 굵게 (Ctrl+B)
  G_MSG.M006 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "727"); // 기울기 (Ctrl+I)
  G_MSG.M007 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "728"); // 취소선
  G_MSG.M008 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "729"); // 글자 색상

  // ── 컬러 패널 ────────────────────────────────────────────────────────────
  G_MSG.M009 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "730"); // 확인
  G_MSG.M010 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "731"); // 닫기
  G_MSG.M011 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "732"); // 프리셋 색상
  G_MSG.M012 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "733"); // 커스텀
  G_MSG.M013 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "734"); // 선택

  return G_MSG;
}());
