/* 
*📦----------------------------------------------------------------------*
* Module       : callInitPreScreenPopup
* Category     : Release / Workspace
* Role         : documenet 설정 - Use init pre-screen event 사용 여부 확인 팝업 호출
*
* Creator      : pes
* Created On   : 2026-03-24
*
* Description  :
*  - 해당 설정시 UI가 화면에 그려지기 전에 HANDLE_ON_INIT 이벤트를 호출할 수 있음
*    이때 FIRST_TIME 파라메터에 X값이 전달됨.
*    이후 UI가 화면에 그리진뒤 기존의 HANDLE_ON_INIT 이벤트가 호출되고 
*    FIRST_TIME 파라메터에는 공백값이 전달됨.
*
*----------------------------------------------------------------------*
*/


/*********************************************************
 * @module - Use init pre-screen event 사용 여부 확인 팝업 호출.
 ********************************************************/
export default async function(sAttr){

    //Help Viewer module load.
    const _viewerPath =  parent.PATH.join(oAPP.oDesign.pathInfo.designRootPath, "util", "helpViewer.js");

    //DIALOG VIEWER IMPORT.
    const {dialogViewer} = await import(_viewerPath);


    //232	Apply
    let _apply = parent.WSUTIL.getWsMsgClsTxt(oAPP.oDesign.settings.GLANGU, "ZMSG_WS_COMMON_001", "232");

    //003  Cancel
    let _cancel = parent.WSUTIL.getWsMsgClsTxt(oAPP.oDesign.settings.GLANGU, "ZMSG_WS_COMMON_001", "003");

    //display 모드일경우 버튼 text를 close로 변경.
    if(oAPP.attr.oModel.oData.IS_EDIT === false){
        //A39	056
        _cancel = parent.WSUTIL.getWsMsgClsTxt(oAPP.oDesign.settings.GLANGU, "ZMSG_WS_COMMON_001", "056");
    }


    //content 정보 구성.
    const _oContent = _getContent();


    let _oModel = new sap.ui.model.json.JSONModel();

    _oContent.setModel(_oModel);

    
    //팝업의 모델 초기값 설정.
    setInitPopupModelData(_oModel, sAttr);


    dialogViewer({
        control : _oContent,
    },
    {
        title:"Use init pre-screen event",
        width:"30%", 
        height:"15%", 
        draggable:true,
        resizable:true,
        disableMaximize : true,
        //HELP DOC 메뉴ID, 추후 변경 필요.
        showHelpDocButton : true,
        u4aHelpDocMenuID : "000230",
        actions:[
            {
                ACTCD:"OK", 
                type : "Accept",
                icon: "sap-icon://accept",
                visible : oAPP.attr.oModel.oData.IS_EDIT,
                //232	Apply
                text:_apply
            },
            {
                ACTCD:"CANCEL", 
                type: "Reject",
                icon: "sap-icon://decline",
                //003	Cancel
                text:_cancel
            }
        ],
        fnCallback: function(sRes){
            
            parent.setBusy("X");

            //단축키 잠금 처리.
            oAPP.fn.setShortcutLock(true);


            if(sRes?.ACTCD === "CANCEL"){

                sRes.dialog.close();

                //단축키 잠금 해제처리.
                oAPP.fn.setShortcutLock(false);

                parent.setBusy("");

                return;
            }


            //Use init pre-screen event 사용 여부 처리.
            setInitPreScreen(_oModel, sAttr);


            sRes.dialog.close();


        }
    });

    //단축키 잠금 해제처리.
    oAPP.fn.setShortcutLock(false);

    parent.setBusy("");


};



/*********************************************************
 * @function - content 정보 구성.
 ********************************************************/
function _getContent(){
    
    //254   Configure the init pre-screen event.
    let _txt01 = parent.WSUTIL.getWsMsgClsTxt(oAPP.oDesign.settings.GLANGU, "ZMSG_WS_COMMON_001", "254");

    return new sap.m.VBox({
        items: [
            new sap.m.Title({
                titleStyle: "H4",
                text : _txt01,
                tooltip: _txt01,
                wrapping: true
            }).addStyleClass("sapUiTinyMarginEnd"),
            new sap.m.Switch({
                state: "{/INTFT_STATE}",
                enabled : "{/EDIT}"
            })
        ]
    }).addStyleClass("sapUiSmallMargin");

}



/*********************************************************
 * @function - 팝업의 모델 초기값 설정.
 ********************************************************/
function setInitPopupModelData(oModel, sAttr){

    //init pre-screen event를 사용하는경우 switch 값을 true로 설정 처리.
    let _state = sAttr.UIATV === "X" ? true : false;

    oModel.setData({
        INTFT_STATE : _state,        
        EDIT : oAPP.attr.oModel.oData.IS_EDIT
    });

}




/*********************************************************
 * @function - Use init pre-screen event 사용 여부 처리.
 ********************************************************/
function setInitPreScreen(oModel, sAttr){

    
    //Use init pre-screen event를 사용하는경우 X값을, 사용하지 않는경우 공백값 매핑.
    sAttr.UIATV = oModel.oData.INTFT_STATE === true ? "X"  : "";


    //attribute 입력건에 대한 미리보기, attr 라인 style 등에 대한 처리.
    oAPP.fn.attrChangeProc(sAttr, undefined ,false, true);


    //20240621 pes.
    //바인딩 팝업의 디자인 영역 갱신처리.
    oAPP.fn.updateBindPopupDesignData();


}