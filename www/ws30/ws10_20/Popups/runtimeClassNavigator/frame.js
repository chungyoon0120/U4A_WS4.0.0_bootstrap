/************************************************************************
 * Copyright 2020. INFOCG Inc. all rights reserved. 
 * ----------------------------------------------------------------------
 * - file Name : runtimeClassNavigator/frame.js
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
        USERINFO = oQueryParams.USERINFO,        
        LANGU = USERINFO.LANGU,
        SYSID = USERINFO.SYSID;

    let oAPP = {};
        oAPP.fn = {};
        oAPP.ui = {};
        oAPP.attr = {};
        oAPP.events = {};
        oAPP.common = {};
        oAPP.attr.aRuntime = [];

    // 현재 비지 상태 
    oAPP.attr.isBusy = false;

    oAPP.REMOTE = REMOTE;
    oAPP.IPCMAIN = oAPP.REMOTE.require('electron').ipcMain;
    oAPP.IPCRENDERER = require('electron').ipcRenderer;
    oAPP.PATH = oAPP.REMOTE.require('path');
    oAPP.APP = oAPP.REMOTE.app;
    oAPP.FS = oAPP.REMOTE.require('fs');
    oAPP.CURRWIN = oAPP.REMOTE.getCurrentWindow();
    oAPP.BROWSKEY = oQueryParams.browserkey;
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

    } // end of oAPP.fn.getThemeInfo  
      

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

    /************************************************************************
     * IPCRENDERER Events..
     ************************************************************************/
    oAPP.IPCRENDERER.on('if-runtime-info', (events, oInfo) => {

        oAPP.attr.oUserInfo = oInfo.oUserInfo; // 접속 로그인 정보
        oAPP.attr.oThemeInfo = oInfo.oThemeInfo; // 테마 개인화 정보
        oAPP.attr.oMetadata = oInfo.oMetadata; // Sap 접속 System Meta 정보

        let aRuntimeData = oInfo.aRuntimeData;

        // 전달받은 Runtime 데이터가 Array 형식이 아니면 리턴.
        if (Array.isArray(aRuntimeData) == false) {
            return;
        }

        var sPrefixClassNm = "ZCL_U4A_";

        // 신규 NAMESPACE 대상인 경우.
        if (oAPP.attr.oMetadata && oAPP.attr.oMetadata.IS_NAME_SPACE == "X") {
            sPrefixClassNm = "/U4A/CL_";
        }

        var iRuntimeCnt = aRuntimeData.length,
            aRuntime = [];

        // Runtime Class 정보 구성
        for (var i = 0; i < iRuntimeCnt; i++) {

            // Object Type이 "1" 인것만 수집
            var oRuntime = aRuntimeData[i];
            if (oRuntime.OBJTY != "1") {
                continue;
            }

            aRuntime.push({
                UIOBJ: oRuntime.UIOBJ, // UI 명
                LIBNM: oRuntime.LIBNM, // UI5 Library 명
                CLASS: sPrefixClassNm + oRuntime.UIOBK
            });

        }

        // Runtime Class 정보 Global 변수에 저장
        oAPP.attr.aRuntime = aRuntime;

        var oWs_frame = document.getElementById("ws_frame");
        if (!oWs_frame) {
            return;
        }

        oWs_frame.src = "index.html";

    });

    window.oAPP = oAPP;

    return oAPP;

})(window);