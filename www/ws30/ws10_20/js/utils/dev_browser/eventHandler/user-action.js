
/****************************************************************************
 * 🌐 Global Variables
 ****************************************************************************/
let oInjectScripts = require("../runtime-injections/index.js");

// DEV Browser 공통 함수 모음
const COMMON = require("../common/index.js");

// 전역 메시지 정보 추출
const G_MSG = require("../msg/index.js")();

const CURRWIN = parent.CURRWIN;
const CONSOLE_SCOPE = "[DEV BROWSER]";      // 로그 태그

const IPC_HANDLER = new parent.CLIpcHandler();     // IPC 핸들러 인스턴스

// 서버 접속정보
const SERVER_INFO = parent.getServerInfo();

// 브라우저 고유 키
const BROWSER_KEY = parent.getBrowserKey();

// 브라우저 세션 키
const SESSION_KEY = parent.getSessionKey();

/****************************************************************************
 * 🔒 Private functions
 ****************************************************************************/

/** 콘솔 로그 출력 헬퍼 */
function _consoleLog(msg, ...args) {
    console.log(`${CONSOLE_SCOPE} - ${msg}`, ...args);
}


/** 콘솔 오류 출력 헬퍼 */
function _consoleErr(msg, ...args) {
    console.error(`${CONSOLE_SCOPE} - ${msg}`, ...args);
}

/** 경고 로그 출력 헬퍼 (박스 형태) */
function _warnBox(title, reason) {

    const msg = [
        `\n######################################`,
        `## ${CONSOLE_SCOPE} - ${title}`,
        `######################################`,
        `- 작업을 수행할 수 없음`,
        `- 사유: ${reason}`,
        `######################################`,
    ];

    console.warn(msg.join("\r\n"));

}

/** 개발모드 브라우저 영역에 메시지 출력 */
async function _showBrowserMessage(oDevBrowser, sMsg, oOptions) {

    await oDevBrowser.executeScript(oInjectScripts.Util.showBrowserMessage(sMsg, oOptions));

} // end of sendMessageExtension


/** 현재 창 포커스 주기 */
function _currWindowFocus() {
    CURRWIN.show();
    CURRWIN.focus();
    CURRWIN.flashFrame(true);
} // end of _currWindowFocus


/** 사용자 클릭 액션 처리 */
async function _handleActionClick(oAction) {

    let oBindData = this;
    let oAPP = oBindData.oAPP;
    let oDevBrowser = this.oDevBrowser;

    /**
     * 전체 WS에 액션 정보 전송
     */

    // 전체 브라우저에 개발 모드 브라우저 액션 정보를 전달한다.
    IPC_HANDLER.command("if-dev-browser", {
        BROWSER_KEY: BROWSER_KEY,
        SESSION_KEY: SESSION_KEY,
        PRCCD: "SELECT_DESIGN_TREE",
        SYSID: SERVER_INFO.SYSID,
        ACTION: oAction
    });

    // 브라우저가 숨겨져 있을 경우는 최상단으로 보여주기
    if (document.visibilityState === "hidden") {

        CURRWIN.setAlwaysOnTop(true, "screen-saver");
        CURRWIN.show();
        CURRWIN.focus();

        /**
         * PIN 설정이 되어 있지 않는 경우에는
         * 현재 브라우저를 항상 최상단으로 설정한 부분을 해제
         */
        let bIsPin = oAPP.common.fnGetModelProperty("/SETTING/ISPIN");
        if (bIsPin === false) {
            CURRWIN.setAlwaysOnTop(false);
        }

    }

    // 2. 현재 20페이지가 아닐 경우는 빠져나간다.
    if (parent.getCurrPage() !== "WS20") {
        // _warnBox("Action Ignored", "WS20번 페이지에서만 동작하는 기능 입니다.");

        // 어플리케이션 개발화면(WS20) 페이지에서만 동작하는 기능 입니다.
        let sMsg = G_MSG.M005;

        COMMON.showMessage(10, "W", sMsg);

        // 브라우저에 메시지 출력
        await _showBrowserMessage(oDevBrowser, sMsg, { type: "W" });

        return;
    }

    // 3. WS20번 앱 정보 구하기
    let oWS20App = oAPP.common.fnGetModelProperty("/WS20/APP");
    if (!oWS20App) {
        // _warnBox("Action Ignored", "WS20번 앱 정보가 없습니다.");

        // 어플리케이션 정보가 누락되었습니다. 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 바랍니다.
        let sMsg = G_MSG.M007 + "\n\n" + G_MSG.M003;

        COMMON.showMessage(20, "E", sMsg);

        // 브라우저에 메시지 출력
        await _showBrowserMessage(oDevBrowser, sMsg, { type: "E" });

        return;
    }

    // // 4. Edit 모드가 아닐 경우는 동작 하지 않음.
    // if (oWS20App.IS_EDIT !== "X") {

    //     // _warnBox("Action Ignored", "Edit 모드가 아닙니다.");

    //     // Display 모드에서는 디자인 트리 선택 동작이 되지 않습니다.
    //     let sMsg = G_MSG.M008;

    //     COMMON.showMessage(10, "W", sMsg);

    //     // 브라우저에 메시지 출력
    //     await _showBrowserMessage(oDevBrowser, sMsg, { type: "W" });

    //     return;
    // }

    // 5. 프로세스 실행 중 체크 (Busy, Dialog 등)
    if (oAPP.common.isProcessRunning() === true) {
        // _warnBox("Action Ignored", "Busy 상태이거나 Dialog가 열려 있습니다.");

        // "현재 Workspace에 다른 프로세스가 실행 중입니다."
        let sMsg = G_MSG.M004;

        COMMON.showMessage(10, "W", sMsg);

        // 브라우저에 메시지 출력
        await _showBrowserMessage(oDevBrowser, sMsg, { type: "W" });

        return;
    }

    // 6. 현재 앱 영역 체크
    if (oAction.IS_CURR_APP === false) {
        // _warnBox("Action Ignored", "선택한 영역이 현재 어플리케이션 영역이 아닙니다.");

        // 선택한 UI는 현재 어플리케이션 영역이 아닙니다.
        let sMsg = G_MSG.M006;

        COMMON.showMessage(10, "W", sMsg);

        // // 브라우저에 메시지 출력
        // await _showBrowserMessage(oDevBrowser, sMsg, { type: "W" });

    }

    let oBusyOptions = {

        // 선택한 UI의 상세정보를 가져오는 중입니다.\n\n잠시만 기다려주세요...
        text: G_MSG.M009 + "\n\n" + G_MSG.M010 + "...",
        // customIcon: "https://img.icons8.com/?size=48&id=mrNoLXFmvXDX&format=png",        
    };

    // Busy 실행
    await oDevBrowser.executeScript(oInjectScripts.BusyDialog.open(oBusyOptions));

    // await COMMON.waiting(300);

    // 선택한 UI가 Usage 영역이 아닐 경우에만 WS20번 화면의 디자인 트리 영역에 포커스를 준다.
    if (oAction.IS_CURR_APP === true) {

        // 현재 창 포커스 주기
        _currWindowFocus();

        // 디자인 트리 해당 요소 선택
        await oAPP.fn.setSelectTreeItem(oAction.OBJID, oAction.UIATK, null);

    }

    // Extension SidePanel 펼치기
    let oExtOpenResult = await oDevBrowser.executeScript(oInjectScripts.Extension.open());

    // executeScript 수행 결과
    if(oExtOpenResult.RETCD === "E"){

        let sRETMSG = oExtOpenResult.MSGTX;

        let sErrMsg = `${G_MSG.M013}\n\n${sRETMSG}`;

        // 브라우저에 오류 메시지 출력
        await _showBrowserMessage(oDevBrowser, sErrMsg, { type: "E" });

        // 개발 브라우저에 Busy Dialog 종료
        await oDevBrowser.executeScript(oInjectScripts.BusyDialog.close());

        return;

    }

    var oExtOpenRDATA = oExtOpenResult.RDATA;
    if (oExtOpenRDATA.RETCD === "E") {

        let sRETMSG = oExtOpenRDATA.MSGTX;

        let sErrMsg = `${G_MSG.M013}\n\n${sRETMSG}`;

        // 브라우저에 오류 메시지 출력
        await _showBrowserMessage(oDevBrowser, sErrMsg, { type: "E" });

        // 개발 브라우저에 Busy Dialog 종료
        await oDevBrowser.executeScript(oInjectScripts.BusyDialog.close());

        return;
    }

    // 개발 모드 브라우저 영역에서 적용되어 있는 테마 정보 구하기
    let oThemeInfo = await oDevBrowser.executeScript(oInjectScripts.Util.getThemeInfo());
    if (oThemeInfo.RETCD === "S") {

        let sApplyTheme = "sap_horizon_dark";
        if (oThemeInfo.RDATA.endsWith("dark") === true) {
            sApplyTheme = "sap_horizon";
        }

        // Extension 영역에 테마 정보 전달
        await oDevBrowser.executeScript(oInjectScripts.Extension.setApplyTheme(sApplyTheme));

    }


    //================================================================
    //#region 🟦 선택한 UI 정보를 Extension 영역에 출력
    //#endregion
    //================================================================
    /**
     * 어플리케이션 계층 구조 정보 구하기
     */
    let oAppHire = await oDevBrowser.executeScript(oInjectScripts.Util.getAppHireachy());

    // executeScript 수행 결과
    if(oAppHire.RETCD === "E"){

        let sRETMSG = oAppHire.MSGTX;

        let sErrMsg = `${G_MSG.M013}\n\n${sRETMSG}`;

        // 브라우저에 오류 메시지 출력
        await _showBrowserMessage(oDevBrowser, sErrMsg, { type: "E" });

        // 개발 브라우저에 Busy Dialog 종료
        await oDevBrowser.executeScript(oInjectScripts.BusyDialog.close());

        return;

    }
    
    /**
     * UI 이벤트 정보 구성
     */
    let oUI_INFO = {};
    oUI_INFO.OBJID = oAction.OBJID;
    oUI_INFO.APPID = oAction.APPID;
    oUI_INFO.CUSTOM_CSS = oAction.CUSTOM_CSS;

    let T_CEVT = [];
    let T_SEVT = [];

    let aEventInfos = oAction.EVENT_INFOS;
    for (const oEventInfo of aEventInfos) {

        // 클라이언트 이벤트 정보가 있을 경우 정보 구성
        if (oEventInfo.IS_EXISTS_CEVT === true) {

            T_CEVT.push({
                APPID: oAction.APPID,
                OBJID: oAction.OBJID,
                CEVT_SCRIPT: oEventInfo.CEVT_SCRIPT,
                UIATT: oEventInfo.EVTNM
            });

        }

        // 서버 이벤트 정보가 있을 경우의 정보 구성
        if (oEventInfo.SEVT !== "") {

            T_SEVT.push({
                APPID: oAction.APPID,
                OBJID: oAction.OBJID,
                UIATT: oEventInfo.EVTNM,
                UIATV: oEventInfo.SEVT
            });

        }

    }

    oUI_INFO.T_CEVT = T_CEVT;
    oUI_INFO.T_SEVT = T_SEVT;

    /**
     * APP 정보 구성
     */
    let aAppInfo = oAppHire?.RDATA;

    let oParams = {
        UI_INFO: oUI_INFO,
        APP_INFO: aAppInfo || []
    };

    var oSendParams = {
        target: "EXT_SIDE_VIEW",
        action: "SHOW_UI_INFO",
        payload: oParams
    };

    // Extension 영역에 UI 정보 전달
    await oDevBrowser.executeScript(oInjectScripts.Extension.sendParams(oSendParams));

    // 개발 브라우저에 Busy Dialog 종료
    await oDevBrowser.executeScript(oInjectScripts.BusyDialog.close());

} // end of _handleActionClick


// ==============================================================================
//  ▶️ Module Start !!
// ==============================================================================

module.exports = function (oAction) {

    let oBindData = this;
    let oAPP = oBindData.oAPP;
    let oDevBrowser = oBindData.oDevBrowser;

    _consoleLog(`ACTION: ${oDevBrowser.getId()}`);

    switch (oAction.EVTNM) {

        case "click":

            _handleActionClick.call(this, oAction);

            break;

        default:
            break;
    }


}