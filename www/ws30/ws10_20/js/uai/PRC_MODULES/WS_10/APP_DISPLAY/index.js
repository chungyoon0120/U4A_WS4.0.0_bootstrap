/****************************************************************************
 * 🔥 Global Variables
 ****************************************************************************/

    const sap = oWS.utill.attr.sap;

    const REMOTE         = require('@electron/remote');
    const CURRWIN        = REMOTE.getCurrentWindow();


/****************************************************************************
 * 🔥 Private functions
 ****************************************************************************/


    /*************************************************************
     * @function - 기다려줘~
     *************************************************************/
    function _fnWaiting (iTime = 1000){

        return new Promise(function(resolve){

            setTimeout(function(){

                resolve();

            }, iTime);

        });

    } // end of _fnWaiting


    /*************************************************************
     * @function - ✅ 프로세스 종료를 기다리는 Promise 함수
     *************************************************************/
    function waitUntilProcessDoneOrTimeout(maxWait = 30000, intervalTime = 200) {
            
        return new Promise((resolve) => {
            const startTime = Date.now();

            const interval = setInterval(() => {
                const bIsProcessing = oAPP.oChildApp.common.isProcessRunning();

                // ✅ 프로세스가 종료되면 resolve(true)
                if (!bIsProcessing) {
                    clearInterval(interval);
                    resolve(true);
                    return;
                }

                // ✅ 30초 경과하면 resolve(false)
                if (Date.now() - startTime >= maxWait) {
                    clearInterval(interval);
                    resolve(false);
                }
            }, intervalTime);
        });

    } // end of waitUntilProcessDoneOrTimeout


    /*************************************************************
     * @function - 현재 실행중인 어플리케이션과 
     *             전달받은 어플리케이션이 같은지 체크
     *************************************************************/
    function _checkRunningAppIsSame(sAPPID){

        let sCurrRunApp = oAPP.oChildApp.common.fnGetModelProperty("/WS20/APP/APPID");
        if(!sCurrRunApp){
            return false;
        }

        if(sCurrRunApp === sAPPID){
            return true;
        }

        return false;

    } // end of _checkRunningAppIsSame


    /**
     * 윈도우의 전체 크기를 기준으로, 모니터의 정확한 중앙에 윈도우가 위치하도록 x, y를 보정함
     * 
     * @param {Electron.Rectangle} parentBounds - 기준이 될 윈도우 bounds (보통 getBounds())
     * @param {number} width - 자식 윈도우 또는 새 윈도우의 너비
     * @param {number} height - 자식 윈도우 또는 새 윈도우의 높이
     * @returns {{ x: number, y: number, width: number, height: number }} - 정확히 중앙에 위치한 bounds
     */
    function _getBoundsToCenterOfMonitor(parentBounds, width, height) {
        if (!parentBounds || !Number.isFinite(width) || !Number.isFinite(height)) {
            return;
        }

        const display = SCREEN.getDisplayMatching(parentBounds);
        const { x: monX, y: monY, width: monW, height: monH } = display.workArea;

        const centeredX = Math.floor(monX + (monW - width) / 2);
        const centeredY = Math.floor(monY + (monH - height) / 2);

        return {
            x: centeredX,
            y: centeredY,
            width,
            height
        };
    }


    /*************************************************************
     * @function - AI의 미리보기가 실행되고 있는 모니터의 가운데에 배치
     *************************************************************/
    function _moveWindowToAiMonitorCenter(oPrevBounds){ 
    
        let oCurrBounds = CURRWIN.getBounds();

        let oBoundsResult = _getBoundsToCenterOfMonitor(oPrevBounds, oCurrBounds.width, oCurrBounds.height);
        if(!oBoundsResult){
            return;
        }    

        let oBounds = {
            x: oBoundsResult.x,
            y: oBoundsResult.y,
            width: oBoundsResult.width,
            height: oBoundsResult.height
        };

        CURRWIN.setBounds(oBounds);

    } // end of _setMovePosAiWinMonitor    


/****************************************************************************
 * 🔥 Modules Start !!!
 ****************************************************************************/  
module.exports = async function(oIF_DATA){
    
    console.log("AI-APP_DISPLAY");

    // 전달받은 파라미터
    let oPARAM = oIF_DATA.PARAM;

    // 전달받은 APPID
    let sAPPID = oPARAM.APPID;

    // 3.0 브라우저가 숨어져 있을 수 있으므로 최상단에 위치시킨다.
    CURRWIN.setAlwaysOnTop(true, "screen-saver");

    // 현재 브라우저가 비가시 상태 or 최소화 상태라면 → show() 후 focus()
    if (CURRWIN.isVisible() === false || CURRWIN.isMinimized() === true) {

        // 현재 윈도우를 먼저 활성화 시켜야 정확하게 이동됨
        CURRWIN.show();

        // AI 미리보기 브라우저의 위치 정보
        let oPrevBounds = oPARAM?.PREV_BOUNDS || undefined;
        if (oPrevBounds) {
            // 현재 ws3.0 윈도우를 AI 미리보기 창이 있는 브라우저로 이동시킨다.
            _moveWindowToAiMonitorCenter(oPrevBounds);
        }

    }

    // 활성/비활성 여부 상관없이 무조건 focus는 줘야 함
    CURRWIN.focus();

    // 사용자가 브라우저 최상위 고정 핀을 박았다면 setAlwaysOnTop을 원복 시키지 않음
    if (oAPP.oChildApp.common.fnGetModelProperty("/SETTING/ISPIN") !== true) {
        CURRWIN.setAlwaysOnTop(false);
    }

    // 현재 다른 프로세스가 실행 중인지 체크
    let bIsProcessing = oAPP.oChildApp.common.isProcessRunning();
    if(bIsProcessing){

        // [MSG]
        var sMsg = "진행 중인 프로세스가 완료된 이후에 다시 시도하세요.";

        parent.showMessage(sap, 10, "W", sMsg);

        return;
    }

    // 현재 실행 중인 페이지 정보를 구한다.
    let sCurrPage = parent.getCurrPage();

    switch (sCurrPage) {
        case "WS10":

            break;

        case "WS20":

            // 현재 실행중인 어플리케이션과 전달받은 어플리케이션이 같다면 포커스만 주기...
            let bIsSame = _checkRunningAppIsSame(sAPPID);
            if(bIsSame === true){

                // [MSG]
                var sMsg = "현재 실행 중인 애플리케이션은 AI 앱에서 방금 실행 요청한 애플리케이션과 동일합니다.";

                parent.showMessage(sap, 10, "W", sMsg);

                return;
            }

            sap.ui.getCore().byId("backBtn").firePress();

            // 특정 프로세스가 종료 될때까지 기다린다(최대 30초)
            const isFinished = await waitUntilProcessDoneOrTimeout(30000, 200);

            // Max 타임이 지나도 안끝났을 경우 진행 중인 프로세스가 종료된 후 다시 시도 메시지 출력
            if(!isFinished){

                // [MSG]
                var sMsg = "진행 중인 프로세스가 완료된 이후에 다시 시도하세요.";

                parent.showMessage(sap, 10, "W", sMsg);

                return;

            }

            break;
    
        default:

            // [MSG]
            var sMsg = "방금 AI 앱에서 요청한 프로세스는 U4A 애플리케이션 메인 화면에서만 실행할 수 있습니다.";

            parent.showMessage(sap, 10, "W", sMsg);

            return;

    }

    sap.ui.getCore().byId("AppNmInput").setValue(sAPPID);
    sap.ui.getCore().byId("displayBtn").firePress();    

    // setTimeout(function(){
    //     sap.ui.getCore().byId("AppNmInput").setValue("");
    // }, 0);

};