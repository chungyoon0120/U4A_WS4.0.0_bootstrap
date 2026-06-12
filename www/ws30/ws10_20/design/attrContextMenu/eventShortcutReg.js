/**
 * @since   2025-12-29 11:09:15
 * @version v3.5.7-4
 * @author  pes
 * @description
 * UI에 이벤트가 등록된 경우 단축키를 등록하는 기능.
 * 
 */
//처리결과 RETURN 구조.
const TY_RES = {
    RETCD : "",
    RTMSG: ""
};

// //허용 가능 단축키 항목.
let C_ALLOW_SHORTCUT = [];


/**
 * UI의 이벤트 설정건에 대해 단축키 등록처리.
 */
export default async function(is_attr){

    parent.setBusy("X");

    //단축키 잠금 처리.
    oAPP.fn.setShortcutLock(true);

    //이벤트 가능 리스트 path 구성.
    let _shortcutPath  = parent.PATH.join(oAPP.oDesign.pathInfo.designRootPath, "attrContextMenu", "shortcutList.js");

    
    let _oShortCut = await import(_shortcutPath);

    //shortcutList 가능 항목 검색.
    C_ALLOW_SHORTCUT = _oShortCut.getShortcutList();
    

    //단축키 등록전 가능여부 점검.
    let _sRes = _checkValidate(is_attr);

    //점검 오류가 존재하는경우.
    if(_sRes.RETCD === "E"){

        //오류 메시지 출력.
        parent.showMessage(sap, 20, 'E', _sRes.RTMSG);
        

        //단축키 잠금 해제 처리.
        oAPP.fn.setShortcutLock(false);

        parent.setBusy("");

        return;
    }
    

    //조회모드일때는 확인만.
    //이전 단축키 등록건 확인.
    //단축키 등록됐음 표현

    //단축키 팝업 js 호출 path 구성.
    let _path = parent.PATH.join(parent.getPath("WS10_20_ROOT"), "js", "utils", "keybindingPopup", "index.js");

    const { keyBinding } = await import(_path);


    //이전 단축키 등록정보.
    let _sPreShortCut = {};

    //단축키 등록 대상 UI, 이벤트명 정보 구성.
    _sPreShortCut.OBJID = is_attr.OBJID;
    _sPreShortCut.UIATT = is_attr.UIATT;

    //이전 단축키 정보가 존재하는경우.
    if(Object.keys(is_attr.SHCUT).length > 0){
        //이전 단축키 등록건.
        _sPreShortCut.keyBinding = is_attr.SHCUT.SCKEY;

        //이전 autoFocus 처리건.
        _sPreShortCut.autoFocus = is_attr.SHCUT.ATFOC === "X" ? true : false;
    }

    //단축키 잠금 해제 처리.
    oAPP.fn.setShortcutLock(false);

    //단축키 팝업 호출.
    let _oKeyBindingInfo = await keyBinding.openKeybindingDialog(_sPreShortCut);

    parent.setBusy("X");

    //단축키 잠금 처리.
    oAPP.fn.setShortcutLock(true);


    //단축키 팝업에서 등록 이외의 처리를 한 경우.
    if(_oKeyBindingInfo?.ACTCD !== "APPLY"){
        
        //단축키 잠금 해제 처리.
        oAPP.fn.setShortcutLock(false);

        parent.setBusy("");   
        return;
    }

    //SHORTCUT 정보 초기화.
    is_attr.SHCUT = "";

    //팝업에서 단축키 정보를 등록하지 않은경우.
    if(_oKeyBindingInfo.RDATA.keyBinding === ""){
        //attribute 입력건에 대한 처리.
        oAPP.fn.attrChange(is_attr);

        //489	단축키를 초기화 했습니다.
        parent.showMessage(sap, 10, "I", parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "489"));

        return;
    }

    
    let _sShortCut = {};

    //단축키 등록 이벤트 명.
    _sShortCut.EVTNM = is_attr.UIATT;

    //단축키 입력건.
    _sShortCut.SCKEY = _oKeyBindingInfo.RDATA.keyBinding;

    _sShortCut.ATFOC = "";

    //단축키 입력시 UI에 포커스 처리 여부값이 설정된 경우.
    if(_oKeyBindingInfo.RDATA.autoFocus === true){
        _sShortCut.ATFOC = "X";
    }


    //단축키 정보 매핑.
    // is_attr.SHCUT = JSON.stringify(_sShortCut);
    is_attr.SHCUT = _sShortCut;


    //attribute 입력건에 대한 처리.
    oAPP.fn.attrChange(is_attr);

    //488	단축키를 등록했습니다.
    parent.showMessage(sap, 10, "I", parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "488"));


}




/**
 * 단축키 등록전 가능여부 점검
 */
function _checkValidate(is_attr){

    let _sRes = {...TY_RES};


    //클라이언트 이벤트 존재 확인.
    let _sCevt = oAPP.DATA.APPDATA.T_CEVT.find( a=> a.OBJID === is_attr.OBJID + is_attr.UIASN );


    //이벤트가 등록되지 않은 경우,
    //클라이언트 이벤트가 등록되지 않은경우.
    if(is_attr.UIATV === "" && typeof _sCevt === "undefined"){
        
        _sRes.RETCD = 'E';

        //483	이벤트 등록을 먼저 진행하십시오
        _sRes.RTMSG = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "483");

        return _sRes; 

    }


    let _sUiInfo = oAPP.fn.getTreeData(is_attr.OBJID);

    
    //단축키 등록이 가능한 UI, 이벤트를 확인.
    let _allow = C_ALLOW_SHORTCUT.findIndex( item => item.UILIB === _sUiInfo.UILIB && item.UIATT === is_attr.UIATT);

    //단축키 등록이 불가능한 경우.
    if(_allow === -1){

        _sRes.RETCD = 'E';

        //484	&1 이벤트에 단축키 등록처리를 할 수 없습니다.
        _sRes.RTMSG = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "484", is_attr.UIATT);

        return _sRes; 

    }


    //n건 바인딩 처리 정보 얻기.
    let _model = oAPP.fn.getParentAggrBind(oAPP.attr.prev[is_attr.OBJID]);


    //N건 모델 바인딩 처리 정보가 존쟈하는경우.
    if(typeof _model !== "undefined" && _model !== ""){

        _sRes.RETCD = 'E';

        //485	모델 바인딩 처리된 경우 이벤트의 단축키 등록을 처리할 수 없습니다.
        _sRes.RTMSG = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "485");

        return _sRes; 

    }


    return _sRes;

}