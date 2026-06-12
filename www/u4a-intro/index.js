

class IntroRuntime{

   constructor() {

      /**
       * 현재 런타임 상태
       * IDLE    : 아직 시작 안됨 / 종료된 상태
       * RUNNING : 인트로 실행 중
       *
       * → 중복 start() 호출 방지용
       */
      this.state = 'IDLE';

      /**
       * 현재 로드된 테마 모듈 객체
       * (themes/{group}/index.js require 결과)
       */
      this.currentTheme = null;

   }


   /**
    * 인트로 시작
    * ----------------------------------------------------------
    * 외부에서는 IntroRuntime.start(params) 만 호출하면 되며,
    * 어떤 테마가 실행될지는 Runtime 내부 로직에서 자동 결정된다.
    *
    * ▶ 전달 파라미터(params)는 인트로 화면 표시 및 동작 제어용 옵션이다.
    *
    * @param {Object} params
    * @param {String} params.versn
    *        - Workspace 메이저/마이너 버전 (예: "5.5.9")
    *        - 인트로 화면에 표시되는 Release Version 정보
    *
    * @param {String|Number} params.splev
    *        - Support Patch Level (예: "8")
    *        - 패치 레벨 표시용 (예: Patch Level 8)
    *
    * @param {Boolean} params.devTools
    *        - true  : 인트로 실행 시 DevTools 자동 오픈 (개발 모드)
    *        - false : 일반 사용자 모드 (DevTools 미사용)
    *
    * ▶ 사용 예:
    *    introRuntime.start({
    *        versn  : "3.5.9",
    *        splev  : "2",
    *        devTools : false
    *    });
    */
   async start(params) {

      if (this.state !== 'IDLE') return;

      this.state = 'RUNNING';
   
      // 1️⃣ 테마 그룹 결정
      const themeGroup = this._decideThemeGroup();

      // 2️⃣ 해당 테마 그룹 index.js 로딩
      this.currentTheme = require(`./themes/${themeGroup}`);
      return await this.currentTheme.start(params);

   }


   /**
    * 인트로 종료
    * ----------------------------------------------------------
    * 현재 실행 중인 테마에게 stop() 을 위임하여
    * 애니메이션 정리 / 이벤트 해제 / DOM 제거 등을 수행.
    */   
   async stop() {

      if (this.state !== 'RUNNING') return;

      const _currentTheme = this?.currentTheme || null;
      if(!_currentTheme){ return; }
      
      await _currentTheme.stop();
      delete this.currentTheme;
      this.state = 'IDLE';
      return;

   }


   /**
    * 사용할 테마 그룹 결정 로직
    * ----------------------------------------------------------
    * 날짜 / 환경 / 설정값 등을 기반으로 어떤 테마를 사용할지 판단.
    *
    * 현재 규칙:
    * - 12월 → christmas 테마
    * - 그 외 → seasons 테마
    *
    * (향후 여기만 수정하면 테마 정책 변경 가능)
    *
    * @returns {String} themeGroup 폴더명
    */   
   _decideThemeGroup() {

      const month = new Date().getMonth() + 1;

      if (month === 12) return 'christmas';

      return 'seasons';
   }


}

module.exports = IntroRuntime;