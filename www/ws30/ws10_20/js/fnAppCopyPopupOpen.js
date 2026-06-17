/************************************************************************
 * Copyright 2020. INFOCG Inc. all rights reserved.
 * ----------------------------------------------------------------------
 * - file Name : fnAppCopyPopupOpen.js
 * - file Desc : Application Copy Popup Open
 * ----------------------------------------------------------------------
 * [컨버전 메모]
 *  원본: sap.m.Dialog + sap.ui.layout.form.Form(JSONModel two-way binding)
 *        + customHeader Toolbar + footer accept/decline Button.
 *  HTML5: native <dialog class="u4a-dialog"> + 공통 컴포넌트
 *        (.u4a-form__row/.u4a-input/.u4a-field/.u4a-label/.u4a-field__msg).
 *        createApplicationPopup.js 와 동일한 전략 — "로직 보존, UI만 교체".
 *
 *  ★ 비즈니스 로직(검증 fnCheckValidAppName / 존재확인 ajax_init_prc /
 *    복사수행 fnSetAppCopy /app_copy / Package F4 fnPackgSchpPopupOpener)은
 *    원본 그대로. UI5 의존부만 치환:
 *      · JSONModel two-way binding  → /WS10/APPCOPY 모델 + DOM 직접 동기.
 *      · sap.ui.core.ValueState     → data-vs="error" + .u4a-field__msg.
 *      · sap.m.* 컨트롤             → DOM + shell.css 컴포넌트.
 *      · parent.showMessage(sap, …) → parent.showMessage(null, …) (HTML5).
 *      · afterOpen fnSetBusyLock("") → showModal 직후 busy 해제.
 ************************************************************************/

(function (window, $, oAPP) {
    "use strict";

    /************************************************************************
     * Root Variable Area..
     ************************************************************************/
    const
        C_BIND_ROOT_PATH = "/WS10/APPCOPY",
        C_APP_COPY_DLG_ID = "u4aWsAppCopyDlg";

    var APPCOMMON = oAPP.common,
        REMOTE = parent.REMOTE;

    // 다이얼로그 DOM 참조(재오픈 시 재사용 + 값/밸류스테이트 갱신).
    var oCopyUI = null;

    const _fa = (sName) => '<i class="fa-solid fa-' + sName + '"></i>';
    function _txt(sCls, sCode, p1, p2, p3, p4) {
        try { return APPCOMMON.fnGetMsgClsText(sCls, sCode, p1 || "", p2 || "", p3 || "", p4 || ""); }
        catch (e) { return ""; }
    }
    function _el(sTag, sClass, sText) {
        const o = document.createElement(sTag);
        if (sClass) { o.className = sClass; }
        if (typeof sText !== "undefined") { o.textContent = sText; }
        return o;
    }
    // clear(X) 버튼 — 전 화면 공통 글리프(fa-xmark)로 통일. 텍스트 "×" 금지(폰트 불일치).
    function _buildClearBtn() {
        const o = _el("button", "u4a-field__clear");
        o.type = "button";
        o.title = "Clear";
        o.tabIndex = -1;
        o.innerHTML = _fa("xmark");
        return o;
    }

    /************************************************************************
     * 공통 스타일 1회 주입 (테마 토큰 소비 — 하드코딩 색 없음)
     ************************************************************************/
    function _ensureStyle() {
        if (document.getElementById("u4aCopyStyle")) { return; }
        const oStyle = document.createElement("style");
        oStyle.id = "u4aCopyStyle";
        oStyle.textContent = `
        .u4aCopyDlg { width: min(92vw, 460px); padding: 0; display: flex; flex-direction: column; }
        .u4aCopyDlg .u4a-dialog__header { cursor: move; user-select: none; }
        .u4aCopyDlg .u4a-dialog__header span { flex: 1 1 auto; }
        .u4aCopyBody { padding: 1.25rem 1.25rem 1.75rem; display: grid; gap: 1.25rem; }
        .u4aCopyBody .u4a-form__row .u4a-field__msg { white-space: nowrap; }
        .u4aCopyFoot { display: flex; gap: 0.5rem; align-items: center; justify-content: flex-end; }
        `;
        document.head.appendChild(oStyle);
    }

    /************************************************************************
     * label + control row. 반환: {row, label, control, msg}
     ************************************************************************/
    function _row(sLabel, bRequired) {
        const oRow = _el("div", "u4a-form__row");
        const oLabel = _el("label", "u4a-label" + (bRequired ? " u4a-label--required" : ""), sLabel);
        oRow.appendChild(oLabel);
        const oCtrl = _el("div", "u4aCopyControl");
        oRow.appendChild(oCtrl);
        const oMsg = _el("div", "u4a-field__msg");
        oRow.appendChild(oMsg);
        return { row: oRow, label: oLabel, control: oCtrl, msg: oMsg };
    }

    /************************************************************************
     * Application Copy Popup Open
     ************************************************************************/
    oAPP.fn.fnAppCopyPopupOpen = function (sAppId) {

        // 푸터 메시지가 있을 경우 닫기
        APPCOMMON.fnHideFloatingFooterMsg();

        // Application Copy Init Model Setting (원본 oBindData 그대로)
        var oBindData = {
            SOURCEID: sAppId,
            TARGETID: "",
            TARGETID_VS: "None",
            TARGETID_VSTXT: "",
            PACKG: "$TMP",
            PACKG_VS: "None",
            PACKG_VSTXT: ""
        };
        APPCOMMON.fnSetModelProperty(C_BIND_ROOT_PATH, oBindData);

        // 이미 만들어진 다이얼로그가 있으면 값만 초기화하고 다시 연다.
        if (oCopyUI && oCopyUI.dlg && document.body.contains(oCopyUI.dlg)) {
            lf_syncModelToDom();
            lf_setVs(oCopyUI.tgtInp, oCopyUI.tgtMsg, false, "");
            lf_setVs(oCopyUI.packInp, oCopyUI.packMsg, false, "");
            oCopyUI.dlg.showModal();
            oAPP.common.fnSetBusyLock("");
            return;
        }

        _ensureStyle();

        // ── 다이얼로그 골격 ────────────────────────────────────────────
        const oDlg = document.createElement("dialog");
        oDlg.id = C_APP_COPY_DLG_ID;
        oDlg.className = "u4a-dialog u4aCopyDlg";

        // 헤더 — 메인 툴바 Copy 버튼(fa-copy)과 동일 아이콘으로 인지 통일.
        const oHeader = _el("div", "u4a-dialog__header");
        oHeader.setAttribute("data-type", "I");
        oHeader.innerHTML = _fa("copy") + '<span></span>';
        oHeader.querySelector("span").textContent = _txt("/U4A/CL_WS_COMMON", "B90"); // Application Copy
        const oXBtn = _el("button", "u4a-btn-icon");
        oXBtn.type = "button";
        oXBtn.setAttribute("data-act", "close");
        oXBtn.innerHTML = _fa("xmark");
        oXBtn.title = _txt("/U4A/CL_WS_COMMON", "A39"); // Close
        oXBtn.addEventListener("click", oAPP.events.ev_AppCopyDlgCancel);
        oHeader.appendChild(oXBtn);
        oDlg.appendChild(oHeader);

        // 바디
        const oBody = _el("div", "u4a-dialog__body u4aCopyBody");
        oDlg.appendChild(oBody);

        // Source App. ID (B91) — 복사 원본(읽기 전용 표시).
        let oR = _row(_txt("/U4A/CL_WS_COMMON", "B91"), false);
        const oSrcInp = _el("input", "u4a-input u4a-input--display");
        oSrcInp.readOnly = true;
        oSrcInp.tabIndex = -1;
        oR.control.appendChild(oSrcInp);
        oBody.appendChild(oR.row);

        // Target App. ID (B92, required) — 입력 + 대문자화 + clear(X) + value-state.
        //   공통 .u4a-field + U4AUI.attachClear 로 다른 화면과 동일한 clear UX.
        oR = _row(_txt("/U4A/CL_WS_COMMON", "B92"), true);
        const oTgtWrap = _el("div", "u4a-field");
        oTgtWrap.setAttribute("data-trail", "1");
        const oTgtInp = _el("input", "u4a-input u4a-field__input");
        oTgtInp.maxLength = oAPP.attr.iAppNameMaxLength || 15;
        oTgtWrap.appendChild(oTgtInp);
        const oTgtClear = _buildClearBtn();
        oTgtWrap.appendChild(oTgtClear);
        oR.control.appendChild(oTgtWrap);
        const oTgtMsg = oR.msg;
        oBody.appendChild(oR.row);

        // Package (A22, required) — 입력 + 대문자화 + clear(X) + value-help(F4) + value-state.
        oR = _row(_txt("/U4A/CL_WS_COMMON", "A22"), true);
        const oPackWrap = _el("div", "u4a-field");
        oPackWrap.setAttribute("data-trail", "2"); // clear + value-help 둘 다
        const oPackInp = _el("input", "u4a-input u4a-field__input");
        oPackWrap.appendChild(oPackInp);
        const oPackClear = _buildClearBtn();
        oPackWrap.appendChild(oPackClear);
        const oVh = _el("button", "u4a-field__vh");
        oVh.type = "button";
        oVh.innerHTML = _fa("magnifying-glass");
        oVh.title = _txt("/U4A/CL_WS_COMMON", "A22"); // Package
        oVh.addEventListener("click", oAPP.events.ev_packageSchpEvt);
        oPackWrap.appendChild(oVh);
        oR.control.appendChild(oPackWrap);
        const oPackMsg = oR.msg;
        oBody.appendChild(oR.row);

        // 푸터 — Copy(확정) / Close(취소)
        const oFoot = _el("div", "u4a-dialog__footer u4aCopyFoot");
        const oOk = _el("button", "u4a-btn u4a-btn--emphasized");
        oOk.type = "button";
        oOk.innerHTML = _fa("check") + '<span></span>';
        oOk.querySelector("span").textContent = _txt("/U4A/CL_WS_COMMON", "A04"); // Copy
        oOk.addEventListener("click", oAPP.events.ev_AppCopyDlgOK);
        oFoot.appendChild(oOk);

        const oCancel = _el("button", "u4a-btn u4a-btn--negative");
        oCancel.type = "button";
        oCancel.innerHTML = _fa("xmark") + '<span></span>';
        oCancel.querySelector("span").textContent = _txt("/U4A/CL_WS_COMMON", "A39"); // Close
        oCancel.addEventListener("click", oAPP.events.ev_AppCopyDlgCancel);
        oFoot.appendChild(oCancel);
        oDlg.appendChild(oFoot);

        // 입력 → 모델 반영 + 대문자화(원본 ev_AppCopyDlgTargetInpChgEvt).
        oTgtInp.addEventListener("input", function () {
            const v = oTgtInp.value.toUpperCase();
            if (oTgtInp.value !== v) { oTgtInp.value = v; }
            lf_modelSet("TARGETID", v);
        });
        oPackInp.addEventListener("input", function () {
            const v = oPackInp.value.toUpperCase();
            if (oPackInp.value !== v) { oPackInp.value = v; }
            lf_modelSet("PACKG", v);
        });

        // clear(X) — 값 있을 때만 노출(공통 U4AUI.attachClear). clear 후 input 이벤트로
        //   모델/노출이 자동 동기화되지만, 명시적으로도 모델을 비운다.
        if (window.U4AUI && U4AUI.attachClear) {
            U4AUI.attachClear(oTgtInp, oTgtClear, function () { lf_modelSet("TARGETID", ""); });
            U4AUI.attachClear(oPackInp, oPackClear, function () { lf_modelSet("PACKG", ""); });
        }

        // ESC → 취소(닫기).
        oDlg.addEventListener("cancel", function (e) { e.preventDefault(); oAPP.events.ev_AppCopyDlgCancel(); });

        _attachDrag(oDlg, oHeader);
        // 헤더 더블클릭 → 화면 중앙 복귀 / 우하단 grip → 크기조절 (공통 U4AUI, SAPUI5 동일 UX)
        if (window.U4AUI && U4AUI.makeDialogRecenter) { U4AUI.makeDialogRecenter(oDlg, oHeader); }
        if (window.U4AUI && U4AUI.makeDialogResizable) { U4AUI.makeDialogResizable(oDlg, { minW: 360, minH: 260 }); }

        // DOM 참조 저장.
        oCopyUI = {
            dlg: oDlg, srcInp: oSrcInp,
            tgtInp: oTgtInp, tgtMsg: oTgtMsg,
            packInp: oPackInp, packMsg: oPackMsg
        };

        // 모델값 → DOM 초기 동기.
        lf_syncModelToDom();

        document.body.appendChild(oDlg);
        oDlg.showModal();

        // busy 끄고 Lock 풀기 (원본 afterOpen).
        oAPP.common.fnSetBusyLock("");

    }; // end of oAPP.fn.fnAppCopyPopupOpen

    /************************************************************************
     * 어플리케이션 복사 수행
     ************************************************************************/
    oAPP.fn.fnSetAppCopy = function (oParam) {

        parent.setBusy('X');

        var sPath = parent.getServerPath() + '/app_copy',
            oFormData = new FormData();

        if (typeof oParam != "undefined") {
            oFormData.append("TRKORR", oParam.TRKORR);
        }

        var oBindData = APPCOMMON.fnGetModelProperty(C_BIND_ROOT_PATH),
            sSourceAppId = oBindData.SOURCEID, // 복사 원본 APPID
            sTargetAppId = oBindData.TARGETID, // 복사 대상 APPID
            sPackg = oBindData.PACKG;

        oFormData.append("S_APPID", sSourceAppId);
        oFormData.append("T_APPID", sTargetAppId);
        oFormData.append("PACKG", sPackg);

        sendAjax(sPath, oFormData, function (oResult) {

            if (oResult.RETCD == "E") {

                // 스크립트가 있으면 eval 처리
                //   [HTML5] 서버 SCRIPT 가 UI5(sap) 의존 코드를 담아 보낼 수 있어, sap 미정의로
                //   ReferenceError → window.onerror(ws_trycatch) → APP.exit() 로 앱이 강제종료되던
                //   회귀를 try/catch 로 차단(앱 유지 + busy 해제 보장). 실패 시 서버 메시지로 폴백.
                if (oResult.SCRIPT) {

                    try {
                        eval(oResult.SCRIPT);
                    } catch (e) {
                        console.error("[HTML5] /app_copy SCRIPT eval 실패 (UI5 의존 추정):", e && e.message, oResult.SCRIPT);
                        if (oResult.RTMSG) { APPCOMMON.fnShowFloatingFooterMsg("E", parent.getCurrPage(), oResult.RTMSG); }
                    }

                    parent.setBusy('');

                    return;
                }

                parent.showMessage(null, 20, 'E', oResult.RTMSG);

                parent.setBusy('');

                return;

            }

            // APP 복사 성공 → 대상 앱으로 Change 모드 진입.
            //   서버 SCRIPT 는 UI5 의존(sap.ui.getCore().byId('AppNmInput').setValue +
            //   appChangeBtn.firePress)이라 HTML5 에선 byId()=null 로 크래시. eval 하지 않고
            //   공통 진입점 onAppCrAndChgMode(앱명 세팅 + ev_AppChange)로 동일 동작 수행한다.
            //   (생성 팝업 createApplicationPopup 성공 처리와 동일 패턴)
            if (oResult.RETCD == "S") {

                // 복사 팝업 닫기
                lf_AppCopyPopupClose();

                // 대상 앱 Change 모드 진입(자체 busy 처리 — 화면 전환 = 성공 피드백).
                try {
                    if (typeof window.onAppCrAndChgMode === "function") {
                        window.onAppCrAndChgMode(sTargetAppId);
                    }
                } catch (e) {
                    console.error("[HTML5] app_copy onAppCrAndChgMode 실패:", e && e.message);
                }

                parent.setBusy('');

                return;
            }

            // 성공이지만 위 분기에 안 걸린 경우 — 서버 메시지로 폴백.
            parent.showMessage(null, 20, 'S', oResult.RTMSG);

            parent.setBusy('');

        });

    }; // end of oAPP.fn.fnSetAppCopy

    /************************************************************************
     * Application Copy Dialog After Close Event (원본 호환 유지)
     ************************************************************************/
    oAPP.events.ev_AppCopyDlgAfterClose = function () {

        // Application Copy Dialog Close
        lf_AppCopyPopupClose();

    }; // end of oAPP.events.ev_AppCopyDlgAfterClose

    /************************************************************************
     * Application Copy OK Button Event
     ************************************************************************/
    oAPP.events.ev_AppCopyDlgOK = function () {

        parent.setBusy('X');

        var oModelData = APPCOMMON.fnGetModelProperty(C_BIND_ROOT_PATH),
            sTargetId = oModelData.TARGETID;

        // Target ID / PACKG 의 valueState 초기화
        lf_setVs(oCopyUI.tgtInp, oCopyUI.tgtMsg, false, "");
        lf_setVs(oCopyUI.packInp, oCopyUI.packMsg, false, "");

        // 어플리케이션 명 정합성 체크
        var oValid = oAPP.fn.fnCheckValidAppName(sTargetId, true);

        if (oValid.RETCD == false) {

            var oCurrWin = REMOTE.getCurrentWindow();

            oCurrWin.flashFrame(true); // 작업표시줄 깜빡임

            parent.showMessage(null, 10, "", oValid.RETMSG);

            lf_setTargetIdValueStateChange("Error", oValid.RETMSG);

            parent.setBusy('');

            return;
        }

        // 패키지를 입력했는지 여부 확인
        if (oModelData.PACKG == "") {

            let sPackageTxt = APPCOMMON.fnGetMsgClsText("/U4A/CL_WS_COMMON", "A22"), // Package
                sPackgMsg = APPCOMMON.fnGetMsgClsText("/U4A/MSG_WS", "050", sPackageTxt); // Package is required.

            parent.showMessage(null, 10, "", sPackgMsg);

            lf_setVs(oCopyUI.packInp, oCopyUI.packMsg, true, sPackgMsg);
            lf_modelSet("PACKG_VS", "Error");
            lf_modelSet("PACKG_VSTXT", sPackgMsg);

            parent.setBusy('');

            return;
        }

        var oFormData = new FormData();
        oFormData.append("APPID", sTargetId);

        // 복사 대상 APP 명 존재 유무 확인하여 없으면 복사 수행.
        ajax_init_prc(oFormData, function (oResult) {

            // 복사대상 어플리케이션이 존재 하는지 유무 확인
            var bIsAppExists = lf_getAppInfo(oResult);
            if (bIsAppExists == false) {

                parent.setBusy('');

                return;
            }

            // 복사 대상 어플리케이션 명이 없을 경우에만 복사 수행
            oAPP.fn.fnSetAppCopy();

        });

    }; // end of oAPP.events.ev_AppCopyDlgOK

    /************************************************************************
     * Application Copy Cancel Button Event
     ************************************************************************/
    oAPP.events.ev_AppCopyDlgCancel = function (oEvent) {

        // Application Copy Dialog Close
        lf_AppCopyPopupClose();

    }; // end of oAPP.events.ev_AppCopyDlgCancel

    /************************************************************************
     * Package Search Help Popup valueHelp Event
     ************************************************************************/
    oAPP.events.ev_packageSchpEvt = function (oEvent) {

        oAPP.fn.fnPackgSchpPopupOpener(function (oResult) {

            var sPackage = oResult.DEVCLASS;

            lf_modelSet("PACKG", sPackage);
            if (oCopyUI && oCopyUI.packInp) { oCopyUI.packInp.value = (sPackage == null ? "" : sPackage); }

        });

    }; // end of oAPP.events.ev_packageSchpEvt

    //-------------------------------------------------------------------------------//
    //-------------------------------------------------------------------------------//

    /************************************************************************
     * (Local Function) 헤더 드래그 이동 (구 sap.m.Dialog draggable 대체)
     ************************************************************************/
    function _attachDrag(oDlg, oHandle) {
        let bDrag = false, dx = 0, dy = 0;
        oHandle.addEventListener("mousedown", function (e) {
            if (e.target.closest(".u4a-btn-icon")) { return; }
            bDrag = true;
            const r = oDlg.getBoundingClientRect();
            oDlg.style.margin = "0";
            oDlg.style.position = "fixed";
            oDlg.style.left = r.left + "px";
            oDlg.style.top = r.top + "px";
            dx = e.clientX - r.left;
            dy = e.clientY - r.top;
            e.preventDefault();
        });
        document.addEventListener("mousemove", function (e) {
            if (!bDrag) { return; }
            oDlg.style.left = (e.clientX - dx) + "px";
            oDlg.style.top = (e.clientY - dy) + "px";
        });
        document.addEventListener("mouseup", function () { bDrag = false; });
    }

    /************************************************************************
     * (Local Function) 모델 단일 프로퍼티 갱신
     ************************************************************************/
    function lf_modelSet(sKey, vVal) {
        var o = APPCOMMON.fnGetModelProperty(C_BIND_ROOT_PATH) || {};
        o[sKey] = vVal;
        APPCOMMON.fnSetModelProperty(C_BIND_ROOT_PATH, o);
    }

    /************************************************************************
     * (Local Function) 모델값 → DOM 동기 (구 two-way binding 초기 반영)
     ************************************************************************/
    function lf_syncModelToDom() {
        if (!oCopyUI) { return; }
        var o = APPCOMMON.fnGetModelProperty(C_BIND_ROOT_PATH) || {};
        oCopyUI.srcInp.value = (o.SOURCEID == null ? "" : o.SOURCEID);
        oCopyUI.tgtInp.value = (o.TARGETID == null ? "" : o.TARGETID);
        oCopyUI.packInp.value = (o.PACKG == null ? "" : o.PACKG);
        // 값 직접 주입은 input 이벤트가 안 떠 clear(X) 노출(data-filled)이 갱신 안 됨.
        // attachClear 의 _sync(input 리스너)를 깨워 X 노출 상태를 맞춘다.
        oCopyUI.tgtInp.dispatchEvent(new Event("input", { bubbles: true }));
        oCopyUI.packInp.dispatchEvent(new Event("input", { bubbles: true }));
    }

    /************************************************************************
     * (Local Function) value-state(error) 토글 — 구 ValueState/ValueStateText
     ************************************************************************/
    function lf_setVs(oInp, oMsg, bError, sText) {
        if (!oInp) { return; }
        if (bError) { oInp.setAttribute("data-vs", "error"); }
        else { oInp.removeAttribute("data-vs"); }
        if (oMsg) { oMsg.textContent = bError ? (sText || "") : ""; }
    }

    /************************************************************************
     * (Local Function) Application Copy Dialog Close
     ************************************************************************/
    function lf_AppCopyPopupClose() {

        if (!oCopyUI || !oCopyUI.dlg) { return; }

        try { oCopyUI.dlg.close(); } catch (e) { }

    } // end of lf_AppCopyPopupClose

    /************************************************************************
     * (Local Function) Application ID 존재 유무 확인하여 없으면 복사 수행
     ************************************************************************/
    function lf_getAppInfo(oResult) {

        if (oResult.MSGTY !== "N") {

            var oCurrWin = REMOTE.getCurrentWindow(),
                sMsg = parent.WSUTIL.getWsMsgClsTxt(parent.getUserInfo().LANGU, "ZMSG_WS_COMMON_001", "371"); // It is already registered application information.

            parent.showMessage(null, 10, "", sMsg);

            oCurrWin.flashFrame(true); // 작업표시줄 깜빡임

            // Target APPID에 대한 정합성 체크 후 오류 시, ValueState를 Error 로 변경
            lf_setTargetIdValueStateChange("Error", sMsg);

            return false;
        }

        // Target APPID에 ValueState 초기화
        lf_setTargetIdValueStateChange("None", "");

        return true;

    } // end of lf_getAppInfo

    /************************************************************************
     * (Local Function) Target APPID Input 의 valueState 변경
     ************************************************************************/
    function lf_setTargetIdValueStateChange(sValueState, sValueStateTxt) {

        // 정합성 체크 후 오류 시, ValueState를 Error 로 변경
        lf_modelSet("TARGETID_VS", sValueState);
        lf_modelSet("TARGETID_VSTXT", sValueStateTxt);

        if (oCopyUI) {
            lf_setVs(oCopyUI.tgtInp, oCopyUI.tgtMsg, sValueState === "Error", sValueStateTxt);
        }

    } // end of lf_setTargetIdValueStateChange

})(window, $, oAPP);
