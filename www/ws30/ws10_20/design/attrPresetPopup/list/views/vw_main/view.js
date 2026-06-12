// export let oContr = await new Promise(async (resolve)=>{
export async function getView(){

/************************************************************************
 * 💖 컨트롤러 호출
 ************************************************************************/

    let sControlPath = "./control.js";

    const oRes = await import(sControlPath);
    const oContr = await oRes.getControl();


/************************************************************************
 * 💖 화면 그리기
 ************************************************************************/

    let APP = new sap.m.App({
        // busy: true,
        // busyIndicatorDelay: 0,
        autoFocus: false,
        dependents : [
            new sap.m.Text({
                text : "{/refresh}"
            })
        ]
    }).addStyleClass("sapUiSizeCompact");

    APP.setModel(oContr.oModel);



    /*****************************************/
    //#region 📄팝업창 제어 TOOLBAR 영역
    /*****************************************/
    let ROOT_PAGE = new sap.m.Page({
        enableScrolling: false,
    });
    APP.addPage(ROOT_PAGE);

    let CUSTOMHEADER1 = new sap.m.Bar({
        contentLeft: [
            new sap.m.Image({
                width: "25px",
                src: parent.PATHINFO.WS_LOGO
            }),
            new sap.m.Title("u4aWsHeaderTitle", {
                //652   UI Attribute 개인화 항목
                text: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "652")
            }),
        ]
    });
    CUSTOMHEADER1.addStyleClass("u4aWsBrowserDraggable");

    ROOT_PAGE.setCustomHeader(CUSTOMHEADER1);

    let BUTTON1 = new sap.m.Button({
        icon: "sap-icon://less",
        press: function () {

            parent.CURRWIN.minimize();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON1);

    oContr.ui.LESS_BTN = BUTTON1;

    let BUTTON2 = new sap.m.Button("maxWinBtn", {
        icon: "sap-icon://header",
        press: function (oEvent) {

            let bIsMax = parent.CURRWIN.isMaximized();

            if (bIsMax) {
                parent.CURRWIN.unmaximize();
                return;
            }

            parent.CURRWIN.maximize();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON2);

    oContr.ui.MAX_WIN_BTN = BUTTON2;

    let BUTTON3 = new sap.m.Button("mainWinClose", {
        icon: "sap-icon://decline",
        press: function () {

            parent.CURRWIN.close();

        }
    });
    CUSTOMHEADER1.addContentRight(BUTTON3);

    oContr.ui.WIN_CLOSE_BTN = BUTTON3;

    let MAIN_NAVCON1 = new sap.m.NavContainer({
        autoFocus: false,
    });
    ROOT_PAGE.addContent(MAIN_NAVCON1);




    /*****************************************/
    //#region 📄 MAIN PAGE
    /*****************************************/
    let PAGE = new sap.m.Page().addStyleClass("u4aWs20Page");
    MAIN_NAVCON1.addPage(PAGE);


    /*****************************************/
    //#region 📄 MAIN 툴바
    /*****************************************/
    let TOOLBAR1 = new sap.m.Toolbar();
    PAGE.setCustomHeader(TOOLBAR1);

    
    TOOLBAR1.addContent(new sap.m.Button({
        icon:"sap-icon://screen-split-one",
        //655 레이아웃 초기화
        tooltip: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "655"),
        press : oContr.fn.onPressResetLayout
    }));

    TOOLBAR1.addContent(new sap.m.ToolbarSeparator());


    /*****************************************/
    //#region 📄 테스트 버튼 영역
    /*****************************************/
    if(REMOTE.app.isPackaged === false){
        
        // TOOLBAR1.addContent(new sap.m.Button({
        //     type : "Emphasized",
        //     text : "테스트 데이터 구성",
        //     icon : "sap-icon://save",
        //     press : function(){
        //         oContr.fn.onTestSaveData();
        //     }
        // }));

        // TOOLBAR1.addContent(new sap.m.Button({
        //     type : "Emphasized",
        //     text : "테스트 데이터 전체 삭제",
        //     icon : "sap-icon://save",
        //     press : function(){
        //         oContr.fn.onTestDelData();
        //     }
        // }));
    }

    
    TOOLBAR1.addContent(new sap.m.ToolbarSpacer());

    
    /*****************************************/
    //#region 📄 업로드/다운로드 메뉴 버튼

    /*****************************************/
    TOOLBAR1.addContent(new sap.m.MenuButton({
        //654	Tools
        text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "654"),
        menu : new sap.m.Menu({
            items: [
                new sap.m.MenuItem({
                    icon:"sap-icon://download",
                    //644 다운로드
                    text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "644"), 
                    press : function(){
                        oContr.fn.onDownloadPresetData();
                    }
                }),
                new sap.m.MenuItem({
                    icon:"sap-icon://upload",
                    //645 업로드
                    text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "645"),
                    press : function(){
                        oContr.fn.onUploadPresetData();
                    }
                })
            ]
        })
    }));


    TOOLBAR1.addContent(new sap.m.Button({
        icon:"sap-icon://sys-help",
        press : function(){
            oContr.fn.onPressHelp();
        }
    }));

    let SPLITTER1 = new sap.ui.layout.Splitter();
    PAGE.addContent(SPLITTER1);

    let PAGE1 = new sap.m.Page({
        showHeader:false,
        layoutData : new sap.ui.layout.SplitterLayoutData({
            resizable:"{/S_LAYO/EXPAND}",
            size:"{/S_LAYO/SIZE}",
            minSize:200
        })
    });
    
    SPLITTER1.addContentArea(PAGE1);

    /*****************************************/
    //#region 📄UI 리스트
    /*****************************************/

    const COLUMN1 = new sap.ui.table.Column({
        autoResizable:true,
        flexible: false,
        sortProperty:"UIOBJ",
        filterProperty:"UIOBJ",
        label : new sap.m.Label({
            design:"Bold",
            //190   UI Object
            text:WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "190")
        }),
        template : new sap.m.HBox({
            alignItems:"Center",
            justifyContent : "SpaceBetween",
            items:[
                new sap.m.HBox({
                    alignItems:"Center",
                    items:[
                        new sap.m.Image({
                            src:"{ICON_PATH}"
                        }).addStyleClass("sapUiSmallMarginEnd"),
                                    
                        new sap.m.VBox({
                            items:[
                                new sap.m.Text({
                                    text:"{UIOBJ}",
                                    tooltip:"{UIOBJ}"
                                }),

                                new sap.m.ObjectStatus({
                                    text:"{LIBNM}",
                                    tooltip:"{LIBNM}",
                                    state : "Information",
                                }).addStyleClass("u4aFontBold")

                            ]
                        })
                    ]
                }),
            ]
        })
        
    });

    oContr.ui.HEAD_COL = COLUMN1;

    let TABLE1 = new sap.ui.table.Table({
        selectionMode:"Single",
        selectionBehavior:"RowOnly",
        visibleRowCountMode:"Auto",
        columnHeaderHeight: 33,
        rowHeight: 40,
        rowSelectionChange : (oEvent)=>{
            oContr.fn.onSelectUI(oEvent);
        },
        firstVisibleRowChanged : function(){
            document.activeElement.blur();
        },
        toolbar : new sap.m.OverflowToolbar({
            content:[
                new sap.m.Label({
                    design:"Bold",
                    //646 UI 검색
                    text:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "646"),
                    layoutData : new sap.m.FlexItemData({
                        minWidth:"80px"                        
                    })
                }),
                new sap.m.Input({
                    //647 UI 검색어 입력
                    placeholder:parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "647"),
                    showClearIcon:true,
                    value: "{/S_COND/HEAD}",
                    change : function(oEvent){
                        oContr.fn.onFindHeader(oEvent);
                    },
                    layoutData : new sap.m.OverflowToolbarLayoutData({
                        shrinkable:true,
                        minWidth:"200px"
                    })                    
                }),

            ]
        }),

        columns:[
            COLUMN1,

        ],
        rows : {
            path : "/T_HEAD",
            templateShareable: true,
            template : new sap.ui.table.Row()
        },
        rowSettingsTemplate : new sap.ui.table.RowSettings({
            highlight : "{highlight}"
        })
    });
    
    PAGE1.addContent(TABLE1);


    //HEADER TABLE 더블클릭 이벤트 추가.
    TABLE1.addEventDelegate({
        ondblclick: function(oEvent){
            oContr.fn.onHeadDblClick(oEvent);
        }
    });


    oContr.ui.HEAD = TABLE1;


    let PAGE2 = new sap.m.Page({
        layoutData : new sap.ui.layout.SplitterLayoutData({
            minSize:200
        })
    }).addStyleClass("u4aWsDesignAttr");
    
    SPLITTER1.addContentArea(PAGE2);


    /*****************************************/
    //#region 📄 header 선택건 정보
    /*****************************************/
    PAGE2.setCustomHeader(
        new sap.m.Toolbar({
            content:[
        
                new sap.m.HBox({
                alignItems:"Center",
                justifyContent : "SpaceBetween",
                items:[
                    new sap.m.HBox({
                        alignItems:"Center",
                        items:[
                            new sap.m.Image({
                                src:"{/S_HEAD/ICON_PATH}"
                            }).addStyleClass("sapUiSmallMarginEnd"),
                                        
                            new sap.m.VBox({
                                items:[
                                    new sap.m.Text({
                                        text:"{/S_HEAD/UIOBJ}",
                                        tooltip:"{/S_HEAD/UIOBJ}",
                                    }),

                                    // new sap.m.Link({
                                    new sap.m.ObjectStatus({
                                        text:"{/S_HEAD/LIBNM}",
                                        tooltip:"{/S_HEAD/LIBNM}",
                                        state : "Information",
                                    }).addStyleClass("u4aFontBold")

                                ]
                            })
                        ]
                    }),
                ]}).addStyleClass('sapUiTinyMargin')
            ]
        }
    ));


    /*****************************************/
    //#region 📄속성 리스트
    /*****************************************/
    let TABLE2 = new sap.m.Table({
        mode : "MultiSelect",
        sticky : ["ColumnHeaders", "HeaderToolbar"],

        headerToolbar : new sap.m.OverflowToolbar({
            content:[
                new sap.m.Button({
                    type : "Reject",
                    //029   Delete
                    text : WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "029"),
                    icon : "sap-icon://delete",
                    press : function(){
                        oContr.fn.onDeletePresetData();
                    }
                }).addStyleClass("sapUiTinyMarginEnd"),
                new sap.m.Input({
                    //648	검색 조건을 입력하십시오.
                    placeholder: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "648"),
                    value: "{/S_COND/ITEM}",
                    showClearIcon:true,
                    change: function(oEvent){
                        oContr.fn.onFindItem(oEvent);
                    },
                    layoutData : new sap.m.OverflowToolbarLayoutData({
                        shrinkable:true,
                        minWidth:"200px"
                    })
                })
            ]
        }),
        columns : [
            new sap.m.Column({
                width : "40%",
                header : new sap.m.Label({
                    design: "Bold",
                    //649	Attribute 명
                    text: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "649")
                })
            }),
            new sap.m.Column({
                header : new sap.m.Label({
                    design: "Bold",
                    //650	Attribute 값
                    text: parent.WSUTIL.getWsMsgClsTxt("", "ZMSG_WS_COMMON_001", "650")
                })
            }),
        ],

        items : {
            path : "/T_ITEM", 
            templateShareable :true,
            template : new sap.m.ColumnListItem({
                cells : [
                    new sap.m.HBox({
                        alignItems:"Center",
                        items:[
                            new sap.ui.core.Icon({
                                src:"{UIATT_ICON}"
                            }).addStyleClass("sapUiSmallMarginEnd"),
                                        
                            new sap.m.VBox({
                                items:[
                                    new sap.m.ObjectStatus({
                                        text:"{UIATT}",
                                        // active:true
                                    }),

                                    //new sap.m.Link({
                                    new sap.m.ObjectStatus({
                                        text:"{UIADT}",
                                        tooltip:"{UIADT}",
                                        state : "Information",
                                    }).addStyleClass("u4aFontBold")

                                ]
                            })
                        ]
                    }),
                    new sap.m.Input({
                        editable:false, 
                        value: "{UIATV}",
                        tooltip: "{UIATV}",
                    }),
                ]
            })

        }
            
    });
    PAGE2.addContent(TABLE2);

    oContr.ui.ITEM = TABLE2;

    
    oContr.ui.APP = APP;
    
    return oContr;
    
}
