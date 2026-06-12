export async function getControl() {

/******************************************************************************
//#region  💖 LIBRARY LOAD 선언부
 ******************************************************************************/
sap.ui.requireSync("sap/m/MessageBox");

sap.ui.getCore().loadLibrary("sap.m"); 
sap.ui.getCore().loadLibrary("sap.ui.layout");
sap.ui.getCore().loadLibrary("sap.ui.table");    


/******************************************************************************
//#region  💖 DATA / ATTRIBUTE 선언부
******************************************************************************/

const TY_LAYO = {
    EXPAND : true,  //HEAD 영역 확장 여부
    SIZE   : "40%"  //HEAD 영역 사이즈
};

const TY_RES = {
    RETCD : "",
    RTMSG : ""
};

const TY_HEAD = {
    UIOBK     : "",     // UI OBKECT KEY
    UIOBJ     : "",     // UI OBJECT 명
    LIBNM     : "",     // UI LIBRARY 명
    UICON     : "",     // UI ICON,
    ICON_PATH : "",     // ICON PATH,
    highlight : null,   // highlight 처리
};

const TY_ITEM = {
    UIATK    : "",      // UI ATTRIBUTE KEY
    UIOBK    : "",      // UI OBKECT KEY
    UIATT    : "",      // UI ATTRIBUTE 명
    UIATV    : "",      // UI ATTRIBUTE VALUE
    UIATY    : "",      // UI ATTRIBUTE 유형
    UIADT    : "",      // UI ATTRIBUTE TYPE
    ISMLB    : "",      // N건 입력 가능 ATTR 정보
    ISUSE    : false,   // 사용 여부

    edit     : false,   //attr 수정 가능 여부.
    inp_visb : false,   //input visible 여부.
    sel_visb : false,   //combobox visible 여부
    btn_visb : false,   //button visible 여부
    chk_visb : false,   //checkbox visible 여부
    showF4   : false,   //input의 valueHelp 활성여부
    F4Only   : false,   //input의 valueHelpOnly 활성 여부

    comboval : "",      //combobox의 value 바인딩 필드
    
    valst    : null,    //valueState 바인딩 필드  
    valtx    : "",      //valueStateText 바인딩 필드

    btn_text : "",      //button text 바인딩 필드
    btn_icon : "",      //button icon 바인딩 필드
    btn_type : null,    //button type 바인딩 필드

    UIATV_c  : false,   //checkbox selected 바인딩 필드

    UIATT_ICON : null,  //attribute의 유형에 따른 아이콘 바인딩 필드

    T_DDLB : undefined, //combobox item array.


};


//검색조건 필드.
const TY_COND = {
    HEAD : "",
    ITEM : "",
};

const CS_ATTR_ICON = {
    PROP       : "sap-icon://customize",
    EVNT       : "sap-icon://border",
    AGGR_SINLG : "sap-icon://color-fill",
    AGGR_MULTI : "sap-icon://dimension",
    ASSO       : undefined,
    EMBED_AGGR : undefined
};



const CS_UIATY_DESC = {
    PROP       : "Properties",
    EVNT       : "Events",
    AGGR       : "Aggregations",
    ASSO       : "Associations",
    EMBED_AGGR : "Embedded Aggregations"
};

const C_OBF_KEY = "U4A_ATTR_PRESET_KEY";


const 
    oContr          = {};
    oContr.msg      = {};
    oContr.ui       = {};
    oContr.fn       = {};
    oContr.attr     = {};

    /*****************************************/
    //#region 📄 MODEL 선언부.
    /*****************************************/
    oContr.oModel = new sap.ui.model.json.JSONModel({
        T_HEAD : [],
        T_ITEM : [],
        S_HEAD : {...TY_HEAD},
        S_LAYO : {...TY_LAYO},
        S_COND : {...TY_COND}

    });

    oContr.oModel.setSizeLimit(Infinity);

/******************************************************************************
//#region  💖 PRIVATE FUNCTION 선언부
******************************************************************************/
/*****************************************/
    /*************************************************************
     * @function - XXXXXXX
     *************************************************************/

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




    /************************************************************************
     * UI ATTR 유형에 따른 ICON 구성 처리.
     ************************************************************************/
    function _setAttrIcon(sAttr){

        switch (sAttr.UIATY) {
            case "1":   //property
                return CS_ATTR_ICON.PROP;

            case "2":   //event
                return CS_ATTR_ICON.EVNT;

            case "3":   //aggregation.
                //카디널리티 0:N인경우 / 0:1 인경우 아이콘 처리.
                return sAttr.ISMLB === "X" ? CS_ATTR_ICON.AGGR_MULTI : CS_ATTR_ICON.AGGR_SINLG;

            case "4":   //Associations
                return CS_ATTR_ICON.ASSO;

            case "6":   //Embedded Aggregations
                return CS_ATTR_ICON.EMBED_AGGR;
                
        }

    }




    /************************************************************************
     * attribute type에 따른 desc얻기.
     ************************************************************************/
    function _attrUIATYDesc(UIATY){
        switch(UIATY){
            case "1":   //PROPERTY
                return CS_UIATY_DESC.PROP;

            case "2":   //EVENT
                return CS_UIATY_DESC.EVNT;

            case "3":   //AGGREGATION
                return CS_UIATY_DESC.AGGR;
            
            case "4":   //ASSOCIATION
                return CS_UIATY_DESC.ASSO;

            case "6":   //EMBED AGGREGATION
                return CS_UIATY_DESC.EMBED_AGGR;

            default:
            return "";
        }

    };  //attribute type에 따른 desc얻기.




    /************************************************************************
     * UI의 bindingContext에 구성된 데이터 얻기.
     ************************************************************************/
    function _getUiContextData(oUi){

        if(!oUi?.getBindingContext){
            return;
        }

        let _oCtxt = oUi?.getBindingContext();

        if(!_oCtxt){
            return;
        }

        return _oCtxt.getProperty();

    }



    /************************************************************************
     * Buffer.from의 Node 버전별 호환 처리.
     ************************************************************************/
    function _bufferFrom(value, encoding) {
        if (Buffer.from) {
            return Buffer.from(value, encoding);
        }

        return new Buffer(value, encoding);
    }


    /************************************************************************
     * Buffer → HEX 문자열
     ************************************************************************/
    function _bufferToHex(buffer) {
        return buffer.toString("hex").toUpperCase();
    }

    
    /************************************************************************
     * 단순 XOR 난독화
     * 
     * 같은 함수로 encode / decode 모두 가능
     ************************************************************************/
    function _xorBuffer(buffer, key) {

        const keyBuffer = _bufferFrom(key, "utf8");
        const result = Buffer.alloc ? Buffer.alloc(buffer.length) : new Buffer(buffer.length);

        for (let i = 0; i < buffer.length; i++) {
            result[i] = buffer[i] ^ keyBuffer[i % keyBuffer.length];
        }

        return result;
    }




    /************************************************************************
     * attr Table의 sort 처리.
     ************************************************************************/
    function _setAttrListSort(){

        const _oBind = oContr.ui.ITEM.getBinding("items");

        //attribute 영역 그룹핑 처리.       
        _oBind.sort([new sap.ui.model.Sorter("UIATY", false, function(oContext){
            var key = oContext.getProperty("UIATY");

            return {key:key, text:_attrUIATYDesc(key)};

        }),new sap.ui.model.Sorter("UIATK", false)]);
    }




    /************************************************************************
     *  SQLite manager 클래스 생성 처리.
     ************************************************************************/
    async function _createSQLiteManager(){
        
        //ui attr의 개인화 저장 DB 경로 구성.
        let _folderPath = PATH.join(PATHINFO.P13N_ROOT, "UI_ATTR");

        //폴더가 존재하지 않는 경우 exit.
        if (!FS.existsSync(_folderPath)) {
            return;

        }
        
        let _path = PATH.join(PATHINFO.WS10_20_ROOT, "design", "util", "sqliteManager.js");

        //SQLite3 처리 클래스 module import
        let {default: sqliteManager} = await import(_path);


        //db 저장 경로 정보 구성.
        let _dbPath = PATH.join(_folderPath, "UI_ATTR_PRESET.db");


        return new sqliteManager(_dbPath);


    }




    /************************************************************************
     *  ui attribute 개인화 항목 검색.
     ************************************************************************/
    async function _getUiPresetList(sWhere){

        let _presetlist = [];

        //SQLite manager 클래스 생성 처리.
        let _sqlite = await _createSQLiteManager();

        if(!_sqlite){
            return _presetlist;
        }


        //DB 생성.
        _sqlite.createTable({
            tableName: "UI_ATTR_PRESET",
            columns: [
                "LIBVER TEXT NOT NULL",
                "SYSID TEXT NOT NULL",
                "UNAME TEXT NOT NULL",
                "UIATK TEXT NOT NULL",
                "UIOBK TEXT NOT NULL",
                "UIATV TEXT",
                "UIATY TEXT"
            ],
            primaryKey: ["LIBVER", "SYSID", "UNAME", "UIATK"]
        });


        //개인화 데이터 검색.
        _presetlist = _sqlite.selectData({
            tableName: "UI_ATTR_PRESET",
            where : sWhere            
        });

        return _presetlist;


    }




    /************************************************************************
     *  header 테이블의 선택한 라인 데이터 얻기.
     ************************************************************************/
    function _getSelHeaderData(){

        //현재 선택된 index 정보 얻기.
        let _index = oContr.ui.HEAD.getSelectedIndex();

        if(_index === -1) {
            return;
        }

        let _oCtxt = oContr.ui.HEAD.getContextByIndex(_index);

        if(!_oCtxt){
            return;
        }

        return _oCtxt.getProperty();

    }


    /************************************************************************
     *  ui attribute 개인화 header 리스트 구성.
     ************************************************************************/
    function _setHeaderList(aPresetList = []){

        let _aHead = [];

        if(aPresetList.length === 0){
            return _aHead;
        }

        let _aCollect = [];

        for (const _sPresetList of aPresetList) {

            //head 리스트 구성건인경우 하위로직 skip.
            if(_aCollect.indexOf(_sPresetList.UIOBK) !== -1){
                continue;
            }

            _aCollect.push(_sPresetList.UIOBK);

            let _s0022 = oAPP.DATA.LIB.T_0022.find( item => item.UIOBK === _sPresetList.UIOBK );

            if(!_s0022) continue;


            let _sHead = {...TY_HEAD};

            //UI OBJECT KEY.(UO00248)
            _sHead.UIOBK = _s0022.UIOBK;

            //UI명(Button)
            _sHead.UIOBJ = _s0022.UIOBJ;

            //라이브러리명(sap.m.Button)
            _sHead.LIBNM = _s0022.LIBNM;

            //UI아이콘.
            _sHead.UICON = _s0022.UICON;

            //아이콘 path.
            _sHead.ICON_PATH = PATH.join(APP.getAppPath(), "icons", `${_s0022.UICON}.gif`);

            //default 사용함.
            _sHead.ISUSE = true;

            //최상단에 ui 추가.
            _aHead.push(_sHead);

        }

        return _aHead;

    }




    /************************************************************************
     *  ui attribute 개인화 item 삭제 전 점검.
     ************************************************************************/
    function _checkDelItemData(){

        let _sRes = {...TY_RES};
        
        //attr 개인화 리스트 항목이 존재하지 않는경우.
        if(oContr.ui.ITEM.getItems().length === 0){

            _sRes.RETCD = "E";

            //630	attribute 개인화 항목이 존재하지 않습니다.
            _sRes.RTMSG = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "630");

            return _sRes;
        }


        //선택한 라인 정보 얻기.
        let _aItem = oContr.ui.ITEM.getSelectedItems();

        
        if(_aItem.length === 0){

            _sRes.RETCD = "E";

            //631	attribute 개인화 항목 선택건이 존재하지 않습니다.
            _sRes.RTMSG = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "631");

            return _sRes;
        }
        
        return _sRes;

    }




    /************************************************************************
     *  ui attribute item 항목 제거 처리.
     ************************************************************************/
    async function _deletePresetData(){

        //아이템 항목 제거 전 점검 로직.
        let _sRes = _checkDelItemData();


        //점검 오류 발생시 메시지 처리.
        if(_sRes.RETCD === "E"){
            
            sap.m.MessageToast.show(_sRes.RTMSG, 
                {my:"center center", at:"center center"});

            oAPP.fn.setBusy("");
            return;
        }


        let _cnt = oContr.ui.ITEM.getSelectedItems().length;

        const _aSelItem = oContr.ui.ITEM.getSelectedContexts();

        let _aSelData = [];

        for (const _oItem of _aSelItem) {
            _aSelData.push(_oItem.getProperty("UIATT"));
        }

        let _len = _aSelData.length;

        if(_aSelData.length > 10){
            _aSelData.splice(10);

            //653	외 $1건 선택됨...
            _aSelData.push(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "653", _len - 10));
        }   
        
        
        let _actcd = await new Promise((res)=>{
            //632	선택한 $1개의 라인을 삭제 하시겠습니까?
            sap.m.MessageBox.confirm(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "632", _cnt), {
                details : _aSelData.join("<br>"),
                onClose: function(actcd){
                    oAPP.fn.setBusy("X");
                
                    res(actcd);

                }
            });
            oAPP.fn.setBusy("");
        });
        
        if(_actcd !== "OK"){
            oAPP.fn.setBusy("");
            return;
        }


        //선택한 라인 정보 얻기.
        let _aItem = oContr.ui.ITEM.getSelectedItems();
        
        let _aUIATK = [];

        for (const _oItem of _aItem) {

            //선택한 라인의 바인딩 데이터 얻기.
            let _sItem = _getUiContextData(_oItem);

            if(!_sItem){
                continue;
            }

            _aUIATK.push(_sItem.UIATK);
            
        }


        //SQLite manager 클래스 생성 처리.
        let _sqlite = await _createSQLiteManager();

        if(!_sqlite){
            oAPP.fn.setBusy("");
            return;
        }


        //UI ATTRIBUTE KEY 조건절 구성.("?", "?", ...)
        const _sPlaceholders = _aUIATK.map(() => "?").join(", ");

        const _oResult = _sqlite.execute(
            `DELETE FROM UI_ATTR_PRESET
                WHERE LIBVER = ?
                AND SYSID  = ?
                AND UNAME  = ?
                AND UIATK IN (${_sPlaceholders})`,
            [
                oAPP.DATA.LIB.LIBVER,
                USERINFO.SYSID,
                USERINFO.ID,
                ..._aUIATK
            ]
        );
        

        //header 테이블의 선택한 라인의 데이터 얻기.
        let _sHead = {...oContr.oModel.oData.S_HEAD};

        if(!_sHead){
            oAPP.fn.setBusy("");
            return;
        }


        //삭제대상건을 제외한 ITEM 정보 발췌.
        let _aT_ITEM = oContr.oModel.oData.T_ITEM.filter( item => _aUIATK.includes(item.UIATK) === false );

        oContr.oModel.oData.T_ITEM = _aT_ITEM;
        
            
        let _pos = oContr.oModel.oData.T_HEAD.findIndex( item => item.UIOBK === _sHead.UIOBK );


        //모든 ITEM 정보가 삭제된 경우라면
        if(_aT_ITEM.length === 0){

            oContr.oModel.oData.T_HEAD.splice(_pos, 1);

            //이전 HEADER를 선택하기 위해 -1 처리
            //(0보다 작으면 0으로 설정)
            _pos = Math.max(_pos - 1, 0);
            
        }

        _sHead = oContr.oModel.oData.T_HEAD[_pos];

        
        //item List 라인 선택건 초기화.
        oContr.ui.ITEM.removeSelections();


        //모델 갱신 처리.
        oContr.oModel.refresh();


        await oContr.fn.uiUpdated();
        

        //처리 완료 메시지 호출.
        //633	삭제 처리가 완료됐습니다.
        sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "633"), 
            {my:"center center", at:"center center"});


        // //head 선택건에 따른 item 리스트 구성.
        // _selectHeadList(_sHead);

        oAPP.fn.setBusy("");

        //head list의 index에 해당하는 라인 더블클릭 이벤트 처리.
        _fireHeadSelect({UIOBK:_sHead?.UIOBK});
        

    }




    /************************************************************************
     *  header list의 ui filter 처리.
     ************************************************************************/
    function _filterHeader(filterValue = ""){

        let _oBind = oContr.ui.HEAD.getBinding("rows");

        if(!_oBind){
            return;
        }


        //header 검색조건 입력값이 존재하지 않는경우.
        if(filterValue === ""){

            //필터 해제 처리.
            _oBind.filter();

            return;

        }

        
        _oBind.filter(
            new sap.ui.model.Filter({
                filters :[
                    new sap.ui.model.Filter({
                        path:"UIOBJ", 
                        operator:"Contains",
                        value1:filterValue
                    }),

                    new sap.ui.model.Filter({
                        path:"LIBNM", 
                        operator:"Contains",
                        value1:filterValue
                    }),
                ]
            }),
            true            
        );

    }




    /************************************************************************
     *  item list의 attr filter 처리.
     ************************************************************************/
    function _filterItem(filterValue = ""){
        
        let _oBind = oContr.ui.ITEM.getBinding("items");

        if(!_oBind){
            return;
        }


        //header 검색조건 입력값이 존재하지 않는경우.
        if(filterValue === ""){

            //필터 해제 처리.
            _oBind.filter();

            return;

        }

        
        //입력값으로 design tree filter 처리.
        _oBind.filter(
            new sap.ui.model.Filter({
                filters :[
                    new sap.ui.model.Filter({
                        path:"UIATT", 
                        operator:"Contains",
                        value1:filterValue
                    }),

                    new sap.ui.model.Filter({
                        path:"UIADT", 
                        operator:"Contains",
                        value1:filterValue
                    }),

                    new sap.ui.model.Filter({
                        path:"UIATV", 
                        operator:"Contains",
                        value1:filterValue
                    }),
                ]
            }),
            true            
        );

    }





    /************************************************************************
     *  head 선택건에 따른 item 리스트 구성.
     ************************************************************************/
    async function _selectHeadList(sHead){

        oContr.oModel.oData.T_ITEM = [];

        oContr.oModel.oData.S_HEAD = {...TY_HEAD};

        oContr.oModel.oData.S_COND.ITEM = "";


        //아이템 필터 초기화.
        _filterItem("");


        //item List 라인 선택건 초기화.
        oContr.ui.ITEM.removeSelections();


        //head 리스트의 highlight 초기화.
        for (const _sHead of oContr.oModel.oData.T_HEAD) {
            _sHead.highlight = null;
        }


        if(!sHead){

            oContr.oModel.refresh();
        
            await oContr.fn.uiUpdated();

            oAPP.fn.setBusy("");
            return;
        }


        //head 정보 매핑.
        oContr.oModel.oData.S_HEAD = {...sHead};


        //UI 선택에 따른 아이템 데이터 세팅
        await oContr.fn.setItemData(sHead);


        let _sHead = oContr.oModel.oData.T_HEAD.find( item => item.UIOBK === sHead.UIOBK );

        if(_sHead){
            _sHead.highlight = "Information";
        }


        oContr.oModel.refresh();

        
        await oContr.fn.uiUpdated();


        const _oBind = oContr.ui.HEAD.getBinding("rows");

        let _index = _oBind.getContexts().findIndex( item => item.getProperty("UIOBK") === sHead.UIOBK );

        oContr.ui.HEAD.setSelectedIndex(_index);


        oAPP.fn.setBusy("");

    }


    
    /************************************************************************
     *  binding된 ui의 index에 해당하는 데이터의 라인 정보 얻기.
     ************************************************************************/
    function _getContextIndexData(sParam){

        let {oUi, aggrName, indx} = sParam;

        if(!oUi || !aggrName){
            return;
        }

        let _oBind = oUi.getBinding(aggrName);

        if(!_oBind){
            return;
        }

        let _oCtxt = _oBind.getContexts(indx, 1, 0, true);

        if(_oCtxt.length === 0){
            return;
        }

        return _oCtxt[0].getProperty();


    }



    /************************************************************************
     *  head list의 index에 해당하는 라인 더블클릭 이벤트 처리.
     ************************************************************************/
    function _fireHeadSelect(sParam){

        //현재 출력된 row에 해당 하는 데이터의 index 정보 얻기.
        let _pos = oContr.ui.HEAD.getRows().findIndex( item => item?.getBindingContext?.()?.getProperty?.("UIOBK") === sParam.UIOBK );

        //현재 출력된 row에 해당하는 데이터가 존재하지 않는 경우.
        if(_pos === -1){
            //모델 데이터에서 해당하는 데이터의 index 정보 얻기.
            _pos = oContr.oModel.oData.T_HEAD.findIndex( item => item.UIOBK === sParam.UIOBK );

            if(_pos === -1){
                return;
            }

            //해당 index의 라인이 출력되도록 scroll 처리.
            oContr.ui.HEAD.setFirstVisibleRow(_pos);

            oContr.ui.HEAD.attachEventOnce("rowsUpdated", function(){
                _fireHeadSelect(sParam);
            });

            return;
        }
        
        
        let _oRow = oContr.ui.HEAD.getRows()[_pos];

        if(!_oRow){
            return;
        }

        let _oDom = _oRow.getDomRef();

        if(!_oDom){
            return;
        }

        _oDom.dispatchEvent(new MouseEvent("dblclick", {
            bubbles: true,
            cancelable: true,
            view: window
        }));

    }


/******************************************************************************
//#region 💖  PUBLIC EVENT FUNCTION 선언부
******************************************************************************/

    /*************************************************************
    * @flowEvent - 화면이 로드 될때 타는 이벤트
    *************************************************************/
    oContr.onViewReady = async function () {
        
        parent.CURRWIN.webContents.emit("load-finish");


        //ui attr List sort 처리.
        _setAttrListSort();


        // 현재 브라우저의 이벤트 핸들러 등록.
        //(최대화/최소화에 따른 버튼 아이콘 변경 처리.)
        _attachCurrentWindowEvents();

        
        //UI attr 개인화 정보를 기준으로 출력 list 구성.
        await oContr.fn.setTableData();


        oContr.oModel.refresh();


        oContr.ui.HEAD.attachEventOnce("rowsUpdated", async function(){

            //header 리스트 0번쨰 라인 선택 처리.
            _fireHeadSelect({UIOBK: oContr.oModel.oData.T_HEAD[0]?.UIOBK});

        });
        

        oAPP.fn.setBusy('', { ISBROAD: true });



    }; // end of oContr.onViewReady




    /*************************************************************
     * @function - UI 화면 갱신 
     *************************************************************/
    oContr.fn.uiUpdated = function(){

        return new Promise(function(resolve){

            function _uiUpdated(sMsg){

                //UI UPDATED 이벤트 제거.
                _oRendering.detachUIUpdated(_uiUpdated);

                resolve();

            }

            let _oRendering = sap.ui.requireSync('sap/ui/core/Rendering');

            _oRendering.attachUIUpdated(_uiUpdated);

            oContr.oModel.setProperty("/refresh", Math.random());

        });


    };




    /*************************************************************
     * @function - UI attr 개인화 정보를 기준으로 출력 list 구성.
     *************************************************************/
    oContr.fn.setTableData = async function(){

        oContr.oModel.oData.T_HEAD = [];
        oContr.oModel.oData.T_ITEM = [];

        //ui attr 개인화 정보 검색을 위한 조건절 구성.
        let _sWhere = {
            LIBVER : oAPP.DATA.LIB.LIBVER,
            SYSID  : USERINFO.SYSID,
            UNAME  : USERINFO.ID,
        };


        //저장된 ui attr 개인화 정보 검색.
        let _aPresetList = await _getUiPresetList(_sWhere);

        if(_aPresetList.length === 0){
            return;
        }
        
        //head list 구성 처리.
        oContr.oModel.oData.T_HEAD = _setHeaderList(_aPresetList);

        //이전에 저장되어 있는 UI, UI의 ATTRIBUTE 정보 검색.

        //검색된 정보가 존재하는경우 UI 라이브러리(/U4A/T0022) 정보 검색.
        //저장된 UI, UI 라이브러리(/U4A/T0022)를 토대로 좌측 UI 리스트구성.

        //UI ATTR 정보중 ATTR 개인화 사용건이 존재하는경우 아이콘 활성화.


    };




    /*************************************************************
     * @function - ui 선택에 따른 아이템 데이터 세팅
     *************************************************************/
    oContr.fn.setItemData = async function(sHead){
        
        oContr.oModel.oData.T_ITEM = [];

        if(!sHead) return;

        //ui attr 개인화 정보 검색을 위한 조건절 구성.
        let _sWhere = {
            LIBVER : oAPP.DATA.LIB.LIBVER,
            SYSID  : USERINFO.SYSID,
            UNAME  : USERINFO.ID,
            UIOBK  : sHead.UIOBK
        };


        //저장된 ui attr 개인화 정보 검색.
        let _aPresetList = await _getUiPresetList(_sWhere);

        if(_aPresetList.length === 0){
            return;
        }

        for (const _sPresetList of _aPresetList) {
        
            let _UIATK = _sPresetList.UIATK;

            //직접 입력 가능한 AGGR 여부 확인.
            if(_UIATK.endsWith("_1")){
                _UIATK = _UIATK.replace("_1", "");
            }

            let _s0023 = oAPP.DATA.LIB.T_0023.find( item => item.UIATK === _UIATK );

            if(!_s0023){continue;}

            let _sItem = {...TY_ITEM};
            
            //UI OBJECT KEY.
            _sItem.UIOBK = _s0023.UIOBK;

            //UI ATTRIBUTE KEY.
            _sItem.UIATK = _sPresetList.UIATK;

            //UI ATTRIBUTE NAME.
            _sItem.UIATT = _s0023.UIATT;

            //UI ATTRIBUTE 개인화 입력값.
            _sItem.UIATV = _sPresetList.UIATV;

            //UI ATTRIBUTE 유형.(1: PROP, 2: EVENT, 3:AGGR, 4:ASSO, 6:EMBED AGGR)
            _sItem.UIATY = _sPresetList.UIATY;

            //UI ATTRIBUTE TYPE.
            _sItem.UIADT = _s0023.UIADT;

            // N건 입력 가능 ATTR 정보
            _sItem.ISMLB = _s0023.ISMLB;

            //UI ATTRIBUTE 유형에 따른 아이콘 바인딩 필드.
            _sItem.UIATT_ICON = _setAttrIcon(_sItem);

            oContr.oModel.oData.T_ITEM.push(_sItem);            
            
        }

    };




    /*************************************************************
     * @function - UI ATTR 개인화 데이터 갱신 처리.
     *************************************************************/
    oContr.fn.refreshPresetData = async function(sParam){

        oAPP.fn.setBusy("X");

        
        const _maxRetry = 100;
        let _retryCnt = 0;

        //db 파일이 존재하는지를 기다리는 로직 추가.
        await new Promise((res) => {
            let _checkFile = setInterval(() => {
                let _dbPath = PATH.join(PATHINFO.P13N_ROOT, "UI_ATTR", "UI_ATTR_PRESET.db");
                if (FS.existsSync(_dbPath)) {                    
                    clearInterval(_checkFile);
                    res();
                }
                _retryCnt++;
                if (_retryCnt >= _maxRetry) {
                    clearInterval(_checkFile);

                    let _msg = `${_dbPath} 경로의 DB 파일을 찾을 수 없습니다.\n` +
                                `www/ws10_20/design/attrPresetPopup/list/views/vw_main/control.js`;

                    throw new Error(_msg);
                }
            }, 100);
        });

        //HEADER LIST 필터 초기화.
        _filterHeader("");

        
        //ITEM LIST 필터 초기화.
        _filterItem("");


        //HEAD, ITEM 테이블 필터 입력값 초기화.
        oContr.oModel.oData.S_COND = {...TY_COND};


        //item List라인 선택건 초기화.
        oContr.ui.ITEM.removeSelections();

        
        // //갱신전 header 선택 라인 데이터 얻기.
        // let _sHead = {...oContr.oModel.oData.S_HEAD};


        //UI attr 개인화 정보를 기준으로 출력 list 구성.
        await oContr.fn.setTableData();


        oContr.oModel.refresh();


        let _indx =  0;

        //구성된 header 정보에서 갱신전 선택한 라인 데이터 존재 여부 확인.
        // if(_sHead){
        //     _indx = oContr.oModel.oData.T_HEAD.findIndex( item => item.UIOBK === _sHead.UIOBK );
        // }

        // _indx = oContr.oModel.oData.T_HEAD.findIndex( item => item.UIOBK === sParam.UIOBK );


        _indx = Math.max(_indx, 0);

        oContr.ui.HEAD.attachEventOnce("rowsUpdated", async function(){

            //header 리스트 0번쨰 라인 선택 처리.
            _fireHeadSelect({UIOBK: sParam.UIOBK});

        });
        

        oAPP.fn.setBusy("");

        CURRWIN.show();


    };


/********************************************************************
 //#region 💨 EVENT
 *********************************************************************/

    /*************************************************************
    //#region 테스트 데이터 구성
     *************************************************************/
    oContr.fn.onTestSaveData = async () => {

        oAPP.fn.setBusy("X");


        //SQLite manager 클래스 생성 처리.
        let _sqlite = await _createSQLiteManager();

        if(!_sqlite){
            oAPP.fn.setBusy("");
            return;
        }

        _sqlite.createTable({
            tableName: "UI_ATTR_PRESET",
            columns: [
                "LIBVER TEXT NOT NULL",
                "SYSID TEXT NOT NULL",
                "UNAME TEXT NOT NULL",
                "UIATK TEXT NOT NULL",
                "UIOBK TEXT NOT NULL",
                "UIATV TEXT",
                "UIATY TEXT"
            ],
            primaryKey: ["LIBVER", "SYSID", "UNAME", "UIATK"]
        });

        let _aT_0023 = oAPP.DATA.LIB.T_0023.filter( item => item.DEFVL !== "" && item.UIATY === "1" );

        let _aSaveData = [];

        for (const _s0023 of _aT_0023) {

            _aSaveData.push({
                LIBVER : oAPP.DATA.LIB.LIBVER,
                SYSID  : USERINFO.SYSID,
                UNAME  : USERINFO.ID,
                UIATK  : _s0023.UIATK,
                UIOBK  : _s0023.UIOBK,
                UIATV  : _s0023.DEFVL,
                UIATY  : _s0023.UIATY,
            });
            
        }


        _sqlite.upsertData({
            tableName: "UI_ATTR_PRESET",
            data: _aSaveData
        });

        sap.m.MessageToast.show("테스트 데이터 저장.", {my:"center center", at:"center center"});

        oAPP.fn.setBusy("");

    };


    
    /*************************************************************
    //#region 테스트 데이터 삭제.
     *************************************************************/
    oContr.fn.onTestDelData = async function(){

        //SQLite manager 클래스 생성 처리.
        let _sqlite = await _createSQLiteManager();

        if(!_sqlite){
            oAPP.fn.setBusy("");
            return;
        }

        _sqlite.createTable({
            tableName: "UI_ATTR_PRESET",
            columns: [
                "LIBVER TEXT NOT NULL",
                "SYSID TEXT NOT NULL",
                "UNAME TEXT NOT NULL",
                "UIATK TEXT NOT NULL",
                "UIOBK TEXT NOT NULL",
                "UIATV TEXT",
                "UIATY TEXT"
            ],
            primaryKey: ["LIBVER", "SYSID", "UNAME", "UIATK"]
        });

        
        const _oResult = _sqlite.execute(
            `DELETE FROM UI_ATTR_PRESET
                WHERE LIBVER = ? AND SYSID = ?`,
            [
                oAPP.DATA.LIB.LIBVER,
                USERINFO.SYSID
            ]
        );

        sap.m.MessageToast.show("테스트 데이터 삭제.", {my:"center center", at:"center center"});

        oAPP.fn.setBusy("");

    };



    /*************************************************************
     * @EVENT - 레이아웃 초기화.
     *************************************************************/
    oContr.fn.onPressResetLayout = () => {

        //헤더의 열 너비 초기화.
        oContr.ui.HEAD_COL.setWidth();

        //SPLITTER의 크기를 DEFAULT로 되돌림.
        oContr.oModel.oData.S_LAYO.SIZE = TY_LAYO.SIZE;

        oContr.oModel.refresh();

    };




    /*************************************************************
     * @EVENT - UI 선택 이벤트
     *************************************************************/
    oContr.fn.onSelectUI = async (oEvent) => {

        //이벤트 파라메터의 선택 index 얻기.
        let _rowIndex = oEvent.getParameter("rowIndex");

        //현재 선택된 index 정보 얻기.
        let _index = oContr.ui.HEAD.getSelectedIndex();

        if(_index === -1) {

            //선택 해제된 경우 이전 선택건을 다시 선택 처리.
            oContr.ui.HEAD.setSelectedIndex(_rowIndex);

            return;

        }

    };




    /*************************************************************
     * @EVENT - header list 더블클릭 이벤트.
     *************************************************************/
    oContr.fn.onHeadDblClick = function(oEvent){

        oAPP.fn.setBusy("X");

        let _oUi = oEvent?.srcControl;
        
        if(!_oUi){

            oAPP.fn.setBusy("");

            return;
        }

        let _sHead = _getUiContextData(_oUi);

        if(!_sHead){
            oAPP.fn.setBusy("");

            return;
        }

        //head 선택건에 따른 item 리스트 구성.
        _selectHeadList(_sHead);


    };




    /*************************************************************
     * @EVENT - header ui 찾기 이벤트.
     *************************************************************/
    oContr.fn.onFindHeader = async function(oEvent) {

        oAPP.fn.setBusy("X");

        let _filterValue = oEvent.getParameter("value");


        // /header list의 ui filter 처리.
        _filterHeader(_filterValue);


        //모델 바인딩 정보에서 첫번째 header 정보 얻기.
        let _sHead = _getContextIndexData({oUi: oAPP.views.VW_MAIN.ui.HEAD, aggrName:"rows", indx:0});
        
        // //첫번째 라인 선택 처리.
        // _selectHeadList(_sHead);

        if(!_sHead){
            oAPP.fn.setBusy("");
            return;
        }

        oContr.ui.HEAD.attachEventOnce("rowsUpdated", async function(){

            //header 리스트 0번쨰 라인 선택 처리.
            _fireHeadSelect({UIOBK : _sHead?.UIOBK});

        });

        oAPP.fn.setBusy("");


    };




    /*************************************************************
     * @EVENT - item attribute 찾기 이벤트.
     *************************************************************/
    oContr.fn.onFindItem = async function(oEvent){
        
        oAPP.fn.setBusy("X");

        let _filterValue = oEvent.getParameter("value");


        //item list의 attr filter 처리.
        _filterItem(_filterValue);


        await oContr.fn.uiUpdated();

        oAPP.fn.setBusy("");


    };




    /*************************************************************
     * @EVENT - UI ATTR 개인화 데이터 삭제 버튼 이벤트.
     *************************************************************/
    oContr.fn.onDeletePresetData = async function(){

        oAPP.fn.setBusy("X");


        //선택한 개인화 데이터 삭제 처리.
        await _deletePresetData();


    };



    /*************************************************************
     * @EVENT - UI ATTR 개인화 데이터 다운로드 처리.
     *************************************************************/
    oContr.fn.onDownloadPresetData = async function(){

        oAPP.fn.setBusy("X");
        
        //ui attr 개인화 정보 검색을 위한 조건절 구성.
        let _sWhere = {
            LIBVER : oAPP.DATA.LIB.LIBVER,
            SYSID  : USERINFO.SYSID,
            UNAME  : USERINFO.ID
        };


        //저장된 ui attr 개인화 정보 검색.
        let _aPresetList = await _getUiPresetList(_sWhere);


        if(_aPresetList.length === 0){
            //634	다운로드할 개인화 정보가 존재하지 않습니다.
            sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "634"), 
                {my:"center center", at:"center center"});
            oAPP.fn.setBusy("");
            return;
        }



        let options = {
            //635	다운로드 경로를 지정하십시오
            title: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "635"),

            properties: ['openDirectory', '']
        };

        
        //다운로드 폴더 지정.
        let _sRes = await  REMOTE.dialog.showOpenDialog(CURRWIN, options);

        if(_sRes.canceled){
            //636	다운로드가 취소되었습니다.
            sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "636"), 
                {my:"center center", at:"center center"});
            oAPP.fn.setBusy("");
            return;
        }

        let _path = _sRes.filePaths[0];


        let _downloadPath = PATH.join(_path, "UI_ATTR_PRESET.dat");


        // 1. JSON 문자열 변환
        const jsonString = JSON.stringify(_aPresetList);

        // 2. JSON 문자열 → Buffer
        const jsonBuffer = _bufferFrom(jsonString, "utf8");


        // 3. 난독화 KEY
        const key = C_OBF_KEY;

        // 4. XOR 난독화
        const encodedBuffer = _xorBuffer(jsonBuffer, key);

        // 5. Buffer → HEX 문자열
        const xstring = _bufferToHex(encodedBuffer);


        //파일로 저장.
        try {         
            FS.writeFileSync(_downloadPath, xstring, "utf8");   
        } catch (error) {
            //637	UI Attribute 개인화 파일 저장에 실패했습니다.
            sap.m.MessageBox.error(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "637"), 
                {my:"center center", at:"center center"});
            oAPP.fn.setBusy("");
            return;
        }


        //638	다운로드가 완료되었습니다.
        sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "638"), 
            {my:"center center", at:"center center"});

        oAPP.fn.setBusy("");

        

        const { shell } = require("electron");
        
        //다운로드 폴더 열기 및 파일 선택 처리.
        shell.showItemInFolder(_downloadPath);

    };




    /*************************************************************
     * @EVENT - UI ATTR 개인화 데이터 업로드 처리.
     *************************************************************/
    oContr.fn.onUploadPresetData = async function(){

        oAPP.fn.setBusy("X");

        let options = {
            //639	업로드할 파일을 선택하십시오
            title: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "639"),

            filters: [
                { name: 'Data Files', extensions: ['dat'] }
            ],

            properties: ['openFile']
        };

        
        //업로드할 파일 선택.
        let _sRes = await  REMOTE.dialog.showOpenDialog(CURRWIN, options);

        if(_sRes.canceled){
            //640	업로드가 취소되었습니다.
            sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "640"), 
                {my:"center center", at:"center center"});
            oAPP.fn.setBusy("");
            return;
        }

        let _filePath = _sRes.filePaths[0];

        let xstring;

        //파일에서 XSTRING 데이터 읽기.
        try {
            xstring = FS.readFileSync(_filePath, "utf8");

        } catch (error) {
            //641	UI Attribute 개인화 파일 정보 얻기에 실패했습니다.
            sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "641"), 
                {my:"center center", at:"center center"});
            oAPP.fn.setBusy("");
            return;
        }

        //XSTRING → Buffer
        const encodedBuffer = _bufferFrom(xstring, "hex");

        //난독화 KEY
        const key = C_OBF_KEY;

        //XOR 복호화
        const jsonBuffer = _xorBuffer(encodedBuffer, key);

        //Buffer → JSON 문자열
        const jsonString = jsonBuffer.toString("utf8");

        let presetList;

        try {
            //JSON 문자열 → 객체 변환
            presetList = JSON.parse(jsonString);
            
        } catch (error) {
            //642	UI Attribute 개인화 정보 파일 형식이 올바르지 않습니다.
            sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "642"), 
                {my:"center center", at:"center center"});
            oAPP.fn.setBusy("");
            return;
        }


        //SQLite manager 클래스 생성 처리.
        let _sqlite = await _createSQLiteManager();

        if(!_sqlite){
            oAPP.fn.setBusy("");
            return;
        }

        _sqlite.createTable({
            tableName: "UI_ATTR_PRESET",
            columns: [
                "LIBVER TEXT NOT NULL",
                "SYSID TEXT NOT NULL",
                "UNAME TEXT NOT NULL",
                "UIATK TEXT NOT NULL",
                "UIOBK TEXT NOT NULL",
                "UIATV TEXT",
                "UIATY TEXT"
            ],
            primaryKey: ["LIBVER", "SYSID", "UNAME", "UIATK"]
        });

        
        _sqlite.upsertData({
            tableName: "UI_ATTR_PRESET",
            data: presetList
        });

        //643	업로드가 완료되었습니다.
        sap.m.MessageToast.show(parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "643"), 
            {my:"center center", at:"center center"});

        //UI attr 개인화 정보를 기준으로 출력 list 구성.
        await oContr.fn.setTableData();
        

        oContr.oModel.refresh();

        await oContr.fn.uiUpdated();

        oAPP.fn.setBusy("");


        //모델 바인딩 정보에서 첫번째 header 정보 선택 처리.
        oContr.ui.HEAD.attachEventOnce("rowsUpdated", async function(){

            //header 리스트 0번쨰 라인 선택 처리.
            _fireHeadSelect({UIOBK: oContr.oModel.oData.T_HEAD[0]?.UIOBK});

        });

    };




    /*************************************************************
     * @EVENT - 도움말 버튼 클릭 이벤트.
     *************************************************************/
    oContr.fn.onPressHelp = function(){

        oAPP.fn.setBusy("X");

        IPCRENDERER.send(`if-attrPresetPopup-${USERINFO.SYSID}`,
            { PRCCD:"U4A_HELP_DOCUMENT", DATA:{startMenuId:"000278"}});


    };



/********************************************************************
 *💨 EXPORT
 *********************************************************************/

    return oContr;
}

