// 현재 브라우저 윈도우
const CURRWIN = parent.CURRWIN;

// 브라우저 고유 키
const BROWSER_KEY = getBrowserKey();

// 브라우저 세션 키
const SESSION_KEY = parent.getSessionKey();

// 서버 접속 정보
const SERVER_INFO = getServerInfo();

// 내부 공통
const COMMON = {
    showMessage: function () {
        oWS.utill.attr.sap.m.InstanceManager.closeAllPopovers();
        parent.showMessage(oWS.utill.attr.sap, ...arguments);
    }
};

const G_MSG = {};


/** 현재 창 포커스 주기 */
function _currWindowFocus() {
    CURRWIN.show();
    CURRWIN.focus();
    CURRWIN.flashFrame(true);
} // end of _currWindowFocus


/**
 * 프로세스 코드별 액션 수행
 */
const PRCCD_ACTIONS = {

    // 디자인 트리 영역 선택 표시
    SELECT_DESIGN_TREE: async function (oAPP, oParams) {

        let oAction = oParams.ACTION;
        if (!oAction) {
            return;
        }

        // 2. 현재 20페이지가 아닐 경우는 빠져나간다.
        if (parent.getCurrPage() !== "WS20") {
            // _warnBox("Action Ignored", "WS20번 페이지에서만 동작하는 기능 입니다.");

            // 어플리케이션 개발화면(WS20) 페이지에서만 동작하는 기능 입니다.
            // let sMsg = G_MSG.M005;
            // let sMsg = "어플리케이션 개발화면(WS20) 페이지에서만 동작하는 기능 입니다";

            // COMMON.showMessage(10, "W", sMsg);

            // // 브라우저에 메시지 출력
            // await oDevBrowser.executeScript(oInjectScripts.Util.showBrowserMessage(sMsg, { type: "W" }));            

            return;
        }

        // 3. WS20번 앱 정보 구하기
        let oWS20App = oAPP.common.fnGetModelProperty("/WS20/APP");
        if (!oWS20App) {
            // _warnBox("Action Ignored", "WS20번 앱 정보가 없습니다.");

            // 어플리케이션 정보가 누락되었습니다. 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 바랍니다.
            // let sMsg = G_MSG.M007 + "\n\n" + G_MSG.M003;
            // let sMsg = "어플리케이션 정보가 누락되었습니다. 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 바랍니다.";

            // COMMON.showMessage(20, "E", sMsg);

            return;
        }

        // // 4. Edit 모드가 아닐 경우는 동작 하지 않음.
        // if (oWS20App.IS_EDIT !== "X") {

        //     // Display 모드에서는 디자인 트리 선택 동작이 되지 않습니다.
        //     let sMsg = G_MSG.M008;

        //     COMMON.showMessage(10, "W", sMsg);

        //     // // 브라우저에 메시지 출력
        //     // await oDevBrowser.executeScript(oInjectScripts.Util.showBrowserMessage(sMsg, { type: "W" }));

        //     return;
        // }

        // 5. 프로세스 실행 중 체크 (Busy, Dialog 등)
        if (oAPP.common.isProcessRunning() === true) {
            // _warnBox("Action Ignored", "Busy 상태이거나 Dialog가 열려 있습니다.");

            // "현재 Workspace에 다른 프로세스가 실행 중입니다."
            // let sMsg = G_MSG.M004;
            let sMsg = "현재 Workspace에 다른 프로세스가 실행 중입니다.";

            COMMON.showMessage(10, "W", sMsg);

            // // 브라우저에 메시지 출력
            // await oDevBrowser.executeScript(oInjectScripts.Util.showBrowserMessage(sMsg, { type: "W" }));

            return;
        }

        // 다른 어플리케이션이라면 하위 로직 수행 하지 않음~!
        let APPID = oAction.APPID;
        if (APPID !== oWS20App.APPID) {
            return;
        }

        // 현재 창 포커스 주기
        _currWindowFocus();

        // 브라우저가 숨겨져 있을 경우는 최상단으로 보여주기
        if (document.visibilityState === "hidden") {

            CURRWIN.setAlwaysOnTop(true, "screen-saver");

            /**
             * PIN 설정이 되어 있지 않는 경우에는
             * 현재 브라우저를 항상 최상단으로 설정한 부분을 해제
             */
            let bIsPin = oAPP.common.fnGetModelProperty("/SETTING/ISPIN");
            if (bIsPin === false) {
                CURRWIN.setAlwaysOnTop(false);
            }

        }

        window.requestAnimationFrame(() => {
            requestIdleCallback(async () => {
                // 디자인 트리 해당 요소 선택      
                await oAPP?.fn?.setSelectTreeItem?.(oAction.OBJID, oAction.UIATK, null);
            });
        });

    },

};


module.exports = async function (oAPP, oParams) {

    if (!oParams) {
        return;
    }

    // 브라우저키가 다를 경우에만 하위 로직 수행        
    let sBrowserKey = oParams?.BROWSER_KEY || "";
    if (sBrowserKey === BROWSER_KEY) {
        return;
    }
    
    // 다른 세션의 Workspace에서 넘어왔을 경우는 처리하지 않음.
    let sSessionKey = oParams?.SESSION_KEY || "";
    if(sSessionKey !== SESSION_KEY){
        return;
    }

    // 프로세스 코드가 없을 경우 아래 로직 수행 하지 않음.
    let sPRCCD = oParams?.PRCCD || "";
    if (!sPRCCD) {
        return;
    }

    // 시스템 아이디가 다를 경우는 아래 로직 수행 하지 않음.
    let SYSID = oParams?.SYSID || "";
    if (!SYSID || SYSID !== SERVER_INFO.SYSID) {
        return;
    }

    // 프로세스 코드에 대한 실행 함수가 없을 경우는 빠져나감.
    if (typeof PRCCD_ACTIONS[sPRCCD] === "undefined") {
        return;
    }

    // 프로세스 코드별 액션 수행!!    
    PRCCD_ACTIONS[sPRCCD](oAPP, oParams);

};