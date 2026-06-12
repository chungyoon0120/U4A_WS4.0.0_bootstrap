export async function getView(){

/************************************************************************
 * 💖 컨트롤러 호출
 ************************************************************************/

    let sControlPath = "./control.js";

    const oRes   = await import(sControlPath);
    const oContr = await oRes.getControl();


/************************************************************************
 * 💖 화면 그리기
 ************************************************************************/

    let APP = new sap.m.App({
        // busy: true,
        // busyIndicatorDelay: 0,
        autoFocus: false,
    }).addStyleClass("sapUiSizeCompact");

    /*****************************************
     * 📑 전체 메인
     *****************************************/
    let PAGE1 = new sap.m.Page({
        enableScrolling: false,
        showFooter: false,
    });

    PAGE1.setModel(oContr.oModel);
    
    APP.addPage(PAGE1);

    oContr.ui.APP = APP;

    return oContr;
    
}