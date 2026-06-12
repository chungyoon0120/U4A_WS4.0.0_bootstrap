
function aaaa(){
	
	debugger;
	
	aa = sap.ui.getCore().byId("__button0");
	bb = aa.data("OBJID")
	appsid = LoU4A.attr.appSid

	sChannelId = u4adevb.conf.userAgent;
	sEventId_cb = appsid + "_cb";

	evalScript = `
	(function(){
		"use strict";
		
		debugger;
		
		const oRES = {
			RETCD: "E",
			STCOD: "",
            RTMSG: "",
			RDATA: {
				styleClass: ""
			}
		};
		
		const sOBJID = "${bb}";		

		let sErrCode = "";
		try{
			
            sErrCode = "E001";
			let sStyleClass = eval(sOBJID + ".data('styleClass')");

            oRES.RETCD ="S";
            oRES.RDATA.styleClass = sStyleClass;

		} catch (error){    

			let sErrMsg = "[DEV_BROWSER-" + sErrCode + "]" + " 커스텀 CSS 구하는중 오류 발생!";		

            oRES.RETCD ="E";
            oRES.STCOD = sErrCode;
            oRES.RTMSG = sErrMsg;
			
			console.error(sErrMsg, error);
			
		}		
		
		let sChannelId = "${sChannelId}";
		let sEventId = "${sEventId_cb}";
		
		let _oEventBus = sap.ui.getCore().getEventBus();
			_oEventBus.publish(sChannelId, sEventId, oRES);	

	})();
	`;

	message = {
		prccd: "evalScript",
		payload: {
			evalScript: evalScript
		}
	};

	_oEventBus = sap.ui.getCore().getEventBus();

	// 이벤트 버스로 전송 후 콜백 받을 이벤트
	_oEventBus.subscribeOnce(sChannelId, sEventId_cb, (channelId, eventId, message) => {

		debugger;

		// resolve(message);            
	});

	_oEventBus.publish(u4adevb.conf.userAgent, `${appsid}-message`, message);

}

aaaa();