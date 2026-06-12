
debugger;

// var로 선언해야 iframe 안에서 parent 접근 가능!!
var
    REMOTE = require('@electron/remote'),
    PATH = REMOTE.require('path'),
    APP = REMOTE.app,
    APPPATH = APP.getAppPath(),
    PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),
    WSUTIL = require(PATHINFO.WSUTIL),
    WSERR = require(PATHINFO.WSTRYCATCH),        
    CURRWIN = REMOTE.getCurrentWindow();
    
    // 브라우저의 쿼리 스트링 정보
    const oQueryParams = WSUTIL.QueryString.parse(location.href);

const
    USERINFO = oQueryParams.USERINFO,
    SESSKEY = oQueryParams.sessionKey,
    BROWSKEY = oQueryParams.browserkey,
    LANGU = USERINFO.LANGU,
    SYSID = USERINFO.SYSID;

var zconsole = WSERR(window, document, console);

var oAPP = {};
    oAPP.attr = {};
    oAPP.fn = {};
    oAPP.events = {};
    oAPP.common = {};

// 현재 비지 상태 
oAPP.attr.isBusy = "";

oAPP.REMOTE = REMOTE;
oAPP.FS = oAPP.REMOTE.require('fs');
oAPP.IPCMAIN = oAPP.REMOTE.require('electron').ipcMain;
oAPP.IPCRENDERER = require('electron').ipcRenderer;
oAPP.APP = oAPP.REMOTE.app;
oAPP.PATH = oAPP.REMOTE.require('path');
oAPP.RANDOM = require("random-key");
oAPP.CURRWIN = oAPP.REMOTE.getCurrentWindow();
oAPP.BROWSKEY = oQueryParams.browserkey;
oAPP.WSUTIL = WSUTIL
oAPP.WSMSG = new oAPP.WSUTIL.MessageClassText(SYSID, LANGU);

oAPP.common.fnGetMsgClsText = oAPP.WSMSG.fnGetMsgClsText.bind(oAPP.WSMSG);

function getEditorInfo() {
    return oAPP.attr.oEditorInfo;
}

function setEditorInfo(oEditorInfo) {
    oAPP.attr.oEditorInfo = oEditorInfo;
}

function getSessionKey() {
    return SESSKEY;
}

function getBrowserKey() {
    return BROWSKEY;
}


/***********************************************************
 * Busy 실행 여부 정보 리턴
 ***********************************************************/
oAPP.fn.getBusy = function(){

    return oAPP.attr.isBusy;

};

function onDeviceReady() {

    // console.log("onDeviceReady");

    var oWs_frame = document.getElementById("ws_editorframe");
    if (!oWs_frame) {
        return;
    }

    oWs_frame.src = "editor.html";

}

oAPP.IPCRENDERER.on('if-editor-info', function (event, res) {

    // console.log("if-editor-info");

    setEditorInfo(res);

    onDeviceReady();

});

document.addEventListener('DOMContentLoaded', function () {

    // console.log("DOMContentLoaded");

});