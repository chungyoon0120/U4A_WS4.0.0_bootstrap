'use strict';

/**
 * @file index.js
 * @description screen_record 모듈 퍼블릭 API 진입점.
 *
 * @example
 *   const screenRecord = require('./screen_record');
 *
 *   // 녹화 시작 (outputDir 생략 시 시스템 Videos 폴더에 자동 저장)
 *   const result = await screenRecord.open();
 *
 *   // 저장 경로 지정
 *   const result = await screenRecord.open({
 *     outputDir : 'C:\\record',
 *     theme     : 'dark',
 *   });
 *
 *   // 부모 창 자동 감지 (기본 동작):
 *   // parentWin 을 전달하지 않으면 호출 창이 자동으로 부모 창이 됩니다.
 *   // 부모 창이 닫히면 녹화 관련 팝업 전체가 자동으로 종료됩니다.
 *   const result = await screenRecord.open();
 *
 *   // 부모 창 명시적 지정:
 *   const { getCurrentWindow } = require('@electron/remote');
 *   const result = await screenRecord.open({ parentWin: getCurrentWindow() });
 *
 *   // 부모-자식 연결 비활성화 (부모 창 종료 시 녹화 팝업 유지):
 *   const result = await screenRecord.open({ parentWin: null });
 *
 *   if (result) {
 *     console.log('저장 경로:', result.filePath);
 *     console.log('녹화 시간:', result.duration, 'ms');
 *     console.log('파일 크기:', result.fileSize, 'bytes');
 *   }
 *
 *   // 외부에서 강제 종료 (진행 중인 모든 팝업 닫기)
 *   screenRecord.close();
 */

const { open, forceCloseAll, isOpen, setTheme } = require('./popups/control-panel/window');

module.exports = {
  /**
   * 화면 녹화 컨트롤 패널을 엽니다.
   *
   * - 멀티모니터 환경에서는 모니터 선택 팝업이 먼저 표시됩니다.
   * - 파일명은 항상 타임스탬프로 자동 생성됩니다 (recording_YYYYMMDD_HHMMSS.webm).
   * - 녹화 완료 후 해당 폴더의 영상 히스토리 팝업이 표시됩니다.
   * - 사용자가 취소하면 null을 반환합니다.
   *
   * @param {Object} [opts={}]
   * @param {string} [opts.outputDir]                    - 저장 디렉터리 (기본값: 시스템 Videos 폴더)
   * @param {string} [opts.theme='dark']                 - UI 테마: 'dark' | 'light'
   * @param {Object} [opts.recordOptions]                - 추가 녹화 옵션
   * @param {number} [opts.recordOptions.frameRate=30]
   * @param {number} [opts.recordOptions.videoBitsPerSecond=2500000]
   * @param {number} [opts.recordOptions.timeslice=1000]
   *
   * @returns {Promise<RecordingResult|null>}
   *
   * @typedef  {Object} RecordingResult
   * @property {string} filePath  - 저장된 파일 전체 경로
   * @property {number} duration  - 녹화 시간 (ms)
   * @property {number} fileSize  - 파일 크기 (bytes)
   * @property {string} fileName  - 자동 생성된 파일명
   * @property {Object} display   - 녹화한 디스플레이 정보
   */
  open,

  /**
   * 현재 화면 녹화 컨트롤 패널이 열려 있는지 여부를 반환합니다.
   *
   * - 세션이 하나라도 존재하면 true를 반환합니다.
   * - open() 이 반환하기 전(녹화 진행 중)에도 true입니다.
   *
   * @returns {boolean}
   *
   * @example
   *   if (screenRecord.isOpen()) {
   *     console.log('이미 실행 중');
   *   } else {
   *     await screenRecord.open();
   *   }
   */
  isOpen,

  /**
   * 현재 열려 있는 screen_record 관련 창을 모두 강제로 닫습니다.
   *
   * - 컨트롤 패널, 인디케이터, 히스토리 팝업 모두 닫힙니다.
   * - 녹화 중이던 세션은 저장 없이 종료됩니다.
   * - open() 이 반환하는 Promise 는 null 로 resolve 됩니다.
   * - 열려 있는 창이 없으면 아무 작업도 하지 않습니다.
   *
   * @returns {void}
   *
   * @example
   *   // 앱 종료 직전 정리
   *   app.on('before-quit', () => screenRecord.close());
   *
   *   // 다른 화면으로 이동할 때 강제 종료
   *   function navigateToHome() {
   *     screenRecord.close();
   *     router.push('/home');
   *   }
   */
  close: forceCloseAll,

  /**
   * 현재 열려 있는 모든 screen_record 팝업의 테마를 즉시 변경합니다.
   *
   * - 녹화 중(recording / paused) 상태에서도 즉시 반영됩니다.
   * - 컨트롤 패널, 인디케이터, 드로잉, 히스토리, 설정 팝업 모두 동기 전환됩니다.
   * - 팝업이 열려 있지 않은 상태에서 호출해도 오류가 발생하지 않습니다.
   *
   * @param {'dark'|'light'} theme
   *
   * @example
   *   // 솔루션 프로그램의 테마가 변경될 때 호출
   *   screenRecord.setTheme('light');
   *   screenRecord.setTheme('dark');
   */
  setTheme,
};
