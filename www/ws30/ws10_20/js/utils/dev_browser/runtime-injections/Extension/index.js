/**
 * Extension SidePanel Open 
 */
let open = function () {

    let sScript = `
    (async function(){
        "use strict";

        return await new Promise(function(resolve){

            let sRandomChar = u4adevb.util.getRandomChar();

            let callbackId = "OPEN_EXTENSION-" + sRandomChar;

            let oSendParams = {
                target: "EXT_BACK",
                action: "OPEN_EXTENSION",
                payload: {
                    callbackId: callbackId
                }
            };

            let oExtContDom = document.getElementById(u4adevb.conf.extension.EXTENSION_CONTENT_ID);
            if(!oExtContDom){
                return;
            }

            function _callback(e){
  
                oExtContDom.removeEventListener(callbackId, _callback);
                resolve(e?.detail || {});
            }
            
            oExtContDom.addEventListener(callbackId, _callback);

            let oEvt = new CustomEvent("message", { detail: oSendParams });

            oExtContDom.dispatchEvent(oEvt);

        });

    })();
    `;

    return sScript;
};

/**
 * Extension 영역에 파라미터 전송 
 */
let sendParams = function (oParams) {

    return `
    (function(){
        "use strict";

        let oExtContDom = document.getElementById(u4adevb.conf.extension.EXTENSION_CONTENT_ID);
        if(!oExtContDom){
            return;
        }

        let oEvt = new CustomEvent("message", { detail: ${JSON.stringify(oParams)} });

        oExtContDom.dispatchEvent(oEvt);

    })();
    `
};


let fireCallback = function (callbackId, oParams) {

    let message = oParams || {};

    return `
    (function(){
        "use strict";    

        let oExtContDom = document.getElementById(u4adevb.conf.extension.EXTENSION_CONTENT_ID);
        if(!oExtContDom){
            return;
        }

        let oEvt = new CustomEvent("${callbackId}", { detail: ${JSON.stringify(message)} });

        oExtContDom.dispatchEvent(oEvt);

    })();
    `
};


let setApplyTheme = function(sThemeName){
    return `
    (function(){
        "use strict";
        u4adevb.util.setExtensionApplyTheme("${sThemeName}");
    })();`;
};

module.exports = {
    open: open,
    fireCallback: fireCallback,
    setApplyTheme: setApplyTheme,
    sendParams: sendParams
};