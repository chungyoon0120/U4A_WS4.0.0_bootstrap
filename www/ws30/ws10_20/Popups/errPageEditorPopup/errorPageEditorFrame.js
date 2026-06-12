/************************************************************************
 * Copyright 2017. INFOCG Inc. all rights reserved. 
 * ----------------------------------------------------------------------
 * - file Name : errorPageEditorFrame.js
 ************************************************************************/

let oAPP = (function(window) {
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

    const 
        SESSKEY = oQueryParams.sessionKey,
        BROWSKEY = oQueryParams.browserkey,
        USERINFO = oQueryParams.USERINFO, 
        LANGU = USERINFO.LANGU,
        SYSID = USERINFO.SYSID;

    var oAPP = {};
        oAPP.msg = {};
        oAPP.attr = {};
        oAPP.fn = {};
        oAPP.events = {};
        oAPP.common = {};

    // 현재 비지 상태 
    oAPP.attr.isBusy = "";

    oAPP.REMOTE = require('@electron/remote');
    oAPP.FS = oAPP.REMOTE.require('fs');
    oAPP.IPCMAIN = oAPP.REMOTE.require('electron').ipcMain;
    oAPP.IPCRENDERER = require('electron').ipcRenderer;
    oAPP.APP = oAPP.REMOTE.app;
    oAPP.PATH = oAPP.REMOTE.require('path');
    oAPP.RANDOM = require("random-key");
    oAPP.CURRWIN = oAPP.REMOTE.getCurrentWindow();
    oAPP.BROWSKEY = BROWSKEY;
    oAPP.USERDATA = oAPP.APP.getPath("userData");  
    oAPP.WSUTIL = WSUTIL;
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

    }; // end of oAPP.fn.getThemeInfo
    
    
    oAPP.fn.getSessionKey = function() {
        return SESSKEY;
    };
    

    /***********************************************************
     * Busy 실행 여부 정보 리턴
     ***********************************************************/
    oAPP.fn.getBusy = function(){

        return oAPP.attr.isBusy;

    };

    /***********************************************************
     * 브라우저 처음 실행 시 보여지는 Busy Indicator
     ***********************************************************/
    oAPP.setBusyLoading = function(bIsShow) {

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

    oAPP.fn.fnSetEditorInfo = function(oEditorInfo) {
        oAPP.attr.oEditorInfo = oEditorInfo;
    };

    oAPP.fn.fnGetEditorInfo = function() {
        return oAPP.attr.oEditorInfo;
    };

    /************************************************************************
     * IPCRENDERER Events..
     ************************************************************************/
    oAPP.IPCRENDERER.on('if-editor-info', function(event, res) {

        oAPP.fn.fnSetEditorInfo(res);

        oAPP.attr.oThemeInfo = res.oThemeInfo;

        var oWs_frame = document.getElementById("ws_editorframe");
        if (!oWs_frame) {
            return;
        }

        oWs_frame.src = "errorPageEditor.html";

    });   

    window.oAPP = oAPP;

    return oAPP;

})(window);