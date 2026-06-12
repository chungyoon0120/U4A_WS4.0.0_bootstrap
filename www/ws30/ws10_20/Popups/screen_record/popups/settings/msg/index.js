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
 * @file msg/settings.js
 * @description settings 팝업 메시지
 * TODO: wsUtil.getMsg() 연동 시 하드코딩 값을 교체합니다.
 */

let G_MSG;

module.exports = (() => {
    if (G_MSG) return G_MSG;
    G_MSG = {};

    // ── 다이얼로그 / 토스트 ──────────────────────────────────────────────────
    G_MSG.M001 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "774"); // 녹화 중에는 품질을 변경할 수 없습니다.
    G_MSG.M002 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "775"); // 기본값으로 초기화
    G_MSG.M003 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "776"); // 모든 설정을 기본값으로 되돌리겠습니까?
    G_MSG.M004 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "777"); // 초기화
    G_MSG.M005 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "778"); // 설정이 저장되었습니다
    G_MSG.M006 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "779"); // 기본값으로 초기화되었습니다
    G_MSG.M007 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "780"); // 취소
    G_MSG.M008 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "781"); // 저장
    G_MSG.M009 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "782"); // 닫기

    // ── HTML 정적 텍스트 ─────────────────────────────────────────────────────
    G_MSG.M010 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "783"); // 설정
    G_MSG.M011 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "784"); // 테마 변경
    G_MSG.M012 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "785"); // 비디오 품질
    G_MSG.M013 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "786"); // 프레임레이트
    G_MSG.M014 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "787"); // 저용량
    G_MSG.M015 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "788"); // 영화 품질
    G_MSG.M016 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "789"); // 기본값
    G_MSG.M017 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "790"); // 고품질
    G_MSG.M018 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "791"); // 비트레이트
    G_MSG.M019 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "792"); // 저화질
    G_MSG.M020 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "793"); // 기본값
    G_MSG.M021 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "794"); // 고화질
    G_MSG.M022 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "795"); // 최고화질
    G_MSG.M023 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "796"); // 다음 녹화 시작 시 적용됩니다.
    G_MSG.M024 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "797"); // 비디오 포맷
    G_MSG.M025 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "798"); // 기본값
    G_MSG.M026 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "799"); // 최고 압축
    G_MSG.M027 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "800"); // 구형 호환
    G_MSG.M028 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "801"); // 안정적
    G_MSG.M029 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "802"); // 편집
    G_MSG.M030 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "803"); // 친화적
    G_MSG.M031 = WSUTIL.getWsMsgClsTxt(LANGU, "ZMSG_WS_COMMON_001", "804"); // H.264 미지원 시 VP9 자동 전환.

    return G_MSG;
})();
