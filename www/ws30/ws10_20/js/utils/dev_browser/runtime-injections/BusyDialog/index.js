const open = function(oOptions){
    return `
    (function(){
        "use strict";

        u4adevb.util.openBusyDialog(${JSON.stringify(oOptions)});

    })();`;
};

const close = function(){
    return `
    (function(){
        "use strict";

        u4adevb.util.closeBusyDialog();

    })();`;
};

module.exports = {
    open: open,
    close: close
};