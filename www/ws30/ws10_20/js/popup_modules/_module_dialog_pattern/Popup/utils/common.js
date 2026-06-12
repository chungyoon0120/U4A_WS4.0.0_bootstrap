/******************************************************************************
 *  💖 DATA / ATTRIBUTE 선언부
 ******************************************************************************/
var G_ISBUSY = false;   // 현재 busy 상태


/*********************************************************
 * @function - 특정 Html 영역을 FadeOut 효과 주기
 *********************************************************
 * @param {DOM} oDomRef 
 * - DOM
 * @param {Integer} itime
 * - FadeOut 효과 적용 시 딜레이 타임 
 *********************************************************/
 export function domFadeOut(oDomRef, itime = 200) {

    return new Promise((resolve) => {

        $(oDomRef).fadeOut(itime, () => {
            resolve();
        });

    });

} // end of domFadeOut

/*********************************************************
 * @function - 특정 Html 영역을 FadeIn 효과 주기
 *********************************************************
 * @param {DOM} oDomRef 
 * - DOM
 * @param {Integer} itime
 * - FadeIn 효과 적용 시 딜레이 타임 
 *********************************************************/
 export function domFadeIn(oDomRef, itime = 200) {

    return new Promise((resolve) => {

        $(oDomRef).fadeIn(itime, () => {
            resolve();
        });

    });

} // end of domFadeIn


/************************************************************************
 * @function - 랜덤키 생성
 ************************************************************************/
export function generateRandomKey(length = 0) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
} // end of oAPP.fn.generateRandomKey


/************************************************************************
 * @function - 화면 Lock
 ************************************************************************/
export function lock() {

    document.body.style.pointerEvents = "none";

}

/************************************************************************
 * @function - 화면 UnLock
 ************************************************************************/
export function unlock(){

    document.body.style.pointerEvents = "";

};


/************************************************************************
 * @function - 일정시간 동안 대기
 ************************************************************************/
export function waiting (iTime = 0) {

    return new Promise(function(resolve){

        setTimeout(function(){

            resolve();

        }, iTime);

    });

};


/************************************************************************
 *  @function - busy, lock 처리.
 * **********************************************************************
 * @param {boolean} bBusy 
 *  true - busy, lock on.
 *  false - busy, lock off.
 ************************************************************************/
export function setBusy (bBusy) {

    G_ISBUSY = bBusy;

    if(bBusy === true){
        
        lock();
     
        sap.ui.core.BusyIndicator.show(0);

        return;
    }

    unlock();

    sap.ui.core.BusyIndicator.hide();

};  //busy, lock 처리.


/************************************************************************
 * @function - 메시지 박스 (Confirm)
 ************************************************************************/
export function showMsgBoxConfirm (sMsg, oOptions){

    return new Promise(function(resolve){
   
        let _sTitle             = oOptions?.title;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL];
        let _sEmphasizedAction  = oOptions?.emphasizedAction || sap.m.MessageBox.Action.OK;
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.confirm(sMsg, {
            title           : _sTitle,                                              
            styleClass      : _sStyleClass,                                   
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,                  
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            },   
        });

    });

} // end of showMsgBoxConfirm


/************************************************************************
 * @function - 메시지 박스 (Error)
 ************************************************************************/
export function showMsgBoxError (sMsg, oOptions){

    return new Promise(function(resolve){   

        let _sTitle             = oOptions?.title;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.CLOSE];
        let _sEmphasizedAction  = oOptions?.emphasizedAction;
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.error(sMsg, {
            title           : _sTitle,
            styleClass      : _sStyleClass,
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            }
        });

    });

} // end of showMsgBoxError


/************************************************************************
 * @function - 메시지 박스 (Information)
 ************************************************************************/
export function showMsgBoxInformation (sMsg, oOptions){

    return new Promise(function(resolve){   

        let _sTitle             = oOptions?.title;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.OK];
        let _sEmphasizedAction  = oOptions?.emphasizedAction || sap.m.MessageBox.Action.OK;
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.information(sMsg, {
            title           : _sTitle,
            styleClass      : _sStyleClass,
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            }
        });

    });

} // end of showMsgBoxInformation


/************************************************************************
 * @function - 메시지 박스 (Alert)
 ************************************************************************/
export function showMsgBoxAlert (sMsg, oOptions){

    return new Promise(function(resolve){   

        let _sTitle             = oOptions?.title;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.OK];
        let _sEmphasizedAction  = oOptions?.emphasizedAction || sap.m.MessageBox.Action.OK;
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.alert(sMsg, {
            title           : _sTitle,
            styleClass      : _sStyleClass,
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            }
        });

    });

} // end of showMsgBoxAlert


/************************************************************************
 * @function - 메시지 박스 (Show)
 ************************************************************************/
export function showMsgBoxShow (sMsg, oOptions){

    return new Promise(function(resolve){   

        let _sIcon              = oOptions?.icon || sap.m.MessageBox.Icon.NONE;
        let _sTitle             = oOptions?.title;
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.OK];
        let _sEmphasizedAction  = oOptions?.emphasizedAction || sap.m.MessageBox.Action.OK;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.show(sMsg, {
            icon            : _sIcon,
            title           : _sTitle,
            styleClass      : _sStyleClass,
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            }
        });

    });

} // end of showMsgBoxShow

/************************************************************************
 * @function - 메시지 박스 (Success)
 ************************************************************************/
export function showMsgBoxSuccess (sMsg, oOptions){

    return new Promise(function(resolve){   

        let _sTitle             = oOptions?.title;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.OK];
        let _sEmphasizedAction  = oOptions?.emphasizedAction || sap.m.MessageBox.Action.OK;
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.success(sMsg, {
            title           : _sTitle,
            styleClass      : _sStyleClass,
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            }
        });

    });

} // end of showMsgBoxSuccess


/************************************************************************
 * @function - 메시지 박스 (Warning)
 ************************************************************************/
export function showMsgBoxWarning (sMsg, oOptions){

    return new Promise(function(resolve){   

        let _sTitle             = oOptions?.title;
        let _sStyleClass        = oOptions?.styleClass || "";
        let _aActions           = oOptions?.actions || [sap.m.MessageBox.Action.OK];
        let _sEmphasizedAction  = oOptions?.emphasizedAction || sap.m.MessageBox.Action.OK;
        let _sInitialFocus      = oOptions?.initialFocus;
        let _sTextDirection     = oOptions?.textDirection || sap.ui.core.TextDirection.Inherit;

        sap.m.MessageBox.warning(sMsg, {
            title           : _sTitle,
            styleClass      : _sStyleClass,
            actions         : _aActions,
            emphasizedAction: _sEmphasizedAction,
            initialFocus    : _sInitialFocus,
            textDirection   : _sTextDirection,
            onClose: function(sAction){
                resolve(sAction);
            }
        });

    });

} // end of showMsgBoxWarning