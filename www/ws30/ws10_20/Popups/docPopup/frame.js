/************************************************************************
 * Copyright 2020. INFOCG Inc. all rights reserved. 
 * ----------------------------------------------------------------------
 * - file Name : doc/frame.js
 ************************************************************************/

let oAPP = (function (window) {
    "use strict";

    const
        REMOTE = require('@electron/remote'),
        PATH = REMOTE.require('path'),
        APP = REMOTE.app,
        APPPATH = APP.getAppPath(),
        PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),
        WSUTIL = require(PATHINFO.WSUTIL),
        CURRWIN = REMOTE.getCurrentWindow();

        
    // 브라우저의 쿼리 스트링 정보
    const oQueryParams = WSUTIL.QueryString.parse(location.href);

    const SESSKEY = oQueryParams.sessionKey;

    const 
        USERINFO = oQueryParams.USERINFO,        
        LANGU = USERINFO.LANGU,
        SYSID = USERINFO.SYSID;

    let oAPP = {};
        oAPP.fn = {};
        oAPP.attr = {};
        oAPP.events = {};
        oAPP.common = {};

    // 현재 비지 상태 
    oAPP.attr.isBusy = false;

    oAPP.REMOTE = REMOTE;    
    oAPP.IPCRENDERER = require('electron').ipcRenderer;
    oAPP.IPCMAIN = oAPP.REMOTE.require('electron').ipcMain;
    oAPP.PATH = oAPP.REMOTE.require('path');
    oAPP.APP = oAPP.REMOTE.app;
    oAPP.FS = oAPP.REMOTE.require('fs');
    oAPP.CURRWIN = oAPP.REMOTE.getCurrentWindow();
    oAPP.BROWSKEY = oQueryParams.browserkey;
    oAPP.USERDATA = oAPP.APP.getPath("userData");

    oAPP.WSUTIL = WSUTIL,
    oAPP.WSMSG = new oAPP.WSUTIL.MessageClassText(SYSID, LANGU);

    oAPP.common.fnGetMsgClsText = oAPP.WSMSG.fnGetMsgClsText.bind(oAPP.WSMSG);



    /*************************************************************
     * @function - 테마 정보를 구한다.
     *************************************************************/
    oAPP.fn.getThemeInfo = function (){

        let oUserInfo = parent.process.USERINFO;
        let sSysID = oUserInfo.SYSID;
        
        // 해당 SYSID별 테마 정보 JSON을 읽는다.
        let sThemeJsonPath = oAPP.PATH.join(oAPP.USERDATA, "p13n", "theme", `${sSysID}.json`);
        if(oAPP.FS.existsSync(sThemeJsonPath) === false){
            return;
        }

        let sThemeJson = oAPP.FS.readFileSync(sThemeJsonPath, "utf-8");

        try {
        
            var oThemeJsonData = JSON.parse(sThemeJson);    

        } catch (error) {
            return;
        }

        return oThemeJsonData;

    } // end of oAPP.fn.getThemeInfo
    
    

    /***********************************************************
     * 브라우저 처음 실행 시 보여지는 Busy Indicator
     ***********************************************************/
    oAPP.setBusyLoading = function (bIsShow) {

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


    /***********************************************************
     * 세션키 구하기
     ***********************************************************/
    oAPP.fn.getSessionKey = function () {
        return SESSKEY;
    };

    /***********************************************************
     * Busy 실행 여부 정보 리턴
     ***********************************************************/
    oAPP.fn.getBusy = function(){
        return oAPP.attr.isBusy;
    };



    /************************************************************************
     * IPCRENDERER Events..
     ************************************************************************/
    oAPP.IPCRENDERER.on('if-appdocu-info', (events, oInfo) => {

        oAPP.attr.oUserInfo = oInfo.USERINFO;
        oAPP.attr.oThemeInfo = oInfo.oThemeInfo;
        oAPP.attr.oAppInfo = oInfo.APPINFO;
        oAPP.attr.sServerPath = oInfo.SERVPATH;

        var oWs_frame = document.getElementById("ws_frame");
        if (!oWs_frame) {
            return;
        }

        oWs_frame.src = "doc.html";

    });

    window.oAPP = oAPP;

    return oAPP;

})(window);