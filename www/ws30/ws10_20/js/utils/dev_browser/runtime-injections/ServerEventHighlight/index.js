
let apply = function(){

    return `
        (function(){
            "use strict";
            u4adevb.util.ServerEventHighlighter.apply();
        })();
    `;

};


let clear = function(){

    return `
        (function(){
            "use strict";            
            u4adevb.util.ServerEventHighlighter.clear();
        })();
    `;

};

module.exports = {
    apply: apply,
    clear: clear
};