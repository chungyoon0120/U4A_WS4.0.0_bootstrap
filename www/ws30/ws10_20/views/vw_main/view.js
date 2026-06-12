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

    let ROOT_PAGE = new sap.m.Page({
        showHeader: true
    });

    /**
     * 헤더 부분 시작 ---------------------------------------------
     */
    let CUSTOMHEADER1 = new sap.m.Bar({
        contentLeft: [
            new sap.m.Image({
                width: "25px",
                src: parent.PATHINFO.WS_LOGO
            }),

        ]
    });
    CUSTOMHEADER1.addStyleClass("u4aWsBrowserDraggable");

    let TITLE1 = new sap.m.Title({
        text: ""
    });

    CUSTOMHEADER1.addContentLeft(TITLE1);

    oContr.ui.WINDOW_TITLE = TITLE1;

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

            oAPP.attr.isPressWindowClose = "X";
            
            parent.CURRWIN.close();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON3);
    
    /**
     * 헤더 부분 끝 ---------------------------------------------
     */


    oContr.ui.ROOT_PAGE = ROOT_PAGE;

    let VBOX1 = new sap.m.VBox({
        width: "100%",
        height: "100%",
        renderType: "Bare"
    });
    ROOT_PAGE.addContent(VBOX1);

    oContr.ui.VBOX1 = VBOX1;

    APP.addPage(ROOT_PAGE);

    oContr.ui.APP = APP;

    return oContr;

}