/**
 * @since   2025-12-29 11:09:15
 * @version v3.5.7-4
 * @author  pes
 * @description
 * UI에 이벤트에 단축키를 등록하는 팝업.
 * 해당 팝업에서 이전 단축키 정보가 존재하는경우 전달받아 표시.
 * 팝업에서 단축키를 입력받은 뒤 적용 버튼 선택시 결과값을 반환.
 * 값을 초기화한 후 적용 버튼 선택시 빈값 반환.
 */
export const keyBinding = {};

/**
 * VSCode Keybinding Popup 스타일의 단축키 입력 Dialog
 * @returns {Promise<object>}
 */
function openKeybindingDialog(sPreShortCut) {

    return new Promise(function (resolve) {

        const _sAppInfo = parent.getAppInfo();

        //476	단축키를 입력하십시오
        var _txt1 = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "476");


        const oInput = new sap.m.Input({
            width: "100%",
            value: sPreShortCut?.keyBinding || "",
            placeholder: _txt1,
            valueState : "Information",
            showValueStateMessage : false
        }).addStyleClass("sapUiTinyMarginBottom");


        const oCheckbox = new sap.m.CheckBox({
            selected : sPreShortCut?.autoFocus || false,
            editable : _sAppInfo.IS_EDIT === "X" ? true : false
        });

        //487	이미 동일한 단축키가 등록되어 있습니다.
        //      UI 찾기 팝업의 ‘단축키 등록 이벤트 사용처 확인’ 메뉴에서 등록된 단축키 항목을 확인해 주십시오.
        var _txt1 = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "487");

        const oMessage = new sap.m.MessageStrip({
            showIcon: true,
            visible: false,
            text : _txt1,
            tooltip: _txt1,
            // link : new sap.m.Link({
            //     enabled: false,
            //     wrapping :true,
            //     text: _txt1,
            //     tooltip: _txt1,
            //     press : ()=>{
            //         //findPopup 버튼 이벤트 수행.
            //         sap.ui.getCore().byId("ws20_findBtn")?.firePress?.();
            //     }
            // })
        }).addStyleClass("sapUiMediumMarginBottom");

        
        //472	단축키 등록을 위해 팝업에서 원하는 키를 직접 누르십시오.
        //      입력한 키 조합은 자동으로 인식되어 화면에 표시됩니다.
        //      입력이 완료되면 [적용] 버튼을 눌러 단축키 등록을 완료하십시오."
        var _txt1 = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "472");

        // 471	단축키 실행 시 대상 UI에 포커스 적용 여부
        var _txt2 = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "471");

        //474	"UI 이벤트에 단축키가 지정된 상태에서 단축키를 입력하면,
        //      해당 이벤트가 연결된 UI로 포커스를 이동할지 여부를 설정합니다."
        var _txt3 = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "474");
        

        const oVBox = new sap.m.VBox({
            items: [
                new sap.m.Text({ 
                    text: _txt1,
                    tooltip: _txt1
                }).addStyleClass("sapUiTinyMarginBottom"),
                oInput,
                oMessage,

                new sap.m.HBox({
                    alignItems: "Center",
                    items: [
                        oCheckbox,
                        new sap.m.Text({ 
                            text: _txt2,
                            tooltip: _txt2
                        })
                    ]
                }),
                new sap.m.Text({ 
                    text: _txt3,
                    tooltip: _txt3
                })
            ],
            alignItems: "Stretch",
            width: "100%"
        }).addStyleClass("sapUiMediumMarginBottom");

        //470	단축키 등록
        var _txt = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "470");

        
        //단축키 등록 대상 UI, 이벤트명 정보가 존재하는경우 TITLE에 추가 구성 처리.
        sPreShortCut?.OBJID && sPreShortCut?.UIATT ?
            _txt += ` ${sPreShortCut.OBJID} - ${sPreShortCut.UIATT}` : "";


        const oDlg = new sap.m.Dialog({
            icon: "sap-icon://keyboard-and-mouse",
            draggable: true,
            content: [oVBox],
            type: "Message",
            initialFocus: oInput,
            horizontalScrolling: false,
            verticalScrolling: false,
            customHeader: new sap.m.Toolbar({
                content: [
                    new sap.ui.core.Icon({
                        src : "sap-icon://keyboard-and-mouse"
                    }),
                    new sap.m.Title({
                        text: _txt,
                        tooltip: _txt
                    }),
                    new sap.m.ToolbarSpacer(),
                    new sap.m.Button({
                        //056	닫기
                        tooltip: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "056"),
                        icon: "sap-icon://decline",
                        type: "Reject",
                        press: function () {
                            closeDlg();
                        }
                    })
                ]
            }),
            escapeHandler: () => {},
            afterClose: () => {
                
                //키다운 이벤트 제거.
                removeKeyDown();

                oDlg.destroy();
                
            },
            afterOpen: () => {
                parent.setBusy("");

                addKeyDown();
            }
        }).addStyleClass("sapUiSizeCompact");

        oDlg.setInitialFocus(oDlg);

        //328	초기화
        var _txt = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "328");

        let _oResetBtn = new sap.m.Button({
            text:_txt,
            tooltip:_txt,
            icon: "sap-icon://delete",
            type:"Attention",
            press:function(){
                
                //단축키 입력값 초기화
                oInput.setValue("");

                // autoFocus 초기화
                oCheckbox.setSelected(false);
            }
        });

        oDlg.addButton(_oResetBtn);

        //232	적용
        var _txt = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "232");

        let oApplyBtn = new sap.m.Button({
            text: _txt,
            tooltip: _txt,
            icon: "sap-icon://accept",
            type: "Accept",
            press: async function () {

                //키다운 이벤트 제거.
                removeKeyDown();

                //473	&1 UI의 & 에 단축키를 등록 하시겠습니까?
                let _txt = parent.WSUTIL.getWsMsgClsTxt("", 
                    "ZMSG_WS_COMMON_001", "473", sPreShortCut.OBJID, sPreShortCut.UIATT);

                
                
                //등록된 단축키 입력값.
                const key = oInput.getValue();

                //단축키 등록건이 존재하지 않는경우 메시지 변경
                //빈값 등록 메시지.
                if(key.trim() === ""){
                    //475	&1 UI의 & 이벤트에 등록된 단축키를 초기화 하시겠습니까?
                    _txt = parent.WSUTIL.getWsMsgClsTxt("", 
                        "ZMSG_WS_COMMON_001", "475", sPreShortCut.OBJID, sPreShortCut.UIATT);
                }

                //단축키 등록전 확인 팝업 호출.
                let _res = await new Promise((res)=>{
                    parent.showMessage(sap, 30, "I", _txt, function(param){
                        res(param);
                    });
                });

                if(_res !== "YES"){
                    //keydown 이벤트 재등록.
                    addKeyDown();
                    return;
                }


                parent.setBusy("X");

                //키다운 이벤트 제거.
                removeKeyDown();

                const autoFocus = oCheckbox.getSelected();

                oDlg.close();
                
                resolve({
                    ACTCD: "APPLY",
                    RDATA: { keyBinding: key || "", autoFocus: autoFocus}
                });
            }
        });
        oDlg.addButton(oApplyBtn);

        //003	취소
        var _txt = parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "003");

        let oCancelBtn = new sap.m.Button({
            text: _txt,
            tooltip: _txt,
            icon: "sap-icon://decline",
            type: "Reject",
            press: function () {
                closeDlg();
            }
        });
        oDlg.addButton(oCancelBtn);

        oDlg.open();


        function buildKeyString(e) {
            const parts = [];

            // 1. Modifier 상태 체크
            if (e.ctrlKey) parts.push("Ctrl");
            if (e.shiftKey) parts.push("Shift");
            if (e.altKey) parts.push("Alt");
            if (e.metaKey) parts.push("Meta");            

            // 2. Modifier 키 목록 정의
            const modifierKeys = [
                "Control", "Shift", "Alt", "Meta", 
                "ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight"
            ];

            // 3. 실제 눌린 키 처리
            if (!modifierKeys.includes(e.key)) {
                let key = e.key;
                
                // 영문 소문자 -> 대문자
                if (key.length === 1) key = key.toUpperCase();

                // 특수 키 매핑
                const map = {
                    " ": "Space",
                    "ArrowUp": "ArrowUp",
                    "ArrowDown": "ArrowDown",
                    "ArrowLeft": "ArrowLeft",
                    "ArrowRight": "ArrowRight",
                    "Escape": "Escape",
                    "Enter": "Enter",
                    "Backspace": "Backspace",
                    "Tab": "Tab"
                };
                
                if (map[key]) key = map[key];

                parts.push(key);
            }

            return parts.join("+");
        }

        function onKeyDown(e) {

            if(_sAppInfo.IS_EDIT !== "X"){
                return;
            }

            oMessage.setVisible(false);

            e.preventDefault();
            e.stopPropagation();

            // 반복 입력 방지
            if (typeof e.repeat === "boolean" && e.repeat) return;

            switch (e.key) {                

                // case "Escape":
                //     removeKeyDown();
                //     oDlg.close();
                //     resolve({ ACTCD: "CANCEL" });
                //     return;

                case "Backspace":
                    oInput.setValue("");
                    return;

                case "Enter":
                    oApplyBtn.firePress();
                    return;

                case "Space":
                    return;
            }

            const sKey = buildKeyString(e);

            //중복된 단축키 존재 여부 확인.
            let _isDupl = checkDuplShortcutKey(sKey);

            if(_isDupl){
                oMessage.setVisible(true);
            }

            oInput.setValue(sKey);
        }



        //단축키 중복건 점검.
        function checkDuplShortcutKey(sKey){

            //ATTR 변경건 수집.
            let _aT_0015 = oAPP.fn.getAttrChangedData();
            
            if(_aT_0015.length === 0){
                return;
            }

            //단축키 등록건 발췌.
            _aT_0015 = _aT_0015.filter( item => item.SHCUT );

            if(_aT_0015.length === 0){
                return;
            }


            for (const _s0015 of _aT_0015) {

                //단축키 팝업을 호출한 UI의 이벤트와 같은건인경우 skip.
                if(sPreShortCut.OBJID === _s0015.OBJID && sPreShortCut.UIATT === _s0015.UIATT){
                    continue;
                }
                
                //단축키 등록건 object화.
                let _sShortcut  = JSON.parse(_s0015.SHCUT);

                
                if(_sShortcut?.SCKEY === sKey){
                    return true;
                }

            }

        }


        function addKeyDown(){
            window.addEventListener("keydown", onKeyDown, true);
        }

        
        function removeKeyDown() {
            window.removeEventListener("keydown", onKeyDown, true);
        }


        function closeDlg() {

            parent.setBusy("X");

            //키다운 이벤트 제거.
            removeKeyDown();

            oDlg.close();

            resolve({ ACTCD: "CANCEL" });
        }

    });
}




keyBinding.openKeybindingDialog = openKeybindingDialog;