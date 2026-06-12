


aa = sap.ui.getCore().byId("__input0");

bb = u4adevb.util.getEventInfoFromUI(aa);

cc = bb.RDATA;

dd = cc[0];


function _cb(data){

    debugger;

}


/**
 * 1안.
 */
// evalScript = `
// (function(){
// 	"use strict";
	
// 	debugger;
	
// 	function getScript() {
	
// 		if(typeof ${dd.CEVT} !== "function"){
// 			return "";
// 		}
		
// 		return ${dd.CEVT}.toString();
		
// 	}

// 	let sScript = getScript();	

//     _cb(sScript);

// })();
// `;


evalScript = `
(function(){
	"use strict";
	
    function getScripts(aCEVT) {

        let aScriptResult = [];
        if(!aCEVT || Array.isArray(aCEVT) === false || aCEVT.length === 0){
            return aScriptResult;
        }

        debugger;

        for(var oItem of aCEVT){

            let sCEVT = oItem?.CEVT;
            if(!sCEVT){                
                continue;
            }

            let sErrCode = "E999";
            try {
                
                sErrCode = "E001";                
                if(typeof eval(sCEVT) !== 'function'){
                    continue;
                }


                sErrCode = "E002";
                let sScript = eval(sCEVT + ".toString()");

                oItem.CEVT_SCRIPT = sScript;

                aScriptResult.push(oItem);

            } catch (error) {

                let sErrMsg = "[DEV_BROWSER-" + sErrCode + "]" + "클라이언트 스크립트 구하는중 오류 발생!";
                console.error(sErrMsg, error);
                continue;

            }           

        }

        return aScriptResult;
		
	}
	
    let aCEVT = ${JSON.stringify(cc)};

    let aResult = getScripts(aCEVT);

    _cb(aResult);

})();
`;

message = {
	prccd: "evalScript",
	payload: {
		evalScript: evalScript
	}
};

agent_name = "U4A_WS_DEV_BROWSER";

_oEventBus = sap.ui.getCore().getEventBus();
_oEventBus.publish(agent_name, `${dd.APPID}-message`, message);