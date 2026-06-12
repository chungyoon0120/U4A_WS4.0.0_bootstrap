//#region [MF-001]
// var oFrame = document.getElementById('ws_frame');

// var oAPP = oFrame.contentWindow.oAPP;
var oAPP = parent.oAPP;

//#endregion

/*********************************************************
 * @module - UI 추가 불가 Aggregation 여부 점검.
 ********************************************************/
exports.checkDenyChildAggr = function(oParam) {

    //공통코드 항목이 존재하지 않는경우 판단하지 않음.
    if(typeof oAPP.attr.S_CODE.UW08 === "undefined" || oAPP.attr.S_CODE.UW08 === null){
		return false;
	}

    //파라메터 정보가 존재하지 않는경우 판단하지 않음.
    if(typeof oParam === "undefined" || oParam === null){
        return false;
    }

    //현재 UI 정보가 존재하지 않는경우 판단하지 않음.
    if(typeof oParam.UIOBK === "undefined" || oParam.UIOBK === null || oParam.UIOBK === ""){
        return false;
    }

    //점검 대상 Aggregation이 존재하지 않는경우 판단하지 않음.
    if(typeof oParam.UIATT === "undefined" || oParam.UIATT === null || oParam.UIATT === ""){
        return false;
    }

    //추가 하려는 CHILD UI 정보가 존재하지 않는경우 판단하지 않음.
    if(typeof oParam.CHILD_UIOBK === "undefined" || oParam.CHILD_UIOBK === null || oParam.CHILD_UIOBK === ""){
        return false;
    }
	

    //추가 불가능 Aggregation에 해당하는 UI 여부 확인.
	var _found = oAPP.attr.S_CODE.UW08.findIndex( item => 
		item.FLD01 === oParam.UIOBK && 
        item.FLD03 === oParam.UIATT && 
        item.FLD04 === oParam.CHILD_UIOBK &&
        item.FLD06 !== "X" );
	
    
    //해당되지 않는경우 EXIT.
	if(_found === -1){
		return false;
	}
    
    //해당되는 경우 추가 불가능 FLAG RETURN.
	return true;

};




/**
 * @since   2026-01-05 02:37:32
 * @version v3.5.7-4
 * @author  PES
 * @description
 * 특정 UI의 Aggregation은 type이 sap.ui.core.Element 이지만,
 * 실제로 허용하는 UI는 별도로 존재하여 해당 UI만 추가가 가능한 경우가 존재함.
 * 이에따라 실제 추가가 가능한 UI에 한 예외 코드를 추가하여 
 * 입력한 UI의 대상 aggregation인경우 허용 가능한지 여부를 판단하는 로직 추가.
 */
exports.checkAllowChildAggr = function(oParam){
    
    //대상 UI의 Aggregation에 허용 가능 UI 항목 공통코드가 존재하지 않는경우 exit.
    if(!oAPP.attr.S_CODE.UW10){
		return true;
	}

    //부모 UI 정보가 존재하지 않는경우 EXIT.
    if(!oParam?.PUIOK){
        return true;
    }


    //추가 대항 UI 정보가 존재하지 않는경우 EXIT.
    if(!oParam?.UIOBK){
        return true;
    }

    //대상 AGGREGATION이 존재하지 않는경우 EXIT.
    if(!oParam?.UIATT){
        return true;
    }


    //대상 UI의 Aggregation에 허용 가능 UI 항목 여부 확인.
    const _aUW10 = oAPP.attr.S_CODE.UW10.filter( item => item.FLD01 === oParam.PUIOK && 
        item.FLD03 === oParam.UIATT && item.FLD06 !== "X" );

    //대상건이 아닌경우 exit.
    if(_aUW10.length === 0){
        return true;
    }

    /**
     * @since   2026-05-23 19:07:42
     * @version v3.6.4-2
     * @author  pes
     * @description
     * UI의 허용항목에 대한 내용 확장을 위해 기존로직 주석 처리함.
     * 기존 로직의 경우 대상 UI aggregation에는 특정 UI만 허용.
     * 예를들어 sap.m.DatePicer의 specialDates aggregation은 sap.ui.core.Control 타입이기에
     * 대부분의 UI를 허용하지만 실제론 sap.ui.unified.DateTypeRange만 허용함.
     * 
     * 확장된 내용
     * sap.ui.layout.form.SimpleForm의 content Aggregation의 타입은 sap.ui.core.Element임.
     * sap.ui.core.Control의 부모 UI 이기에 더 많은 UI를 허용함.
     * 하지만 실제론 sap.ui.core.Control 으로 파생된 UI
     * sap.ui.core.Title, sap.ui.core.Toolbar(interface class), sap.ui.core.Label(interface class)
     * 의 UI만 추가할 수 있음.
     * 이에 따라 공통코드에 파생된 UI 검색 항목을 추가하여(FLD07 필드)
     * 파생건 탐색을 허용하는경우 T_0027 테이블을 추가로 탐색하여 허용되는 UI를 판단하는 로직 추가.
     * 
     */
    // //허용 UI정보가 존재하는경우 추가할 UI가 해당되는지 여부 확인.
    // if(_aUW10.findIndex( item => item.FLD04 === oParam.UIOBK ) === -1){
    //     return false;
    // }
    
    // //허용 가능한 UI인경우 허용함 flag 처리.
    // return true;


    let _allow = false;

    for(let i = 0, l = _aUW10.length; i < l; i++){

        const _sUW10 = _aUW10[i];

        //현재 UI가 부모의 aggregation에 추가 가능한 경우.
        if(_sUW10.FLD04 === oParam.UIOBK){
            _allow = true;
            break;
        }

        //공통코드 항목의 가능 UI로부터 파생된 UI를 탐색하는 flag가 존재하지 않는경우 exit.
        //(sap.ui.core.Control로부터 파생된 UI를 허용 UI로 판단하는 flag)
        if(_sUW10.FLD07 !== "X"){
            continue;
        }

        const _s0022 = oAPP.DATA.LIB.T_0022.find( item => item.UIOBK === _sUW10.FLD04 );

        if(!_s0022){
            continue;
        }

        let _TOBTY = "3";

        //대상 UI가 interface class 인경우.
        if(_s0022.OBJTY === "3"){
            //known Direct Implementations 항목을 검색하도록 변경.
            _TOBTY = "4";
        }

        //파생된 UI 탐색을 위해 해당 UI 검색 처리.
        if(oAPP.DATA.LIB.T_0027.some( item => 
            item.SGOBJ === _sUW10.FLD04 && 
            item.TGOBJ === oParam.UIOBK && 
            item.TOBTY === _TOBTY )){
            
            _allow = true;
            break;
        }


    }

    return _allow;
    
};