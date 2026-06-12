
let get = function(){

    return `
        (function(){
            "use strict";            

            return window.u4adevbrowser.ServerEventHighlighter.getList();

        })();
    `;
};


module.exports = {
    get : get
}