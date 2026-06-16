/************************************************************************
 * ws_html5_ws20_edit.js  (HTML5)
 * ----------------------------------------------------------------------
 * WS20 좌측 디자인 트리의 "UI 편집" 기능 — 우클릭 컨텍스트 메뉴 + 행 액션(+/삭제)
 *   핸들러를 HTML5 로 이식한다. (구 design/js/uiDesignArea.js / callDesignContextMenu.js
 *   는 UI5 파일이라 메인 렌더러에 미로드 → 여기서 sap-free 로 재구현.)
 *
 *   · 트리 데이터(oAPP.attr.oModel.oData.zTREE) 직접 조작 + 모델 refresh(→fnRenderDesignTree)
 *   · 미리보기(Preview iframe = UI5 KEEP)의 createUIInstance/moveUIObjPreView/destroyUIPreView
 *     호출은 try/catch 가드(iframe 미로드/함수 부재 시 트리만 갱신).
 *   · 변경 시 setChangeFlag + 앱헤더(Active→Inactive) 갱신.
 *   · 모든 oAPP.fn.* 는 가드 정의(원본 UI5 가 로드된 환경이면 그쪽 우선).
 *
 *   [Phase 1] 컨텍스트 메뉴 + 삭제/이동(Up/Down)/복사/붙여넣기.
 *   [Phase 2 예정] UI 삽입 팝업(insert-UI: aggregation 선택 + UI 카탈로그) — 현재 안내.
 ************************************************************************/
(function (window, oAPP) {
    "use strict";

    oAPP.fn = oAPP.fn || {};
    oAPP.attr = oAPP.attr || {};
    var APPCOMMON = oAPP.common || (oAPP.common = {});

    var COPY_AREA = "U4AWSuiDesignArea"; // setCopyData/getCopyData 키 (원본 동일)

    function _msg(sNum, sFallback) {
        try {
            var s = APPCOMMON.fnGetMsgClsText("/U4A/CL_WS_COMMON", sNum);
            if (s != null && s !== "") { return s; }
        } catch (e) { }
        return sFallback;
    }
    function _msgWs(sNum, sFallback) {
        try {
            var s = APPCOMMON.fnGetMsgClsText("/U4A/MSG_WS", sNum);
            if (s != null && s !== "") { return s; }
        } catch (e) { }
        return sFallback;
    }
    function _footer(sType, sMsg) {
        try { APPCOMMON.fnShowFloatingFooterMsg(sType, "WS20", sMsg); } catch (e) { }
    }
    function _isEdit() {
        try { return oAPP.attr.oModel.oData.IS_EDIT === true; } catch (e) { return false; }
    }
    function _tree() {
        try { return oAPP.attr.oModel.oData.zTREE || []; } catch (e) { return []; }
    }
    // 노드 찾기 (HTML5 getTreeData 우선, 없으면 자체 재귀)
    function _node(sObjid) {
        try { if (typeof oAPP.fn.getTreeData === "function") { return oAPP.fn.getTreeData(sObjid); } } catch (e) { }
        var found = null;
        (function walk(arr) {
            if (!arr || found) { return; }
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].OBJID === sObjid) { found = arr[i]; return; }
                walk(arr[i].zTREE);
            }
        })(_tree());
        return found;
    }
    function _refreshTree() {
        try { oAPP.attr.oModel.refresh(); } catch (e) { }       // → fnRenderDesignTree 훅
        try { if (oAPP.fn.fnRenderDesignTree) { oAPP.fn.fnRenderDesignTree(); } } catch (e) { }
    }
    function _markChanged() {
        try { if (typeof oAPP.fn.setChangeFlag === "function") { oAPP.fn.setChangeFlag(); } } catch (e) { }
        try { APPCOMMON.fnSetModelProperty && APPCOMMON.fnSetModelProperty("/WS20/APP/IS_CHAG", "X"); } catch (e) { }
        try { if (oAPP.fn.fnUpdateWs20AppHeader) { oAPP.fn.fnUpdateWs20AppHeader(); } } catch (e) { }
    }
    function _selectNode(sObjid) {
        try { if (typeof oAPP.fn.setSelectTreeItem === "function") { oAPP.fn.setSelectTreeItem(sObjid); } } catch (e) { }
    }
    // 미리보기 iframe 함수 안전 호출 (UI5 preview KEEP — 부재 시 무시)
    function _prev(fnName, aArgs) {
        try {
            var w = oAPP.attr.ui && oAPP.attr.ui.frame && oAPP.attr.ui.frame.contentWindow;
            if (w && typeof w[fnName] === "function") { w[fnName].apply(w, aArgs || []); return true; }
        } catch (e) { }
        return false;
    }

    // 행 액션 아이콘(+추가/삭제) 표시 플래그 계산 (구 uiDesignArea.js designSetActionIcon 1860 1:1)
    //   setUIAreaEditable 이 _safeDecorate("designSetActionIcon", root) 로 호출 → visible_add/delete 세팅.
    //   규칙: Change 모드(IS_EDIT)만 노출, ROOT=둘다 없음, APP=추가만, 그외=추가+삭제. (재귀)
    if (typeof oAPP.fn.designSetActionIcon !== "function") {
        oAPP.fn.designSetActionIcon = function (is_tree) {
            if (!is_tree) { return; }
            var bEdit = false;
            try { bEdit = oAPP.attr.oModel.oData.IS_EDIT === true; } catch (e) { }
            is_tree.visible_add = bEdit;
            is_tree.visible_delete = bEdit;
            if (is_tree.OBJID === "ROOT") { is_tree.visible_add = false; is_tree.visible_delete = false; }
            else if (is_tree.OBJID === "APP") { is_tree.visible_delete = false; }
            if (!is_tree.zTREE || !is_tree.zTREE.length) { return; }
            for (var i = 0; i < is_tree.zTREE.length; i++) { oAPP.fn.designSetActionIcon(is_tree.zTREE[i]); }
        };
    }

    // OBJID 채번 (구 uiDesignArea.js setOBJID 1:1 — 붙여넣기/삽입용)
    if (typeof oAPP.fn.setOBJID !== "function") {
        oAPP.fn.setOBJID = function (objid) {
            var l_cnt = 1;
            var l_upper = String(objid || "UI").toUpperCase();
            var l_objid = l_upper + l_cnt;
            var lt_0014 = (typeof oAPP.fn.parseTree2Tab === "function")
                ? oAPP.fn.parseTree2Tab(oAPP.attr.oModel.oData.zTREE) : [];
            while (true) {
                if (lt_0014.findIndex(function (a) { return a.OBJID === l_objid; }) === -1) { return l_objid; }
                l_cnt += 1; l_objid = l_upper + l_cnt;
            }
        };
    }

    /********************************************************************
     * 삭제 (구 designUIDelete) — 확인 후 부모 zTREE 에서 노드 제거.
     ********************************************************************/
    function _deleteUI(oNode) {
        if (!oNode || !_isEdit()) { return; }
        if (oNode.OBJID === "ROOT" || oNode.OBJID === "APP") { return; }

        var sMsg = _msgWs("003", "Do you really want to delete?");
        var fnConfirm = APPCOMMON.fnConfirmBox;
        function lf_do(act) {
            if (act !== "YES") { return; }
            var oParent = _node(oNode.POBID);
            if (!oParent || !oParent.zTREE) { return; }
            // 미리보기 제거(가드) — 자식 포함 정리는 preview 가 재귀 처리
            _prev("delUIObjPreView", [oNode.OBJID]);
            _prev("destroyUIPreView", [oNode.OBJID]);
            // 부모 배열에서 제거
            var idx = oParent.zTREE.findIndex(function (a) { return a.OBJID === oNode.OBJID; });
            if (idx !== -1) { oParent.zTREE.splice(idx, 1); }
            // prev 상태 정리(가드)
            try { if (oAPP.attr.prev) { delete oAPP.attr.prev[oNode.OBJID]; } } catch (e) { }
            _refreshTree();
            _selectNode(oParent.OBJID);
            _markChanged();
        }
        if (typeof fnConfirm === "function") { fnConfirm("I", sMsg, lf_do); }
        else { lf_do(window.confirm(sMsg) ? "YES" : "NO"); }
    }

    /********************************************************************
     * 위/아래 이동 (구 contextMenuUiMove) — 형제 배열 내 순서 변경.
     *   sDir: "-" 위로 / "+" 아래로
     ********************************************************************/
    function _moveUI(oNode, sDir) {
        if (!oNode || !_isEdit()) { return; }
        var oParent = _node(oNode.POBID);
        if (!oParent || !oParent.zTREE) { return; }
        var aSib = oParent.zTREE;
        var idx = aSib.findIndex(function (a) { return a.OBJID === oNode.OBJID; });
        if (idx === -1) { return; }
        var newIdx = (sDir === "-") ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= aSib.length) { return; } // 경계
        aSib.splice(idx, 1);
        aSib.splice(newIdx, 0, oNode);
        _refreshTree();
        // 미리보기 순서 반영(가드) — 시그니처: (OBJID, UILIB, POBID, PUIOK, UIATT, POSIT, ISMLB, UIOBK)
        _prev("moveUIObjPreView", [oNode.OBJID, oNode.UILIB, oNode.POBID, oNode.PUIOK, oNode.UIATT, newIdx, oNode.ISMLB, oNode.UIOBK]);
        _selectNode(oNode.OBJID);
        _markChanged();
    }

    /********************************************************************
     * 복사 (구 contextMenuUiCopy) — 노드+속성 깊은복사 → copy 버퍼.
     ********************************************************************/
    function _copyUI(oNode) {
        if (!oNode) { return; }
        if (oNode.OBJID === "ROOT" || oNode.OBJID === "APP") { return; }
        var clone;
        try { clone = JSON.parse(JSON.stringify(oNode)); } catch (e) { return; }
        // 각 노드의 속성(_T_0015) 동봉 (prev 에서 수집)
        (function attach(n) {
            try {
                var p = oAPP.attr.prev && oAPP.attr.prev[n.OBJID];
                n._T_0015 = (p && p._T_0015) ? JSON.parse(JSON.stringify(p._T_0015)) : [];
            } catch (e) { n._T_0015 = []; }
            if (n.zTREE) { for (var i = 0; i < n.zTREE.length; i++) { attach(n.zTREE[i]); } }
        })(clone);
        try {
            if (typeof oAPP.fn.setCopyData === "function") { oAPP.fn.setCopyData(COPY_AREA, [COPY_AREA], clone); }
            else { oAPP.attr.__ws20Copy = clone; }
            _footer("S", _msg("A04", "Copy") + " ✓");
        } catch (e) { }
    }
    function _getCopy() {
        try {
            if (typeof oAPP.fn.getCopyData === "function") {
                var r = oAPP.fn.getCopyData(COPY_AREA);
                return (r && r[0] && r[0].DATA) ? r[0].DATA : null;
            }
        } catch (e) { }
        return oAPP.attr.__ws20Copy || null;
    }

    /********************************************************************
     * 붙여넣기 (구 contextMenuUiPaste, 간소화) — 복사본을 대상 노드 자식으로 삽입.
     *   OBJID 는 setOBJID 로 전부 재채번. 미리보기 생성은 가드(부재 시 트리만).
     ********************************************************************/
    function _pasteUI(oTarget) {
        if (!oTarget || !_isEdit()) { return; }
        var src = _getCopy();
        if (!src) { _footer("W", _msg("A58", "Paste") + " — 복사된 UI 없음"); return; }
        var clone;
        try { clone = JSON.parse(JSON.stringify(src)); } catch (e) { return; }

        // OBJID 재채번(재귀) + 부모관계 재설정
        (function regen(n, sPobid, sPuiok) {
            n.OBJID = oAPP.fn.setOBJID(n.UIOBJ || n.OBJID || "UI");
            n.POBID = sPobid;
            if (sPuiok != null) { n.PUIOK = sPuiok; }
            if (n.zTREE) { for (var i = 0; i < n.zTREE.length; i++) { regen(n.zTREE[i], n.OBJID, n.UIOBK); } }
        })(clone, oTarget.OBJID, oTarget.UIOBK);

        if (!oTarget.zTREE) { oTarget.zTREE = []; }
        oTarget.zTREE.push(clone);

        // 복사해온 속성을 prev 에 반영(가드)
        (function restore(n) {
            try {
                if (oAPP.attr.prev && n._T_0015) {
                    oAPP.attr.prev[n.OBJID] = oAPP.attr.prev[n.OBJID] || {};
                    oAPP.attr.prev[n.OBJID]._T_0015 = n._T_0015;
                }
            } catch (e) { }
            delete n._T_0015;
            if (n.zTREE) { for (var i = 0; i < n.zTREE.length; i++) { restore(n.zTREE[i]); } }
        })(clone);

        _refreshTree();
        // 미리보기 생성(가드)
        _prev("createUIInstance", [clone, (oAPP.attr.prev && oAPP.attr.prev[clone.OBJID] && oAPP.attr.prev[clone.OBJID]._T_0015) || []]);
        _selectNode(clone.OBJID);
        _markChanged();
        _footer("S", _msg("A58", "Paste") + " ✓");
    }

    /********************************************************************
     * [PUBLIC] 행 액션/메뉴 핸들러 — 트리 +/삭제 버튼이 호출(designUIAdd/Delete).
     *   원본 UI5 가 미로드일 때만 정의(가드).
     ********************************************************************/
    if (typeof oAPP.fn.designUIDelete !== "function") {
        oAPP.fn.designUIDelete = function (oNode) { _deleteUI(oNode); };
    }
    if (typeof oAPP.fn.designUIAdd !== "function") {
        oAPP.fn.designUIAdd = function (oNode) {
            // [Phase 2] UI 삽입 팝업(insert-UI) 미이식 — 안내.
            _footer("I", "UI 삽입 팝업은 다음 단계에서 제공됩니다.");
        };
    }

    /********************************************************************
     * [PUBLIC] 우클릭 컨텍스트 메뉴 (구 callDesignContextMenu / enableDesignContextMenu)
     ********************************************************************/
    var _openMenu = null;
    function _closeMenu() {
        if (_openMenu) { try { _openMenu.remove(); } catch (e) { } _openMenu = null; }
        document.removeEventListener("mousedown", _onOutside, true);
        document.removeEventListener("keydown", _onEsc, true);
    }
    function _onOutside(ev) { if (_openMenu && !_openMenu.contains(ev.target)) { _closeMenu(); } }
    function _onEsc(ev) { if (ev.key === "Escape") { _closeMenu(); } }

    // 노드/모드별 메뉴 항목 enable 규칙 (구 enableDesignContextMenu)
    function _buildItems(oNode) {
        var bEdit = _isEdit();
        var bHasCopy = !!_getCopy();
        var sId = oNode.OBJID;
        var oParent = _node(oNode.POBID);
        var aSib = (oParent && oParent.zTREE) || [];
        var iIdx = aSib.findIndex(function (a) { return a.OBJID === sId; });
        var bOnlyOne = aSib.length <= 1;

        var en = { add: false, del: false, up: false, down: false, copy: false, paste: false };
        if (sId === "ROOT") {
            // 전부 비활성
        } else if (sId === "APP") {
            if (bEdit) { en.add = true; en.paste = bHasCopy; }
        } else {
            if (!bEdit) { en.copy = true; }
            else {
                en.add = true; en.del = true; en.copy = true; en.paste = bHasCopy;
                en.up = !bOnlyOne && iIdx > 0;
                en.down = !bOnlyOne && iIdx < aSib.length - 1;
            }
        }

        var aItems = [
            { key: "M01", icon: "plus", text: _msg("A54", "Insert Element"), on: en.add, fn: function () { oAPP.fn.designUIAdd(oNode); } },
            { key: "M02", icon: "trash", text: _msg("A03", "Delete"), on: en.del, sep: true, fn: function () { _deleteUI(oNode); } },
            { key: "M03", icon: "arrow-up", text: _msg("A55", "Up"), on: en.up, fn: function () { _moveUI(oNode, "-"); } },
            { key: "M04", icon: "arrow-down", text: _msg("A56", "Down"), on: en.down, fn: function () { _moveUI(oNode, "+"); } },
            { key: "M06", icon: "copy", text: _msg("A04", "Copy"), on: en.copy, sep: true, fn: function () { _copyUI(oNode); } },
            { key: "M07", icon: "paste", text: _msg("A58", "Paste"), on: en.paste, fn: function () { _pasteUI(oNode); } }
        ];
        return aItems.filter(function (it) { return it.on; }); // 활성 항목만 노출
    }

    oAPP.fn.fnWs20ShowTreeContextMenu = function (oNode, iX, iY) {
        _closeMenu();
        if (!oNode) { return; }
        var aItems = _buildItems(oNode);
        if (!aItems.length) { return; } // 표시할 항목 없음(예: ROOT/Display)

        var oMenu = document.createElement("div");
        oMenu.className = "u4a-menu u4aWs20TreeCtxMenu";
        oMenu.setAttribute("role", "menu");
        aItems.forEach(function (it) {
            // [공통 UX] ws10_html 메뉴와 동일 마크업(.u4a-menu__item + __item-text + FA <i>).
            var oItem = document.createElement("div");
            oItem.className = "u4a-menu__item";
            oItem.setAttribute("role", "menuitem");
            if (it.sep) { oItem.style.borderTop = "1px solid var(--line)"; } // 그룹 구분(경량)
            oItem.innerHTML = '<i class="fa-solid fa-' + it.icon + '"></i><span class="u4a-menu__item-text">' + it.text + '</span>';
            oItem.addEventListener("click", function (e) {
                e.stopPropagation();
                _closeMenu();
                try { it.fn(); } catch (err) { console.warn("[HTML5][WS20] ctx menu " + it.key + " error:", err && err.message); }
            });
            oMenu.appendChild(oItem);
        });

        document.body.appendChild(oMenu);
        // 위치(화면 경계 보정)
        var r = oMenu.getBoundingClientRect();
        var x = iX, y = iY;
        if (x + r.width > window.innerWidth) { x = Math.max(4, window.innerWidth - r.width - 4); }
        if (y + r.height > window.innerHeight) { y = Math.max(4, window.innerHeight - r.height - 4); }
        oMenu.style.position = "fixed";
        oMenu.style.left = x + "px";
        oMenu.style.top = y + "px";
        oMenu.style.zIndex = "4000";
        _openMenu = oMenu;
        setTimeout(function () {
            document.addEventListener("mousedown", _onOutside, true);
            document.addEventListener("keydown", _onEsc, true);
        }, 0);
    };

})(window, (window.oAPP = window.oAPP || {}));
