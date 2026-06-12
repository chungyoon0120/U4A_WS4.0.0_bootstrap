export async function getView() {

    /*************************************************************
     * 📝 컨트롤러 로드
     *************************************************************/

    let sControlPath = "./control.js";

    const oRes = await import(sControlPath);
    const oContr = await oRes.getControl();


    /************************************************************************
     * 💖 화면 그리기
     ************************************************************************/

    let APP = new sap.m.App({
        autoFocus: false,
    });

    APP.addStyleClass("sapUiSizeCompact");


    /**
     * 헤더 부분 시작 ---------------------------------------------
     */


    let ROOT_PAGE = new sap.m.Page({
        enableScrolling: false,
    });
    APP.addPage(ROOT_PAGE);

    let CUSTOMHEADER1 = new sap.m.Bar({
        contentLeft: [
            new sap.m.Image({
                width: "25px",
                src: parent.PATHINFO.WS_LOGO
            }),
            new sap.m.Title("u4aWsHeaderTitle", {
                text: "Extension Browser" // [MSG]
            }),
        ]
    });
    CUSTOMHEADER1.addStyleClass("u4aWsBrowserDraggable");

    ROOT_PAGE.setCustomHeader(CUSTOMHEADER1);

    let BUTTON1 = new sap.m.Button({
        icon: "sap-icon://less",
        press: function () {

            parent.CURRWIN.minimize();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON1);

    oContr.ui.LESS_BTN = BUTTON1;

    let BUTTON2 = new sap.m.Button("maxWinBtn", {
        icon: "sap-icon://header",
        press: function (oEvent) {

            let bIsMax = parent.CURRWIN.isMaximized();

            if (bIsMax) {
                parent.CURRWIN.unmaximize();
                return;
            }

            parent.CURRWIN.maximize();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON2);

    oContr.ui.MAX_WIN_BTN = BUTTON2;

    let BUTTON3 = new sap.m.Button("mainWinClose", {
        icon: "sap-icon://decline",
        press: function () {

            parent.CURRWIN.close();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON3);

    oContr.ui.WIN_CLOSE_BTN = BUTTON3;

    let MAIN_NAVCON1 = new sap.m.NavContainer({
        autoFocus: false,
    });
    ROOT_PAGE.addContent(MAIN_NAVCON1);


    /**
     * 헤더 부분 끝 ---------------------------------------------
     */


    /*****************************************
     * 📑 메인 페이지
     *****************************************/
    let PAGE = new sap.m.Page({
        showHeader: false,
        enableScrolling: false,
        showFooter: false,
    });
    MAIN_NAVCON1.addPage(PAGE);

    PAGE.setModel(oContr.oModel);

    oContr.ui.APP = APP;

    return oContr;

}