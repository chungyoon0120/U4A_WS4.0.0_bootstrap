/**
 * @since   2026-01-02 02:45:57
 * @version v3.5.7-4
 * @author  PES
 * @description
 * attr 항목의 변경된 라인 style 처리.
 */


//attribute 변경됨 표현 css.
const C_ATTR_CHANGED_STYLE = "changeValue";

export function changedDataMarker(oUi){

    if(!oUi){
        return;
    }

    oUi.addEventDelegate({onAfterRendering:(e)=>{

        //모델 데이터 정보가 구성되지 않은경우 exit.
        if(!oAPP?.attr?.oModel?.oData?.uiinfo?.OBJID){
            return;
        }

        
        /**
         * @since   2026-02-11 01:44:43
         * @version v3.6.0-0
         * @author  PES
         * @description
         * ROOT 영역인 경우 ATTR 변경건 표현 처리 SKIP 로직 주석 처리.
         */
        // //현재 선택한 라인이 ROOT인경우 EXIT.
        // if(oAPP.attr.oModel.oData.uiinfo.OBJID === "ROOT"){
        //     return;
        // }
        

        const _oUi = e.srcControl;


        //ATTR 출력 리스트 정보 얻기.
        const _aItems = _oUi.getItems();

        if(_aItems.length === 0){
            return;
        }
        

        /**
         * @since   2026-02-11 01:44:43
         * @version v3.6.0-0
         * @author  PES
         * @description
         * ROOT 영역의 ATTR 변경건 표현 로직 추가.
         */
        if(oAPP.attr.oModel.oData.uiinfo.OBJID === "ROOT"){
            setRootChangedMarker(_aItems);
            return;
        }



        for (const _oItem of _aItems) {

            //이전 css 제거.
            _oItem.removeStyleClass(C_ATTR_CHANGED_STYLE);

            //bindingContext 정보 얻기.
            let _oCtxt = _oItem.getBindingContext();

            if(!_oCtxt){
                continue;
            }

            //해당 라인의 바인딩 값 얻기.
            let _sAttr = _oCtxt.getProperty();

            if(!_sAttr){
                continue;
            }


            //클라이언트 이벤트 존재시 
            if(_sAttr.UIATY === "2" && oAPP.DATA.APPDATA.T_CEVT.findIndex( a => a.OBJID === _sAttr.OBJID + _sAttr.UIASN && a.OBJTY === "JS" ) !== -1){
                //값을 변경한 경우 style처리.
                _oItem.addStyleClass(C_ATTR_CHANGED_STYLE);
                continue;
            }

            // //대상 UI의 attr 정보 얻기.
            // let _s0023 = oAPP.DATA.LIB.T_0023.find( item => item.UIOBK === _sAttr.UIOBK && 
            //     item.UIATT === _sAttr.UIATT && item.UIATY === _sAttr.UIATY);

            let _UIATK = _sAttr.UIATK;

            //직접 입력 가능한 aggregation 여부 확인.
            if(_UIATK.endsWith("_1")){
                //집접 입력 가능한 aggregation인경우 구분자 제거.
                _UIATK = _UIATK.slice(0, -2);
            }

            //대상 UI의 attr 정보 얻기.
            let _s0023 = oAPP.DATA.LIB.T_0023.find( item => item.UIATK === _UIATK );

            if(!_s0023){
                continue;
            }

            //현재 라인의 값을 변경하지 않은경우 skip.
            if(_s0023.DEFVL === _sAttr.UIATV){
                continue;
            }

            //값을 변경한 경우 style처리.
            _oItem.addStyleClass(C_ATTR_CHANGED_STYLE);
        
        }

    }});


}





/**
 * @since   2026-02-11 01:44:43
 * @version v3.6.0-0
 * @author  PES
 * @description
 * ROOT 영역의 ATTR 변경건 표현 로직 추가.
 */
/** ───────────────────────────────────────
 * ⚙️ setRootChangedMarker
 * ----------------------------------------
 * 📌 설명: ROOT 영역인경우 변경 항목에 대한 STYLE 처리 function.
 *
 * @param  {Object} aItems   ATTR 영역의 List Item 객체 배열
*/
function setRootChangedMarker(aItems){

    //오브젝트(array)를 탐색하며 값이 다른지 판단 module 로드.
    const _deepEqual = sap.ui.requireSync('sap/base/util/deepEqual');

    for (const _oItem of aItems) {

        //이전 css 제거.
        _oItem.removeStyleClass(C_ATTR_CHANGED_STYLE);

        //bindingContext 정보 얻기.
        let _oCtxt = _oItem.getBindingContext();

        if(!_oCtxt){
            continue;
        }

        //해당 라인의 바인딩 값 얻기.
        let _sAttr = _oCtxt.getProperty();

        if(!_sAttr){
            continue;
        }


        //예외 처리 비교 대상에 해당하는건 확인.
        switch (_sAttr.UIATK) {
            case "DH001022":    //CSS Link Add
                //CSS 링크 등록건 존재시.
                if(oAPP.DATA.APPDATA.T_CSLK.length > 0){
                    //값을 변경한 경우 style처리.
                    _oItem.addStyleClass(C_ATTR_CHANGED_STYLE);
                }

                break;

            case "DH001023":    //JS Link Add
                //JS 링크 등록건 존재시.
                if(oAPP.DATA.APPDATA.T_JSLK.length > 0){
                    //값을 변경한 경우 style처리.
                    _oItem.addStyleClass(C_ATTR_CHANGED_STYLE);
                }

                break;  

            case "DH001026":    //Web Security Settings
                
                //Web Security Settings 세팅값과 default 세팅값이 다른 경우.
                if(_deepEqual(oAPP.DATA.APPDATA.S_WSO, oAPP.DATA.APPDATA.S_WSO_DEF) === false){
                    //값을 변경한 경우 style처리.
                    _oItem.addStyleClass(C_ATTR_CHANGED_STYLE);
                }

                break;
        
            default:
                break;
        }

        //DOCUMENT 공통코드의 KEY에 해당하는 항목중 입력 가능 항목만 발췌.
        let _sUA003 = oAPP.attr.S_CODE.UA003.find( item => item.ITMCD === _sAttr.UIATK && item.FLD06 !== "X");

        if(!_sUA003){
            continue;
        }

        //DEFAULT 값과 다른 같은경우 SKIP.
        if(_sUA003.FLD03 === _sAttr.UIATV){
            continue;
        }

        //값을 변경한 경우 style처리.
        _oItem.addStyleClass(C_ATTR_CHANGED_STYLE);
           
    
    }



}