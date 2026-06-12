/************************************************************************
 * U4A Workspace — 테마 API shim (doc 12 §5.2)
 * ----------------------------------------------------------------------
 * UI5 테마 API 와 동일 시그니처로 내부만 CSS 변수 기반으로 동작.
 *   applyTheme(name)        → U4ATheme.apply(name)
 *   Parameters.get("--x")   → U4ATheme.param("--x")
 *   attachThemeChanged(fn)  → U4ATheme.onChange(fn)
 *
 * UI5 테마명(sap_horizon 등)은 5종 키로 매핑한다.
 ************************************************************************/
(function (global) {
    "use strict";

    // 기본 테마
    var DEFAULT_THEME = "horizon_white";

    /**
     * 테마 별칭 매핑 → 정식 data-theme 키.
     * 명명 규칙: {대표테마}_{색상의미} (예: horizon_white). 베이스 테마 확장 대비.
     *  - UI5 테마명(sap_horizon 등)
     *  - 레거시 5종 키(white/dark/purple/red/green)도 호환
     */
    var THEME_ALIAS = {
        // UI5 테마명
        "sap_horizon": "horizon_white",
        "sap_horizon_dark": "horizon_dark",
        "sap_horizon_hcb": "horizon_dark",
        "sap_horizon_hcw": "horizon_white",
        // 레거시 키
        "white": "horizon_white",
        "dark": "horizon_dark",
        "purple": "horizon_purple",
        "red": "horizon_red",
        "green": "horizon_green"
    };

    var U4ATheme = {

        THEMES: ["horizon_white", "horizon_dark", "horizon_purple", "horizon_red", "horizon_green"],

        /**
         * UI5 테마명 / 레거시 키 / 정식 키를 받아 data-theme 키로 정규화.
         * @param {string} name
         * @returns {string} 정식 테마 키 (기본 horizon_white)
         */
        normalize: function (name) {
            if (!name) {
                return DEFAULT_THEME;
            }
            if (this.THEMES.indexOf(name) !== -1) {
                return name;
            }
            if (THEME_ALIAS[name]) {
                return THEME_ALIAS[name];
            }
            return DEFAULT_THEME;
        },

        /** applyTheme() 대체 */
        apply: function (name) {
            var t = this.normalize(name);
            document.documentElement.dataset.theme = t;
            global.dispatchEvent(new CustomEvent("u4a-theme-changed", { detail: { name: t } }));
            return t;
        },

        /** 현재 적용된 테마 키 */
        current: function () {
            return document.documentElement.dataset.theme || DEFAULT_THEME;
        },

        /** Parameters.get() 대체 — 의미 토큰 값 조회 */
        param: function (varName) {
            return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        },

        /** attachThemeChanged 대체 */
        onChange: function (cb) {
            global.addEventListener("u4a-theme-changed", cb);
        }
    };

    global.U4ATheme = U4ATheme;

    // CommonJS(Electron nodeIntegration) 환경에서도 require 가능하게
    if (typeof module === "object" && module.exports) {
        module.exports = U4ATheme;
    }

})(typeof window !== "undefined" ? window : this);
