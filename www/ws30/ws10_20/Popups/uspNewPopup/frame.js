/************************************************************************
 * Copyright 2020. INFOCG Inc. all rights reserved. 
 * ----------------------------------------------------------------------
 * - file Name : findPopup/frame.js
 ************************************************************************/
let oAPP = (function(window) {
    "use strict";

    const
        REMOTE = require('@electron/remote'),
        PATH = REMOTE.require('path'),
        CURRWIN = REMOTE.getCurrentWindow(),        
        APP = REMOTE.app,
        APPPATH = APP.getAppPath(),
        PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),
        WSUTIL = require(PATHINFO.WSUTIL);

    let oAPP = {};
        oAPP.fn = {};
        oAPP.attr = {};
        oAPP.events = {};
        oAPP.common = {};

    // 브라우저의 쿼리 스트링 정보
    const oQueryParams = WSUTIL.QueryString.parse(location.href);

    oAPP.REMOTE = require('@electron/remote');
    oAPP.IPCMAIN = oAPP.REMOTE.require('electron').ipcMain;
    oAPP.IPCRENDERER = require('electron').ipcRenderer;
    oAPP.PATH = oAPP.REMOTE.require('path');
    oAPP.APP = oAPP.REMOTE.app;
    oAPP.CURRWIN = oAPP.REMOTE.getCurrentWindow();
    oAPP.BROWSKEY = oQueryParams.browserkey;

    const 
        USERINFO = oQueryParams.USERINFO,
        LANGU = USERINFO.LANGU,
        SYSID = USERINFO.SYSID;

    const WSMSG = new WSUTIL.MessageClassText(SYSID, LANGU);

    oAPP.common.fnGetMsgClsText = WSMSG.fnGetMsgClsText.bind(WSMSG);

    // /*******************************************************
    //  * 메시지클래스 텍스트 작업 관련 Object -- end
    //  *******************************************************/

    // oAPP.setBusy = function(bIsShow) {

    //     var oLoadPg = document.getElementById("u4a_main_load");

    //     if (!oLoadPg) {
    //         return;
    //     }

    //     if (bIsShow == 'X') {
    //         oLoadPg.classList.remove("u4a_loadersInactive");
    //     } else {
    //         oLoadPg.classList.add("u4a_loadersInactive");
    //     }

    // };

    // oAPP.setBusyIndicator = function(bIsBusy) {

    //     var oBusy = document.getElementById("u4aWsBusyIndicator");

    //     if (!oBusy) {
    //         return;
    //     }

    //     if (bIsBusy) {
    //         oBusy.style.visibility = "visible";
    //     } else {
    //         oBusy.style.visibility = "hidden";
    //     }

    // }

    /************************************************************************
     * IPCRENDERER Events..
     ************************************************************************/
    oAPP.IPCRENDERER.on('if-uspnew', (events, oInfo) => {

        oAPP.attr.APPINFO = oInfo.APPINFO;
        oAPP.attr.BROWSKEY = oInfo.BROWSKEY;
        oAPP.attr.oThemeInfo = oInfo.oThemeInfo;
        oAPP.attr.CHANNELID = oInfo.CHANNELID;
        oAPP.attr.oUserInfo = oInfo.oUserInfo;
        oAPP.attr.TREEDATA = oInfo.TREEDATA;
        
        var oWs_frame = document.getElementById("ws_frame");
        if (!oWs_frame) {
            return;
        }

        oWs_frame.src = "index.html";

    });

    // oAPP.fn.fnIpcMainFindSuccess = () => {

    //     oAPP.setBusyIndicator('');

    // };

    // oAPP.IPCMAIN.on(`${oAPP.BROWSKEY}--find--success`, oAPP.fn.fnIpcMainFindSuccess);

    // window.addEventListener("beforeunload", () => {

    //     oAPP.IPCMAIN.off(`${oAPP.BROWSKEY}--find--success`, oAPP.fn.fnIpcMainFindSuccess);

    // });

    window.oAPP = oAPP;

    return oAPP;

})(window);