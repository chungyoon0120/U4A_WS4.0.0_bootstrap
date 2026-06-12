/**
 * @since   2026-01-06 02:45:57
 * @version v3.5.7-4
 * @author  PES
 * @description
 * UI의 extend event 처리 클래스.
 * (click, keydown 등 UI5의 기존 이벤트 외에 추가 이벤트 처리를 위한 클래스)
 */
export class attachExtendEvent extends sap.ui.base.EventProvider{
    constructor(oUi) {

        super();

        this.oUi = oUi;

        //UI의 이벤트 등록 처리.
        this.addEventDelegate();
    }

    //UI의 이벤트 등록 처리.
    addEventDelegate() {

        this.oDelegate = {
            onAfterRendering: (e) => {

                const _oUi = e?.srcControl?.getDomRef?.();

                if (!_oUi) {
                    return;
                }
                
                // 이전 이벤트 리스너 제거 (중복 방지)
                _oUi.removeEventListener("click", this._handleClick);
                _oUi.removeEventListener("keydown", this._handleKeydown);
                
                // 새 이벤트 리스너 추가
                _oUi.addEventListener("click", this._handleClick);
                _oUi.addEventListener("keydown", this._handleKeydown);
            }
        };

        this.oUi.addEventDelegate(this.oDelegate);
    }
    
    //click 대표 callback 이벤트.
    _handleClick = (e) => {

        this.fireEvent("click", { originalEvent: e });

    }
    
    //keydown 대표 callback 이벤트.
    _handleKeydown = (e) => {

        this.fireEvent("keydown", { originalEvent: e });

    }
    
    
    //UI 초기화 및 등록 이벤트 제거 처리.
    destroy() {

        //super destroy 호출.
        super.destroy();

        //입력 UI 초기화.
        const _oUi = this.oUi;

        this.oUi = null;

        //UI의 이벤트 등록 제거 처리.
        _oUi.removeEventDelegate(this.oDelegate);


        const _oDom = _oUi.getDomRef?.();

        //dom에 추가된 이벤트 제거.
        if (_oDom) {
            _oDom.removeEventListener("click", this._handleClick);
            _oDom.removeEventListener("keydown", this._handleKeydown);
        }

    }
}