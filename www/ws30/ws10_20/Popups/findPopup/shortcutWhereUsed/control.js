
/********************************************************************
 *📝 CONTROL.JS
    내역 : 단축키 등록 사용처 조회 팝업 컨트롤러
********************************************************************/
export async function createControl(oParam){
    /********************************************************************
     *📝 DATA / ATTRIBUTE 선언부
    ********************************************************************/
    const oContr = {};
        oContr.ui = {};
        oContr.fn = {};
        oContr.attr = {};


    //단축키 화면 도움말 view PATH 선언.
    oContr.attr.helpPath = parent.PATH.join(parent.__dirname, "shortcutWhereUsed", "helpDoc", "view.js");

    
    //findPopup <-> 단축키 사용건 확인 view의 eventBus 액션코드
    const CS_ACTCD = {
        REFRESH: "REFRESH"
    };

    const TY_COND = {
        KEYWORD : ""    //검색어
    };

    const TY_LIST = {
        HOTKEY: "",   //단축키
        UIATV: "",    //서버이벤트명
        EVTXT: "",    //서버이벤트 DESC.
        UIATT: "",    //UI 이벤트명
        OBJID: ""     //UI OBJECT ID
    };

    oContr.oModel = new sap.ui.model.json.JSONModel({
        //데이터 모델 선언.
        S_COND : {...TY_COND},
        T_LIST : []
    });




    /********************************************************************
     *📝 VIEW READY.
     //#region VIEW READY.
    ********************************************************************/
    oContr.onViewReady = async function(oEvent){

        oAPP.fn.setBusyIndicator("X");


        //이벤트 버스 등록 처리.
        oContr.fn._subscribeEventBus();

        
        //ROOT ui destroy 처리 감지.
        oContr.fn._setRootUiDestroyObserve();


        //모델 바인딩 데이터 구성.
        oContr.fn._setModelData();

        
        oAPP.fn.setBusyIndicator("");


    };




    /********************************************************************
     *📝 VIEW EXIT.
     //#region VIEW EXIT.
    ********************************************************************/
    oContr.onViewExit = async function(oEvent){

        //이벤트 버스 등록 해제.
        oContr.fn._unsubscribeEventBus();

    };




    /********************************************************************
     *📝 키워드 검색 이벤트.
     //#region 키워드 검색 이벤트.
    ********************************************************************/
    oContr.fn.onFindKeyword = function(oEvent){

        let _keyword = oContr.oModel.getProperty("/S_COND/KEYWORD");

        //키워드 입력건에 대한 결과 테이블 필터링.
        oContr.fn._findKeyword(_keyword);

    };



    /********************************************************************
     *📝 eventBus Callaback
     //#region eventBus Callaback
    ********************************************************************/
    oContr.fn.onEventBusListener = function(cId, eventName, oParam){
        
        switch (oParam?.ACTCD) {
            case CS_ACTCD.REFRESH:
                //refresh를 통해 바인딩 정보를 갱신 해야하는경우.

                //모델 바인딩 데이터 구성.
                oContr.fn._setModelData();
                
                break;
        
            default:
                //허용하지 않는 액션코드를 받은경우 치명적 오류 표현 처리.
                let _msg = `"www/ws10_20/Popups/findPopup/shortcutWhereUsed/control.js"\n` +
                    `파일에서 오류 발생.\n` +
                    `findPopup <-> 단축키 사용건 확인 view의 eventBus에 잘못된 action코드 전달받음\n` +
                    `action code : ${oParam?.ACTCD}\n` +
                    `관리자에게 문의 바랍니다.`;
                throw new Error(_msg);
                break;
        }
        

    };



    
    /********************************************************************
     *📝 shortcut 도움말 호출.
     //#region shortcut 도움말 호출 이벤트.
    ********************************************************************/
    oContr.fn.onShortcutHelp = function(oEvent){

        //이벤트 발생 UI 정보 얻기.
        const _oUi = oEvent.getSource();

        //shortcut 도움말 호출.
        oContr.fn._shortcutHelp(_oUi);

        
    };



    /********************************************************************
     *📝 키워드 입력건에 대한 결과 테이블 필터링.
    ********************************************************************/
    oContr.fn._findKeyword = function(keyword = ""){

        const _oBind = oContr.ui.SCLIST.getBinding("items");

        if(!_oBind){
            return;
        }

        //키워드 검색건이 존재하지 않는경우 filter 초기화.
        if(keyword === ""){
            _oBind.filter();
            return;
        }

        const _aFilter = [];

        _aFilter.push(new sap.ui.model.Filter({path:"HOTKEY", operator:"Contains", value1:keyword}));
        _aFilter.push(new sap.ui.model.Filter({path:"UIATV", operator:"Contains", value1:keyword}));
        _aFilter.push(new sap.ui.model.Filter({path:"EVTXT", operator:"Contains", value1:keyword}));
        _aFilter.push(new sap.ui.model.Filter({path:"UIATT", operator:"Contains", value1:keyword}));
        _aFilter.push(new sap.ui.model.Filter({path:"OBJID", operator:"Contains", value1:keyword}));  

        //키워드 입력건으로 결과리스트 필터링 처리.
        _oBind.filter([new sap.ui.model.Filter(_aFilter, false)]);

    };




    /********************************************************************
     *📝 단축키 사용 리스트 구성.
    ********************************************************************/
    oContr.fn._setShortcutList = function(){
        
        //기존 데이터 초기화.
        oContr.oModel.oData.T_LIST = [];

        //attr 변경 데이터 수집.
        let _aAttrData = oAPP.fn.getAttrChangedData();

        //이벤트건중 단축키가 지정된 항목만 필터링.
        let _aShortcutList = _aAttrData.filter( item => item.UIATY === "2" && item.SHCUT !== "");

        //단축키 등록건이 존재하지 않는경우 exit.
        if(_aShortcutList.length === 0){
            return;
        }
        
        // 서버 이벤트 Descripion정보 얻기.
        const _aServEvent = oAPP.fn.getServerEventList();


        let _aList = [];

        for(let _oShrtcutItem of _aShortcutList){

            let _sList = {...TY_LIST};

            let _sShortCut = JSON.parse(_oShrtcutItem.SHCUT);

            //단축키.(Ctrl + Alt + S)
            _sList.HOTKEY = _sShortCut.SCKEY;

            //서버이벤트명(EV_SEARCH)
            _sList.UIATV = _oShrtcutItem.UIATV;

            //UI 이벤트명(press)
            _sList.UIATT = _oShrtcutItem.UIATT;

            //UI OBJECT ID(BUTTON1)
            _sList.OBJID = _oShrtcutItem.OBJID;

            //서버이벤트에 해당하는 desc 정보 검색.
            let _sServEvent = _aServEvent.find(elem => elem.KEY == _sList.UIATV);
            
            //서버이벤트 desc 정보 매핑.(없을경우 빈값)
            _sList.EVTXT = _sServEvent?.DESC || "";

            _aList.push(_sList);
            
        }


        oContr.oModel.oData.T_LIST = _aList;


    };




    /********************************************************************
     *📝 shortcut 도움말 호출.
    ********************************************************************/
    oContr.fn._shortcutHelp = async function(oUi){

        oAPP.fn.setBusyIndicator("X");

        let _langu = oAPP.attr.oUserInfo.LANGU || "EN";

        //html src, html 전체 소스

        //도움말 팝업 모듈 js 
        let _viewerPath =  oAPP.PATH.join(oAPP.REMOTE.app.getAppPath(), "ws30", "ws10_20", "design", "util",
            "helpViewer.js");

        
        //도움말 팝업 기능 module import.
        const {popoverViewer} = await import(_viewerPath);


        let _sParams = {};

        _sParams.width = "70%";
        _sParams.height = "70%";

        //477	단축키 등록 항목
        _sParams.title = oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "477");


        let _sContent = {};
        
        let _htmlPath = oAPP.PATH.join(oAPP.REMOTE.app.getAppPath(), "ws30", "ws10_20", "Popups", "findPopup", 
            "shortcutWhereUsed", "helpDoc", _langu, "index.html");

        let _content = "";
        
        try {
            _content = oAPP.FS.readFileSync(_htmlPath);    

        } catch (error) {
            //허용하지 않는 액션코드를 받은경우 치명적 오류 표현 처리.
            let _msg = `"www/ws10_20/Popups/findPopup/shortcutWhereUsed/control.js"\n` +
                `파일에서 오류 발생.\n` +
                `oContr.fn._shortcutHelp 펑션의 도움말 HTML 본문 정보를 얻는 과정에서 오류 발생\n` +
                `html 파일 경로 : ${_htmlPath}\n` +
                `관리자에게 문의 바랍니다.`;
            throw new Error(_msg);  
        }
        

        _sContent.htmlContent = _content.toString();

        // _sContent.src = _htmlPath;

        //도움말 popover 구성.
        let _oContr = popoverViewer(_sContent, _sParams);
        
        //현재 ROOT에 추가 처리.
        oContr.ui.ROOT.addDependent(_oContr.ui.ROOT);

        //대상 UI에 팝업 오픈 처리.
        _oContr.ui.ROOT.openBy(oUi);
        
        oAPP.fn.setBusyIndicator("");
        
    };




    /********************************************************************
     *📝 모델 바인딩 데이터 구성.
    ********************************************************************/
    oContr.fn._setModelData = function(){
        
        //단축키 사용 리스트 구성.
        oContr.fn._setShortcutList();


        oContr.oModel.refresh();


    };




    /********************************************************************
     *📝 이벤트 버스 등록.
    ********************************************************************/
    oContr.fn._subscribeEventBus = function(){

        const _oEventBus = sap.ui.getCore().getEventBus();

        _oEventBus.subscribe("findPopup", "shortcutWhereUsed", oContr.fn.onEventBusListener);

    };




    /********************************************************************
     *📝 이벤트 버스 등록 해제.
    ********************************************************************/
    oContr.fn._unsubscribeEventBus = function(){

        const _oEventBus = sap.ui.getCore().getEventBus();

        _oEventBus.unsubscribe("findPopup", "shortcutWhereUsed", oContr.fn.onEventBusListener);

    };




    /********************************************************************
     *📝 ROOT ui destroy 처리 감지.
    ********************************************************************/
    oContr.fn._setRootUiDestroyObserve = function(){

        const _oObserver = new sap.ui.base.ManagedObjectObserver(function (oChange) {

            _oObserver.disconnect();

            //VIEW EXIT.
            oContr.onViewExit();

        });


        //root UI destroy 감지.
        _oObserver.observe(oContr.ui.ROOT, {
            destroy: true
        });
        

    };

    return oContr;

};
