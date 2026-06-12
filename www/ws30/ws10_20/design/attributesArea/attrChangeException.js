/* 
*📦----------------------------------------------------------------------*
* Module       : attrChangeException.js
* Category     : Release / Workspace
* Role         : attr 변경 예외처리 module.
*
* Creator      : pes
* Created On   : 2026-02-26
*
* Description  :
*  - UI의 attribute 변경에 대한 예외처리 공통 module.
*
*----------------------------------------------------------------------*
*/

/**
 * @since   2026-02-26 16:47:56
 * @version v3.6.0-2
 * @author  pes
 * @description
 *  UI의 attribute 변경에 대한 예외처리 공통 module.
 *  해당 module에서 각 예외처리 sub module를 호출.
 */
export async function attrChangeException(sAttr){


    //해당 패치가 존재하지 않는경우 exit.
    if(!oAPP.common.checkWLOList("C", "UHAK901369")){
        return;
    }

    //WS 3.0 Attribute 예외처리 module 호출 항목 해당 여부 확인.
    const _sUW13 = oAPP.attr.S_CODE.UW13.find( item => item.FLD01 === sAttr?.UIATK );

    if(!_sUW13){
        return;
    }

    //module path 구성 처리.
    const _path = _sUW13.FLD04 + _sUW13.FLD05;

    const _module = await import(_path);
    
    await _module.default(sAttr);

    return true;


}