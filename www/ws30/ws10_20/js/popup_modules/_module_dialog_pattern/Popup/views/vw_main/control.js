export async function getControl() {

    /******************************************************************************
     *  💖 LIBRARY LOAD 선언부
     ******************************************************************************/

    sap.ui.getCore().loadLibrary("sap.m");

    jQuery.sap.require("sap.m.MessageBox");

    /******************************************************************************
     *  💖 DATA / ATTRIBUTE 선언부
     ******************************************************************************/

    const
        oContr = {};
        oContr.msg = {};
        oContr.ui = {};
        oContr.fn = {};
        oContr.types = {};
        oContr.attr = {};

    // I/F 파라미터 구조
    oContr.attr.IF_DATA = {};

    // 현재 뷰의 이름
    oContr.attr.VIEW_NAME = "main";

    // 이벤트 버스 객체
    oContr.attr.oEventBus = sap.ui.getCore().getEventBus();

    oContr.oModel = new sap.ui.model.json.JSONModel({



    });

    oContr.oModel.setSizeLimit(Infinity);

    /******************************************************************************
     *  💖 PRIVATE FUNCTION 선언부
     ******************************************************************************/







    /************************************************************************
     * 현재 브라우저의 이벤트 핸들러
     ************************************************************************/
    function _attachCurrentWindowEvents() {

        let oMaxWinBtn = oContr.ui.MAX_WIN_BTN;

        parent.CURRWIN.on("maximize", () => {

            oMaxWinBtn.setIcon("sap-icon://value-help");

        });

        parent.CURRWIN.on("unmaximize", () => {

            oMaxWinBtn.setIcon("sap-icon://header");

        });

    } // end of _attachCurrentWindowEvents


    /*************************************************************
     * @function - 이벤트 버스 등록하기
     *************************************************************/
    function _attachEventBus() {

        const oEventBus = sap.ui.getCore().getEventBus();

        // 이벤트 등록.
        oEventBus.subscribe(oContr.attr.VIEW_NAME, "onMessage", _eventBusOnMessage)


    } // end of _attachEventBus


    /*************************************************************
     * @function - 이벤트 버스의 onMessage
     *************************************************************/
    function _eventBusOnMessage(a, b, c) {

        debugger;

    } // end of _eventBusOnMessage


    function _waiting(itime = 1000) {
        return new Promise(resolve => setTimeout(resolve, itime));
    }


    /******************************************************************************
     * 💖  PUBLIC EVENT FUNCTION 선언부
     ******************************************************************************/


    /*************************************************************
     * @function - 화면이 로드 될때 타는 이벤트
     *************************************************************/
    oContr.onViewReady = async function (IF_DATA) {

        // 현재 브라우저의 이벤트 핸들러
        _attachCurrentWindowEvents();

        // 이벤트 버스 등록하기
        _attachEventBus();

        // 초기 설정
        await oContr.fn.onInit(IF_DATA);

        oAPP.fn.setBusy('');

    }; // end of oContr.onViewReady


    /******************************************************************************
     *  💖 PUBLIC FUNCTION 선언부
     ******************************************************************************/


    /*************************************************************
     * @function - 초기 설정
     *************************************************************/
    oContr.fn.onInit = async function (IF_DATA) {



    }; // end of oContr.fn.onInit


    oContr.fn.setBusy = function (sBusy) {
        oAPP.fn.setBusy(sBusy);
    };


    /*************************************************************
     * @function - 메시지 토스트 출력
     *************************************************************/
    oContr.fn.showMsgToast = function (sMsg) {
        sap.m.MessageToast.show(sMsg);
    };

    return oContr;

}