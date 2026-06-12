'use strict';

/**
 * @file shared/store.js
 * @description 프로세스 간 공유 상태 저장소.
 *
 * ⚠️ 반드시 remote.require()를 통해 메인 프로세스에서 로드해야 합니다.
 *    Node.js 모듈 캐시 덕분에 모든 렌더러 창이 동일한 인스턴스를 공유합니다.
 *
 * @example
 *   // 렌더러 프로세스에서 사용
 *   const remote = require('@electron/remote');
 *   const path   = require('path');
 *   const store  = remote.require(path.join(__dirname, '../../core/store'));
 *
 *   store.set('my_key', { value: 42 });
 *   store.get('my_key');          // { value: 42 }
 *   store.del('my_key');
 */

const _state = {};

module.exports = {
  /**
   * 값 저장
   * @param {string} key
   * @param {*}      value
   */
  set(key, value) {
    _state[key] = value;
  },

  /**
   * 값 조회
   * @param {string} key
   * @param {*}      [defaultValue=null]
   * @returns {*}
   */
  get(key, defaultValue = null) {
    return Object.prototype.hasOwnProperty.call(_state, key)
      ? _state[key]
      : defaultValue;
  },

  /**
   * 키 존재 여부 확인
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return Object.prototype.hasOwnProperty.call(_state, key);
  },

  /**
   * 값 삭제
   * @param {string} key
   */
  del(key) {
    delete _state[key];
  },

  /**
   * 접두사로 시작하는 모든 키 일괄 삭제
   * @param {string} prefix
   */
  delByPrefix(prefix) {
    Object.keys(_state)
      .filter(k => k.startsWith(prefix))
      .forEach(k => delete _state[k]);
  },

  /**
   * 현재 상태 전체 복사본 반환 (디버깅용)
   * @returns {Object}
   */
  snapshot() {
    return { ..._state };
  },

  /**
   * 전체 초기화
   */
  clear() {
    Object.keys(_state).forEach(k => delete _state[k]);
  },
};
