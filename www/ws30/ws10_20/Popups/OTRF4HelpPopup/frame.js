/************************************************************************
 * Copyright 2020. INFOCG Inc. all rights reserved. 
 * ----------------------------------------------------------------------
 * - file Name : bindPopup/frame.js
 ************************************************************************/

let oAPP = (function(window) {
    "use strict";

    const 
        REMOTE = oAPP.REMOTE,
        APP = REMOTE.app,
        APPPATH = APP.getAppPath(),
        PATH = REMOTE.require('path'),
        CURRWIN = REMOTE.getCurrentWindow(),
        PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),
        WSUTIL = require(PATHINFO.WSUTIL);

    // 브라우저의 쿼리 스트링 정보
    const oQueryParams = WSUTIL.QueryString.parse(location.href);        

    const 
        USERINFO = oQueryParams.USERINFO,
        LANGU = USERINFO.LANGU,
        SYSID = USERINFO.SYSID,
        WSMSG = new WSUTIL.MessageClassText(SYSID, LANGU);        

    let oAPP = {};
        oAPP.fn = {};
        oAPP.attr = {};
        oAPP.events = {};
        oAPP.common = {};

    oAPP.REMOTE = require('@electron/remote');
    oAPP.IPCRENDERER = require('electron').ipcRenderer;
    oAPP.PATH = oAPP.REMOTE.require('path');
    oAPP.APP = oAPP.REMOTE.app;
    oAPP.FS = oAPP.REMOTE.require('fs');
    oAPP.USERDATA = oAPP.APP.getPath("userData");
    oAPP.IPCMAIN = oAPP.REMOTE.require('electron').ipcMain;

    var PATHINFOURL = PATH.join(APPPATH, "ws30", "resources", "pathInfo.js"),
        PATHINFO = require(PATHINFOURL),
        WSERR = require(PATHINFO.WSTRYCATCH);
            
    var zconsole = WSERR(window, document, console);    

    oAPP.common.fnGetMsgClsText = WSMSG.fnGetMsgClsText.bind(WSMSG);

    
    /*******************************************************
     * 메시지클래스 텍스트 작업 관련 Object -- end
     *******************************************************/

    oAPP.setBusy = function(bIsShow) {

        var oLoadPg = document.getElementById("u4a_main_load");

        if (!oLoadPg) {
            return;
        }

        if (bIsShow == 'X') {
            oLoadPg.classList.remove("u4a_loadersInactive");
        } else {
            oLoadPg.classList.add("u4a_loadersInactive");
        }

    };

    /************************************************************************
     * IPCRENDERER Events..
     ************************************************************************/
    oAPP.IPCRENDERER.on('if_OTRF4HelpPopup', async (events, oInfo) =>  {

        oAPP.attr.oUserInfo = USERINFO; // User 정보(필수)
        // oAPP.attr.oUserInfo = oInfo.oUserInfo; // User 정보(필수)
        oAPP.attr.oThemeInfo = oInfo.oThemeInfo; // User 정보(필수)

        oAPP.attr.T_9011 = oInfo.T_9011;
        oAPP.attr.oAppInfo = oInfo.oAppInfo;
        oAPP.attr.servNm = oInfo.servNm;        

        var oWs_frame = document.getElementById("ws_frame");
        if (!oWs_frame) {
            return;
        }

        oWs_frame.src = "index.html";

    });

    window.oAPP = oAPP;

    return oAPP;

})(window);