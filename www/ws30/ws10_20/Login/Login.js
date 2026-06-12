/************************************************************************
 * Copyright 2020. INFOCG Inc. all rights reserved. 
 * ----------------------------------------------------------------------
 * - file Name : Login.js
 * - file Desc : WS Login Page
 ************************************************************************/
let oAPP = (function () {
    "use strict";

    const
        require = parent.require,
        REMOTE = parent.REMOTE,
        REMOTEMAIN = parent.REMOTEMAIN,
        CURRWIN = REMOTE.getCurrentWindow(),
        APPPATH = parent.APPPATH,
        PATH = parent.PATH,
        REGEDIT = parent.REGEDIT,
        APP = parent.APP,
        USERDATA = APP.getPath("userData"),
        FS = parent.FS,      
        PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),        
        WSUTIL = require(PATHINFO.WSUTIL),
        autoUpdater = REMOTE.require("electron-updater").autoUpdater,
        autoUpdaterSAP = require(parent.getPath("AUTOUPDSAP")).autoUpdaterSAP,
        SERVPATH = parent.getServerPath(),
        autoUpdaterServerUrl = `${SERVPATH}/update_check`,
        OCTOKIT = REMOTE.require("@octokit/core").Octokit,
        WSLOG = require(PATH.join(PATHINFO.WS10_20_ROOT, "js", "ws_log.js")),
        GlobalShortCut = REMOTE.globalShortcut;

    let oAPP = {};
    oAPP.fn = {};
    oAPP.attr = {};
    oAPP.events = {};
    oAPP.msg = {};

    /**
     * Default Browser 기준정보
     *  @ !! 위에서 부터 Default 값 우선 순위 브라우저임!! @@
     */
    // oAPP.attr.aDefaultBrowsers = [{
    //     NAME: "CHROME",
    //     DESC: "Google Chrome Browser",
    //     REGPATH: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe",
    //     REGPATH2: "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe",
    //     APP_MODE: false,
    // },
    // {
    //     NAME: "MSEDGE",
    //     DESC: "Microsoft Edge Browser",
    //     REGPATH: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe",
    //     REGPATH2: "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe",
    //     APP_MODE: false,
    // },
    //     // {
    //     //     NAME: "IE",
    //     //     DESC: "Microsoft Internet Explorer",
    //     //     REGPATH: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\IEXPLORE.EXE",
    //     //     REGPATH2: "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\IEXPLORE.EXE"
    //     // },
    // ];

    function _checkWLOListAsync(aWLO, REGTYP, CHGOBJ) {

        if (!aWLO || Array.isArray(aWLO) === false || aWLO.length === 0) {
            return false;
        }

        let oFind = aWLO.find(e => e.REGTYP === REGTYP && e.CHGOBJ === CHGOBJ);
        if (oFind) {
            return true;
        }

        return false;

    } // end of _checkWLOListAsync



    /************************************************************************
     * div의 content DOM을 활성화 처리 한다.     
     ************************************************************************/
    function _showContentDom(bIsShow) {

        let oContentDom = document.getElementById("content");
        if (!oContentDom) {
            return;
        }

        oContentDom.style.display = "none";

        if (bIsShow === "X") {

            oContentDom.style.display = "";

            return;
        }

    } // end of _contentDomDisplay


    /************************************************************************
     * 서버 언어 데이터를 수집한다.
     * 
     * - 기존: 접속 언어에 해당하는 메시지 정보를 로그인 성공 시 서버에서 가져옴
     * - 변경: 접속 언어에 해당하는 메시지 정보를 클라이언트에서 가져옴
     * 
     ************************************************************************/
    function _serverMsgConfig(oMeta) {

        // 서버에서 가져온 메시지 구조가 없다면 만든다.
        if (!oMeta.MSGCLS || Array.isArray(oMeta.MSGCLS) === false) {
            oMeta.MSGCLS = [];
        }

        // 로그인 접속 정보를 구한다.
        let oUserInfo = parent.getUserInfo();

        // 로그인 접속 언어를 구한다.
        let sLoginLangu = oUserInfo.LANGU;

        // WS 설정 정보를 구한다.
        let oSettingsInfo = oAPP.fn.fnGetSettingsInfo();

        // WS에서 관리하고있는 PATH 정보를 구한다.
        let oPath = oSettingsInfo.path;

        // 언어별 메시지가 있는 폴더 경로를 구성한다.
        let sLanguPath = parent.PATH.join(oPath.WSMSG_ROOT, "WS_MSG", sLoginLangu, "U4AMSG_WS.json");

        if (parent.FS.existsSync(sLanguPath) === false) {
            return;
        }

        try {

            var sMsgStr = parent.FS.readFileSync(sLanguPath, "utf8");

            var aServMsg = JSON.parse(sMsgStr);

        } catch (error) {

            return;
        }

        oMeta.MSGCLS = aServMsg;

    } // end of _serverMsgConfig


    /************************************************************************
     * 로그인 결과의 리턴코드에 따른 오류 처리
     ************************************************************************/
    // function _handleLoginResultRcodeError(RCODE){

    //     // msg - 치명적인 오류가 발생하였습니다. 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 하세요.
    //     let sCriticalErrMsg = oAPP.msg.M081 + "\n\n" + oAPP.msg.M290;

    //     switch (RCODE) {

    //         // Change Password 일 경우의 메시지 처리
    //         case "R001":

    //             // MSG - You need to change your password. Please update it via SAPGUI.
    //             var sMsg = oAPP.msg.M082;

    //             console.log(sMsg);

    //             sap.m.MessageBox.warning(sMsg);

    //             return;

    //         // 필수 언어 정보가 없을 경우.
    //         case "E001":

    //             var sMsg = `[ Error code: ${RCODE} ] \n\n${sCriticalErrMsg}`;

    //             console.log(sMsg);

    //             sap.m.MessageBox.error(sMsg);

    //             return;

    //     }

    // } // end of _handleLoginResultRcodeError


    function _loginErrMsgBox(sMsg, options = {}) {

        let oMsgBoxOptions = {
            styleClass: "u4aLoginErrorMsgBox",
            ...options
        }

        sap.m.MessageBox.error(sMsg, oMsgBoxOptions);

    } // end of _loginErrMsgBox

    // oAPP.fn.setBusy = function(sBusy){

    //     parent.setDomBusy(sBusy);

    // };

    /************************************************************************
     * 기본 실행 브라우저 목록을 구한다.
     ************************************************************************/
    oAPP.fn.getDefaultBrowserInfo = () => {

        let oSettingsInfo = parent.getSettingsInfo();

        // return oAPP.attr.aDefaultBrowsers;

        return oSettingsInfo.aBrowserInfo;
    };


    /************************************************************************
     * 현재 PC에 설치되어 있는 브라우저 설치 경로를 구한다.
     ************************************************************************/
    oAPP.fn.fnCheckIstalledBrowser = () => {

        return new Promise((resolve, reject) => {

            // Default Browser 정보를 구한다.
            var aDefaultBrowsers = oAPP.fn.getDefaultBrowserInfo(),
                iBrowsCnt = aDefaultBrowsers.length;

            var aPromise = [];

            // Default Browser 기준으로 현재 내 PC에 해당 브라우저가 설치되어 있는지 
            // 레지스트리를 확인하여 설치 경로를 구한다.
            for (var i = 0; i < iBrowsCnt; i++) {

                var oPromise = oAPP.fn.fnGetBrowserInfoPromise(aDefaultBrowsers, i);

                aPromise.push(oPromise);

            }

            Promise.all(aPromise).then((aValues) => {

                parent.setDefaultBrowserInfo(aValues);

                resolve();

            });

        });

    }; // end of fnCheckIstalledBrowser

    /************************************************************************
     * 레지스트리를 확인하여 각 브라우저별 설치 경로를 구한다.
     ************************************************************************/
    oAPP.fn.fnGetBrowserInfoPromise = (aDefaultBrowsers, index) => {

        var oDefBrows = aDefaultBrowsers[index],
            sRegPath = oDefBrows.REGPATH,
            sRegPath2 = oDefBrows.REGPATH2;

        var oProm = new Promise(async (resolve) => {

            let oRETURN = Object.assign({}, aDefaultBrowsers[index]);

            if(!sRegPath && !sRegPath2){
                resolve(oRETURN);
                return;
            }

            let oBrowsInstResult = await parent.WSUTIL.getRegeditList([sRegPath, sRegPath2]);
            if (oBrowsInstResult.RETCD == "E") {
                resolve(oRETURN);
                return;
            }

            /**
             * Current User(HKCU) 경로 레지스트리 정보에 브라우저 설치 경로가 있는지 확인한다.
             */
            let oBrowsInstData = oBrowsInstResult.RTDATA,
                oCheckHKCU = oBrowsInstData[sRegPath2];

            if (oCheckHKCU.exists) {

                var oExePathObj = oCheckHKCU.values[""];
                if (oExePathObj != null) {
                    oRETURN.INSPATH = oExePathObj.value;
                    resolve(oRETURN);
                    return;
                }

            }

            /**
             * Local Machine (HKLM) 경로 레지스트리 정보에 브라우저 설치 경로가 있는지 확인한다.
             */
            let oCheckHKLM = oBrowsInstData[sRegPath];

            if (oCheckHKLM.exists) {
                var oExePathObj = oCheckHKLM.values[""];

                if (oExePathObj != null) {
                    oRETURN.INSPATH = oExePathObj.value;
                    resolve(oRETURN);
                    return;
                }

            }

            resolve(oRETURN);


            // REGEDIT.list(sRegPath, (err, result) => {

            //     var oRETURN = Object.assign({}, aDefaultBrowsers[index]);

            //     // 레지스터에 해당 패스가 없을 경우 오류 처리..
            //     if (err) {

            //         resolve(oRETURN);
            //         return;

            //     }

            //     // 해당 브라우저가 설치 되어있으면 실제 설치된 경로를 매핑한다.
            //     var sObjKey = Object.keys(result)[0],
            //         oPathObj = result[sObjKey],
            //         oExePathObj = oPathObj.values[""];

            //     if (oExePathObj != null) {
            //         oRETURN.INSPATH = oExePathObj.value;
            //     }

            //     resolve(oRETURN);

            // });

        });

        return oProm;

    }; // end of fn_onPromise

    /************************************************************************
     * WS의 설정 정보를 구한다.
     ************************************************************************/
    oAPP.fn.fnGetSettingsInfo = () => {

        // // Browser Window option
        // var oSettingsPath = PATHINFO.WSSETTINGS,

        //     // JSON 파일 형식의 Setting 정보를 읽는다..
        //     oSettings = require(oSettingsPath);
        // if (!oSettings) {
        //     return;
        // }

        return WSUTIL.getWsSettingsInfo();

    }; // end of fnGetSettingsInfo

    /************************************************************************
     * WS의 UI5 Bootstrap 정보를 생성한다.
     ************************************************************************/
    oAPP.fn.fnLoadBootStrapSetting = () => {

        let oThemeInfo = parent.getThemeInfo(); // theme 정보

        var oSettings = oAPP.fn.fnGetSettingsInfo(),
            oSetting_UI5 = oSettings.UI5,
            oBootStrap = oSetting_UI5.bootstrap;

        //     sLangu = navigator.language;

        // sLangu = sLangu.toLowerCase().substring(0, 2); // 저장된 언어 값을 0부터 2까지 자르고 소문자로 변환하여 lang에 저장
        // sLangu = sLangu.toUpperCase();

        let oSettingInfo = parent.WSUTIL.getWsSettingsInfo();
        let sLangu = oSettingInfo.globalLanguage;

        var oScript = document.createElement("script");
        if (oScript == null) {
            return;
        }

        // 공통 속성 적용
        for (const key in oBootStrap) {
            oScript.setAttribute(key, oBootStrap[key]);
        }

        oScript.setAttribute("data-sap-ui-language", sLangu);

        //20231228 pes.
        //sap.ui.table 라이브러리 추가 로드.
        oScript.setAttribute("data-sap-ui-libs", "sap.m, sap.f, sap.ui.layout");

        oScript.setAttribute("data-sap-ui-theme", oThemeInfo.THEME);
        oScript.setAttribute("src", oSetting_UI5.resourceUrl);

        document.head.appendChild(oScript);

    }; // end of fnLoadBootStrapSetting

    /************************************************************************
     * Illustration Pool에 TNT Theme를 등록한다.
     ************************************************************************/

    oAPP.fn.fnRegisterIllustrationPool = () => {

        jQuery.sap.require("sap.m.IllustrationPool");

        let oTntSet = {
            setFamily: "tnt",
            setURI: sap.ui.require.toUrl("sap/tnt/themes/base/illustrations")
        };

        let oPool = sap.m.IllustrationPool;

        // register tnt illustration set
        oPool.registerIllustrationSet(oTntSet, false);

    }; // end of oAPP.fn.fnRegisterIllustrationPool

    /************************************************************************
     * Icon Pool에 Fiori icon인 TNT ICON을 등록한다.
     ************************************************************************/
    oAPP.fn.fnRegisterFioriIconPool = () => {

        jQuery.sap.require("sap.ui.core.IconPool");

        let oTntSet = {
            collectionName: "SAP-icons-TNT",
            fontFamily: "SAP-icons-TNT",
            fontURI: sap.ui.require.toUrl("sap/tnt/themes/base/fonts"),
            lazy: true
        };

        let oIconPool = sap.ui.core.IconPool;
        oIconPool.registerFont(oTntSet);

    }; // end of oAPP.fn.fnRegisterFioriIconPool

    /************************************************************************
     * 로그인 페이지의 form
     ************************************************************************/
    oAPP.fn.fnGetLoginForm = () => {

        return new sap.ui.layout.form.Form({
            editable: true,

            layout: new sap.ui.layout.form.ResponsiveGridLayout({
                labelSpanL: 12,
                labelSpanM: 12,
                labelSpanS: 12
            }),

            formContainers: [
                new sap.ui.layout.form.FormContainer({
                    formElements: [

                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "CLIENT"
                            }),
                            fields: [
                                new sap.m.Input("ws_client", {
                                    type: sap.m.InputType.Number,
                                    value: "{CLIENT}",
                                    width: "100px",
                                    showClearIcon: true,
                                    showValueStateMessage: false,
                                    submit: oAPP.events.ev_login
                                })

                            ]
                        }),

                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "ID"
                            }),
                            fields: [

                                new sap.m.SearchField("ws_id", {
                                    value: "{ID}",
                                    showSearchButton: false,
                                    placeholder: "　",
                                    suggest: function (oEvent) {

                                        // 커서가 다른쪽으로 이미 이동했을 경우 (탭 키를 누르던지 마우스를 이용하던지간에)
                                        // suggestion을 하지 않는다.
                                        let iIndexOf = document.activeElement.id.indexOf(oEvent.getSource().getId());
                                        if (iIndexOf == -1) {
                                            return;
                                        }

                                        var sValue = oEvent.getParameter("suggestValue"),
                                            aFilters = [];

                                        if (sValue) {

                                            aFilters = [
                                                new sap.ui.model.Filter([
                                                    new sap.ui.model.Filter("ID", function (sText) {
                                                        return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
                                                    }),
                                                ], false)
                                            ];

                                        }

                                        this.getBinding("suggestionItems").filter(aFilters);
                                        this.suggest();

                                    },
                                    search: function (oEvent) {

                                        var bIsPressClearBtn = oEvent.getParameter("clearButtonPressed");
                                        if (bIsPressClearBtn) {
                                            return;
                                        }

                                        var oSuggetionItem = oEvent.getParameter("suggestionItem");
                                        if (oSuggetionItem) {
                                            return;
                                        }

                                        var iKeyCode = event.keyCode;
                                        if (iKeyCode != 13) {
                                            return;
                                        }

                                        oAPP.events.ev_login();

                                    },
                                    enableSuggestions: true,
                                    suggestionItems: {
                                        path: "/LOGIN/IDSUGG",
                                        sorter: "{ path : '/LOGIN/IDSUGG/ID' }",
                                        template: new sap.m.SuggestionItem({
                                            key: "{ID}",
                                            text: "{ID}",
                                        })
                                    }
                                }),

                            ]
                        }),

                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "PASSWORD"
                            }),
                            fields: [
                                new sap.m.Input("ws_pw", {
                                    type: sap.m.InputType.Password,
                                    value: "{PW}",
                                    showClearIcon: true,
                                    showValueHelp: true,
                                    showValueStateMessage: true,
                                    valueHelpIconSrc: "sap-icon://hide",
                                    valueHelpRequest: fnPWInputValueHelpEvent,
                                    submit: oAPP.events.ev_login
                                }).addEventDelegate({
                                    onkeydown: fnPWInputCapsLockCheck,
                                    onmousedown: fnPWInputCapsLockCheck,
                                    onfocusout: (oEvent) => {

                                        let oInput = oEvent.srcControl;
                                        let oCtx = oInput.getBindingContext();
                                        let oModel = oCtx.getModel();

                                        /**
                                         * @since   2026-03-16 00:47:44
                                         * @version v3.6.0-3
                                         * @author  soccerhs
                                         * @description
                                         * 
                                         * onfocusout 이벤트를 걸고 input에 값을 입력 후, 
                                         * 바로 다른 버튼을 선택하면 입력한 값이 모델에 반영되지 않아,
                                         * Input의 getValue() 메소드를 이용해서 화면에 입력한 값을 구한 후,
                                         * 모델에 적용한다.
                                         * 
                                         */
                                        oModel.setProperty(oCtx.getPath() + "/PW", oInput.getValue());

                                        oInput.setValueState("None");
                                        oInput.setValueStateText("");

                                    }
                                })
                            ]
                        }),

                        new sap.ui.layout.form.FormElement("ws_langu_input_form", {
                            visible: false,
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "LANGUAGE"
                            }),
                            fields: [

                                new sap.m.Input("ws_langu", {
                                    // value: "{LANGU}",
                                    value: "{LANGU}",
                                    showValueStateMessage: false,
                                    submit: oAPP.events.ev_login,
                                    change: (oEvent) => {

                                        var sValue = oEvent.getParameter("value");
                                        if (typeof sValue !== "string") {
                                            return;
                                        }

                                        var sUpperValue = sValue.toUpperCase();
                                        oEvent.getSource().setValue(sUpperValue);

                                    }
                                })

                            ]
                        }),

                        new sap.ui.layout.form.FormElement("ws_langu_select_form", {
                            visible: false,
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "LANGUAGE"
                            }),
                            fields: [

                                new sap.m.Select({
                                    selectedKey: "{LANGU}",
                                    items: {
                                        path: "T_LANGU",
                                        template: new sap.ui.core.ListItem({
                                            key: "{KEY}",
                                            text: "{LANGU}",
                                        })
                                    }
                                }),

                            ]
                        }),

                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "Workspace Language"
                            }),
                            fields: [
                                new sap.m.Select("ws_wslangu", {
                                    selectedKey: "{WSLANGU}",
                                    items: {
                                        path: "T_WSLANGU",
                                        template: new sap.ui.core.ListItem({
                                            key: "{KEY}",
                                            text: "{VALUE}",
                                        })
                                    }
                                })
                            ]
                        }),

                        new sap.ui.layout.form.FormElement({
                            label: new sap.m.Label({
                                design: sap.m.LabelDesign.Bold,
                                text: "Remember"
                            }),
                            fields: [
                                new sap.m.CheckBox("ws_rem", {
                                    selected: "{REMEMBER}"
                                })
                            ]
                        }),

                    ]
                })

            ] // end of formContainers

        });

    }; // end of oAPP.fn.fnGetLoginForm

    /************************************************************************
     * 비밀번호 입력시 caps lock 메시지
     ************************************************************************/
    function fnPWInputCapsLockCheck(oEvent) {

        let oInput = oEvent.srcControl;

        // valueHelpRequest 버튼을 눌렀을 경우 제외
        if (oInput instanceof sap.m.Input == false) {
            return;
        }

        oInput.setValueState("None");
        oInput.setValueStateText("");
        oInput.setShowValueStateMessage(false);

        let isCaps = event.getModifierState("CapsLock");
        if (!isCaps) {
            return;
        }

        oInput.setShowValueStateMessage(true);
        oInput.setValueState("Information");
        oInput.setValueStateText("Caps lock is switched on.");

    }; // end of fnPWInputCapsLockCheck

    /************************************************************************
     * 비밀번호 보이기 숨기기 이벤트
     ************************************************************************/
    function fnPWInputValueHelpEvent(oEvent) {

        let oInput = oEvent.getSource();
        let sInputType = oInput.getType();
        let oCtx = oInput.getBindingContext();
        let oModel = oCtx.getModel();

        let sDefType = "Password";
        let sDefIcon = "sap-icon://hide";

        // f4Help 선택 시, Input type을 변경하면 기존 값 사라지는 문제
        // oInput.setValue(oInput.getValue());

        /**
         * @since   2026-03-16 00:47:44
         * @version v3.6.0-3
         * @author  soccerhs
         * @description
         * 
         * ValueHelp Event 수행 시, Input에 입력된 값이 모델에 반영되지 않아,
         * Input의 getValue() 메소드를 이용해서 화면에 입력한 값을 구한 후,
         * 모델에 적용한다.
         * 
         */
        oModel.setProperty(oCtx.getPath() + "/PW", oInput.getValue());

        if (sInputType === sDefType) {

            oInput.setType("Text");
            oInput.setValueHelpIconSrc("sap-icon://show");

            return;
        }

        oInput.setType(sDefType);
        oInput.setValueHelpIconSrc(sDefIcon);

    } // end of fnPWInputValueHelpEvent

    /************************************************************************
     * U4A R&D Staff 자동 로그인 버튼
     ************************************************************************/
    oAPP.fn.fnGetStaffLoginButton = () => {

        return [

            new sap.m.Button({
                text: "영선",
                press: function () {
                    oAPP.fn.fnStaffLogin("yshong");
                }
            }),
            new sap.m.Button({
                text: "성호",
                press: function () {
                    oAPP.fn.fnStaffLogin("shhong");
                }
            }).addStyleClass("sapUiTinyMarginBeginEnd"),
            new sap.m.Button({
                text: "은섭",
                press: function () {
                    oAPP.fn.fnStaffLogin("pes");
                }
            }),
            new sap.m.Button({
                text: "청윤",
                press: function () {
                    oAPP.fn.fnStaffLogin("soccerhs");
                }
            }).addStyleClass("sapUiTinyMarginBeginEnd"),

        ];

    }; // end of oAPP.fn.fnGetStaffLoginButton

    /************************************************************************
     * U4A R&D Staff 자동 로그인
     ************************************************************************/
    oAPP.fn.fnStaffLogin = (sStaffID) => {

        var oId = sap.ui.getCore().byId("ws_id"),
            oPw = sap.ui.getCore().byId("ws_pw"),
            oLogInBtn = sap.ui.getCore().byId("ws_loginBtn");

        oId.setValue(sStaffID);

        switch (sStaffID) {
            case "yshong":
                oPw.setValue("1qazxsw2");
                break;

            case "shhong":
                oPw.setValue("2wsxzaq1!");
                break;

            case "pes":
                oPw.setValue("dmstjq8!");
                break;

            case "soccerhs":
                oPw.setValue("cjddbs12");
                break;

        }

        oLogInBtn.firePress();

    }; // end of oAPP.fn.fnStaffLogin

    /************************************************************************
     * 로그인 페이지의 form 영역을 감싸는 Card (sap.f.Card)
     ************************************************************************/
    oAPP.fn.fnGetLoginFormFCard = () => {

        var oForm = oAPP.fn.fnGetLoginForm(),
            aStaffBtns = oAPP.fn.fnGetStaffLoginButton();

        let oCard = new sap.f.Card({
            width: "50%",

            header: new sap.f.cards.Header({
                iconSrc: PATHINFO.WS_LOGO,
                title: "U4A Workspace Login",
                iconDisplayShape: sap.m.AvatarShape.Square,

            }),
        }).addStyleClass("u4aWsLoginFormFcard sapUiContentPadding");

        let oVBox1 = new sap.m.VBox({
            width: "100%",
            renderType: sap.m.FlexRendertype.Bare,
            layoutData: new sap.m.FlexItemData({
                styleClass: "sapUiTinyMarginTop"
            }),
            items: [

                oForm,

                new sap.m.Button("ws_loginBtn", {
                    text: "LOGIN",
                    width: "100%",
                    type: sap.m.ButtonType.Emphasized,
                    press: oAPP.events.ev_login
                }),

            ]

        });

        oCard.setContent(oVBox1);

        let oHBox1 = new sap.m.HBox({
            items: aStaffBtns,
            layoutData: new sap.m.FlexItemData({
                styleClass: "sapUiTinyMarginTop"
            }),
        });

        /**
         * @since   2026-03-04 17:05:15
         * @version v3.6.0-2
         * @author  soccerhs
         * @description
         *  
         * 속도 느린 PC 에서 어드민 자동 로그인 버튼이 살짝 보였다가 사라지는 문제 수정
         * - 조건에 맞을 경우에만 스태프 버튼을 화면에 붙인다.
         */

        let oServerInfo = parent.getServerInfo();
        if(parent.isU4A_RND_SERVER(oServerInfo.SYSID)){
            oVBox1.addItem(oHBox1);
        }

        return oCard;

    }; // end of oAPP.fn.fnGetLoginFormFCard

    /************************************************************************
     * 로그인 페이지
     ************************************************************************/
    oAPP.fn.fnGetLoginPage = () => {

        var oFcard = oAPP.fn.fnGetLoginFormFCard();

        return new sap.m.Page({

            // properties
            showHeader: false,
            showFooter: true,
            backgroundDesign: sap.m.PageBackgroundDesign.Transparent,
            enableScrolling: false,

            // aggregations
            customHeader: new sap.m.Bar({
                contentLeft: [
                    new sap.m.Image({
                        width: "25px",
                        src: PATHINFO.WS_LOGO
                    }),
                    new sap.m.Title({
                        text: "U4A Workspace - Login"
                    }),
                ],
                contentRight: [

                    new sap.m.Button({
                        icon: "sap-icon://less",
                        press: function () {

                            CURRWIN.minimize();

                        }
                    }),
                    new sap.m.Button("maxWinBtn", {
                        icon: "sap-icon://header",
                        press: function (oEvent) {

                            let bIsMax = CURRWIN.isMaximized();

                            if (bIsMax) {
                                CURRWIN.unmaximize();
                                return;
                            }

                            CURRWIN.maximize();

                        }
                    }),
                    new sap.m.Button({
                        icon: "sap-icon://decline",
                        press: function () {

                            oAPP.attr.isPressWindowClose = "X";

                            CURRWIN.close();

                        }
                    }),

                ]
            }).addStyleClass("u4aWsBrowserDraggable"),

            content: [

                new sap.m.VBox({

                    // properties
                    alignItems: sap.m.FlexAlignItems.Center,
                    renderType: sap.m.FlexRendertype.Bare,
                    alignItems: sap.m.FlexAlignItems.Center,
                    justifyContent: sap.m.FlexJustifyContent.Center,
                    width: "100%",
                    height: "100%",

                    // Aggregations
                    items: [
                        oFcard
                    ]

                })

            ],
            footer: new sap.m.Toolbar({
                content: [
                    new sap.m.Text({
                        text: "Copyright 2022. Infocg inc. all rights reserved."
                    }),

                    new sap.m.ToolbarSpacer(),

                    // new sap.m.Text({
                    //     text: "CLIENT: {/LOGIN/CLIENT}"
                    // }),

                    new sap.m.Text({
                        text: "SYSID: {/LOGIN/SYSID}"
                    }),

                ]
            })
            // .addStyleClass("sapUiSizeCompact")

        })
            .bindElement("/LOGIN")
            .addStyleClass("u4aWsLoginPage");

    }; // end of oAPP.fn.fnGetLoginPage

    /************************************************************************
     * 로그인 페이지 초기 렌더링
     ************************************************************************/
    oAPP.fn.fnOnInitRendering = () => {

        var oApp = new sap.m.App({
            autoFocus: false,
        });

        // oApp.addStyleClass("sapUiSizeCompact");

        var oLoginPage = oAPP.fn.fnGetLoginPage();

        oApp.addPage(oLoginPage);
        oApp.placeAt("content");

    }; // end of oAPP.fn.fnOnInitRendering   

    /************************************************************************
     * 로그인 페이지 초기 렌더링
     ************************************************************************/
    oAPP.fn.fnOnInitModelBinding = () => {

        let oUserInfo = parent.getUserInfo(),
            oServerInfo = parent.getServerInfo(),
            bIsRemember = oAPP.fn.fnGetRememberCheck(),
            oRememberInfo = oAPP.fn.fnGetRememberLoginInfo();

        if (oUserInfo) {
            parent.setUserInfo(null);
            parent.setServerInfo(parent.getBeforeServerInfo());
            oServerInfo = parent.getServerInfo();
        }

        // SAP Client
        let sClient = (bIsRemember ? oRememberInfo && oRememberInfo.CLIENT || "" : oServerInfo.CLIENT);

        // SAP Language
        let sLangu = (bIsRemember ? oRememberInfo && oRememberInfo.LANGU || "" : oServerInfo.LANGU);

        // SAP ID
        let sId = (bIsRemember ? oRememberInfo && oRememberInfo.ID || "" : "");

        // Workspace Language
        let sWsLangu = (bIsRemember ? oRememberInfo && oRememberInfo.WSLANGU || "" : "");

        // Login 모델 데이터
        let oLoginData = {
            CLIENT: sClient,              // SAP Client
            ID: sId,                  // SAP ID
            PW: "",                   // SAP Password
            LANGU: sLangu,               // SAP Language            
            SYSID: oServerInfo.SYSID,    // SAP System ID
            WSLANGU: sWsLangu,             // Workspace Language
            T_WSLANGU: [
                { KEY: "EN", VALUE: "EN" },
                { KEY: "KO", VALUE: "KO" },
            ],
            T_LANGU: [],                  // Workspace Language List
            REMEMBER: bIsRemember,          // Remember Flag
            IDSUGG: [],                      // SAP ID Suggest Data
            SERVER_SETTINGS: oServerInfo.SETTINGS // 서버 설정 정보
        };


        let oBusyPopInit = {
            TITLE: "Checking for updates...",
            DESC: "　",
            ILLUSTTYPE: "sapIllus-BeforeSearch",
            PROGVISI: false,
            PERVALUE: 0,
            ANIMATION: true
        };

        let oBusyPopData = {
            TITLE: "Checking for updates...",
            DESC: "　",
            ILLUSTTYPE: "sapIllus-BeforeSearch",
            PROGVISI: false,
            PERVALUE: 0,
            ANIMATION: true
        };

        // ID Suggest Data
        let aIDSugg = oAPP.fn.fnReadIDSuggData();

        oLoginData.IDSUGG = aIDSugg;

        let oJsonModel = new sap.ui.model.json.JSONModel();
        let oData = {
            LOGIN: oLoginData,
            BUSYPOPINIT: oBusyPopInit,
            BUSYPOP: oBusyPopData,
        };

        let oCoreModel = sap.ui.getCore().getModel();
        if (oCoreModel == null) {

            oJsonModel.setData(oData);

            sap.ui.getCore().setModel(oJsonModel);

            return;
        }

        oCoreModel.setData(oData);

        oCoreModel.refresh();

    }; // end of oAPP.fn.fnOnInitModelBinding

    /************************************************************************
     * 로그인 버튼 클릭
     ************************************************************************/
    //#region - 로그인
    //#endregion
    oAPP.events.ev_login = (oPARAM) => {

        parent.setDomBusy('X');

        let oCoreModel = sap.ui.getCore().getModel();
        if (oCoreModel == null) {

            parent.setDomBusy("");

            // div의 content DOM을 활성화 처리 한다.
            _showContentDom("X");

            return;
        }

        let oLogInData = oCoreModel.getProperty("/LOGIN");
        if (oLogInData == null) {

            parent.setDomBusy("");

            // div의 content DOM을 활성화 처리 한다.
            _showContentDom("X");

            return;
        }

        // SSO 로그인 처리가 아닐 경우에만 로그인 입력값 체크를 수행 한다.
        if (typeof oPARAM?.SSO_TICKET === "undefined") {

            var oResult = oAPP.fn.fnLoginCheck(oLogInData.ID, oLogInData.PW, oLogInData.CLIENT, oLogInData.LANGU);
            if (oResult.RETCD == 'E') {

                // 메시지 처리.. 
                // parent.showMessage(null, 99, "E", oResult.MSG);
                sap.m.MessageToast.show(oResult.MSG, { width: "auto" });

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;

            }

        }

        // Remember 정보 저장
        oAPP.fn.fnSaveRemember(oLogInData);

        // 로그인 아이디 저장
        oAPP.fn.fnSaveIDSuggData(oLogInData.ID);

        let oSettings = WSUTIL.getWsSettingsInfo();

        var sServicePath = parent.getServerPath() + "/wsloginchk";

        var oFormData = new FormData();

        // SSO 처리가 아닐 경우에만 아래의 FormData를 전송한다.
        // SSO 처리 일 경우는 아래 정보는 필요 없음.
        if (typeof oPARAM?.SSO_TICKET === "undefined") {

            oFormData.append("sap-user", oLogInData?.ID);
            oFormData.append("sap-password", oLogInData?.PW);
            oFormData.append("sap-client", oLogInData?.CLIENT);

        }

        // 필수!!
        oFormData.append("sap-language", oLogInData?.LANGU);
        oFormData.append("SYSID", oLogInData?.SYSID);

        oFormData.append("WSVER", oSettings.appVersion);
        oFormData.append("WSPATCH_LEVEL", oSettings.patch_level);

        oFormData.append("PRCCD", "00");    // 로그인에서 호출하고 있다는 구분자 (로그인 성공시: [/wsloginchk] 서비스 부분에서 참조하는 파라미터)
        oFormData.append("ACTCD", "001");   // 로그인에서 호출하고 있다는 구분자 (로그인 실패시: WS_LOGIN 클래스 부분에서 참조하는 파라미터)

        var oPwInput = sap.ui.getCore().byId("ws_pw");

        var xhr = new XMLHttpRequest();

        xhr.onload = async function (e) {

            let u4a_status = xhr.getResponseHeader("u4a_status");
            if (u4a_status) {

                var oResult;

                try {

                    oResult = JSON.parse(xhr.response);

                } catch (error) {

                    // 콘솔용 오류 메시지
                    var aConsoleMsg = [
                        `\n############# 로그인 오류 ###############`,
                        `[PATH]: www/Login/Login.js`,
                        `=> oAPP.events.ev_login`,
                        `=> 'u4a_status' 응답 헤더에 값이 있을 경우에 JSON parse Error!!\n`,
                        `[xhr.response]: ${xhr.response}`,
                        `########################################\n`,
                    ];

                    console.error(error);
                    console.error(aConsoleMsg.join("\r\n"));
                    console.trace();

                    // 치명적인 오류가 발생하였습니다.
                    // 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 하세요.
                    let sErrMsg = oAPP.msg.M295 + "\n\n";
                    sErrMsg += oAPP.msg.M290;

                    // sap.m.MessageBox.error(sErrMsg);

                    /**
                     * @since   2025-06-25
                     * @version v3.5.6-8
                     * @author  soccerhs
                     * 
                     * @description
                     * 로그인창 실행 시 오류 발생에 대한 확인 및 조치 가이드 내용 추가
                     *
                     * - 기존:
                     *   단순 서버 접속 실패 메시지
                     * 
                     * - 변경:
                     *   접속 실패 메시지와 함께 확인 사항 가이드 내용 추가
                     */
                    let sTitle = oAPP.msg.M417; // 서버 연결 실패!

                    // 로그인 오류 메시지 Dialog 호출
                    _openLoginErrorDialog({ TITLE: sTitle, DESC: sErrMsg });

                    parent.setDomBusy("");

                    // div의 content DOM을 활성화 처리 한다.
                    _showContentDom("X");

                    return;
                }

                // // 잘못된 url 이거나 지원하지 않는 기능 처리
                // oAPP.common.fnUnsupportedServiceUrlCall(u4a_status, oResult);

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;
            }

            var oResult;

            try {

                oResult = JSON.parse(xhr.response);

                oResult.SERVER_SETTINGS = oLogInData.SERVER_SETTINGS;

            } catch (error) {

                // 콘솔용 오류 메시지
                var aConsoleMsg = [
                    `\n############# 로그인 오류 ###############`,
                    `[PATH]: www/Login/Login.js`,
                    `=> oAPP.events.ev_login`,
                    `=> oResult = JSON.parse(xhr.response)`,
                    `로그인 처리시 약속된 JSON 구조가 아님!!\n`,
                    `[xhr.response]: ${xhr.response}`,
                    `########################################\n`,
                ];

                console.error(error);
                console.error(aConsoleMsg.join("\r\n"));
                console.trace();

                /**
                 * 📝 2024-06-27 soccerhs
                 * 로그인 처리시 약속된 JSON 구조가 아닐 경우는 알수 없는 오류처리
                 */

                // MSG - 로그인 처리 하는 과정에서 문제가 발생하였습니다. 담당자에게 문의하세요.
                let sErrMsg = oAPP.msg.M081;

                // sap.m.MessageBox.error(sErrMsg);  

                /**
                 * @since   2025-06-25
                 * @version v3.5.6-8
                 * @author  soccerhs
                 * 
                 * @description
                 * 로그인창 실행 시 오류 발생에 대한 확인 및 조치 가이드 내용 추가
                 *
                 * - 기존:
                 *   단순 서버 접속 실패 메시지
                 * 
                 * - 변경:
                 *   접속 실패 메시지와 함께 확인 사항 가이드 내용 추가
                 */
                let sTitle = oAPP.msg.M417; // 서버 연결 실패!

                // 로그인 오류 메시지 Dialog 호출
                _openLoginErrorDialog({ TITLE: sTitle, DESC: sErrMsg });

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;

            }

            if (oResult.TYPE === "E") {

                if (oPwInput) {
                    oPwInput.setValue("");
                }

                /**
                 * 📝 2024-06-27 soccerhs
                 * Change Password 일 경우의 메시지 처리
                 */
                if (oResult.RCODE === "R001") {

                    // MSG - You need to change your password. Please update it via SAPGUI.
                    let sMsg = oAPP.msg.M082;

                    console.log(sMsg);

                    sap.m.MessageBox.warning(sMsg);

                    parent.setDomBusy("");

                    // div의 content DOM을 활성화 처리 한다.
                    _showContentDom("X");

                    return;

                }

                //20231228 pes -start.
                //권한 점검 오류가 발생한 경우.
                //오류 권한 리스트 팝업 호출.
                var _called = await oAPP.fn.fnCallAuthErrorListPopup(oResult);
                if (_called === true) {

                    parent.setDomBusy("");

                    // div의 content DOM을 활성화 처리 한다.
                    _showContentDom("X");

                    return;
                }
                //20231228 pes -end.                

                var sMsg = "";
                /**
                 * @since   2026-03-23 01:01:00
                 * @version v3.6.0-4
                 * @author  soccerhs
                 * @description
                 * 
                 * 로그인 체크 중 오류 발생에 대한 내용 보완
                 * 백앤드에서 로그인 체크 시, 필수 정보 누락할 경우
                 * 빠르게 식별 가능한 코드를 메시지로 출력하여
                 * 신속한 대응을 위한 로직 강화함.
                 */
                // msg - 치명적인 오류가 발생하였습니다. 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 하세요.
                let sCriticalErrMsg = oAPP.msg.M295 + "\n" + oAPP.msg.M290;

                let sSTCOD = oResult?.STCOD || "";
                if(sSTCOD){
                    // sMsg = `[ Error code: ${sSTCOD} ]\n${sCriticalErrMsg}\n\n${oResult.MSG}`;
                    sMsg = `[ Error code: ${sSTCOD} ]\n${sCriticalErrMsg}`;
                } else {
                    sMsg = oResult.MSG;
                }

                console.log(sMsg);

                // 오류 처리..    
                // sap.m.MessageBox.error(oResult.MSG);
                sap.m.MessageBox.error(sMsg);

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;

            }

            // HTTP ONLY 값을 글로벌에 저장
            oAPP.attr.HTTPONLY = oResult.HTTP_ONLY;
            oAPP.attr.LOGIN = oLogInData;


            oAPP.attr.LOGIN_INFO = oResult;


            // 여기까지 온건 로그인 성공했다는 뜻이니까 
            // 권한 체크를 수행한다.
            try {
                //#region - 로그인 -> 권한 체크
                //#endregion
                var oAuthInfo = await oAPP.fn.fnCheckAuthority();
                if (oAuthInfo?.TYPE === "E") {

                    // 오류 처리..    
                    sap.m.MessageBox.error(oAuthInfo.MSG);

                    parent.setDomBusy("");

                    // div의 content DOM을 활성화 처리 한다.
                    _showContentDom("X");

                    // 콘솔용 오류 메시지
                    var aConsoleMsg = [
                        `[PATH]: www/Login/Login.js`,
                        `=> oAPP.events.ev_login`,
                        `=> oAPP.fn.fnCheckAuthority`,
                        `=> [RETURN]: ${JSON.stringify(oAuthInfo)}`,
                        `=> [DESC]  : 권한 체크 중 오류 발생!!`,
                    ];

                    console.error(aConsoleMsg.join("\r\n"));

                    return;
                }

            } catch (e) {

                // 콘솔용 오류 메시지
                var aConsoleMsg = [
                    `\n############# 로그인시 권한 체크 오류 ###############`,
                    `[PATH]: www/Login/Login.js`,
                    `=> oAPP.events.ev_login`,
                    `=> var oAuthInfo = await oAPP.fn.fnCheckAuthority()\n`,
                    `=> try...catch 오류`,
                    `#####################################################\n`,
                ];

                console.error(e);
                console.error(aConsoleMsg.join("\r\n"));

                // 권한이 없으므로 오류 메시지를 띄운다.
                oAPP.fn.fnShowNoAuthIllustMsg(e);

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;

            }

            // trial 버전 확인
            var oWsSettings = oAPP.fn.fnGetSettingsInfo(),
                bIsTrial = oWsSettings.isTrial,
                bIsPackaged = APP.isPackaged;

            oAuthInfo.IS_TRIAL = bIsTrial; // 유저 권한 정보에 Trial 정보를 저장한다.

            // no build일 경우 혹은 Trial 버전일 경우는 최신 버전 체크를 하지 않는다.                        
            if (!bIsPackaged || bIsTrial) {

                // parent.setDomBusy('');

                //#region TEST ------ Start
                // debugger;                

                // // 개발자 권한 성공시
                // oAPP.fn.fnCheckAuthSuccess(oResult, oAuthInfo);

                //#endregion TEST ---------End
                // return;


                oAPP.fn.fnCheckVersionFinished(oResult, oAuthInfo);

                return;
            }

            // 개발자 권한 성공시
            oAPP.fn.fnCheckAuthSuccess(oResult, oAuthInfo);

        }; // end of xhr.onload

        function _onError(e) {

            // 콘솔용 오류 메시지
            var aConsoleMsg = [
                `\n############# 로그인시 오류 발생!! ###############`,
                `[PATH]: www/Login/Login.js`,
                `=> oAPP.events.ev_login`,
                `=> _onError\n`,
                `[xhr.response]: ${xhr.response}`,
                `########################################\n`,
            ];

            console.error(e);
            console.error(aConsoleMsg.join("\r\n"));
            console.trace();


            // 타임아웃일 경우
            if (e.type === "timeout") {

                let sErrMsg = oAPP.msg.M294; // 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.

                sap.m.MessageBox.error(sErrMsg);

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;
            }


            let sErrMsg = oAPP.msg.M283; // 서버 접속 오류가 발생하였습니다. 네트워크 상태 및 서버 접속 정보를 확인하세요.

            if (xhr.response == "") {

                sap.m.MessageBox.error(sErrMsg);

                parent.setDomBusy("");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                return;
            }

            var sCleanHtml = parent.setCleanHtml(xhr.response);

            parent.showMessage(null, 99, "E", sCleanHtml);

            parent.setDomBusy("");

            // div의 content DOM을 활성화 처리 한다.
            _showContentDom("X");

        }

        // 통신 오류가 발생한 경우
        xhr.onerror = _onError;

        // Timeout 오류가 발생한 경우
        xhr.ontimeout = _onError;

        xhr.open('POST', sServicePath); // 메소드와 주소 설정
        xhr.withCredentials = true;
        xhr.send(oFormData); // 요청 전송      

    }; // end of oAPP.events.ev_login

    /************************************************************************
     * 권한 오류 리스트 팝업 호출.
     ************************************************************************/
    oAPP.fn.fnCallAuthErrorListPopup = (oRes) => {

        sap.ui.getCore().loadLibrary("sap.ui.table");

        return new Promise(async (resolve, reject) => {

            if (oRes?.TYPE !== "E") {
                return resolve();
            }

            let T_AUTH = oRes?.T_AUTH || oRes?.META?.T_AUTH || [];
            if (!T_AUTH || Array.isArray(T_AUTH) === false || T_AUTH.length === 0) {
                return resolve();
            }

            var _gModel = sap.ui.getCore().getModel();

            //접속 하려는 SYSTEM ID 얻기.
            var _SYSID = _gModel.getProperty("/LOGIN/SYSID");

            //[U4A] WS Patch : v3.4.0_00005 / 20231026 110241
            //해당 패치 정보가 존재하는지 여부 확인.
            var _found1 = await WSUTIL.checkWLOListAsync(_SYSID, "C", "UHAK900697");

            /**
             * @since   2026-03-13 15:51:26
             * @version v3.6.0-3
             * @author  soccerhs
             * @description
             * 
             * - 로그인 이전에는 화이트 리스트 오브젝트를 레지스트리에서 구할 수 없고,
             *   서버에서 전달되는 화이트 리스트 정보로 체크하는 로직으로 변경.
             * 
             */
            let aREG_WLO = oRes?.META?.T_REG_WLO || [];

            var _found2 = _checkWLOListAsync(aREG_WLO, "C", "UHAK900697");

            //패치 정보가 존재하지 않는경우 EXIT.
            // if (_found !== true) {
            //     return resolve();
            // }

            if (_found1 === false && _found2 === false) {
                return resolve();
            }

            //권한 오류 리스트 팝업 구성.
            var oDialog = new sap.m.Dialog({
                title: "Authorization Error",
                draggable: true,
                resizable: true,
                // contentWidth: "40%",
                contentWidth: "80%",
                type: "Message",
                state: "Error",
                // contentHeight: "40%",
                contentHeight: "40%",
                verticalScrolling: false,
                customHeader: new sap.m.Toolbar({
                    content: [
                        new sap.m.Title({
                            text: "Authorization Error"
                        }),
                        new sap.m.ToolbarSpacer(),
                        new sap.m.Button({
                            icon: "sap-icon://decline",
                            type: "Reject",
                            press: () => {
                                oDialog.close();
                                oDialog.destroy();
                            }
                        })
                    ]
                }),
                content: [
                    new sap.ui.table.Table({
                        title: new sap.m.Title({
                            text: oRes.MSG,
                            wrapping: true
                        }),
                        selectionMode: "None",
                        visibleRowCountMode: "Auto",
                        minAutoRowCount: 1,
                        columns: [
                            new sap.ui.table.Column({
                                width: "150px",
                                sortProperty: "OBJECT",
                                filterProperty: "OBJECT",
                                label: new sap.m.Label({
                                    design: "Bold",
                                    text: "Auth. Object"
                                }),
                                template: new sap.m.Text({
                                    text: "{OBJECT}"
                                })
                            }),
                            new sap.ui.table.Column({
                                sortProperty: "TTEXT",
                                filterProperty: "TTEXT",
                                label: new sap.m.Label({
                                    design: "Bold",
                                    text: "Description"
                                }),
                                template: new sap.m.Text({
                                    text: "{TTEXT}"
                                })
                            }),
                            new sap.ui.table.Column({
                                width: "150px",
                                sortProperty: "ACTVT",
                                filterProperty: "ACTVT",
                                label: new sap.m.Label({
                                    design: "Bold",
                                    text: "Field"
                                }),
                                template: new sap.m.Text({
                                    text: "{ACTVT}"
                                })
                            }),
                            new sap.ui.table.Column({
                                sortProperty: "FIELD",
                                filterProperty: "FIELD",
                                label: new sap.m.Label({
                                    design: "Bold",
                                    text: "Value"
                                }),
                                template: new sap.m.Text({
                                    text: "{FIELD}"
                                })
                            })
                        ],
                        rows: {
                            path: "/T_AUTH",
                            template: new sap.ui.table.Row()
                        }
                    })
                ],
                buttons: [
                    new sap.m.Button({
                        icon: "sap-icon://decline",
                        type: "Reject",
                        press: () => {
                            oDialog.close();
                            oDialog.destroy();
                        }
                    })
                ]
            }).addStyleClass("sapUiSizeCompact");

            var oModel = new sap.ui.model.json.JSONModel();
            oDialog.setModel(oModel);

            // oModel.setData({ T_AUTH: oRes.T_AUTH });
            oModel.setData({ T_AUTH: T_AUTH });


            //권한 오류 리스트 팝업 OPEN 처리.
            oDialog.open();

            return resolve(true);

        });

    };  // end of oAPP.fn.fnCallAuthErrorListPopup

    /************************************************************************
     * 개발 권한 체크
     ************************************************************************/
    oAPP.fn.fnCheckAuthority = () => {

        return new Promise((resolve, reject) => {

            console.log("개발 권한 체크중..");

            var sServicePath = parent.getServerPath() + "/chk_u4a_authority";

            var oFormData = new FormData();

            let oSettings = WSUTIL.getWsSettingsInfo();

            oFormData.append("WSVER", oSettings.appVersion);
            oFormData.append("WSPATCH_LEVEL", oSettings.patch_level);
            // oFormData.append("WSLANGU", oSettings.globalLanguage || "EN");

            // if (oAPP.attr.HTTPONLY && oAPP.attr.HTTPONLY == "1") {

            //     let oLogInData = oAPP.attr.LOGIN;

            //     oFormData.append("sap-user", oLogInData.ID);
            //     oFormData.append("sap-password", oLogInData.PW);
            //     oFormData.append("sap-client", oLogInData.CLIENT);
            //     oFormData.append("sap-language", oLogInData.LANGU);

            // }

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () { // 요청에 대한 콜백
                if (xhr.readyState === xhr.DONE) { // 요청이 완료되면
                    if (xhr.status === 200 || xhr.status === 201) {

                        // ***  ISLICEN <== 값이 없으면 !!! 메시지 처리후 화면 종료 !!!
                        // ***  DEV_KEY <== 개발자 KEY  !!! 메시지 처리후 화면 종료 !!!
                        // ***  RTMSG   <== 리턴 메시지
                        // ***  IS_DEV  <== 개발서버 여부 개발서버 : D / (조회만 가능)

                        // {"ISLICEN":"X","RTMSG":"","IS_DEV":"D","DEV_KEY":"39787814141386174101"}

                        var oResult;

                        try {

                            oResult = JSON.parse(xhr.response);

                            /**
                             * @since   2026-03-07 11:18:56
                             * @version v3.6.0-2
                             * @author  soccerhs
                             * @description
                             * 
                             * 로그인 시 권한체크 부분 로그 강화
                             * 
                             */
                            var aConsoleMsg = [
                                `\n######################################`,
                                `## 개발 권한 결과!!`,
                                `######################################`,
                                `=> [RESULT]: ${JSON.stringify(oResult)}`,
                                `######################################`,
                            ];
                            console.log(aConsoleMsg.join("\r\n"));

                        } catch (error) {

                            var aConsoleMsg = [
                                `\n######################################`,
                                `## 개발 권한 체크시 오류 발생!!!`,
                                `######################################`,
                                `=> oAPP.fn.fnCheckAuthority`,
                                `=> 응답 결과 JSON parse error!`,
                                `######################################`,
                            ];
                            console.error(aConsoleMsg.join("\r\n"));

                            var sCleanHtml = parent.setCleanHtml(xhr.response);

                            parent.showMessage(null, 99, "E", sCleanHtml);

                            parent.setDomBusy("");

                            return;
                        }

                        if (oResult.ISLICEN == "") {
                            reject(oResult.RTMSG);
                            return;
                        }

                        if (oResult.DEV_KEY == "") {
                            reject(oResult.RTMSG);
                            return;
                        }

                        resolve(oResult);

                    } else {

                        parent.showMessage(null, 99, "E", xhr.response);

                        parent.setDomBusy("");

                    }
                }
            };

            xhr.open('POST', sServicePath); // 메소드와 주소 설정
            // xhr.open('GET', sServicePath); // 메소드와 주소 설정
            // xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
            xhr.withCredentials = true;
            xhr.send(oFormData); // 요청 전송   

        }); // end of promise

    }; // end of oAPP.fn.fnCheckAuthority

    /************************************************************************
     * 개발자 권한 체크 성공시 수행
     ************************************************************************/
    oAPP.fn.fnCheckAuthSuccess = (oResult, oAuthInfo) => {

        var oResultData = {
            oResult: oResult,
            oAuthInfo: oAuthInfo
        };

        //#region - 로그인 -> 권한체크 -> 고객사 라이센스 체크
        //#endregion
        // 고객사 라이센스를 체크한다.
        oAPP.fn.fnCheckCustomerLisence().then(oAPP.fn.fnCheckCustomerLisenceThen.bind(oResultData));

    }; // end of oAPP.fn.fnCheckAuthSuccess

    /************************************************************************
     * 고객사 라이센스 체크를 한다.
     ************************************************************************/
    oAPP.fn.fnCheckCustomerLisence = () => {

        // CHK_CUSTOMER_LICENSE
        return new Promise((resolve, reject) => {

            var sServicePath = parent.getServerPath() + "/chk_customer_license";

            var oFormData = new FormData();

            let oSettings = WSUTIL.getWsSettingsInfo();

            oFormData.append("WSVER", oSettings.appVersion);
            oFormData.append("WSPATCH_LEVEL", oSettings.patch_level);
            // oFormData.append("WSLANGU", oSettings.globalLanguage || "EN");

            // if (oAPP.attr.HTTPONLY && oAPP.attr.HTTPONLY == "1") {

            //     let oLogInData = oAPP.attr.LOGIN;

            //     oFormData.append("sap-user", oLogInData.ID);
            //     oFormData.append("sap-password", oLogInData.PW);
            //     oFormData.append("sap-client", oLogInData.CLIENT);
            //     oFormData.append("sap-language", oLogInData.LANGU);

            // }

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () { // 요청에 대한 콜백
                if (xhr.readyState === xhr.DONE) { // 요청이 완료되면
                    if (xhr.status === 200 || xhr.status === 201) {

                        try {

                            var oResult = JSON.parse(xhr.response);

                            resolve(oResult);

                        } catch (error) {

                            // 콘솔용 오류 메시지
                            var aConsoleMsg = [
                                `\n############# 고객사 라이센스 체크시 오류 발생!! ###############`,
                                `[PATH]: www/Login/Login.js`,
                                `=> oAPP.fn.fnCheckCustomerLisence`,
                                `=> JSON parse Error!!\n`,
                                `[xhr.response]: ${xhr.response}`,
                                `################################################################\n`,
                            ];

                            console.error(error);
                            console.error(aConsoleMsg.join("\r\n"));
                            console.trace();


                            var sCleanHtml = parent.setCleanHtml(xhr.response);

                            parent.showMessage(null, 99, "E", sCleanHtml);

                            parent.setDomBusy("");

                            // div의 content DOM을 활성화 처리 한다.
                            _showContentDom("X");

                            return;

                        }

                    } else {

                        parent.showMessage(null, 99, "E", xhr.response);

                        parent.setDomBusy("");

                        // div의 content DOM을 활성화 처리 한다.
                        _showContentDom("X");

                    }
                }
            };

            xhr.open('POST', sServicePath); // 메소드와 주소 설정
            xhr.withCredentials = true;
            xhr.send(oFormData); // 요청 전송   

        });

    }; // end of oAPP.fn.fnCheckCustomerLisence

    /************************************************************************
     * 고객사 라이센스 체크 성공
     ************************************************************************/
    oAPP.fn.fnCheckCustomerLisenceThen = function (oLicenseInfo) {

        // ISCDS TYPE C LENGTH 1, "on premise : space
        // RETCD TYPE C LENGTH 1, "처리 리턴 코드 : E 오류
        // RTMSG TYPE STRING,     "처리 리턴 메시지
        // REMIN TYPE STRING,     "라이센스 잔여 일
        // ISLIC TYPE C LENGTH 1, "라이센스 유효 여부 "X : 유효"

        // 오류 확인
        if (oLicenseInfo.RETCD == "E") {

            // 콘솔용 오류 메시지
            var aConsoleMsg = [
                `\n############# 고객사 라이센스 체크 후 오류 ###############`,
                `[PATH]: www/Login/Login.js`,
                `=> oAPP.fn.fnCheckCustomerLisenceThen\n`,
                `=> [oLicenseInfo]: ${JSON.stringify(oLicenseInfo)}`,
                `#####################################################\n`,
            ];
            console.error(aConsoleMsg.join("\r\n"));

            // 라이선스가 유효하지 않으면 오류 메시지와 함께 창 닫는다.
            oAPP.fn.fnShowNoAuthIllustMsg(oLicenseInfo.RTMSG);

            parent.setDomBusy('');

            // div의 content DOM을 활성화 처리 한다.
            _showContentDom("X");

            return;
        }

        // 개인화 파일에 저장된 CDN 허용 여부 플래그를 구한다.        
        var bIsCDN = parent.getIsCDN();

        // CDN 플래그가 저장되어 있고, CDN 허용일 경우 GitHub에 Ping을 수행.
        if (bIsCDN == "X") {

            oAPP.fn.fnConnectionGithub().then(oAPP.fn.fnConnectionGithubThen.bind(this));

            return;

        }

        // sap 서버에 최신 버전 체크 후 있다면 다운받기
        oAPP.fn.fnSetAutoUpdateForSAP(this).then(oAPP.fn.fnSetAutoUpdateForSAPThen.bind(this));

    }; // end of oAPP.fn.fnCheckCustomerLisenceThen

    //#region - 메이저 버전 체크
    oAPP.fn.fnSetAutoUpdateForSAP = (oPARAM) => {

        return new Promise((resolve, reject) => {

            var oModel = sap.ui.getCore().getModel();

            //업데이트 확인
            autoUpdaterSAP.on('checking-for-update-sap', (e) => {
                console.log(e?.params?.message || "major update check...");
            });

            //업데이트 가능 
            autoUpdaterSAP.on('update-available-sap', (e) => {

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                let oBusyPop = oModel.getProperty("/BUSYPOP");
                oBusyPop.PROGVISI = true;
                oBusyPop.PROGTXT = "Downloading";

                oModel.setProperty("/BUSYPOP", oBusyPop, true);

                // oModel.setProperty("/BUSYPOP/PROGVISI", true, true);

                // 로그인 페이지의 Opacity를 적용한다.
                $('.u4aWsLoginFormFcard').animate({
                    opacity: "0.3"
                }, 500, "linear");

                // Version Check Dialog를 띄운다.
                oAPP.fn.fnVersionCheckDialogOpen();

                parent.setDomBusy("");

                // console.log(e.params.message);
            });

            //현재 최신버전입니다
            autoUpdaterSAP.on('update-not-available-sap', (e) => {
                debugger;
                let oParam = {
                    ISCDN: "",
                    oLoginInfo: oPARAM.oResult // 서버에서 받은 로그인 정보
                };

                // 현재 버전 정보와 서버 버전정보를 구한다.
                let oVerInfo = e?.params?.verInfo;
                if (oVerInfo) {

                    // WS의 메이져 버전이 같을 경우에만 Support package 업데이트 체크를 한다.
                    if (oVerInfo.appVer === oVerInfo.updVER) {

                        console.log("WS Support Package Version Check...");

                        // WS Support Package Version Check
                        oAPP.fn.fnCheckSupportPackageVersion(resolve, oParam);

                        return;

                    }

                }

                resolve();

            });

            //다운로드 ...
            autoUpdaterSAP.on('download-progress-sap', (e) => {

                var iToTal = e.params.TOTAL, // 전체 모수
                    iJobCnt = e.params.jobCnt, // 현재 전송된 데이터
                    iPerCnt = (iJobCnt / iToTal) * 100; // 백분율 구하기

                var iPer = parseFloat(iPerCnt).toFixed(2); // 소수점 2자리까지

                /**
                 * 업데이트 파일 다운로드시 퍼센트가 100이 넘을 경우에는 100으로 하드코딩
                 */
                if (iPer >= 100) {
                    iPer = 100;
                }

                oModel.setProperty("/BUSYPOP/TITLE", "Downloading...", true);

                oModel.setProperty("/BUSYPOP/PERVALUE", iPer, true);

            });

            //다운로드 ...완료
            autoUpdaterSAP.on('update-downloaded-sap', (e) => {

                oModel.setProperty("/BUSYPOP/TITLE", "Update Complete! Restarting...", true);

                oModel.setProperty("/BUSYPOP/ILLUSTTYPE", "sapIllus-SuccessHighFive", true);

                oModel.setProperty("/BUSYPOP/PERVALUE", 100, true);

                console.log('업데이트가 완료되었습니다.');

                setTimeout(() => {

                    autoUpdaterSAP.quitAndInstall(); //<--- 자동 인스톨 

                }, 3000);

            });

            //오류
            autoUpdaterSAP.on('update-error-sap', (e) => {

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                parent.setDomBusy("");

                // 이벤트 파라미터의 오류 메시지
                let sErrMsg = e?.params?.message || "";

                // 메시지 팝업을 띄운다.
                // 다운로드 중 오류가 발생하였습니다.
                // 재시작 하시겠습니까?
                let sMsg = oAPP.msg.M051 + "\n\n";

                // 이벤트 파라미터에 메시지 내용이 있다면 메시지 팝업 내용에 동봉한다.
                if (sErrMsg !== "") {
                    sMsg += sErrMsg + "\n\n";
                }

                sMsg += oAPP.msg.M052 + "\n\n";
                sMsg += sap.m.MessageBox.Action.RETRY + ": " + oAPP.msg.M055 + " " + oAPP.msg.M056 + "\n\n";
                sMsg += sap.m.MessageBox.Action.CLOSE + ": " + oAPP.msg.M055 + " " + oAPP.msg.M056 + "\n\n";
                // sMsg += sap.m.MessageBox.Action.IGNORE + ": " + oAPP.msg.M053; //"Ignoring updates and then running the program"

                sap.m.MessageBox.error(sMsg, {
                    title: oAPP.msg.M054, // "U4A Workspace Update Error"
                    initialFocus: sap.m.MessageBox.Action.RETRY,
                    emphasizedAction: sap.m.MessageBox.Action.RETRY,
                    onClose: function (action) {

                        switch (action) {
                            case "RETRY": // 앱 재시작

                                APP.relaunch();
                                APP.exit();

                                return;

                            case "CLOSE": // 앱 종료

                                APP.exit();

                                return;

                            /**
                             * @since   2026-02-04 00:51:20
                             * @version v3.5.9-1
                             * @author  soccerhs
                             * @description
                             * 
                             * 메이저 업그레이드 중, 오류 팝업에서 로그 폴더 열기 버튼 추가
                             * 
                             */
                            case "OpenLog":

                                WSLOG.openLOG(true);

                                APP.exit();

                                return;


                            // case "IGNORE": // 무시하고 진행

                            //     resolve();

                            //     return;

                        }

                    },

                    // actions: [sap.m.MessageBox.Action.RETRY, sap.m.MessageBox.Action.CLOSE, sap.m.MessageBox.Action.IGNORE]
                    actions: [sap.m.MessageBox.Action.RETRY, "OpenLog", sap.m.MessageBox.Action.CLOSE]

                });

            });

            // 서버 HTTPONLY 정보 및 로그인 정보
            let oServerInfo = {
                HTTPONLY: oAPP.attr.HTTPONLY,
                LOGIN: oAPP.attr.LOGIN
            };

            let sVersion = REMOTE.app.getVersion();

            // 서버에서 받은 로그인 정보
            let oLoginInfo = oPARAM.oResult;
            // if(!REMOTE.app.isPackaged){

            //     //#region TEST --------- Start
            //     sVersion = '3.5.7';
            //     //#endregion TEST ------ End

            // }

            // 로그인 정보에 서버에서 구한 메타 정보 추가
            oServerInfo.LOGIN.META = oLoginInfo.META;

            // 자동 업데이트 체크
            autoUpdaterSAP.checkForUpdates(sVersion, oServerInfo);

        });

    }; // end of  oAPP.fn.fnSetAutoUpdateForSAP 
    //#endregion 메이저 버전 체크

    oAPP.fn.fnSetAutoUpdateForSAPThen = function () {

        var oResult = this.oResult,
            oAuthInfo = this.oAuthInfo;

        // 버전 체크 완료시
        oAPP.fn.fnCheckVersionFinished(oResult, oAuthInfo);

    }; // end of oAPP.fn.fnSetAutoUpdateForSAPThen

    function HexToStr(hex) {
        var hex = hex.toString();//force conversion
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }

    /************************************************************************
     * Github 연결을 시도 하여 on-premise 인지 CDN인지 확인
     ************************************************************************/
    oAPP.fn.fnConnectionGithub = () => {

        return new Promise((resolve, reject) => {

            var oSettings = oAPP.fn.fnGetSettingsInfo(),
                oGitSettings = oSettings.GITHUB,
                sGitDevKey = oGitSettings.devKey,
                sLatestUrl = oGitSettings.latestUrl

            const octokit = new OCTOKIT({
                // auth: atob(sGitDevKey)
                auth: HexToStr(sGitDevKey)
            });

            octokit.request(sLatestUrl, {
                org: "octokit", //기본값  
                type: "Public", //github repositories type private /  Public 
            }).then((data) => {

                resolve({
                    ISCDN: "X"
                });

            }).catch((err) => {

                console.log(err);

                resolve({
                    ISCDN: ""
                });

            });

        });

    }; // end of oAPP.fn.fnConnectionGithub

    /************************************************************************
     * Github 연결을 시도 하여 on-premise 인지 CDN인지 확인
     ************************************************************************/
    oAPP.fn.fnConnectionGithubThen = function (oReturn) {

        parent.setIsCDN(oReturn.ISCDN);

        // on-premise 일 경우 업데이트 URL을 서버쪽으로 바라본다.
        if (oReturn.ISCDN != "X") {

            // sap 서버에 최신 버전 체크 후 있다면 다운받기
            oAPP.fn.fnSetAutoUpdateForSAP(this).then(oAPP.fn.fnSetAutoUpdateForSAPThen.bind(this));

            return;

        }

        // 버전 체크 수행
        oAPP.fn.fnSetAutoUpdateForCDN(this).then(oAPP.fn.fnSetAutoUpdateForCDNThen.bind(this));

    }; // end of oAPP.fn.fnConnectionGithubThen

    /************************************************************************
     * WS Version을 확인한다.
     ************************************************************************/
    // oAPP.fn.fnSetAutoUpdateForCDN = (sVersionCheckUrl) => {
    oAPP.fn.fnSetAutoUpdateForCDN = (oPARAM) => {

        return new Promise((resolve, reject) => {

            var oModel = sap.ui.getCore().getModel();

            /* Updater Event 설정 ======================================================*/

            // 온프로미스 이면.
            // if (typeof sVersionCheckUrl !== "undefined") {

            //     autoUpdater.setFeedURL(sVersionCheckUrl);

            // }

            autoUpdater.on('checking-for-update', () => {

                console.log("CDN - 업데이트 확인 중...");

            });

            autoUpdater.on('update-available', (info) => {

                console.log("CDN - 업데이트가 가능합니다.");

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                let oBusyPop = oModel.getProperty("/BUSYPOP");
                oBusyPop.PROGVISI = true;
                oBusyPop.PROGTXT = "Downloading";

                oModel.setProperty("/BUSYPOP", oBusyPop, true);

                // oModel.setProperty("/BUSYPOP/PROGVISI", true, true);

                // 로그인 페이지의 Opacity를 적용한다.
                $('.u4aWsLoginFormFcard').animate({
                    opacity: "0.3"
                }, 500, "linear");

                // Version Check Dialog를 띄운다.
                oAPP.fn.fnVersionCheckDialogOpen();

                parent.setDomBusy("");

            });

            autoUpdater.on('update-not-available', (info) => {

                console.log("CDN - 현재 최신버전입니다.");

                let oParam = {
                    ISCDN: "X",
                    oLoginInfo: oPARAM.oResult // 서버에서 받은 로그인 정보
                };

                // WS Support Package Version Check
                oAPP.fn.fnCheckSupportPackageVersion(resolve, oParam);

                // resolve();                

                // 업데이트가 완료되면 기존 CDN 체크를 해제 한다.
                parent.setIsCDN("");

            });

            autoUpdater.on('error', (err) => {

                // div의 content DOM을 활성화 처리 한다.
                _showContentDom("X");

                // 메시지 팝업을 띄운다.
                // 다운로드 중 오류가 발생하였습니다.
                // 재시작 하시겠습니까?
                let sMsg = oAPP.msg.M051 + " \n ";
                sMsg += oAPP.msg.M052 + " \n \n";
                sMsg += sap.m.MessageBox.Action.RETRY + ": " + oAPP.msg.M055 + " " + oAPP.msg.M056 + " \n \n ";
                sMsg += sap.m.MessageBox.Action.CLOSE + ": " + oAPP.msg.M055 + " " + oAPP.msg.M056 + " \n \n ";
                // sMsg += sap.m.MessageBox.Action.IGNORE + ": " + oAPP.msg.M053; //"Ignoring updates and then running the program"

                sap.m.MessageBox.error(sMsg, {
                    title: oAPP.msg.M054, //"U4A Workspace Update Error",
                    initialFocus: sap.m.MessageBox.Action.RETRY,
                    emphasizedAction: sap.m.MessageBox.Action.RETRY,
                    onClose: function (oEvent) {

                        switch (oEvent) {
                            case "RETRY": // 앱 재시작

                                APP.relaunch();
                                APP.exit();

                                return;

                            case "CLOSE": // 앱 종료

                                APP.exit();

                                return;

                            // case "IGNORE": // 무시하고 진행

                            //     resolve();

                            //     return;

                        }

                    },

                    // actions: [sap.m.MessageBox.Action.RETRY, sap.m.MessageBox.Action.CLOSE, sap.m.MessageBox.Action.IGNORE]
                    actions: [sap.m.MessageBox.Action.RETRY, sap.m.MessageBox.Action.CLOSE]

                });

                console.log('CDN - 에러가 발생하였습니다. 에러내용 : ' + err);

            });

            autoUpdater.on('download-progress', (progressObj) => {

                var iPer = parseFloat(progressObj.percent).toFixed(2);

                oModel.setProperty("/BUSYPOP/TITLE", "Downloading...", true);

                oModel.setProperty("/BUSYPOP/PERVALUE", iPer, true);

            });

            autoUpdater.on('update-downloaded', (info) => {

                oModel.setProperty("/BUSYPOP/TITLE", "Update Complete! Restarting...", true);

                oModel.setProperty("/BUSYPOP/ILLUSTTYPE", "sapIllus-SuccessHighFive", true);

                console.log('CDN - 업데이트가 완료되었습니다.');

                setTimeout(() => {

                    // 업데이트가 완료되면 기존 CDN 체크를 해제 한다.
                    parent.setIsCDN("");

                    autoUpdater.quitAndInstall(); //<--- 자동 인스톨 

                }, 3000);

            });

            autoUpdater.checkForUpdates();

        });

    }; // oAPP.fn.fnSetAutoUpdateForCDN

    /************************************************************************
     * 버전 체크 성공시
     ************************************************************************/
    oAPP.fn.fnSetAutoUpdateForCDNThen = function () {

        var oResult = this.oResult,
            oAuthInfo = this.oAuthInfo;

        // 버전 체크 완료시
        oAPP.fn.fnCheckVersionFinished(oResult, oAuthInfo);

    }; // end of oAPP.fn.fnSetAutoUpdateForCDNThen

    /************************************************************************
     * 버전 체크 완료시
     ************************************************************************/
    oAPP.fn.fnCheckVersionFinished = (oResult, oAuthInfo) => {

        // 로그인 성공 후 서버에서 전달받은 UNAME, MANDT 정보를 기존 모델에 저장한다.
        let oCoreModel = sap.ui.getCore().getModel();

        let oLogInData = oCoreModel.getProperty("/LOGIN");
        oLogInData.ID = oResult.UNAME;
        oLogInData.CLIENT = oResult.MANDT;

        oCoreModel.setProperty("/LOGIN", oLogInData);

        // // 로그인 페이지의 Opacity를 적용한다.
        // $('.u4aWsVersionCheckDialog,.u4aWsLoginFormFcard,.u4aWsGuestLoginCard').animate({
        //     opacity: "0"
        // }, 500, "linear", () => {

        var oResultData = jQuery.extend(true, {}, oResult);

        oResultData.USER_AUTH = oAuthInfo;

        parent.showLoadingPage("X");

        parent.setDomBusy("X");

        parent.CURRWIN.setTitle("U4A Workspace - Main");

        // [async] 권한이 있으면 성공적으로 로그인 후 10번으로 이동
        oAPP.fn.fnOnLoginSuccess(oResultData);

        // });

    }; // end of oAPP.fn.fnCheckVersionFinished    

    /************************************************************************
     * Version Check Dialog 를 실행한다.
     ************************************************************************/
    oAPP.fn.fnVersionCheckDialogOpen = () => {

        var sDialogId = "u4aWsVersionCheckDialog";

        var oDialog = sap.ui.getCore().byId(sDialogId);

        if (oDialog) {
            oDialog.open();
            return;
        }

        var oIllustMsg = new sap.m.IllustratedMessage({
            title: "{TITLE}",
            // description: "　",
            // description: "If the patch is completed\nplease restart your computer!",
            description: "{DESC}",
            illustrationSize: sap.m.IllustratedMessageSize.Dialog,
            illustrationType: "{ILLUSTTYPE}"
        }).addStyleClass(`${sDialogId}--illustMsg`);

        jQuery.sap.require("sap.m.ProgressIndicator");

        var oProgressbar = new sap.m.ProgressIndicator({
            visible: "{PROGVISI}",
            percentValue: "{PERVALUE}",
            displayOnly: true,
            state: "Success",
            // displayValue: "Downloading... {PERVALUE}%"            
            // displayValue: "{PROGTXT}... {PERVALUE}%"
            displayValue: "{PROGTXT}..."
        }).bindProperty("displayAnimation", "ANIMATION", function (ANIMATION) {
            return ANIMATION === false ? false : true;
        }).addStyleClass("sapUiSmallMarginBeginEnd sapUiMediumMarginBottom");

        new sap.m.Dialog(sDialogId, {

            // properties
            showHeader: false,
            horizontalScrolling: false,
            verticalScrolling: false,

            // aggregations
            content: [
                oIllustMsg,

                new sap.m.HBox({
                    renderType: "Bare",
                    items: [
                        oProgressbar
                    ]
                }),

            ],

            // Events
            escapeHandler: () => { }, // esc 키 방지

        })
            .addStyleClass(`${sDialogId}`)
            .bindElement("/BUSYPOP")
            .open();

    }; // end of oAPP.fn.fnVersionCheckDialogOpen    

    /************************************************************************
     * 권한 없음 Illustration Message Popup Open
     ************************************************************************/
    oAPP.fn.fnShowNoAuthIllustMsg = (sMsg) => {

        let oMsg = new sap.m.IllustratedMessage({
            title: "No Authority!",
            description: sMsg,
            illustrationSize: sap.m.IllustratedMessageSize.Dialog,
            illustrationType: "tnt-UnsuccessfulAuth",
            additionalContent: new sap.m.Button({
                type: "Emphasized",
                text: "OK",
                press: oAPP.events.ev_attachIllustMsgOkBtn
            })
        });

        let oAuthDialog = new sap.m.Dialog({
            showHeader: false,
            contentWidth: "600px",
            content: [
                oMsg
            ],
            escapeHandler: function () { },
            afterClose: function () {
                oAuthDialog.destroy();
            }

        })
            // .addStyleClass("sapUiSizeCompact")
            .open();

    }; // end of oAPP.fn.fnShowNoAuthIllustMsg

    /************************************************************************
     * 권한 없음 Illustration Message Popup Ok 버튼 press 이벤트
     ************************************************************************/
    oAPP.events.ev_attachIllustMsgOkBtn = () => {

        oAPP.attr.isPressWindowClose = "X";

        var oCurrWin = REMOTE.getCurrentWindow();
        oCurrWin.close();

    }; // end of oAPP.events.ev_attachIllustMsgOkBtn

    /************************************************************************
     * 로그인 성공시 
     ************************************************************************/
    oAPP.fn.fnOnLoginSuccess = async (oResult) => {

        let oCoreModel = sap.ui.getCore().getModel();
        if (oCoreModel == null) {
            return;
        }

        let oLogInData = oCoreModel.getProperty("/LOGIN");
        if (oLogInData == null) {
            return;
        }

        // trial 버전이 아닐때만 수행
        var oWsSettings = oAPP.fn.fnGetSettingsInfo(),
            bIsTrial = oWsSettings.isTrial,
            oTrialServerInfo = oWsSettings.trialServerInfo;

        if (bIsTrial) {

            oResult.META.HOST = `http://${oTrialServerInfo.SERVERIP}:80${oTrialServerInfo.INSTANCENO}`;

        } else {

            // Remember 정보 저장
            oAPP.fn.fnSaveRemember(oLogInData);

            // 로그인 아이디 저장
            oAPP.fn.fnSaveIDSuggData(oLogInData.ID);

        }

        var oUserInfo = jQuery.extend({}, oResult, oLogInData);
        // var oPackageJson = REMOTE.require("./package.json");

        // 패키지 여부에 따른 앱 버전 정보 구하기
        var sAppVer = APP.getVersion();

        if (!APP.isPackaged) {
            sAppVer = oWsSettings.appVersion;
        }

        oUserInfo.WSVER = sAppVer;
        oUserInfo.WSPATCH_LEVEL = Number(oWsSettings.patch_level || 0);

        var oServerInfo = parent.getServerInfo();

        oServerInfo.WSVER = sAppVer;
        oServerInfo.WSPATCH_LEVEL = Number(oWsSettings.patch_level || 0);

        // 서버 Info 이전 값을 저장한다.
        parent.setBeforeServerInfo(jQuery.extend(true, {}, oServerInfo));

        oServerInfo.CLIENT = oUserInfo.CLIENT;
        oServerInfo.LANGU = oUserInfo.LANGU;

        // 서버 정보에 실제 로그인한 client, language 정보를 저장한다.
        parent.setServerInfo(oServerInfo);

        // oUserInfo.SERVER_LANGU = oUserInfo.LANGU;
        oUserInfo.LANGU = oUserInfo.WSLANGU;

        // 로그인 유저의 아이디/패스워드를 저장해둔다.
        parent.setUserInfo(oUserInfo);

        // Metadata 정보 세팅 (서버 호스트명.. 또는 메시지 클래스 데이터 등..)
        if (oResult.META) {

            /**
             * 서버 언어 저장
             */
            _serverMsgConfig(oResult.META);

            parent.setMetadata(oResult.META);

            // 서버 기준 테마 목록 정보를 레지스트리에 등록
            if (oResult.META.T_REG_THEME) {
                await _registry_T_REG_THEME(oResult.META.T_REG_THEME);
            }

            // 서버 기준 Object White list 정보를 레지스트리에 등록
            if (oResult.META.T_REG_WLO) {
                await _registry_T_REG_WLO(oResult.META.T_REG_WLO);
            }

            // 메시지 클래스 정보가 있다면 APPDATA 경로에 버전별로 JSON파일을 만든다.
            // if (oResult.META.MSGCLS) {
            //     oAPP.fn.fnWriteMsgClsJson(oResult.META.MSGCLS);
            // }

        }


        let oProcessUserInfo = {
            CLIENT: oUserInfo.CLIENT,
            ID: oUserInfo.ID,
            PW: oUserInfo.PW,
            SYSID: oUserInfo.SYSID,
            LANGU: oResult.META.LANGU,
            LANGU_CNV: oUserInfo.LANGU,
            // WSLANGU: oUserInfo.WSLANGU
            // LOGIN_LANGU: oUserInfo.LOGIN_LANGU,
            // GLOBAL_LANGU: oWsSettings.globalLanguage,            
            // isServDependLangu: parent.process.isServDependLangu
        };

        // 접속 언어 지정을 로그인 시 입력한 언어로 지정
        oProcessUserInfo.LANGU = oUserInfo.LANGU;

        // process.env 변수에 접속한 User 정보를 저장한다.
        parent.setProcessEnvUserInfo(oProcessUserInfo);

        $('#content').css({
            "display": "none"
        });

        try {

            // 테마 정보를 생성
            var oThemeInfo = await oAPP.fn.fnP13nCreateTheme();

        } catch (error) {
            console.error(error);
        }

        // 테마 정보를 저장한다.
        parent.setThemeInfo(oThemeInfo);

        // 브라우저 백그라운드 색상을 테마의 대표 색상으로 적용한다.
        var oCurrWin = REMOTE.getCurrentWindow();
        oCurrWin.setBackgroundColor(oThemeInfo.BGCOL);

        /**
         * 작업표시줄의 모든창 닫기 메뉴 선택 시, 로그인 창이 닫히지 않게 하기 위해
         * beforeunload 이벤트 발생 시, 커스텀한 헤더의 닫기 버튼을 눌렀을 경우에만 닫을 수 있도록
         * 닫기 버튼 눌렀다는 플래그를 이용하여 닫기 기능을 구현했는데,
         * 로그인 성공 후 10번 페이지로 이동 시, 로드하는 html이 바뀌면서 beforeunload를 타면서 
         * 닫기 버튼 눌렀다는 플래그값이 없으면 beforeunload에서 체크 로직에 걸려 10번 페이지로 이동이 되지 않아,
         * 로그인 성공시도 같은 플래그를 부여함.
         */
        oAPP.attr.isPressWindowClose = "X";

        // SSO로 로그인 했을때, 전달받은 파라미터 중, APPID가 있다면 20번 페이지로 이동
        // let oServerInfo = parent.getServerInfo();
        if (oServerInfo?.IS_SSO === "X") {

            if (oServerInfo.APPID && oServerInfo.APPID !== "") {

                let oIF_DATA = {
                    ACTCD: "MOVE20",            // 새창 띄우면서 20번으로 넘어가는 액션 코드
                    APPID: oServerInfo.APPID       	// 실행 어플리케이션명
                };

                parent.setNewBrowserIF_DATA(oIF_DATA);
            }

        }

        // WS10번 페이지로 이동
        // parent.onMoveToPage("WS10");

        parent.oAPP.views.VW_MAIN.fn.loadWS30MainPage();

        parent.showLoadingPage('');

        // if (!APP.isPackaged) {
        //     // Floating Menu를 오픈한다.                    
        //     oAPP.fn.fnFloatingMenuOpen();
        // }

        // 웰컴 사운드
        parent.setSoundMsg('WELCOME');

    }; // end of oAPP.fn.fnOnLoginSuccess   

    /************************************************************************
     * 메시지 클래스 정보를 SYSTEM ID별, LANGUAGE 별로 JSON을 만든다.
     ************************************************************************/
    // oAPP.fn.fnWriteMsgClsJson = (aMsgCls) => {

    //     // Launguage 별로 그룹을 만든다.
    //     var oGroup = aMsgCls.reduce((acc, curr) => { // [1]
    //         const {
    //             // SPRSL
    //             LANGU
    //         } = curr; // [2]
    //         if (acc[LANGU]) acc[LANGU].push(curr); // [3]
    //         else acc[LANGU] = [curr]; // [4]
    //         return acc; // [5]
    //     }, {}); // [6]

    //     // APPPATH 경로를 구한다.
    //     let oServerInfo = parent.getServerInfo(),
    //         sSysID = oServerInfo.SYSID,
    //         sJsonFolderPath = PATH.join(USERDATA, "msgcls", sSysID);

    //     for (const key in oGroup) {

    //         const element = oGroup[key];

    //         // SYSTEM ID 별, LANGUAGE 별 폴더가 있는지 확인.
    //         const
    //             sJsonLanguFolderPath = sJsonFolderPath + "\\" + key,
    //             sJsonPath = PATH.join(sJsonLanguFolderPath, "msgcls.json");

    //         if (!FS.existsSync(sJsonLanguFolderPath)) {
    //             FS.mkdirSync(sJsonLanguFolderPath, {
    //                 recursive: true,
    //                 mode: 0o777 // 올 권한	
    //             });
    //         }

    //         let sMsgCls = JSON.stringify(element);

    //         FS.writeFileSync(sJsonPath, sMsgCls, {
    //             encoding: "utf8",
    //             mode: 0o777 // 올 권한
    //         });

    //     }

    // }; // end of oAPP.fn.fnWriteMsgClsJson



    //[-----원본------]
    // oAPP.fn.fnWriteMsgClsJson = (oMsgCls) => {

    //     // APPPATH 경로를 구한다.
    //     let oServerInfo = parent.getServerInfo(),
    //         sSysID = oServerInfo.SYSID,
    //         sJsonFolderPath = PATH.join(USERDATA, "msgcls", sSysID),
    //         sJsonPath = PATH.join(sJsonFolderPath, "msgcls.json");

    //     if (!FS.existsSync(sJsonFolderPath)) {
    //         FS.mkdirSync(sJsonFolderPath, {
    //             recursive: true,
    //             mode: 0o777 // 올 권한	
    //         });
    //     }

    //     let sMsgCls = JSON.stringify(oMsgCls);

    //     FS.writeFileSync(sJsonPath, sMsgCls, {
    //         encoding: "utf8",
    //         mode: 0o777 // 올 권한
    //     });

    // }; // end of oAPP.fn.fnWriteMsgClsJson

    /************************************************************************
     * 테마 정보 저장
     ************************************************************************/
    oAPP.fn.fnP13nCreateTheme = () => {

        return new Promise((resolve, reject) => {

            let oCoreModel = sap.ui.getCore().getModel(),
                oLogInData = oCoreModel.getProperty("/LOGIN"),
                sSysID = oLogInData.SYSID,
                sThemeJsonPath = PATH.join(USERDATA, "p13n", "theme", `${sSysID}.json`);

            // default Theme setting    
            let oWsSettings = oAPP.fn.fnGetSettingsInfo(),
                oDefThemeInfo = {
                    THEME: oWsSettings.defaultTheme,
                    BGCOL: oWsSettings.defaultBackgroundColor
                };

            // SYSTEM ID 테마 정보 JSON 파일 유무 확인
            if (!FS.existsSync(sThemeJsonPath)) {

                // 테마 정보가 없으면 신규 파일 생성 후 기본 테마 정보 전달
                FS.writeFile(sThemeJsonPath, JSON.stringify(oDefThemeInfo), {
                    encoding: "utf8",
                    mode: 0o777 // 올 권한
                }, function (err) {

                    if (err) {
                        reject(err.toString());
                        return;
                    }

                    resolve(oDefThemeInfo);

                });

                return;
            }

            // 테마 정보가 있을 경우 바로 읽어서 전달
            // let oThemeInfo = parent.require(sThemeJsonPath);
            // resolve(oThemeInfo);

            // 테마 정보가 있을 경우 바로 읽어서 전달
            let sThemeData = FS.readFileSync(sThemeJsonPath, 'utf-8'),
                oThemeInfo = JSON.parse(sThemeData);

            resolve(oThemeInfo);
        });

    }; // end of oAPP.fn.fnP13nCreateTheme

    // /************************************************************************
    //  * 자연스러운 로딩
    //  ************************************************************************/
    // oAPP.fn.fnOnSmoothLoading = () => {

    //     $('#content').fadeIn(100, 'linear');

    // }; // end of oAPP.fn.fnOnSmoothLoading     

    /************************************************************************
     * 로그인 정보 입력 체크
     ************************************************************************/
    oAPP.fn.fnLoginCheck = (ID, PW, CLIENT, LANGU) => {

        let oClientInput = sap.ui.getCore().byId("ws_client"),
            oIdInput = sap.ui.getCore().byId("ws_id"),
            oPwInput = sap.ui.getCore().byId("ws_pw"),
            oLanguInput = sap.ui.getCore().byId("ws_langu");

        oClientInput.setValueState("None");
        oPwInput.setValueState("None");
        oPwInput.setShowValueStateMessage(false);
        oLanguInput.setValueState("None");

        oIdInput.removeStyleClass("u4aWsSearchError");

        var oCheck = {
            RETCD: "S",
            MSG: ""
        };

        if (isEmpty(CLIENT) === true || isBlank(CLIENT) === true) {

            oCheck.RETCD = "E";
            oCheck.MSG = oAPP.msg.M0271; // "Client is Required!";

            oClientInput.setValueState("Error");

            setTimeout(() => {
                oClientInput.focus();
            }, 0);

            return oCheck;

        }

        if (isEmpty(ID) === true || isBlank(ID) === true) {

            oCheck.RETCD = "E";
            oCheck.MSG = oAPP.msg.M0272; // "ID is Required!";

            oIdInput.addStyleClass("u4aWsSearchError");

            setTimeout(() => {
                oIdInput.focus();
            }, 0);

            return oCheck;

        }

        if (isEmpty(PW) === true || isBlank(PW) === true) {

            oCheck.RETCD = "E";
            oCheck.MSG = oAPP.msg.M0273; // "PW is Required!";

            oPwInput.setValueState("Error");

            setTimeout(() => {
                oPwInput.focus();
            }, 0);

            return oCheck;

        }

        if (isEmpty(LANGU) === true || isBlank(LANGU) === true) {

            oCheck.RETCD = "E";
            oCheck.MSG = oAPP.msg.M0274; // "Language is Required!";

            oLanguInput.setValueState("Error");

            setTimeout(() => {
                oLanguInput.focus();
            }, 0);

            return oCheck;

        }

        return oCheck;

    }; // end of oAPP.fn.fnLoginCheck


    /************************************************************************
     * Remember Check 시 로그인한 정보 저장
     ************************************************************************/
    oAPP.fn.fnSaveRemember = (oLogInData) => {

        var oServerInfo = parent.getServerInfo(),
            sSysID = oServerInfo.SYSID;

        let sJsonPath = PATH.join(USERDATA, "p13n", "login.json"),
            sJsonData = FS.readFileSync(sJsonPath, 'utf-8'),
            oLoginInfo = JSON.parse(sJsonData);

        if (typeof oLoginInfo !== "object") {
            oLoginInfo = {};
        }

        // System ID 별로 Client, Language를 저장할 Object 생성
        if (typeof oLoginInfo[sSysID] == "undefined") {
            oLoginInfo[sSysID] = {};
        }

        // Remember Check 했을 경우 ID, Client, Language 정보를 저장한다.
        var oSysInfo = oLoginInfo[sSysID],
            bIsRemember = oLogInData.REMEMBER;

        oSysInfo.REMEMBER = bIsRemember;

        if (bIsRemember) {
            oSysInfo.CLIENT = oLogInData.CLIENT;
            oSysInfo.LANGU = oLogInData.LANGU;
            oSysInfo.ID = oLogInData.ID;
            oSysInfo.WSLANGU = oLogInData.WSLANGU;
        }

        // login.json 파일에 ID Suggestion 정보 저장
        FS.writeFileSync(sJsonPath, JSON.stringify(oLoginInfo));

    }; // end of oAPP.fn.fnSaveRemember


    /************************************************************************
     * Remember 저장한 로그인 정보 읽어오기
     ************************************************************************/
    oAPP.fn.fnGetRememberLoginInfo = () => {

        var oServerInfo = parent.getServerInfo(),
            sSysID = oServerInfo.SYSID;

        let sJsonPath = PATH.join(USERDATA, "p13n", "login.json"),
            sJsonData = FS.readFileSync(sJsonPath, 'utf-8'),
            oLoginInfo = JSON.parse(sJsonData);

        if (typeof oLoginInfo != "object") {
            return;
        }

        if (typeof oLoginInfo[sSysID] == "undefined") {
            return;
        }

        return oLoginInfo[sSysID];

    }; // end of oAPP.fn.fnGetRememberLoginInfo

    /************************************************************************
     * Remember 선택 여부 저장값 읽어오기
     ************************************************************************/
    oAPP.fn.fnGetRememberCheck = () => {

        var oServerInfo = parent.getServerInfo(),
            sSysID = oServerInfo.SYSID;

        let sJsonPath = PATH.join(USERDATA, "p13n", "login.json"),
            sJsonData = FS.readFileSync(sJsonPath, 'utf-8'),
            oLoginInfo = JSON.parse(sJsonData);

        if (typeof oLoginInfo != "object") {
            return false;
        }

        if (typeof oLoginInfo[sSysID] == "undefined") {
            return false;
        }

        return oLoginInfo[sSysID].REMEMBER;

    }; // end of oAPP.fn.fnGetRememberCheck

    /************************************************************************
     * ID Suggestion Data Save
     ************************************************************************/
    oAPP.fn.fnSaveIDSuggData = (ID) => {

        const iIdSuggMaxCnt = 10;
        const sJsonPath = PATH.join(USERDATA, "p13n", "login.json");

        let oLoginInfo = {};

        try {

            if (FS.existsSync(sJsonPath)) {
                const sJsonData = FS.readFileSync(sJsonPath, 'utf-8');
                oLoginInfo = JSON.parse(sJsonData);
            }

        } catch (e) {

            oLoginInfo = {};

        }

        oLoginInfo.aIds = Array.isArray(oLoginInfo.aIds) ? oLoginInfo.aIds : [];

        // 중복 제거 후 맨 앞에 추가
        oLoginInfo.aIds = oLoginInfo.aIds.filter(a => a.ID !== ID);
        oLoginInfo.aIds.unshift({ ID });

        // 최대 개수 초과 시 자르기
        if (oLoginInfo.aIds.length > iIdSuggMaxCnt) {
            oLoginInfo.aIds = oLoginInfo.aIds.slice(0, iIdSuggMaxCnt);
        }

        try {

            FS.writeFileSync(sJsonPath, JSON.stringify(oLoginInfo, null, 2));

        } catch (e) {

            console.error("login.json write error", e);

        }

    }; // end of oAPP.fn.fnSaveIDSuggData


    /************************************************************************
     * ID Suggestion Data Read
     ************************************************************************/
    oAPP.fn.fnReadIDSuggData = () => {

        let sJsonPath = PATH.join(USERDATA, "p13n", "login.json"),
            sJsonData = FS.readFileSync(sJsonPath, 'utf-8'),
            oLoginInfo = JSON.parse(sJsonData);

        if (typeof oLoginInfo != "object" || oLoginInfo.aIds == null) {
            return [];
        }

        return oLoginInfo.aIds;

    }; // end of oAPP.fn.fnReadIDSuggData

    /************************************************************************
     * 네트워크 연결 시 Network Indicator 해제
     * **********************************************************************/
    oAPP.fn.fnNetworkCheckerOnline = function () {

        // 네트워크 활성화 여부 flag
        oAPP.attr.bIsNwActive = true;

        var bIsNwActive = oAPP.attr.bIsNwActive;

        parent.setNetworkBusy(!bIsNwActive);

    }; // end of oAPP.fn.fnNetworkCheckerOnline

    /************************************************************************
     * 네트워크 연결 시 Network Indicator 실행
     * **********************************************************************/
    oAPP.fn.fnNetworkCheckerOffline = function () {

        // 네트워크 활성화 여부 flag
        oAPP.attr.bIsNwActive = false;

        var bIsNwActive = oAPP.attr.bIsNwActive;

        parent.setNetworkBusy(!bIsNwActive);

    }; // end of oAPP.fn.fnNetworkCheckerOffline    

    /************************************************************************
     * 개인화 폴더 생성 및 로그인 사용자별 개인화 Object 만들기
     ************************************************************************/
    oAPP.fn.fnOnP13nFolderCreate = function () {

        var oServerInfo = parent.getServerInfo(),
            sSysID = oServerInfo.SYSID;

        var sP13nfolderPath = PATH.join(USERDATA, "p13n"), // P13N 폴더 경로
            sP13nPath = parent.getPath("P13N"), // P13N.json 파일 경로
            bIsExists = FS.existsSync(sP13nPath); // P13N.json 파일 유무 확인.        

        // 파일이 있을 경우
        if (bIsExists) {

            // 파일이 있을 경우.. 파일 내용을 읽어본다.	
            var sSavedData = FS.readFileSync(sP13nPath, 'utf-8'),
                oSavedData = JSON.parse(sSavedData);

            if (oSavedData == "") {
                oSavedData = {};
            }

            // 파일 내용에 SYSTEM 아이디의 정보가 있으면 리턴.
            if (oSavedData[sSysID]) {
                return;
            }

            // 없으면 개인화 영역 Object 생성 후 Json 파일에 저장
            oSavedData[sSysID] = {};

            FS.writeFileSync(sP13nPath, JSON.stringify(oSavedData));

            return;
        }

        // 로그인 사용자의 개인화 정보가 없을 경우 
        var oP13N_data = {};
        oP13N_data[sSysID] = {};

        // P13N 폴더가 없으면 폴더부터 생성 		
        if (!FS.existsSync(sP13nfolderPath)) {
            FS.mkdirSync(sP13nfolderPath);
        }

        // p13n.json 파일에 브라우저 정보 저장
        FS.writeFileSync(sP13nPath, JSON.stringify(oP13N_data));

    }; // end of oAPP.fn.fnOnP13nFolderCreate

    /************************************************************************
     * 단축키 설정
     ************************************************************************/
    oAPP.fn.fnSetShortCut = () => {

        GlobalShortCut.register('F11', () => {

            var oCurrWin = REMOTE.getCurrentWindow(),
                bIsFull = oCurrWin.isFullScreen();

            oCurrWin.setFullScreen(!bIsFull);

        });

    }; // end of oAPP.fn.fnSetShortCut

    oAPP.fn.fnOnBeforeUnload = () => {

        GlobalShortCut.unregisterAll();

    };

    /************************************************************************
     * WS Support Package Version Check
     ************************************************************************/
    //#region - WS Support Package Version Check
    oAPP.fn.fnCheckSupportPackageVersion = (resolve, oParam) => {

        let oModel = sap.ui.getCore().getModel(),
            oModelData = oModel.getProperty("/BUSYPOP");

        oModelData.ANIMATION = true;
        oModelData.PROGVISI = true;
        oModelData.TITLE = "Downloading...";
        oModelData.DESC = "If the patch is completed\nplease restart your computer!";

        oModelData.PROGTXT = "Downloading";
        oModelData.PERVALUE = 0;

        oModel.setProperty("/BUSYPOP", oModelData, true);

        let sSupportPackageCheckerPath = parent.getPath("WS_SP_UPD"),
            spAutoUpdater = require(sSupportPackageCheckerPath);

        //업데이트 확인
        spAutoUpdater.on("checking-for-update-SP", (e) => {
            console.log(e?.detail?.message || "패치 업데이트 확인중..");
        });

        //업데이트 가능 
        spAutoUpdater.on("update-available-SP", (e) => {

            console.log("SP - 업데이트 항목이 존재합니다");

            // 로그인 페이지의 Opacity를 적용한다.
            $('.u4aWsLoginFormFcard').animate({
                opacity: "0.3"
            }, 500, "linear");

            // Version Check Dialog를 띄운다.
            oAPP.fn.fnVersionCheckDialogOpen();

            parent.setDomBusy("");

            // div의 content DOM을 활성화 처리 한다.
            _showContentDom("X");

        });

        spAutoUpdater.on("update-not-available-SP", (e) => {

            console.log("SP - 현재 최신버전입니다.");

            resolve();

        });

        // 다운로드 중
        spAutoUpdater.on("download-progress-SP", (e) => {

            oModel.setProperty("/BUSYPOP/TITLE", "Support Patch Downloading...", true);

            if (oParam.ISCDN == "X") {

                // Progress Bar 실행
                _supportPackageVersionCheckDialogProgressStart();

                return;
            }

            let iTotal = e.detail.file_info.TOTAL,
                iCurr = e.detail.file_info.TRANSFERRED;

            let iPer = parseFloat(iCurr / iTotal * 100).toFixed(2);

            // 퍼센트 계산 중, 100이 넘을 경우는 강제로 100으로 만들어서
            // 프로그레스바에 표시한다.
            if (iPer >= 100) {
                iPer = 100;
            }

            oModel.setProperty("/BUSYPOP/PERVALUE", iPer, true);

        });

        // 다운로드 후, asar 압축 및 인스톨
        spAutoUpdater.on("update-install-SP", (e) => {

            console.log("SP - 패치 파일 다운로드 후 asar 압축 및 인스톨..");

            // Progress Bar 종료
            _supportPackageVersionCheckDialogProgressEnd();

            oModel.setProperty("/BUSYPOP/TITLE", "Support Patch Installing...", true);
            oModel.setProperty("/BUSYPOP/PROGTXT", "Processing", true);

            // Progress Bar 실행
            _supportPackageVersionCheckDialogProgressStart();

        });

        // 다운로드 완료시
        spAutoUpdater.on("update-downloaded-SP", (e) => {

            console.log('SP - 업데이트가 완료되었습니다.');

            // Progress Bar 종료
            _supportPackageVersionCheckDialogProgressEnd(true);

            oModel.setProperty("/BUSYPOP/TITLE", "Update Complete! Restarting...", true);

            oModel.setProperty("/BUSYPOP/PROGTXT", "Processing Complete!", true);

            oModel.setProperty("/BUSYPOP/ILLUSTTYPE", "sapIllus-SuccessHighFive", true);

            setTimeout(() => {

                if (oParam.ISCDN == "X") {

                    // 업데이트가 완료되면 기존 CDN 체크를 해제 한다.
                    parent.setIsCDN("");

                }

                //app 재실행             
                APP.relaunch();
                APP.exit();

            }, 3000);

        });

        // 업데이트 중 오류 발생
        spAutoUpdater.on("update-error-SP", (e) => {

            // div의 content DOM을 활성화 처리 한다.
            _showContentDom("X");

            // 메시지 팝업을 띄운다.
            // 다운로드 중 오류가 발생하였습니다.
            // 재시작 하시겠습니까?
            parent.setDomBusy("");

            // 오류 이벤트 호출 시 전달 받은 오류 메시지
            let sRetMsg = e?.detail?.message || "";

            let sMsg = oAPP.msg.M057 + "\n\n";
            sMsg += sRetMsg + "\n\n";

            sap.m.MessageBox.error(sMsg, {
                title: oAPP.msg.M058, //"U4A Workspace Support Package Update Error",
                initialFocus: sap.m.MessageBox.Action.OK,
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: function (action) {

                    switch (action) {

                        /**
                         * @since   2026-02-04 00:51:20
                         * @version v3.5.9-1
                         * @author  soccerhs
                         * @description
                         * 
                         * 패치 업그레이드 중, 오류 팝업에서 로그 폴더 열기 버튼 추가
                         * 
                         */
                        case "OpenLog":

                            WSLOG.openLOG(true);

                            break;

                    }

                    APP.exit();

                },

                actions: [sap.m.MessageBox.Action.OK, "OpenLog"]

            });

            console.log('SP - 패치 업데이트 중 에러가 발생하였습니다. 에러내용 : ' + sRetMsg);

        });

        let bIsCDN = (oParam.ISCDN == "X" ? true : false),
            sAppVer = `v${APP.getVersion()}`,
            oSettings = oAPP.fn.fnGetSettingsInfo(),
            sPatch_level = oSettings.patch_level,
            oWSLoginInfo = sap.ui.getCore().getModel().getProperty("/LOGIN");

        // 로그인 정보에 서버에서 구한 메타 정보 추가
        oWSLoginInfo.META = oParam.oLoginInfo.META;
        // if(!REMOTE.app.isPackaged){            
        //     //#region TEST  patch update --------- Start
        //     sAppVer = 'v3.5.9';
        //     sPatch_level = 0;
        //     //#endregion TEST patch update ------ End
        // }

        spAutoUpdater.checkForUpdates(REMOTE, bIsCDN, sAppVer, sPatch_level, oWSLoginInfo);

    }; // end of oAPP.fn.fnCheckSupportPackageVersion
    //#endregion - WS Support Package Version Check

    oAPP.fn.fnFloatingMenuOpen = () => {

        var sFloatingMenuJsPath = parent.getPath("FLTMENU"),
            oFloatMenu = require(sFloatingMenuJsPath),
            oServerInfo = parent.getServerInfo(),
            sSysID = oServerInfo.SYSID;

        oFloatMenu.open(REMOTE, screen, APPPATH, sSysID);

        // let sFloatingMenuJsPath = parent.getPath("FLTMENU"),
        //     oFloatMenu = require(sFloatingMenuJsPath),
        //     oServerInfo = parent.getServerInfo(),
        //     sSysID = oServerInfo.SYSID;

        // oFloatMenu.open(REMOTE, screen, APPPATH, sSysID);

    }; // end of oAPP.fn.fnFloatingMenuOpen


    /************************************************************************
     * 서버리스트 화면과 로그인 화면간 IPC Interface
     ************************************************************************/
    // oAPP.fn.onIpcMain_if_login_serverlist = function(oEvent, oRes){

    //     if(!oRes){
    //         return;
    //     }

    //     // 글로벌 언어 설정에 따른 Language 입력 필드 제어
    //     _setLoginLanguInputHandle(oRes);

    // }; // end of oAPP.fn.onIpcMain_if_login_serverlist


    /************************************************************************
     * 테마 개인화 변경 IPC 이벤트
     ************************************************************************/
    oAPP.fn.onIpcMain_if_p13n_themeChange = function () {

        // 로그인 정보 중, SYSID 정보를 구한다.
        let oCoreModel = sap.ui.getCore().getModel();
        let oLogInData = oCoreModel.getProperty("/LOGIN");
        let sSysID = oLogInData.SYSID;

        // 해당 SYSID별 테마 정보 JSON을 읽는다.
        let sThemeJsonPath = PATH.join(USERDATA, "p13n", "theme", `${sSysID}.json`);
        if (FS.existsSync(sThemeJsonPath) === false) {
            return;
        }

        let sThemeJson = FS.readFileSync(sThemeJsonPath, "utf-8");

        try {

            var oThemeJsonData = JSON.parse(sThemeJson);

        } catch (error) {
            return;
        }

        let sWebConBodyCss = `html, body { margin: 0px; height: 100%; background-color: ${oThemeJsonData.BGCOL}; }`;
        let oBrowserWindow = REMOTE.getCurrentWindow();
        oBrowserWindow.webContents.insertCSS(sWebConBodyCss);

        sap.ui.getCore().applyTheme(oThemeJsonData.THEME);

    }; // end of oAPP.fn.onIpcMain_if_p13n_themeChange


    /************************************************************************
     * 전체 브라우저간 통신
     ************************************************************************/
    oAPP.fn.fnIpcMain_browser_interconnection = (oEvent, oRes) => {

        let PRCCD = oRes.PRCCD;

        switch (PRCCD) {

            case "04": // 전체 윈도우를 강제로 닫을 경우

                oAPP.fn.fnIpcMain_browser_interconnection_04(oRes);

                return;

            default:
                break;

        }

    }; // end of oAPP.fn.fnIpcMain_browser_interconnection

    oAPP.fn.fnIpcMain_browser_interconnection_04 = () => {

        oAPP.attr.isPressWindowClose = "X";

        CURRWIN.close();

    }; // end of oAPP.fn.fnIpcMain_browser_interconnection_04

    function _supportPackageVersionCheckDialogProgressStart() {

        if (oAPP.attr.progressIntervalStop === true) {
            return;
        }

        // 기존에 돌고있던 인터벌이 있으면 제거한다.
        if (typeof oAPP.attr.progressInterval !== "undefined") {
            clearInterval(oAPP.attr.progressInterval);
            delete oAPP.attr.progressInterval;
        }

        let oModel = sap.ui.getCore().getModel();

        let iPer = 0;

        oAPP.attr.progressInterval = setInterval(function () {

            iPer += 1;

            oModel.setProperty("/BUSYPOP/PERVALUE", iPer, true);

            if (iPer >= 100) {

                if (typeof oAPP.attr.progressInterval !== "undefined") {
                    clearInterval(oAPP.attr.progressInterval);
                    delete oAPP.attr.progressInterval;

                    setTimeout(function () {
                        _supportPackageVersionCheckDialogProgressStart();
                    }, 500);

                    return;
                }

            }

        }, 20);

    } // end of _supportPackageVersionCheckDialogProgressStart

    function _supportPackageVersionCheckDialogProgressEnd(bIsStop) {

        let oModel = sap.ui.getCore().getModel(),
            oModelData = oModel.getProperty("/BUSYPOP");

        if (typeof oAPP.attr.progressInterval !== "undefined") {
            clearInterval(oAPP.attr.progressInterval);
            delete oAPP.attr.progressInterval;
        }

        oAPP.attr.progressIntervalStop = bIsStop;

        oModelData.PERVALUE = 100;
        oModelData.ANIMATION = false;

        oModel.setProperty("/BUSYPOP", oModelData, true);

    } // end of _supportPackageVersionCheckDialogProgressEnd

    /************************************************************************
     * 접속서버의 테마 정보 레지스트리에 저장
     ************************************************************************/
    function _registry_T_REG_THEME(T_REG_THEME) {

        return new Promise(async (resolve) => {

            // T_REG_THEME
            let oServerInfo = parent.getServerInfo(), // 서버 접속 정보
                oSettings = oAPP.fn.fnGetSettingsInfo(), // WS 설정 정보
                oRegPaths = oSettings.regPaths, // WS 레지스트리 정보
                sSystemsRegPath = oRegPaths.systems,

                // 접속 서버에 대한 테마 정보
                sRegThemeInfo = JSON.stringify(T_REG_THEME);

            // 저장할 레지스트리 경로
            let sRegPath = PATH.join(sSystemsRegPath, oServerInfo.SYSID);

            // 저장할 레지스트리 데이터
            let oRegData = {};
            oRegData[sRegPath] = {};
            oRegData[sRegPath]["T_REG_THEME"] = {
                value: sRegThemeInfo,
                type: "REG_SZ"
            };

            await WSUTIL.putRegeditValue(oRegData);

            resolve();

        });

    } // end of _registry_T_REG_THEME

    /************************************************************************
     * 접속 서버의 WhiteList Object를 레지스트리에 저장
     ************************************************************************/
    function _registry_T_REG_WLO(T_REG_WLO) {

        return new Promise(async (resolve) => {

            // T_REG_THEME
            let oServerInfo = parent.getServerInfo(), // 서버 접속 정보
                oSettings = oAPP.fn.fnGetSettingsInfo(), // WS 설정 정보
                oRegPaths = oSettings.regPaths, // WS 레지스트리 정보
                sSystemsRegPath = oRegPaths.systems,

                // 접속 서버에 대한 테마 정보
                sWhiteListObj = JSON.stringify(T_REG_WLO);

            // 저장할 레지스트리 경로
            let sRegPath = PATH.join(sSystemsRegPath, oServerInfo.SYSID);

            // 저장할 레지스트리 데이터
            let oRegData = {};
            oRegData[sRegPath] = {};
            oRegData[sRegPath]["T_REG_WLO"] = {
                value: sWhiteListObj,
                type: "REG_SZ"
            };

            await WSUTIL.putRegeditValue(oRegData);

            resolve();

        });


    } // end of _registry_T_REG_WLO


    /************************************************************************
     * 현재 브라우저의 이벤트 핸들러
     ************************************************************************/
    function _attachCurrentWindowEvents() {

        CURRWIN.on("maximize", () => {

            if (typeof sap === "undefined") {
                return;
            }

            let oMaxBtn = sap.ui.getCore().byId("maxWinBtn");
            if (!oMaxBtn) {
                return;
            }

            oMaxBtn.setIcon("sap-icon://value-help");

        });

        CURRWIN.on("unmaximize", () => {

            if (typeof sap === "undefined") {
                return;
            }

            let oMaxBtn = sap.ui.getCore().byId("maxWinBtn");
            if (!oMaxBtn) {
                return;
            }

            oMaxBtn.setIcon("sap-icon://header");

        });

    } // end of _attachCurrentWindowEvents

    /************************************************************************
     * IPC 이벤트 핸들러
     ************************************************************************/
    function _attachIPCEvents() {

        // 브라우저간 IPC 통신
        IPCMAIN.on('if-browser-interconnection', oAPP.fn.fnIpcMain_browser_interconnection);

        // 서버 정보를 구한다.
        let oServerInfo = parent.getServerInfo();

        // 접속 서버의 SYSID 정보를 구한다.
        let sSysID = oServerInfo.SYSID;

        // SYSID에 해당하는 테마 변경 IPC 이벤트를 등록한다.
        IPCMAIN.on(`if-p13n-themeChange-${sSysID}`, oAPP.fn.onIpcMain_if_p13n_themeChange);

    } // end of _attachIPCEvents


    /************************************************************************
     * 글로벌 설정값 관련 설정      
     ************************************************************************/
    // async function _globalSettingsConfig(){

    //     // 글로벌 설정 값을 구한다.
    //     let oGlobalSettings = await WSUTIL.getWsGlobalSettingInfoAsync();
    //     if(!oGlobalSettings){
    //         return;
    //     }

    // } // end of _globalSettingsConfig


    /************************************************************************
     * !! 현재 브라우저의 Child 기준 !!
     ************************************************************************
     * 에디터 타입별로 이미 오픈된 팝업이 있는지 확인
     * 있으면 새창을 띄우지 말고 focus 를 준다.
     * **********************************************************************
     * @param {Object} oEditInfo
     * - 오픈 하려는 에디터의 타입 정보
     * 
     * @return {Object} 
     *  - ISOPEN {Boolean} 
     *      true : 같은 타입의 오픈된 에디터 팝업이 이미 있는 경우.
     *      false : 같은 타입의 오픈된 에디터 팝업이 없는 신규일 경우.
     * 
     *  - WINDOW {Object}
     *      BrowserWindow Instance
     *  
     ************************************************************************/
    function _getCheckAlreadyOpenWindow(OBJTY) {

        var oCurrWin = REMOTE.getCurrentWindow(), // 현재 window
            aChildWin = oCurrWin.getChildWindows(), // 현재 window의 child window           
            iChildWinCnt = aChildWin.length,
            sObjType = OBJTY;

        if (iChildWinCnt <= 0) {
            return {
                ISOPEN: false
            };
        }

        for (var i = 0; i < iChildWinCnt; i++) {

            var oWin = aChildWin[i];

            if (oWin.isDestroyed()) {
                continue;
            }

            try {

                var oWebCon = oWin.webContents;
                var oWebPref = oWebCon.getWebPreferences();
                var sType = oWebPref.OBJTY;

                if (sObjType != sType) {
                    continue;
                }

                oWin.focus();

                return {
                    ISOPEN: true,
                    WINDOW: oWin
                };

            } catch (error) {
                continue;
            }

        }

        return {
            ISOPEN: false
        };

    }; // end of _getCheckAlreadyOpenWindow


    /************************************************************************
     * 로그인 오류 확인사항 가이드 Popup 실행
     ************************************************************************/
    function _showLoginErrorHelpPopup() {

        parent.setDomBusy("X");

        const oSettingInfo = WSUTIL.getWsSettingsInfo(),
            WS_LANGU = oSettingInfo.globalLanguage;

        const sHelpRoot = PATH.join(APPPATH, "help", "login");
        let sHelpLanguPath = PATH.join(sHelpRoot, WS_LANGU, "index.html");

        if (!parent.FS.existsSync(sHelpLanguPath)) {

            sHelpLanguPath = PATH.join(sHelpRoot, "EN", "index.html");

            if (!parent.FS.existsSync(sHelpLanguPath)) {

                // 해당 언어에 대한 가이드 문서가 없습니다. U4A 솔루션 팀에 문의하세요.
                const sErrMsg = oAPP.msg.M414;

                sap.m.MessageBox.information(sErrMsg);

                parent.setDomBusy("");

                return;
            }

        }

        const sPopupName = "LOGIN_ERROR";

        // 기존 팝업이 열렸을 경우 새창 띄우지 말고 해당 윈도우에 포커스를 준다.
        const oResult = WSUTIL.getCheckAlreadyOpenWindow(sPopupName);
        if (oResult.ISOPEN) {

            // 부모 위치 가운데 배치한다.            
            parent.WSUTIL.setParentCenterBounds(REMOTE, oResult.WINDOW);

            parent.setDomBusy("");

            return;

        }

        const 
            SESSKEY = parent.getSessionKey(),
            BROWSKEY = parent.getBrowserKey();

        const oThemeInfo = parent.getThemeInfo(); // theme 정보      

        // 브라우저 옵션 설정
        const 
            sSettingsJsonPath = parent.getPath("BROWSERSETTINGS"),
            oDefaultOption = parent.require(sSettingsJsonPath),
            oBrowserOptions = jQuery.extend(true, {}, oDefaultOption.browserWindow);

        oBrowserOptions.title = oAPP.msg.M415;  // 서버 접속 관련 오류 점검사항
        oBrowserOptions.autoHideMenuBar = true;
        oBrowserOptions.parent = CURRWIN;
        oBrowserOptions.backgroundColor = oThemeInfo.BGCOL;

        oBrowserOptions.opacity = 0.0;
        oBrowserOptions.show = false;
        oBrowserOptions.closable = false;

        oBrowserOptions.webPreferences.partition = SESSKEY;
        oBrowserOptions.webPreferences.browserkey = BROWSKEY;
        oBrowserOptions.webPreferences.OBJTY = sPopupName;

        // 브라우저 오픈
        let oBrowserWindow = new REMOTE.BrowserWindow(oBrowserOptions);
        

        // 오픈할 브라우저 백그라운드 색상을 테마 색상으로 적용
        const sWebConBodyCss = `html, body { margin: 0px; height: 100%; background-color: ${oThemeInfo.BGCOL}; }`;

        oBrowserWindow.webContents.insertCSS(sWebConBodyCss);

        // 브라우저 상단 메뉴 없애기
        oBrowserWindow.setMenu(null);        

        const oQueryParams = {
            browserkey: oBrowserOptions?.webPreferences?.browserkey,
            sessionKey: oBrowserOptions?.webPreferences?.partition,
            OBJTY: sPopupName,
        };        
 
        // URL에 QueryString 파라미터를 적용한다.
        const sLoadUrl = WSUTIL.QueryString.build(sHelpLanguPath, oQueryParams);

        oBrowserWindow.loadURL(sLoadUrl);

        // 브라우저가 활성화 될 준비가 될때 타는 이벤트
        oBrowserWindow.once('ready-to-show', () => {

            // 부모 위치 가운데 배치한다.            
            WSUTIL.setParentCenterBounds(REMOTE, oBrowserWindow);

        });

        // 브라우저가 오픈이 다 되면 타는 이벤트
        oBrowserWindow.webContents.on('did-finish-load', function () {

            // 윈도우 오픈할때 opacity를 이용하여 자연스러운 동작 연출
            WSUTIL.setBrowserOpacity(oBrowserWindow);

            // 부모 위치 가운데 배치한다.            
            WSUTIL.setParentCenterBounds(REMOTE, oBrowserWindow);

            parent.setDomBusy("");

            oBrowserWindow.closable = true;

            oBrowserWindow.show();

        });

        // 브라우저를 닫을때 타는 이벤트
        oBrowserWindow.on('closed', () => {

            oBrowserWindow = null;

            CURRWIN.focus();

        });

    } // end of _showLoginErrorHelpPopup


    /************************************************************************
     * 로그인 오류 메시지 Dialog 실행
     ************************************************************************/
    function _openLoginErrorDialog(oPARAM) {

        // 제목
        let sTitle = oPARAM?.TITLE || "";

        // 점검사항
        let sMsg01 = oAPP.msg.M249;

        // 아래의 점검사항을 확인하세요.
        let sMsg02 = oAPP.msg.M250;

        let oDialog = new sap.m.Dialog({
            contentWidth: "500px",
            draggable: true,
            resizable: true,
            state: "Error",
            buttons: [
                new sap.m.Button({
                    icon: "sap-icon://question-mark",
                    text: sMsg01, /* 점검사항 */
                    press: function () {

                        // 로그인 오류 확인사항 가이드 Popup 실행
                        _showLoginErrorHelpPopup();

                    }
                }),
                new sap.m.Button({
                    icon: "sap-icon://decline",
                    type: sap.m.ButtonType.Reject,
                    press: function () {
                        oDialog.close();
                    }
                })
            ],
            afterClose: function () {

                oDialog.destroy();

                oAPP.attr.isPressWindowClose = "X";

                CURRWIN.close();

            }
        });
        // .addStyleClass("sapUiSizeCompact");

        oDialog.addStyleClass("sapUiContentPadding");

        let oToolbar1 = new sap.m.Toolbar();
        oDialog.setCustomHeader(oToolbar1);

        let oIcon1 = new sap.ui.core.Icon({
            src: "sap-icon://disconnected",
            size: "20px",
        });
        oToolbar1.addContent(oIcon1);

        // 제목 영역
        let oTitle1 = new sap.m.Title({
            text: sTitle
        });
        oToolbar1.addContent(oTitle1);

        let oVBox1 = new sap.m.VBox();
        oDialog.addContent(oVBox1);

        // 오류 내용
        let oTitle2 = new sap.m.Title({
            text: oPARAM?.DESC || "",
            wrapping: true
        });
        oVBox1.addItem(oTitle2);

        oTitle2.addStyleClass("sapUiSmallMarginBottom");

        let oTitle4 = new sap.m.Title({
            text: sMsg02, /* 아래의 점검사항을 확인하세요. */
            wrapping: true,
        });
        oVBox1.addItem(oTitle4);

        oDialog.open();

    } // end of _openLoginErrorDialog

    /********************************************************
     * 접속서버에서 설치된 언어 목록을 구한다.
     ********************************************************/
    function _getSupportedLangu(PARAM) {

        return new Promise(function (resolve) {

            let sServicePath = parent.getServerPath();

            // ajax 결과
            var oResult = undefined;

            let oFormData = new FormData();
            oFormData.append("GET_LANGU", "X");
            oFormData.append("PRCCD", PARAM.PRCCD);

            jQuery.ajax({
                timeout: 5000,
                method: "POST",
                url: sServicePath,
                data: oFormData,
                cache: false,
                contentType: false,
                processData: false,
                success: function (data, textStatus, xhr) {

                    oResult = { success: true, data: data, status: textStatus, statusCode: xhr && xhr.status };

                    let sStringData = oResult.data;

                    try {

                        var oRetJson = JSON.parse(sStringData);

                    } catch (error) {

                        // 콘솔용 오류 메시지
                        var aConsoleMsg = [
                            `[PATH]: www/Login/Login.js`,
                            `=> _getSupportedLangu`,
                            `=> success`,
                            `=> JSON.parse error!`,
                            `=> 여기서 JSON Parse 오류 발생 시`,
                            `=> 백엔드에 해당 체크 로직이 없어서 로그인 클래스에서 html이 리턴됨.`,
                            `=> 그러므로 상위 WS 에서 하위 버전(3.4.x) 서버를 접근하는 것으로`,
                            `=> 로그인 페이지의 언어 선택 영역이 서버 언어 입력 Input만 나오게 처리`,
                        ];

                        console.log(aConsoleMsg.join("\r\n"));
                        console.trace();

                        return resolve({
                            RETCD: "E",
                            STCOD: "E998",
                        });

                    }

                    return resolve(oRetJson);

                },
                error: function (xhr, textStatus, error) {

                    // 콘솔용 오류 메시지
                    var aConsoleMsg = [
                        `[PATH]: www/Login/Login.js`,
                        `=> _getSupportedLangu`,
                        `=> 통신오류 발생!!`,
                        `=> 접속 정보 확인 요망!!`,
                        `=> 접속 서버가 SSO(SAML 2.0) 적용 서버일 경우, ZU4A_WBC 서비스에 SAML 삭제!!`,
                    ];

                    console.error(error);
                    console.error(aConsoleMsg.join("\r\n"));
                    console.trace();

                    oResult = { success: false, data: undefined, status: textStatus, error: error, statusCode: xhr.status, errorResponse: xhr.responseText };

                    return resolve({
                        RETCD: "E",
                        STCOD: "E999",
                    });

                }
            });

        });

    } // end of _getSupportedLangu


    /********************************************************
     * PRCCD값을 던져서 응답시 동일한 값으로 오는지 아닌지에 따라
     * 로그인 화면 제어를 하기 위한 function
     ********************************************************/
    function _handleLoginLangu() {

        return new Promise(async function (resolve) {

            // PRCCD값을 던져서 응답시 동일한 값으로 오는지 아닌지에 따라
            // 로그인 화면 제어를 하기 위한 코드
            let sLanguPRCCD = "GET_LANGU";

            // 접속서버에서 설치된 언어 목록을 구한다.
            let oLanguResult = await _getSupportedLangu({ PRCCD: sLanguPRCCD });

            // 로그 메시지
            var aConsoleMsg = [
                `[PATH]: www/Login/Login.js`,
                `=> _handleLoginLangu`,
            ];

            console.log(aConsoleMsg.join("\r\n"));
            console.log(oLanguResult);

            if (oLanguResult.RETCD === "E") {

                let sErrMsg = "";

                switch (oLanguResult.STCOD) {

                    case "E001":

                        sErrMsg = oAPP.msg.M282; // 지원가능한 언어가 없습니다

                        break;

                    case "E998":

                        // 해당 오류는 상위 WS 에서 하위 버전(3.4.x) 서버를 접근하는 내용으로,
                        // 로그인 페이지의 언어 선택 영역이 서버 언어 입력 Input만 나오게 처리하면 됨.
                        let oLanguForm = sap.ui.getCore().byId("ws_langu_input_form");
                        oLanguForm.setVisible(true);

                        return resolve();

                    case "E999":

                        sErrMsg = oAPP.msg.M283; // 통신오류

                        break;


                    default:

                        sErrMsg = oAPP.msg.M283; // 통신오류

                        break;

                }

                // sap.m.MessageBox.error(sErrMsg, {
                //     onClose: function(){

                //         oAPP.attr.isPressWindowClose = "X";

                //         CURRWIN.close();

                //     }
                // });   

                /**
                 * @since   2025-06-25
                 * @version v3.5.6-8
                 * @author  soccerhs
                 * 
                 * @description
                 * 로그인창 실행 시 오류 발생에 대한 확인 및 조치 가이드 내용 추가
                 *
                 * - 기존:
                 *   단순 서버 접속 실패 메시지
                 * 
                 * - 변경:
                 *   접속 실패 메시지와 함께 확인 사항 가이드 내용 추가
                 */
                let sTitle = oAPP.msg.M416; // 서버 연결 실패!

                // 로그인 오류 메시지 Dialog 호출
                _openLoginErrorDialog({ TITLE: sTitle, DESC: sErrMsg });

                parent.setDomBusy("");

                return;

            }

            // 내가 던진 PRCCD 아니라면 기존 Input 형태의 language를 보여준다.
            if (oLanguResult?.PRCCD !== sLanguPRCCD) {

                let oLanguForm = sap.ui.getCore().byId("ws_langu_input_form");
                oLanguForm.setVisible(true);

                return resolve();

            }

            // 내가 던진 ACTCD가 같다면 Select 형태의 language를 보여준다.
            let oLanguForm = sap.ui.getCore().byId("ws_langu_select_form");
            oLanguForm.setVisible(true);

            // 접속 서버에 설치된 언어 정보 체크
            let aLangu = oLanguResult?.T_LANGU || [];

            let oModel = sap.ui.getCore().getModel();
            if (!oModel) {
                return resolve();
            }

            // 기 저장된 언어 정보가 없다면 서버의 Default 언어로 설정해준다
            let sLangu = oModel.getProperty("/LOGIN/LANGU");
            if (!sLangu) {
                oModel.setProperty("/LOGIN/LANGU", oLanguResult.DEFLANGU || "");
            }

            oModel.setProperty("/LOGIN/T_LANGU", aLangu);

            return resolve();

        });

    } // end of _handleLoginLangu


    /********************************************************
     * 화면 랜더링 이후에 호출되는 이벤트
     ********************************************************/
    async function _onViewReady() {

        // Default Browser check
        await oAPP.fn.fnCheckIstalledBrowser();

        // WS Global 메시지 글로벌 변수 설정
        await fnWsGlobalMsgList();

        // 초기값 바인딩
        oAPP.fn.fnOnInitModelBinding();

        // 현재 브라우저의 이벤트 핸들러
        _attachCurrentWindowEvents();

        // IPC 이벤트 핸들러
        _attachIPCEvents();

        // 개인화 폴더 체크 후 없으면 생성
        oAPP.fn.fnOnP13nFolderCreate();

        // Illustration Message TNT-svg register
        oAPP.fn.fnRegisterIllustrationPool();

        // IconPool Register Fiori icon
        oAPP.fn.fnRegisterFioriIconPool();

        // PRCCD값을 던져서 응답시 동일한 값으로 오는지 아닌지에 따라
        // 로그인 화면 제어를 하기 위한 function
        await _handleLoginLangu();

        // SSO 키 정보가 있다면 자동로그인 처리한다.
        let oServerInfo = parent.getServerInfo();

        if (oServerInfo?.IS_SSO === "X") {

            // 전달받은 SYSID, LANGU, WSLANGU 값이 있다면 모델 세팅한다.
            let oCoreModel = sap.ui.getCore().getModel();
            let oLogInData = oCoreModel.getProperty("/LOGIN");

            if (oServerInfo.CLIENT) {
                oLogInData.CLIENT = oServerInfo.CLIENT;
            }

            if (oServerInfo.SAPID) {
                oLogInData.ID = oServerInfo.SAPID;
            }

            if (oServerInfo.SAPPW) {
                oLogInData.PW = oServerInfo.SAPPW;
            }

            if (oServerInfo.LANGU) {
                oLogInData.LANGU = oServerInfo.LANGU;
            }

            if (oServerInfo.WSLANGU) {
                oLogInData.WSLANGU = oServerInfo.WSLANGU;
            }

            oCoreModel.setProperty("/LOGIN", oLogInData);

            // SSO 관련 로그인 처리
            await _handleSSOLogin();

            oAPP.events.ev_login(oServerInfo);

            return;

        }


        setTimeout(() => {
            $('#content').fadeIn(300, 'linear');
        }, 300);

        parent.setDomBusy("");

    } // end of _onViewReady


    /********************************************************
     * SSO 관련 로그인 처리
     ********************************************************/
    function _handleSSOLogin() {

        return new Promise(async function (resolve) {

            // 서버 정보
            let oServerInfo = parent.getServerInfo();

            // SSO 키
            let SSO_TICKET = oServerInfo?.SSO_TICKET || undefined;

            // SSO 키가 있는지 확인
            if (typeof SSO_TICKET === "undefined") {
                return resolve();
            }

            // 호출할 서버 경로
            let sServerPath = parent.getServerPath();

            // SSO Header 구분자
            let SSO_HDR = `${SSO_TICKET}_XXX`;

            let oFormData = new FormData();
            oFormData.append("SSO_TICKET", SSO_TICKET);

            try {

                var response = await fetch(sServerPath, {
                    headers: {
                        "sso_hdr": SSO_HDR,
                    },
                    method: "POST",
                    body: oFormData

                });

            } catch (error) {

                // 콘솔용 오류 메시지
                var aConsoleMsg = [
                    `[PATH]: www/Login/Login.js`,
                    `=> _handleSSOLogin`,
                    `=> 통신오류 발생!!`,
                    `=> SSO 관련 로그인 처리 실패!!`,
                    `=> 접속 정보 확인 요망!!`,
                    `=> 접속 서버가 SSO(SAML 2.0) 적용 서버일 경우, ZU4A_WBC 서비스에 SAML 삭제!!`,
                ];

                console.error(error);
                console.error(aConsoleMsg.join("\r\n"));
                console.trace();
            }

            resolve();

        });

    } // end of _handleSSOLogin

    /************************************************************************s
     *---------------------[ U4A WS Login Page Start ] ----------------------
     ************************************************************************/
    oAPP.fn.fnAttachInit = () => {

        sap.ui.getCore().attachInit(async () => {

            jQuery.sap.require("sap.m.MessageBox");

            var oWsSettings = oAPP.fn.fnGetSettingsInfo();

            // trial 버전 로그인 페이지를 그린다.
            if (oWsSettings.isTrial) {

                oAPP.fn.fnOnTrialLoginPageRendering();

                return;
            }

            // 로그인 페이지 초기 렌더링
            oAPP.fn.fnOnInitRendering();

            /**
             * 무조건 맨 마지막에 수행 되어야 함!!
             */

            // 자연스러운 로딩
            sap.ui.getCore().attachEvent(sap.ui.core.Core.M_EVENTS.UIUpdated, async function () {

                if (!oAPP.attr.UIUpdated) {

                    // SSO 접속 일 경우가 아니면 로그인 화면부터 나오게 한다.
                    let oServerInfo = parent.getServerInfo();
                    if (oServerInfo?.IS_SSO !== "X") {

                        setTimeout(() => {
                            $('#content').fadeIn(300, 'linear');
                        }, 300);

                    }

                    // setTimeout(() => {
                    //     $('#content').fadeIn(300, 'linear');
                    // }, 300);

                    oAPP.attr.UIUpdated = "X";

                    // 화면 랜더링 이후 호출
                    await _onViewReady();

                }

            });

        });

    }; // end of oAPP.fn.fnAttachInit

    return oAPP;

})();


// function fnSetGlobalBusy(bIsShow) {

//     let oBusy = parent.document.getElementById("u4aWsBusyIndicator"),
//         sVisibility = "hidden";

//     if (bIsShow) {
//         sVisibility = "visible";
//     }

//     oBusy.style.visibility = sVisibility;

// }



// function fnSetBusy(bIsShow) {

//     var oLoadPg = document.getElementById("u4a_main_load");

//     if (!oLoadPg) {
//         return;
//     }

//     if (bIsShow == 'X') {
//         oLoadPg.classList.remove("u4a_loadersInactive");
//     } else {
//         oLoadPg.classList.add("u4a_loadersInactive");
//     }

// }

// fnSetBusy('X');

oAPP.fn.fnLoadBootStrapSetting();

function _fnWait() {
    return new Promise((resolve) => {

        setTimeout(() => {
            resolve();
        }, 3000);

    });

}

/************************************************************************
* WS Global 메시지 글로벌 변수 설정
************************************************************************/
function fnWsGlobalMsgList() {

    return new Promise(async (resolve) => {

        const WSUTIL = parent.WSUTIL;

        let oSettingInfo = WSUTIL.getWsSettingsInfo(),
            sWsLangu = oSettingInfo.globalLanguage;

        oAPP.msg.M001 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "001"); // Language        
        oAPP.msg.M032 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "032"); // Restart
        oAPP.msg.M051 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "051"); // Error occurred while U4A Workspace Updating!
        oAPP.msg.M052 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "052"); // Do you want to restart?
        oAPP.msg.M053 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "053"); // Ignoring updates and then running the program
        oAPP.msg.M054 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "054"); // U4A Workspace Update Error
        oAPP.msg.M055 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "055"); // Program
        oAPP.msg.M056 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "056"); // Close
        oAPP.msg.M057 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "057"); // Error occurred while U4A Workspace Support Package Updating!
        oAPP.msg.M058 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "058"); // U4A Workspace Support Package Update Error
        oAPP.msg.M063 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "063"); // Client
        oAPP.msg.M064 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "064"); // ID
        oAPP.msg.M065 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "065"); // Password
        oAPP.msg.M081 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "081"); // An issue occurred during login. Please contact support for assistance.
        oAPP.msg.M082 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "082"); // You need to change your password. Please update it via SAPGUI.

        oAPP.msg.M249 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "249"); // 점검사항
        oAPP.msg.M250 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "250"); // 아래의 점검사항을 확인하세요.

        oAPP.msg.M0271 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "027", oAPP.msg.M063); // (Client) &1 is required entry value
        oAPP.msg.M0272 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "027", oAPP.msg.M064); // (ID) &1 is required entry value
        oAPP.msg.M0273 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "027", oAPP.msg.M065); // (Password) &1 is required entry value
        oAPP.msg.M0274 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "027", oAPP.msg.M001); // (Language) &1 is required entry value

        oAPP.msg.M282 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "282"); // 사용 가능한 로그인 언어가 없습니다.
        oAPP.msg.M283 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "283"); // 서버 접속 오류가 발생하였습니다.
        oAPP.msg.M290 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "290"); // 다시시도 하시거나, 문제가 지속될 경우 U4A 솔루션 팀에 문의 하세요.
        oAPP.msg.M294 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "294"); // 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.
        oAPP.msg.M295 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "295"); // 치명적인 오류가 발생하였습니다.

        oAPP.msg.M414 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "414"); // 해당 언어에 대한 가이드 문서가 없습니다. U4A 솔루션 팀에 문의하세요.
        oAPP.msg.M415 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "415"); // 서버 접속 관련 오류 점검사항
        oAPP.msg.M416 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "416"); // 서버 연결 실패!
        oAPP.msg.M417 = WSUTIL.getWsMsgClsTxt(sWsLangu, "ZMSG_WS_COMMON_001", "417"); // 로그인 실패!

        resolve();

    });

}; // end of fnWsGlobalMsgList

window.addEventListener("load", async () => {

    // // Default Browser check
    // await oAPP.fn.fnCheckIstalledBrowser();

    // // WS Global 메시지 글로벌 변수 설정
    // await fnWsGlobalMsgList();

    oAPP.fn.fnAttachInit();

});

window.onbeforeunload = () => {

    // 브라우저의 닫기 버튼을 누른게 아니라면 종료 하지 않음
    if (parent.oAPP.attr.isPressWindowClose !== "X") {
        return false;
    }

    window.removeEventListener("online", oAPP.fn.fnNetworkCheckerOnline);
    window.removeEventListener("offline", oAPP.fn.fnNetworkCheckerOffline);

    // 브라우저간 IPC 통신
    IPCMAIN.off('if-browser-interconnection', oAPP.fn.fnIpcMain_browser_interconnection);

    // 서버 정보를 구한다.
    let oServerInfo = parent.getServerInfo();

    // 접속 서버의 SYSID 정보를 구한다.
    let sSysID = oServerInfo.SYSID;

    // SYSID에 해당하는 테마 변경 IPC 이벤트를 제거한다.
    IPCMAIN.off(`if-p13n-themeChange-${sSysID}`, oAPP.fn.onIpcMain_if_p13n_themeChange);

    oAPP.fn.fnOnBeforeUnload();

};

// window.addEventListener("beforeunload", () => {

//     window.removeEventListener("online", oAPP.fn.fnNetworkCheckerOnline);
//     window.removeEventListener("offline", oAPP.fn.fnNetworkCheckerOffline);

//     oAPP.fn.fnOnBeforeUnload();

// });

/************************************************************************
 * 네트워크 연결 및 해제 시 발생되는 이벤트
 * **********************************************************************/
window.addEventListener("online", oAPP.fn.fnNetworkCheckerOnline, false);
window.addEventListener("offline", oAPP.fn.fnNetworkCheckerOffline, false);

// window.addEventListener("beforeunload", oAPP.fn.fnOnBeforeUnload, false);

document.addEventListener('DOMContentLoaded', function () {

    // 브라우저 타이틀 변경
    parent.CURRWIN.setTitle("U4A Workspace - Login");

    // 브라우저 zoom 레벨을 수정 한 후 로그인 페이지로 이동 시 기본 zoom 레벨 적용
    parent.WEBFRAME.setZoomLevel(0);

});

function isBlank(s) {
    return isEmpty(s.trim());
}

function isEmpty(s) {
    return !s.length;
}