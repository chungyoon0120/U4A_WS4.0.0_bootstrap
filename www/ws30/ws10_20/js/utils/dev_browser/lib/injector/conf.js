/* 
*📦----------------------------------------------------------------------*
* Module       : conf.js
* Creator      : SOCCERHS
* Created On   : 2026-04-01
* Description  : 개발 브라우저 관련 Config 설정 정보 리소스 주입
*----------------------------------------------------------------------*
*/

module.exports = async function () {
    "use strict";

    /****************************************************************************
     * 🌐 Global Variables
     ****************************************************************************/

    // 네임스페이스 초기화
    window.u4adevb = window.u4adevb || {};

    // 환경 변수 설정 (기존 값 유지 + 신규 값 병합)
    window.u4adevb.conf = {
        ...(window.u4adevb.conf || {}),

        userAgent: "U4A_WS_DEV_BROWSER",
        // 필요한 경우 여기에 추가 설정

        // extension 관련 설정 변수
        extension: {
            U4A_WS_VIEW_NAME: "U4A_WS",
            EXTENSION_CONTENT_ID: "u4a-dev-browser-extension-content",
            EXTENSION_WEB_ID: "u4a-dev-browser-extension-app"
        },

    };

};