/**
 * 어플리케이션 계층 구조
 * (Usage 되어있을 경우 부모 자식 관계 정보) 
 */
const getAppHireachy = () => {
    return `
    (function(){
        "use strict";
        return u4adevb.util.getAppHireachy();
    })();`;
};

/**
 * 개발 브라우저에 메시지 출력
 */
const showBrowserMessage = function(sMessage, mOptions){

    let sMsg = sMessage || ""; 
    if(sMsg){
        sMsg = encodeURIComponent(sMsg);
    }

    return `
    (function(){
        "use strict";
        u4adevb.util.showBrowserMessage("${sMsg}", ${JSON.stringify(mOptions)});
    })();`;
};

/**
 * 개발 브라우저에 로드된 테마 정보를 구한다.
 */
const getThemeInfo = function(){
    return `
    (function(){
        "use strict";
        return sap.ui.getCore().getConfiguration().getTheme();
    })();`;
};


module.exports = {
    getAppHireachy: getAppHireachy,
    getThemeInfo: getThemeInfo,
    showBrowserMessage: showBrowserMessage
};