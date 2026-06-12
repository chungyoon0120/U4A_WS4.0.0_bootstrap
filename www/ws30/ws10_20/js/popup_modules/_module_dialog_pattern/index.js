
const
    PATH = require("path"),
    SESSKEY = parent.getSessionKey(),
    BROWSKEY = parent.getBrowserKey();


module.exports = function (REMOTE, oAPP) {

    return new Promise(function (resolve) {

        // // busy 키고 Lock 걸기
        // oAPP.common.fnSetBusyLock("X");

        // // 전체 자식 윈도우에 Busy 킨다.
        // oAPP.attr.oMainBroad.postMessage({ PRCCD: "BUSY_ON" });

        let CURRWIN = REMOTE.getCurrentWindow();

        // 팝업 고유 이름
        let sPopupName = "[POPUP_NAME]";

        // 기존 팝업이 열렸을 경우 새창 띄우지 말고 해당 윈도우에 포커스를 준다.
        let oResult = oAPP.common.getCheckAlreadyOpenWindow2(sPopupName);
        if (oResult.ISOPEN) {

            // 부모 위치 가운데 배치한다.            
            parent.WSUTIL.setParentCenterBounds(REMOTE, oResult.WINDOW);

            // busy 끄고 Lock 풀기
            oAPP.common.fnSetBusyLock("");

            // 전체 자식 윈도우에 Busy 끈다.
            oAPP.attr.oMainBroad.postMessage({ PRCCD: "BUSY_OFF" });

            //해당 윈도우를 맨 앞으로 이동 처리.
            oResult.WINDOW.show();
            oResult.WINDOW.focus();

            return;
        }

        // theme 정보
        let oThemeInfo = parent.getThemeInfo();

        // Browswer Options
        let sSettingsJsonPath = parent.getPath("BROWSERSETTINGS"),
            oDefaultOption = parent.require(sSettingsJsonPath),
            oBrowserOptions = JSON.parse(JSON.stringify(oDefaultOption.browserWindow));

        oBrowserOptions.title = "DEV Browser Extension"; // [MSG]
        oBrowserOptions.titleBarStyle = 'hidden';
        oBrowserOptions.autoHideMenuBar = true;
        oBrowserOptions.resizable = true;
        oBrowserOptions.movable = true;

        // oBrowserOptions.parent = CURRWIN;

        oBrowserOptions.backgroundColor = oThemeInfo.BGCOL; //테마별 색상 처리
        
        oBrowserOptions.modal = false;
        oBrowserOptions.closable = true;

        oBrowserOptions.opacity = 0.0;
        oBrowserOptions.show = false;

        oBrowserOptions.webPreferences.nodeIntegrationInWorker = true;
        oBrowserOptions.webPreferences.partition = SESSKEY;
        oBrowserOptions.webPreferences.browserkey = BROWSKEY;
        oBrowserOptions.webPreferences.OBJTY = sPopupName;
        oBrowserOptions.webPreferences.USERINFO = parent.process.USERINFO;

        // 브라우저 오픈
        let oBrowserWindow = new REMOTE.BrowserWindow(oBrowserOptions);
        parent.REMOTEMAIN.enable(oBrowserWindow.webContents);

        // 오픈할 브라우저 백그라운드 색상을 테마 색상으로 적용
        let sWebConBodyCss = `html, body { margin: 0px; height: 100%; background-color: ${oThemeInfo.BGCOL}; }`;
        oBrowserWindow.webContents.insertCSS(sWebConBodyCss);

        // 브라우저 상단 메뉴 없애기
        oBrowserWindow.setMenu(null);

        // 브라우저 실행 경로에 붙일 QueryString 정보
        const oQueryParams = {
            browserkey: oBrowserOptions?.webPreferences?.browserkey,
            sessionKey: oBrowserOptions?.webPreferences?.partition,
            OBJTY: sPopupName,
            USERINFO: parent.process.USERINFO
        };

        let sPopupPath = PATH.join(__dirname, "Popup", "index.html");

        // URL에 QueryString 파라미터를 적용한다.
        const sLoadUrl = parent.WSUTIL.QueryString.build(sPopupPath, oQueryParams);

        oBrowserWindow.loadURL(sLoadUrl);        

        // no build 일 경우에는 개발자 툴을 실행한다.
        if (!REMOTE.app.isPackaged) {
            oBrowserWindow.webContents.openDevTools();
        }

        oBrowserWindow.once('ready-to-show', () => {

            // 부모 위치 가운데 배치한다.
            parent.WSUTIL.setParentCenterBounds(REMOTE, oBrowserWindow);

        });

        // 브라우저가 오픈이 다 되면 타는 이벤트
        oBrowserWindow.webContents.on('did-finish-load', function () {

            let oOptionData = {
                BROWSKEY: BROWSKEY, // 브라우저 고유키 
                // oUserInfo: oUserInfo, // 로그인 사용자 정보
                // oServerInfo: oServerInfo, // 서버 정보                
                oThemeInfo: oThemeInfo, // 테마 정보                
            };

            oBrowserWindow.webContents.send('HANDLE_ON_INIT', oOptionData);

            // 부모 위치 가운데 배치한다.
            parent.WSUTIL.setParentCenterBounds(REMOTE, oBrowserWindow);

        });

        // 브라우저를 닫을때 타는 이벤트
        oBrowserWindow.on('closed', () => {

            oBrowserWindow = null;

            CURRWIN.focus();

        });

        //  현재 윈도우가 닫힐 때(새로고침 등) 브라우저 정리 (1회성)
        window.addEventListener('pagehide', function(){
            try { oBrowserWindow.close(); } catch (error) {}
        }, { once: true });

    });

};