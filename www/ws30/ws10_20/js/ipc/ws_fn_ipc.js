/**************************************************************************
 * ws_fn_ipc.js
 **************************************************************************/

(function (window, $, oAPP) {
    "use strict";

    const IPCRENDERER = parent.IPCRENDERER;
    const APPCOMMON = oAPP.common;
    const IPC_HANDLER = parent.IPC_HANDLER;



    /************************************************************************
     * Electron IPCMAIN의 세션 타임 체크 관련 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_if_session_time = function (event, res) {

        let iSessionTime = oAPP.attr.iSessionTimeout; // 세션 타임아웃 시간        

        let sSessionKey = parent.getSessionKey();
        if (sSessionKey != res) {
            return;
        }

        zconsole.log("시작!! -> " + Math.floor(+new Date() / 1000));

        if (oAPP.attr._oWorker) {

            oAPP.attr._oWorker.postMessage(iSessionTime);

        }

    }; // end of oAPP.fn.fnIpcMain_if_session_time

    /************************************************************************
     *  Electron IPCMAIN의 Exam 팝업에서 샘플 리스트의 WorkBench Move 버튼 실행 시 수행 되는 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_if_exam_move = function (event, res) {

        zconsole.log("fnIpcMain_if_exam_move");

        let oMsg = res,
            MODE = oMsg.MODE,
            sAppID = oMsg.APPID,
            BROWSERKEY = parent.getBrowserKey();

        // 다른 브라우저에서 실행한 이벤트면 리턴 시킨다.
        if (res.BROWSERKEY != BROWSERKEY) {
            return;
        }

        switch (MODE) {
            case "A": // 브라우저 띄우기

                oAPP.fn.fnOnExecApp(sAppID);

                break;

            case "B": // WS 디자인 영역으로 이동

                // onAppCrAndChgMode(sAppID);

                // 샘플에 대한 WS20 페이지 이동
                oAPP.fn.fnExamMoveToPageWs20(sAppID);

                break;
        }

    }; // end of oAPP.fn.fnIpcMain_if_exam_move

    /************************************************************************
     * Error Page Popup의 Table Click Event
     ************************************************************************/
    oAPP.fn.fnIpcMain_errmsg_click = (event, res) => {

        let oRowData = res.oRowData;

        switch (oRowData.GRCOD) {

            case "CLS_SNTX":
            case "METH":
            case "CLSD":
            case "CPRO":
            case "CPUB":

            // 2024-07-29 v3.4.2-sp2 
            // 오류 항목 유형 추가
            case "CPRI":

                oAPP.common.execControllerClass(oRowData.OBJID, oRowData.LINE);
                return;

            default:

                oAPP.fn.setSelectTreeItem(oRowData.OBJID, oRowData.UIATK, oRowData.TYPE);
                return;

        }

    }; // end of oAPP.fn.fnIpcMain_errmsg_click

    /************************************************************************
     * Application Import 성공시 타는 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_export_import_IMPORT = (event, res) => {

        debugger;

        // 페이지 이동 처리..
        onAppCrAndChgMode(res.APPID);

        // 푸터 메시지
        oAPP.common.fnShowFloatingFooterMsg("S", "WS20", res.RTMSG);

    }; // end of oAPP.fn.fnIpcMain_export_import_IMPORT

    /************************************************************************
     * Application Export 성공시 타는 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_export_import_EXPORT = (event, res) => {

        // oAPP.ipcRenderer.send(`${oAPP.BROWSKEY}--export_import-EXPORT`, { RETCD: "S", RTMSG: Lmsg });

        let sCurrPage = parent.getCurrPage();

        // 푸터 메시지
        oAPP.common.fnShowFloatingFooterMsg(res.RETCD, sCurrPage, res.RTMSG);

    }; // end of oAPP.fn.fnIpcMain_export_import_EXPORT

    /************************************************************************
     * IPC MAIN Attach Event
     ************************************************************************/
    oAPP.fn.fnIpcMain_Attach_Event_Handler = () => {

        oAPP.attr.aSessionKeys = [];

        // 브라우저 고유 키
        let BROWSKEY = parent.getBrowserKey();

        // 서버 접속 정보
        let oServerInfo = parent.getServerInfo();

        // EXAM MOVE 이벤트
        parent.IPCMAIN.on("if-exam-move", oAPP.fn.fnIpcMain_if_exam_move);

        // 여러창일때 나를 제외한 윈도우를 닫고 싶을때 
        parent.IPCMAIN.on('if-browser-close', oAPP.fn.fnIpcMain_if_browser_close);

        // 전체 브라우저에 공통으로 타는 DragEnd 이벤트
        parent.IPCMAIN.on('if-dragEnd', oAPP.fn.fnIpcMain_if_DragEnd);

        // // 여러창일때 나를 제외한 윈도우를 닫고 싶을때 
        // parent.IPCMAIN.on('if-browser-close', oAPP.fn.fnIpcMain_if_browser_close);

        // 브라우저간 IPC 통신
        parent.IPCMAIN.on('if-browser-interconnection', oAPP.fn.fnIpcMain_browser_interconnection);

        // 부모로 부터 접속 환경 정보 구하기
        parent.IPCMAIN.on(`if-get-sys-info-${BROWSKEY}`, oAPP.fn.fnIpcMain_if_get_sys_info);

        // 액션별 명령어 수행
        parent.IPCMAIN.on(`if-send-action-${BROWSKEY}`, oAPP.fn.fnIpcMain_if_send_action);

        // 접속 서버의 SYSID
        let sSysID = oServerInfo.SYSID;

        // SYSID에 해당하는 테마 변경 IPC 이벤트를 등록한다.
        parent.IPCMAIN.on(`if-p13n-themeChange-${sSysID}`, oAPP.fn.fnIpcMain_if_p13n_themeChange);

        // dev browser 관련 IPC 이벤트를 등록한다.
        // parent.IPCMAIN.on(`if-dev-browser`, oAPP.fn.fnIpcMain_if_dev_browser);
        IPC_HANDLER.on(`if-dev-browser`, oAPP.fn.fnIpcMain_if_dev_browser);



        // parent.IPCMAIN.on("if-ws20-get", function(oEvent, oRes){

        //     console.log(`IPCMAIN.on("if-ws20-get")`);

        //     debugger;

        //     // oEvent.sender.send('if-ws20-set', oRes);

        //     parent.IPCRENDERER.send('if-ws20-set', oRes);


        // });

        // parent.IPCRENDERER.on("if-ws20-get", function(oEvent, oRes){

        //     console.log(`zz`);

        //     debugger;

        //     // 1안
        //     oEvent.sender.send('yoon', oRes);

        // });


    }; // end of oAPP.fn.fnIpcMain_Attach_Event_Handler

    /************************************************************************
     * IPC MAIN Detach Event
     ************************************************************************/
    oAPP.fn.fnIpcMain_Detach_Event_Handler = () => {

        // 브라우저 고유 키
        let BROWSKEY = parent.getBrowserKey();

        // 서버 접속 정보
        let oServerInfo = parent.getServerInfo();

        // 화면 잠겼을때 세션타임 아웃 이벤트 해제
        parent.IPCMAIN.off('if-session-time', oAPP.fn.fnIpcMain_if_session_time);

        // EXAM MOVE 이벤트 해제
        parent.IPCMAIN.off('if-exam-move', oAPP.fn.fnIpcMain_if_exam_move);

        // DragEnd 이벤트 해제
        parent.IPCMAIN.off('if-dragEnd', oAPP.fn.fnIpcMain_if_DragEnd);

        // 여러창일때 나를 제외한 윈도우를 닫고 싶을때 이벤트 해제 
        parent.IPCMAIN.off('if-browser-close', oAPP.fn.fnIpcMain_if_browser_close);

        // 브라우저간 IPC 통신
        parent.IPCMAIN.off('if-browser-interconnection', oAPP.fn.fnIpcMain_browser_interconnection);

        // 부모로 부터 접속 환경 정보 구하기
        parent.IPCMAIN.off(`if-get-sys-info-${BROWSKEY}`, oAPP.fn.fnIpcMain_if_get_sys_info);

        // 부모 자식간 액션별 명령어 수행
        parent.IPCMAIN.off(`if-send-action-${BROWSKEY}`, oAPP.fn.fnIpcMain_if_send_action);

        // 접속 서버의 SYSID
        let sSysID = oServerInfo.SYSID;

        // SYSID에 해당하는 테마 변경 IPC 이벤트를 해제한다.
        parent.IPCMAIN.off(`if-p13n-themeChange-${sSysID}`, oAPP.fn.fnIpcMain_if_p13n_themeChange);

        // dev browser 관련 IPC 이벤트를 해제한다.
        // parent.IPCMAIN.off(`if-dev-browser`, oAPP.fn.fnIpcMain_if_dev_browser);

        IPC_HANDLER.off(`if-dev-browser`, oAPP.fn.fnIpcMain_if_dev_browser);

    };

    /************************************************************************
     * 전체 브라우저에 공통으로 타는 DragEnd 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_if_DragEnd = (event, res) => {

        zconsole.log("Fire!! oAPP.fn.fnIpcMain_if_DragEnd");

        oAPP.main.onDragend();

    }; // end of oAPP.fn.fnIpcMain_if_DragEnd

    oAPP.fn.fnIpcMain_if_browser_close = (event, res) => {

        var oCurrWin = parent.CURRWIN,
            sType = res.ACTCD,
            sCurrSessionKey = parent.getSessionKey(),
            sCurrBrowsKey = parent.getBrowserKey();

        if (res.SESSKEY !== sCurrSessionKey) {
            return;
        }

        switch (sType) {

            case "A": // 같은 세션 키를 가진 브라우저 중 나를 제외한 나머지 창을 전부 닫기

                if (sCurrBrowsKey == res.BROWSKEY) {
                    return;
                }

                // onBeforeunload event 해제
                oAPP.main.fnDetachBeforeunloadEvent();

                // 현재 브라우저에 걸려있는 shortcut, IPCMAIN 이벤트 등 각종 이벤트 핸들러를 제거 하고, 
                // 현재 브라우저의 화면이 20번 페이지일 경우는 서버 세션 죽이고 Lock도 해제한다.
                oAPP.main.fnBeforeunload();

                break;


            case "B": // 같은 세션 키를 가진 브라우저 중, 전달받은 키가 나와 같으면 나만 죽인다.

                if (sCurrBrowsKey !== res.BROWSKEY) {
                    return;
                }

                // onBeforeunload event 해제
                oAPP.main.fnDetachBeforeunloadEvent();

                // 현재 브라우저에 걸려있는 shortcut, IPCMAIN 이벤트 등 각종 이벤트 핸들러를 제거 하고, 
                // 현재 브라우저의 화면이 20번 페이지일 경우는 서버 세션 죽이고 Lock도 해제한다.
                oAPP.main.fnBeforeunload();

                oCurrWin.close();

                break;

            case "C": // 같은 세션을 가진 브라우저 중 로그오프가 된 브라우저의 키를 수집한다.

                var aSameBrowsers = oAPP.fn.fnGetSameBrowsersAll(), // #[ws_fn_02.js]
                    iSameBrowserLength = aSameBrowsers.length;

                oAPP.attr.aSessionKeys.push(res.BROWSKEY);

                var iSessionKeyLength = oAPP.attr.aSessionKeys.length;

                zconsole.log(`같은 브라우저 총 갯수 : ${iSameBrowserLength} `);
                zconsole.log(`수집된 키 총 갯수 : ${iSessionKeyLength} `);

                if (iSameBrowserLength != iSessionKeyLength) {
                    return;
                }

                zconsole.log("전체 키 수집!!!");

                // 현재 떠있는 브라우저 갯수와 수집된 브라우저 키의 갯수가 동일 하다면..
                if (iSessionKeyLength == 1) {

                    fn_logoff_success("X");

                    return;

                }

                var aSortKeys = oAPP.attr.aSessionKeys.sort(),
                    sChoiceKey = aSortKeys[0];

                parent.IPCRENDERER.send('if-browser-close', {
                    ACTCD: "A", // 나를 제외한 나머지는 다 죽인다.
                    SESSKEY: parent.getSessionKey(),
                    BROWSKEY: sChoiceKey
                });

                // beforeUnload 이벤트 해제
                oAPP.main.fnDetachBeforeunloadEvent();

                // 현재 브라우저에 걸려있는 shortcut, IPCMAIN 이벤트 등 각종 이벤트 핸들러를 제거 하고, 
                // 현재 브라우저의 화면이 20번 페이지일 경우는 서버 세션 죽이고 Lock도 해제한다.
                oAPP.main.fnBeforeunload();

                // 브라우저에 내장된 세션 정보를 클리어 한다.
                oAPP.fn.fnClearSessionStorageData(); // #[ws_fn_04.js]

                // 현재 세션에서 파생된 Childwindow를 닫는다.
                oAPP.fn.fnChildWindowAllClose();
                // oAPP.fn.fnChildWindowClose();

                if (oAPP.attr._oWorker && oAPP.attr._oWorker.terminate) {
                    oAPP.attr._oWorker.terminate();
                    delete oAPP.attr._oWorker;
                }

                if (oAPP.attr._oServerWorker && oAPP.attr._oServerWorker) {
                    oAPP.attr._oServerWorker.terminate();
                    delete oAPP.attr._oServerWorker;
                }

                let sTitle = "Session Timeout",
                    sDesc = "Please Try Login Again!",
                    sIllustType = "tnt-SessionExpired",
                    sIllustSize = sap.m.IllustratedMessageSize.Dialog;

                oAPP.fn.fnShowIllustMsgDialog(sTitle, sDesc, sIllustType, sIllustSize, fnSessionTimeOutDialogOk);

                break;

            default:
                break;

        }


    };

    /************************************************************************
     * 전체 브라우저에 공통으로 타는 DragEnd 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_cdn_save = function (oEvent, oRes) {

        let BROWSKEY = oRes.BROWSKEY,
            ISCDN = oRes.ISCDN;

        parent.setIsCDN(ISCDN);

        oEvent.reply(`${BROWSKEY}-cdn-save-callback`, {
            RETCD: "S",
            RTMSG: "Success!",
            ISCDN: ISCDN
        });

    }; // end of oAPP.fn.fnIpcMain_cdn_save

    /************************************************************************
     * 전체 브라우저간 통신
     ************************************************************************/
    oAPP.fn.fnIpcMain_browser_interconnection = async (oEvent, oRes) => {

        let PRCCD = oRes?.PRCCD;
        if (!PRCCD) {
            return;
        }

        switch (PRCCD) {
            case "01": // [컨트롤러 클래스 눌렀을 때 팝업] 같은 SYSID & CLIENT에 ILLUST 메시지 팝업 오픈

                oAPP.fn.fnIpcMain_browser_interconnection_01(oRes);

                return;

            case "02": // [컨트롤러 클래스 눌렀을 때 팝업] 같은 SYSID & CLIENT에 ILLUST 메시지 팝업 닫기

                oAPP.fn.fnIpcMain_browser_interconnection_02(oRes);

                return;

            case "03": // [컨트롤러 클래스 눌렀을 때 팝업] 같은 SYSID & CLIENT에 ILLUST 메시지 변경

                oAPP.fn.fnIpcMain_browser_interconnection_03(oRes);

                return;

            case "04": // 전체 윈도우를 강제로 닫을 경우

                oAPP.fn.fnIpcMain_browser_interconnection_04(oRes);

                return;

            default:
                break;
        }


        /**
         * @since   2025-05-07
         * @version v3.5.6-2
         * @author  soccerhs
         * 
         * @description
         * 전체 브라우저 통신 시, PRCCD를 Case 분기로 처리하는 방식을
         * 앞으로는 모듈 성격의 assist js 안에서 동적처리로 방식 변경함
         *  
         */
        let PATHINFO = parent.PATHINFO;

        let sIpcModulePath = parent.PATH.join(PATHINFO.JS_ROOT, "ipc", "assist", "browser_interconnection_assist.js");

        try {

            let oASSIST = await import(sIpcModulePath);

            if (!oASSIST || !oASSIST[PRCCD]) {
                return;
            }

            oASSIST[PRCCD](oEvent, oRes);

        } catch (error) {

            // 콘솔용 오류 메시지
            var aConsoleMsg = [
                `[PATH]: www/ws10_20/js/ipc/ws_fn_ipc.js`,
                `=> oAPP.fn.fnIpcMain_browser_interconnection`,
                `=> let oASSIST = await import(sIpcModulePath)`,
                `=> try...catch error`,
                `[DESC]:`
                    `=> assist.js 파일 Import 하다가 오류 발생`
                    `=> 또는 assist js 안의 로직에서 오류 발생!!`
                    `=> PRCCD: ${PRCCD}`
            ];

            console.error(aConsoleMsg.join("\r\n"));
            console.error(error);
            console.trace();

            return;

        }

    }; // end of oAPP.fn.fnIpcMain_browser_interconnection

    /************************************************************************
     * 전체 브라우저간 통신
     * **********************************************************************
     * # PRCCD: 01 
     *   - 컨트롤러 클래스 버튼 눌렀을 때, 같은 SYSID & CLIENT에 ILLUST 메시지 팝업 오픈
     ************************************************************************/
    oAPP.fn.fnIpcMain_browser_interconnection_01 = (oRes) => {

        let oServerInfo = parent.getServerInfo(),
            SYSID = oRes.SYSID,
            CLIENT = oRes.CLIENT,
            OPTIONS = oRes.OPTIONS;

        if (oServerInfo.SYSID !== SYSID || oServerInfo.CLIENT !== CLIENT) {
            return;
        }

        APPCOMMON.fnIllustMsgDialogOpen(OPTIONS);

    }; // end of oAPP.fn.fnIpcMain_browser_interconnection_01

    /************************************************************************
     * 전체 브라우저간 통신
     * **********************************************************************
     * # PRCCD: 02 
     *   - 컨트롤러 클래스 버튼 눌렀을 때, 같은 SYSID & CLIENT에 ILLUST 메시지 팝업 닫기
     ************************************************************************/
    oAPP.fn.fnIpcMain_browser_interconnection_02 = (oRes) => {

        let oServerInfo = parent.getServerInfo(),
            SYSID = oRes.SYSID,
            CLIENT = oRes.CLIENT;

        if (oServerInfo.SYSID !== SYSID || oServerInfo.CLIENT !== CLIENT) {
            return;
        }

        APPCOMMON.fnIllustMsgDialogClose();

    }; // end of oAPP.fn.fnIpcMain_browser_interconnection_01

    /************************************************************************
     * 전체 브라우저간 통신
     * **********************************************************************
     * # PRCCD: 03
     *   - 컨트롤러 클래스 버튼 눌렀을 때, 같은 SYSID & CLIENT에 ILLUST 메시지 변경
     ************************************************************************/
    oAPP.fn.fnIpcMain_browser_interconnection_03 = (oRes) => {

        let oServerInfo = parent.getServerInfo(),
            SYSID = oRes.SYSID,
            CLIENT = oRes.CLIENT,
            sMsg = oRes.MSG;

        if (oServerInfo.SYSID !== SYSID || oServerInfo.CLIENT !== CLIENT) {
            return;
        }

        let oIllustMsg = sap.ui.getCore().byId("u4aWsIllustedMsg");

        if (oIllustMsg) {
            oIllustMsg.setDescription(sMsg);
        }

    }; // end of oAPP.fn.fnIpcMain_browser_interconnection_03

    /************************************************************************
     * 전체 브라우저간 통신
     * **********************************************************************
     * # PRCCD: 04
     *   - 전체 브라우저 닫기
     ************************************************************************/
    oAPP.fn.fnIpcMain_browser_interconnection_04 = (oRes) => {

        // onBeforeunload event 해제
        oAPP.main.fnDetachBeforeunloadEvent();

        // 현재 브라우저에 걸려있는 shortcut, IPCMAIN 이벤트 등 각종 이벤트 핸들러를 제거 하고, 
        // 현재 브라우저의 화면이 20번 페이지일 경우는 서버 세션 죽이고 Lock도 해제한다.
        oAPP.main.fnBeforeunload();


    }; // end of oAPP.fn.fnIpcMain_browser_interconnection_04

    /************************************************************************
     * 접속환경 정보 구하기
     ************************************************************************/
    oAPP.fn.fnIpcMain_if_get_sys_info = function (oEvent, oPARAM) {

        let APPPATH = parent.REMOTE.app.getAppPath();
        let PATHINFOURL = parent.PATH.join(APPPATH, "ws30", "resources", "pathInfo.js");
        let PATHINFO = parent.require(PATHINFOURL);

        let sIpcModulePath = parent.PATH.join(PATHINFO.JS_ROOT, "ipc", "assist", "sys_info_assist.js");
        let oASSIST = parent.require(sIpcModulePath);

        if (!oASSIST[oPARAM.PRCCD]) {
            return;
        }

        try {

            oASSIST[oPARAM.PRCCD](oEvent, oPARAM);

        } catch (error) {

            console.error("[ws_fn_ipc.js] oAPP.fn.fnIpcMain_if_get_sys_info --- Start");
            console.error(error);
            console.error("[ws_fn_ipc.js] oAPP.fn.fnIpcMain_if_get_sys_info --- End");

            return;
        }

    }; // end of oAPP.fn.fnIpcMain_if_get_sys_info


    /************************************************************************
     * 액션별 명령어 수행
     ************************************************************************ 
     * @param {} oEvent 
     * @param {Object} oPARAM 
     * {
     *    ACTCD : 명령어 수행할 ACTION CODE
     * }     
     *************************************************************************/
    oAPP.fn.fnIpcMain_if_send_action = async function (oEvent, oPARAM) {

        if (typeof oPARAM !== "object") {
            return;
        }

        let APPPATH = parent.REMOTE.app.getAppPath();
        let PATHINFOURL = parent.PATH.join(APPPATH, "ws30", "resources", "pathInfo.js");
        let PATHINFO = parent.require(PATHINFOURL);

        let sIpcModulePath = parent.PATH.join(PATHINFO.JS_ROOT, "ipc", "assist", "send_action_assist.js");

        let oASSIST = await import(sIpcModulePath);

        if (!oASSIST[oPARAM.ACTCD]) {
            return;
        }

        try {

            oASSIST[oPARAM.ACTCD](oEvent, oPARAM);

        } catch (error) {

            console.error("[ws_fn_ipc.js] oAPP.fn.fnIpcMain_if_send_action --- Start");
            console.error(error);
            console.error("[ws_fn_ipc.js] oAPP.fn.fnIpcMain_if_send_action --- End");

            return;
        }


    }; // end of oAPP.fn.fnIpcMain_if_send_action

    /************************************************************************
     * 테마 개인화 변경 IPC 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_if_p13n_themeChange = function () {

        // 서버 접속 정보
        let oServerInfo = parent.getServerInfo();

        // 접속 서버의 SYSID
        let sSysID = oServerInfo.SYSID;

        // 해당 SYSID별 테마 정보 JSON을 읽는다.
        let sThemeJsonPath = parent.PATH.join(parent.USERDATA, "p13n", "theme", `${sSysID}.json`);
        if (parent.FS.existsSync(sThemeJsonPath) === false) {
            return;
        }

        let sThemeJson = parent.FS.readFileSync(sThemeJsonPath, "utf-8");

        try {

            var oThemeJsonData = JSON.parse(sThemeJson);

            // 테마 정보를 전역에 저장한다.
            parent.setThemeInfo(oThemeJsonData);

        } catch (error) {
            return;
        }

        sap.ui.getCore().applyTheme(oThemeJsonData.THEME);


        /*****************************************************
         * @since   2025-05-06
         * @version v3.5.6-2
         * @author  soccerhs
         * 
         * @description
         * USP의 모나코 에디터의 테마 변경 관런로직
         * 
         * # Workspace Theme 변경시 테마에 따른 
         *   USP 모나코 에디터 테마 동시 변경 적용을 하지 않는 것으로 
         *   결정하여 임시 주석처리함
         ******************************************************/
        // // 마지막 선택한 테마 정보를 구한다.
        // let sSelectedThemeUsp = oAPP.common.fnGetModelProperty("/WS30/USP_EDITOR/sSelectedTheme");
        // if(!sSelectedThemeUsp){
        //     return;
        // }

        // // USP 에디터에 마지막 선택한 테마 정보가 있는지 확인
        // let oLastSelectedThemeInfo = oAPP.usp.getLastSelectedEditorTheme();
        // let sLastThemeName = oLastSelectedThemeInfo?.themeName;
        // if(sLastThemeName){
        //     return;
        // }

        // // 마지막 선택한 테마 정보가 없다면 테마의 다크 or 화이트에 따른 
        // // 에디터 영역 테마 설정

        // // 기본 에디터 테마 설정
        // let sThemeName = "vs-light";

        // if (oThemeJsonData.THEME.endsWith("dark")) {
        //     sThemeName = "vs-dark";
        // }

        // // 선택된 테마 정보
        // let oSelectedThemeInfo = {
        //     themeName : sThemeName,
        // };

        // // 전체 USP의 모나코 에디터에 PostMessage 를 전송한다.
        // oAPP.usp.sendEditorPostMessageAll({ actcd: 'applyTheme', oThemeInfo: oSelectedThemeInfo });


    }; // end of oAPP.fn.fnIpcMain_if_p13n_themeChange


    /************************************************************************
     * dev browser 관련 IPC Main 이벤트
     ************************************************************************/
    oAPP.fn.fnIpcMain_if_dev_browser = function (oEvent, oPARAM) {

        if (!oPARAM) {
            return;
        }

        let APPPATH = parent.REMOTE.app.getAppPath();
        let PATHINFOURL = parent.PATH.join(APPPATH, "ws30", "resources", "pathInfo.js");
        let PATHINFO = parent.require(PATHINFOURL);

        let sIpcModulePath = parent.PATH.join(PATHINFO.JS_ROOT, "ipc", "dev_browser", "index.js");

        parent.require(sIpcModulePath)(oAPP, oPARAM);

    } // end of oAPP.fn.fnIpcMain_if_dev_browser




})(window, $, oAPP);