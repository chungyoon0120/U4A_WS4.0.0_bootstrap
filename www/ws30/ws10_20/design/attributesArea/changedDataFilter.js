/* 
*📦----------------------------------------------------------------------*
* Module       : changedDataFilter
* Category     : Release / Workspace
* Role         : attribute area changed data filter
*
* Creator      : PES
* Created On   : 2026-01-28
*
* Description  :
*  - UI의 attr 항목중 변경된 데이터만 필터링 처리.
*
*----------------------------------------------------------------------*
*/
/**
 * @since   2026-01-28 15:21:21
 * @version v3.5.8-1
 * @author  pes
 * @description
 * UI의 attr 항목중 변경된 데이터만 필터링 처리.
 */


/** ───────────────────────────────────────
 * ⚙️ changedDataFilter
 * ----------------------------------------
 * 📌 설명: 변경 이력을 수집하여 표준 포맷으로 변환
 *
 * @param  {Object} sParam  filter 처리 object 정보
 * @param  {Object} sParam.oUi 필터 처리 대상 UI
 * @param  {Object} sParam.T_0015 필터 처리 대상 변경 attr 항목
 * 
*/
export function changedDataFilter(sParam){

    if(!sParam?.oUi){
        return;
    }


    //filter 처리 대상 파라메터가 존재하지 않는경우 exit.
    if(!sParam?.T_0015){
        return;
    }

    const _oBind = sParam.oUi.getBinding('items');

    if(!_oBind){
        return;
    }
    

    const _afilter = [];

    //필터링 대상 데이터가 존재하지 않는경우 필터해제 처리.
    if(sParam?.T_0015.length === 0){

        /**
         * @since   2026-02-04 18:05:06
         * @version v3.5.9-2
         * @author  pes
         * @description
         * 변경된 데이터가 존재하지 않는경우 UI의 속성정보 리스트를 강제 필터링 처리.
         */
        // _oBind.filter();

        //변경된 데이터가 존재하지 않는경우 UI의 속성정보 리스트를 강제 필터링 처리.
        _afilter.push(new sap.ui.model.Filter({path:"", operator:"EQ", value1:""}));
        _oBind.filter(_afilter);

        return;

    }

    
    /**
     * @since   2026-02-10 18:56:26
     * @version v3.6.0-0
     * @author  pes
     * @description
     * ROOT의 경우 변경 항목에 대한 필터링 처리 방식이 다르므로 별도 function으로 처리.
     * 
     */
    if(oAPP.attr.oModel.oData.uiinfo.OBJID === "ROOT"){
        setRootChangedFilter({oBind: _oBind, T_0015: sParam.T_0015});
        return;
    }


    for(const _s0015 of sParam.T_0015){

        _afilter.push(new sap.ui.model.Filter({path:"UIATK", operator:"EQ", value1:_s0015.UIATK}));

    }

    //attr 변경건에 대해 필터링 처리.
    _oBind.filter(_afilter);

}



/** ───────────────────────────────────────
 * ⚙️ clearDataFilter
 * ----------------------------------------
 * 📌 설명: 필터 초기화 처리.
 *
 * @param  {Object} sParam  filter 초기화 처리 object 정보
 * @param  {Object} sParam.oUi 필터 초기화 처리 대상 UI
 * 
*/
export function clearDataFilter(sParam){

    if(!sParam?.oUi){
        return;
    }

    const _oBind = sParam.oUi.getBinding('items');

    if(!_oBind){
        return;
    }


    _oBind.filter();


}



/** ───────────────────────────────────────
 * ⚙️ initButtonBind
 * ----------------------------------------
 * 📌 설명: 필터 버튼 초기 바인딩값 설정.
 *
 * @param  {Object} sParam  filter 초기화 처리 object 정보
 * @param  {Object} sParam.oUi 필터 초기화 처리 대상 UI
 * 
*/
export function initButtonBind(){

    oAPP.attr.oModel.oData.sAttrFilt = {
        press : false,
        //490	변경 항목 보기
        text : parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "490"), 
        icon : "sap-icon://filter"
    };

}



/** ───────────────────────────────────────
 * ⚙️ setButtonState
 * ----------------------------------------
 * 📌 설명: 변경건 필터 버튼 text, icon 구성.
 *
 * @param  {Object} sParam  속성 변경 처리 object 정보
 * @param  {Object} sParam.oUi 속성 변경 처리 대상 UI.
 * 
*/
export function setButtonState(sParam){


    if(!sParam?.oUi){
        return;
    }

    //default 값 설정.
    //490	변경 항목 보기
    let _txt = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "490");
    let _icon = "sap-icon://filter";

    if(sParam.oUi.getPressed() === true){

        //491	전체 항목 보기
        _txt = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "491");
        _icon = "sap-icon://clear-filter";

    }

    sParam.oUi.setText(_txt);
    sParam.oUi.setIcon(_icon);

}




/**
 * @since   2026-02-11 01:44:43
 * @version v3.6.0-0
 * @author  PES
 * @description
 * ROOT 영역의 ATTR 변경건 필터 로직 추가.
 */
/** ───────────────────────────────────────
 * ⚙️ setRootChangedMarker
 * ----------------------------------------
 * 📌 설명: ROOT 영역인경우 변경 항목에 대한 FILTER 처리
 *
 * @param  {Object} sParam   바인딩 정보, ROOT의 변경건 수집 정보.
*/
function setRootChangedFilter(sParam){

    const _oBind = sParam.oBind;

    const _afilter = [];

    //오브젝트(array)를 탐색하며 값이 다른지 판단 module 로드.
    const _deepEqual = sap.ui.requireSync('sap/base/util/deepEqual');

    //DOCUEMNT 속성 정보 중 수정 가능한 항목 정보만 추출.
    const _aUA003 = oAPP.attr.S_CODE.UA003.filter( item => item.FLD06 !== "X" );

    for(const _s0015 of sParam.T_0015){

        const _sUA003 = _aUA003.find( item => item.ITMCD === _s0015.UIATK );

        if(!_sUA003){
            continue;
        }

        //DEFAULT 값과 다른 경우 필터링 처리.
        if(_sUA003.FLD03 !== _s0015.UIATV){
            _afilter.push(new sap.ui.model.Filter({path:"UIATK", operator:"EQ", value1:_s0015.UIATK}));
        }

    }

    //CSS 링크 등록건 존재시.
    if(oAPP.DATA.APPDATA.T_CSLK.length > 0){
        //값을 변경한 경우 style처리.
        _afilter.push(new sap.ui.model.Filter({path:"UIATK", operator:"EQ", value1:"DH001022"}));
    }

    //JS 링크 등록건 존재시.
    if(oAPP.DATA.APPDATA.T_JSLK.length > 0){
        //값을 변경한 경우 style처리.
        _afilter.push(new sap.ui.model.Filter({path:"UIATK", operator:"EQ", value1:"DH001023"}));
    }

    //Web Security Settings 세팅값과 default 세팅값이 다른 경우.
    if(_deepEqual(oAPP.DATA.APPDATA.S_WSO, oAPP.DATA.APPDATA.S_WSO_DEF) === false){
        //값을 변경한 경우 style처리.
        _afilter.push(new sap.ui.model.Filter({path:"UIATK", operator:"EQ", value1:"DH001026"}));
    }


    //attr 변경건에 대해 필터링 처리.
    _oBind.filter(_afilter);


}