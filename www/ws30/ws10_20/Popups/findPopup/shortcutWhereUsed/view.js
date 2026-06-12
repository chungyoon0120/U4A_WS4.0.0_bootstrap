
/********************************************************************
 *📝 VIEW.JS    
    내역 : 단축키 등록 사용처 조회 팝업 뷰
********************************************************************/
export async function createView(oParam){
    
    const _path  = "./control.js";
    const _oMudule = await import(_path);
    const _oContr = await _oMudule.createControl(oParam);

    //ROOT UI 구성 처리.
    //(ROOT UI는 PAGE로 기준을 정함)
    const ROOT = new sap.m.Page(`${oParam.pageId}--page`, {
        showHeader: true,
        title: oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "478"), //478	단축키 등록 이벤트 사용처 확인
        titleAlignment: "Center",
    });
    _oContr.ui.ROOT = ROOT;

    ROOT.setModel(_oContr.oModel);

    //ROOT UI가 출력될 때 VIEW READY 이벤트 수행 처리.
    const _oDelegate = {
        onAfterRendering : async function(){
            
            ROOT.removeEventDelegate(_oDelegate);
            
            await _oContr.onViewReady();
            
        }
    };
    ROOT.addEventDelegate(_oDelegate);

    
    const TABLE1 = new sap.m.Table({

        // properties
        fixedLayout: false,
        alternateRowColors: true,
        growing: true,
        growingScrollToLoad: true,
        growingThreshold: 50,
        sticky: [
            // "HeaderToolbar",
            "ColumnHeaders"
        ],

        // Aggregations
        columns: [
            new sap.m.Column({
                demandPopin: false,
                header: new sap.m.Label({
                    text: oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "479"), //479	단축키
                    design: "Bold"
                })
            }),
            
            new sap.m.Column({
                demandPopin: false,
                header: new sap.m.Label({
                    text: oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "480"), //480	대상 이벤트 속성
                    design: "Bold"
                })
            }),

            new sap.m.Column({
                demandPopin: false,
                header: new sap.m.Label({
                    text: oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "481"), //481	이벤트 ID
                    design: "Bold"
                })
            }),

            new sap.m.Column({
                demandPopin: true,
                minScreenWidth: "Desktop",
                popinDisplay: sap.m.PopinDisplay.Inline,
                header: new sap.m.Label({
                    text: oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "482"), //482	이벤트 텍스트
                    design: "Bold"
                })
            }),

            new sap.m.Column({
                demandPopin: false,
                header: new sap.m.Label({
                    text: oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "190"), //190	UI 오브젝트 ID
                    design: "Bold"
                })
            })

        ],

        items: {
            path: `/T_LIST`,
            template: new sap.m.ColumnListItem({
                cells: [
                    new sap.m.Text({
                        text: "{HOTKEY}"
                    }),

                    
                    new sap.m.Link({
                        text: "{UIATT}",
                        emphasized: true,
                        press: oAPP.events.ev_press_Link_Find
                    }),

                    new sap.m.Link({
                        text: "{UIATV}",
                        emphasized: true,
                        press: oAPP.events.ev_press_Link_Find_Controller
                    }),

                    new sap.m.Text({
                        text: "{EVTXT}"
                    }),


                    new sap.m.Text({
                        text: "{OBJID}"
                    })

                ]
            })
        }

    });


    ROOT.addContent(TABLE1);

    _oContr.ui.SCLIST = TABLE1;

    /************************************************
     * 테이블 헤더 툴바 영역
     ************************************************/
    let TOOLBAR1 = new sap.m.Toolbar();        
    TABLE1.setHeaderToolbar(TOOLBAR1);       

    let SEARCHFIELD1 = new sap.m.SearchField({
        width: "300px",
        value: "{/S_COND/KEYWORD}", //binding path
        change: _oContr.fn.onFindKeyword
    });

    TOOLBAR1.addContent(SEARCHFIELD1);


    TOOLBAR1.addContent(new sap.m.ToolbarSpacer());


    //B39	Help
    //도움말 버튼.
    TOOLBAR1.addContent(new sap.m.Button({
        icon: "sap-icon://question-mark",
        tooltip:oAPP.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "198"), //198	도움말
        press : _oContr.fn.onShortcutHelp
    }));


    return _oContr;

};
