module.exports = {

    /** 랜덤값 추출 */
    getRandomChar : (length = 8) => {
        
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            // 문자셋 안에서 랜덤하게 한 글자씩 선택
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    },

    /** 일정시간 대기 */
    waiting: function(itime = 1000){
        return new Promise(function(res){
            setTimeout(function(){
                res();
            }, itime);
        });
    },

    /** 메시지 공통 함수 */
    showMessage(){
        oWS.utill.attr.sap.m.InstanceManager.closeAllPopovers();
        parent.showMessage(oWS.utill.attr.sap, ...arguments);
    }

};