/* 
*📦----------------------------------------------------------------------*
* Module       : imageCompress.js
* Category     : Release / Workspace
* Role         : file uploader의 image compress 설정을 위한 module.
*
* Creator      : pes
* Created On   : 2026-03-24
*
* Description  :
*  - fileUploader, uploadCollection UI의 image compress 설정을 위한 module.
*
*----------------------------------------------------------------------*
*/

//이미지 압축 관련 기본 설정값.
//🔔추후 설정 정보가 추가 될 경우 해당 객체에 추가하여 관리.🔔
const CS_DEFAULT = {
    enabled : false,
    quality : 0.5
};


//이미지 품질 오류 표현 바인딩 정보.
const CS_VALUST = {
    quality_vs : undefined,
    quality_vt : "",
};

const  CS_RES = {
    RETCD: "",
    RTMSG: ""
};

//이미지 압축 품질의 최소값과 최대값 상수로 정의.
const C_MIN_QUALITY = 0.01;
const C_MAX_QUALITY = 1;


export default async function(sAttr){
                    
    //image compress HTML PATH 구성.
    const _htmlPath = parent.PATH.join(oAPP.oDesign.pathInfo.designRootPath, "html", "documents", 
        "imageCompress", "index.html");

    //Help Viewer module load.
    const _viewerPath =  parent.PATH.join(oAPP.oDesign.pathInfo.designRootPath, "util", "helpViewer.js");

    //DIALOG VIEWER IMPORT.
    const {dialogViewer} = await import(_viewerPath);

    //003  Cancel
    let _cancel = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "003");

    //display 모드일경우 버튼 text를 close로 변경.
    if(oAPP.attr.oModel.oData.IS_EDIT === false){
        //056   close
        _cancel = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "056");
    }


    //UIATV값이 존재하는 경우 JSON으로 파싱, 존재하지 않는 경우 빈 객체로 초기화.
    let _sSetting = JSON.parse(sAttr.UIATV || "{}");

    //UI에 필요한 설정값이 존재하지 않는 경우 기본값으로 초기화.
    for(let key in CS_DEFAULT){
        if(_sSetting[key] === undefined){
            _sSetting[key] = CS_DEFAULT[key];
        }
    }

    const _oModel = new sap.ui.model.json.JSONModel({
        settings:_sSetting,
        valueSt :{...CS_VALUST}
    });

    //settings 정보.
    let _oPanel = _getSettingUiInfo();


    _oPanel.setModel(_oModel);


    //DIALOG VIEWER 호출.
    dialogViewer({
        control : _oPanel,

        
    }, {
        title:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "506"),  //506	Image Compression Settings
        width:"30%", 
        height:"20%", 
        draggable:true,
        resizable:true,
        disableMaximize : true,
        showHelpDocButton : true,
        u4aHelpDocMenuID : "000268", 

        actions:[
        {
            ACTCD:"OK", 
            type : "Accept",
            icon: "sap-icon://accept",
            visible : oAPP.attr.oModel.oData.IS_EDIT,
            //232	Apply
            text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "232")
        },
        {
            ACTCD:"CANCEL", 
            type: "Reject",
            icon: "sap-icon://decline",
            //003	Cancel
            text:_cancel
        }
    ], fnCallback : (sRes)=>{

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


            //이미지 압축 설정값 얻기.
            let _sSetting = _oModel.getProperty("/settings");


            //setting 입력값 점검.
            let _sRes = _checkSettingData(_sSetting);

            //입력값 점검 오류가 존재하는경우.
            if(_sRes.RETCD === "E"){

                _oModel.setProperty("/valueSt", _sRes.valueSt);
                
                parent.showMessage(sap, 20, "E", _sRes.RTMSG);

                //단축키 잠금 해제처리.
                oAPP.fn.setShortcutLock(false);

                parent.setBusy("");

                return;
            }


            //품질 숫자유형으로 변경.
            _sSetting.quality = Number(_sSetting.quality);


            let _changed = false;

            //기존 설정값과 비교하여 변경 여부 확인.
            for(let key in _sSetting){
                if(_sSetting[key] !== CS_DEFAULT[key]){
                    _changed = true;
                    break;
                }
            }

            //변경된 설정값이 존재하는 경우 JSON 문자열로 변환하여 UIATV에 저장, 변경된 설정값이 없는 경우 UIATV 초기화.
            if(_changed === false){
                sAttr.UIATV = "";
            }else{
                sAttr.UIATV = JSON.stringify(_sSetting);
            }

            sRes.dialog.close();

            //attribute 입력건에 대한 미리보기, attr 라인 style 등에 대한 처리.
            oAPP.fn.attrChangeProc(sAttr, undefined ,false, true);


            //20240621 pes.
            //바인딩 팝업의 디자인 영역 갱신처리.
            oAPP.fn.updateBindPopupDesignData();
        }
    
    });

    //단축키 잠금 해제처리.
    oAPP.fn.setShortcutLock(false);

    parent.setBusy("");
    
}



/** ───────────────────────────────────────
 * ⚙️ _checkSettingData
 * ----------------------------------------
 * 📌 설명: 변경 이력을 수집하여 표준 포맷으로 변환
 *
 * @param  {Object} ctx   실행 컨텍스트
 * @param  {Array}  list  대상 파일 목록
 * @return {Boolean} 성공 여부
*/
function _checkSettingData(sSetting){
    
    let _sRes = {...CS_RES};

    _sRes.valueSt = {...CS_VALUST};

    //input에 잘못된 값을 입력하여 모델 정보에 데이터가 없는경우.
    if(sSetting.quality === ""){

        _sRes.RETCD = "E";
        _sRes.RTMSG = "잘못된 값을 입력했습니다. 이미지 품질의 입력 허용값은 0.01 ~ 1 입니다.";

        _sRes.valueSt.quality_vs = "Error";

        _sRes.valueSt.quality_vt = _sRes.RTMSG;

        return _sRes;
    }


    //품질 입력값 숫자 형식으로 변환.
    let _quality = Number(sSetting.quality);

    //숫자 이외의 값을 입력한 경우.
    if(isNaN(_quality)){

        _sRes.RETCD = "E";
        _sRes.RTMSG = "잘못된 값을 입력했습니다. 이미지 품질의 입력 허용값은 0.01 ~ 1 입니다.";

        _sRes.valueSt.quality_vs = "Error";
        _sRes.valueSt.quality_vt = _sRes.RTMSG;

        return _sRes;

    }


    //0.01 ~ 1의 범위값을 벗어난 값을 입력한 경우.
    if (_quality < 0.01 || _quality > 1) {

        _sRes.RETCD = "E";
        _sRes.RTMSG = "잘못된 값을 입력했습니다. 이미지 품질의 입력 허용값은 0.01 ~ 1 입니다.";

        _sRes.valueSt.quality_vs = "Error";
        _sRes.valueSt.quality_vt = _sRes.RTMSG;

        return _sRes;

    }

    return _sRes;

}



/** ───────────────────────────────────────
 * ⚙️ _getSettingUiInfo
 * ----------------------------------------
 * 📌 setting 설정 UI instance.
 *
 * @return {object} setting 정보에 관련된 UI Instance
*/
function _getSettingUiInfo(){

    return new sap.m.Panel({
        expandable : true,
        expanded : true,
        width: "100%",
        headerToolbar : new sap.m.Toolbar({
            content:[
                new sap.m.Title({
                    text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "503"),  //503	Image Compression Options
                }).addStyleClass("sapUiTinyMarginEnd"),
                new sap.m.Switch({
                    enabled:oAPP.attr.oModel.oData.IS_EDIT,
                    state: "{/settings/enabled}",
                })
            ]
        }),
        content: [
            new sap.f.GridList({
                items :[
                    new sap.f.GridListItem({
                        content:[
                            new sap.m.VBox({
                                items:[
                                    new sap.m.Label({
                                        design:"Bold",
                                        text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "504"),  //504	Enable Image Compression
                                    }),
                                    new sap.m.Switch({
                                        enabled:oAPP.attr.oModel.oData.IS_EDIT,
                                        state: "{/settings/enabled}",
                                    })
                                ]
                            }).addStyleClass("sapUiTinyMargin")
                        ]
                    }),
                    new sap.f.GridListItem({
                        content:[
                            new sap.m.VBox({
                                items:[
                                    new sap.m.Label({
                                        design:"Bold",
                                        text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "505"),  //505	Image Quality

                                    }),
                                    new sap.m.HBox({
                                        renderType:"Bare",
                                        alignItems:"Center",
                                        items: [
                                            new sap.m.Input({
                                                type: "Number",
                                                width:"60px",
                                                editable: oAPP.attr.oModel.oData.IS_EDIT,
                                                value: "{/settings/quality}",
                                                valueState:"{/valueSt/quality_vs}",
                                                valueStateText:"{/valueSt/quality_vt}"

                                            }).addStyleClass("sapUiTinyMargin"),
                                            new sap.m.Slider({
                                                enabled: oAPP.attr.oModel.oData.IS_EDIT,
                                                value: "{/settings/quality}",
                                                min: 0.01,
                                                max: 1,
                                                step: 0.01,
                                                showAdvancedTooltip: true,
                                                inputsAsTooltips: true
                                            })
                                        ]
                                    })
                                ]
                            }).addStyleClass("sapUiTinyMargin")
                        ]
                    })
                ]
            }).addStyleClass("sapUiSmallMarginBottom")
        ]
    });


}