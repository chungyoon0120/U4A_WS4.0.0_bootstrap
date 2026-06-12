'use strict';

/**
 * @file popups/shared/ui-message.js
 * @description SAP UI5 MessageToast / MessageBox 원리를 기반으로 한 공통 UI 메시지 모듈.
 *              Electron dialog 를 사용하지 않고, 각 팝업 창 내부에 직접 렌더링합니다.
 *              호스트 HTML 의 CSS 변수(--bg, --surface, --accent, --danger 등)를 자동으로
 *              참조하므로 테마(dark/light) 전환이 별도 처리 없이 즉시 반영됩니다.
 *
 * ─ 사용 방법 ────────────────────────────────────────────────────────────────
 *   const { MessageToast, MessageBox } = require('../../shared/ui-message');
 *
 *   // ① 자동소멸 토스트 (하단 중앙)
 *   MessageToast.show('저장되었습니다');
 *   MessageToast.show('오류 발생', { type: 'error', duration: 3000 });
 *
 *   // ② 단순 알림 (버튼 1개)
 *   await MessageBox.alert('소스 ID가 없습니다.', { title: '오류', type: 'error' });
 *
 *   // ③ 확인 / 취소
 *   const ok = await MessageBox.confirm('삭제하시겠습니까?', {
 *     title: '파일 삭제', detail: '삭제된 파일은 복구할 수 없습니다.',
 *     type: 'warning', okLabel: '삭제', cancelLabel: '취소',
 *   });
 *   if (ok) { ... }
 *
 *   // ④ 커스텀 버튼 (버튼 인덱스 반환, 확장용)
 *   const idx = await MessageBox.show('녹화를 중지합니까?', {
 *     title: '녹화 종료', type: 'question',
 *     buttons: ['취소', '닫기'], defaultId: 0,
 *   });
 *   if (idx === 1) { ... }
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ─ 확장 가이드 ───────────────────────────────────────────────────────────────
 *   · 타입 추가 : ICONS 객체에 SVG 를 추가하고, CSS 에 `.uim-dialog-icon.type-{NEW}` 규칙 추가
 *   · 버튼 스타일 : _getButtonClass() 에 규칙 추가
 *   · 토스트 위치 : STYLES 내 `.uim-toast-container` 의 bottom/top/left/right 조정
 *   · 애니메이션  : `.uim-toast`, `.uim-dialog` 의 transition 값 조정
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── 초기화 플래그 / DOM 참조 ────────────────────────────────────────────────
let _initialized      = false;
let _toastContainer   = null;
let _overlayContainer = null;
let _toastIdCounter   = 0;

// ── 인라인 스타일 정의 ─────────────────────────────────────────────────────
/**
 * 호스트 HTML 에 주입할 CSS.
 * 모든 색상은 CSS 변수를 통해 테마를 자동 추종합니다.
 */
const STYLES = `
/* ── ui-message: Toast ───────────────────────────────────────────────────── */

.uim-toast-container {
  position  : fixed;
  bottom    : 36px;
  left      : 50%;
  transform : translateX(-50%);
  display         : flex;
  flex-direction  : column-reverse;
  align-items     : center;
  gap             : 8px;
  z-index         : 9100;
  pointer-events  : none;
}

.uim-toast {
  display     : flex;
  align-items : center;
  gap         : 8px;
  padding     : 9px 18px 9px 13px;
  border-radius : 8px;
  font-family : inherit;
  font-size   : 12px;
  font-weight : 600;
  letter-spacing : 0.1px;
  min-width   : 160px;
  max-width   : 340px;
  white-space : nowrap;
  overflow    : hidden;
  text-overflow: ellipsis;
  box-shadow  : 0 4px 16px rgba(0,0,0,0.35);
  border      : 1px solid var(--border);
  background  : var(--surface);
  color       : var(--text1);
  pointer-events : none;
  opacity     : 0;
  transform   : translateY(12px) scale(0.97);
  transition  : opacity 0.2s ease, transform 0.2s ease;
}

.uim-toast.uim-show {
  opacity   : 1;
  transform : translateY(0) scale(1);
}

.uim-toast.uim-hide {
  opacity   : 0;
  transform : translateY(-8px) scale(0.97);
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.uim-toast-icon {
  flex-shrink : 0;
  display     : flex;
  align-items : center;
}

.uim-toast.type-success { border-color: var(--success); }
.uim-toast.type-success .uim-toast-icon { color: var(--success); }

.uim-toast.type-error   { border-color: var(--danger); }
.uim-toast.type-error   .uim-toast-icon { color: var(--danger); }

.uim-toast.type-warning { border-color: var(--warning); }
.uim-toast.type-warning .uim-toast-icon { color: var(--warning); }

.uim-toast.type-info    { border-color: var(--accent); }
.uim-toast.type-info    .uim-toast-icon { color: var(--accent); }

/* ── ui-message: MessageBox 오버레이 ────────────────────────────────────── */

.uim-overlay {
  position        : fixed;
  inset           : 0;
  background      : rgba(0,0,0,0.50);
  backdrop-filter : blur(2px);
  display         : flex;
  align-items     : center;
  justify-content : center;
  z-index         : 9000;
  opacity         : 0;
  transition      : opacity 0.18s ease;
}

.uim-overlay.uim-show { opacity: 1; }

.uim-dialog {
  background    : var(--surface);
  border        : 1px solid var(--border);
  border-radius : 12px;
  min-width     : 290px;
  max-width     : 420px;
  width         : calc(100vw - 48px);
  box-shadow    : 0 12px 40px rgba(0,0,0,0.55);
  display       : flex;
  flex-direction: column;
  overflow      : hidden;
  transform     : scale(0.94) translateY(10px);
  transition    : transform 0.2s ease;
}

.uim-overlay.uim-show .uim-dialog {
  transform : scale(1) translateY(0);
}

.uim-dialog-header {
  display     : flex;
  align-items : center;
  gap         : 10px;
  padding     : 16px 18px 0;
}

.uim-dialog-icon {
  flex-shrink     : 0;
  width           : 30px;
  height          : 30px;
  border-radius   : 50%;
  display         : flex;
  align-items     : center;
  justify-content : center;
}

.uim-dialog-icon.type-error    { background: var(--danger-dim);           color: var(--danger);  }
.uim-dialog-icon.type-warning  { background: rgba(255,214,10,0.12);        color: var(--warning); }
.uim-dialog-icon.type-success  { background: var(--success-dim);          color: var(--success); }
.uim-dialog-icon.type-info     { background: var(--accent-dim);           color: var(--accent);  }
.uim-dialog-icon.type-question { background: var(--accent-dim);           color: var(--accent);  }

.uim-dialog-title {
  font-size     : 13px;
  font-weight   : 700;
  color         : var(--text1);
  flex          : 1;
  min-width     : 0;
  white-space   : nowrap;
  overflow      : hidden;
  text-overflow : ellipsis;
}

.uim-dialog-body {
  padding : 11px 18px 6px;
}

.uim-dialog-message {
  font-size   : 12.5px;
  color       : var(--text1);
  line-height : 1.55;
  word-break  : break-word;
}

.uim-dialog-detail {
  margin-top  : 7px;
  font-size   : 11.5px;
  color       : var(--text2);
  line-height : 1.5;
  word-break  : break-word;
}

.uim-dialog-footer {
  display         : flex;
  justify-content : flex-end;
  gap             : 8px;
  padding         : 10px 16px 14px;
}

.uim-btn {
  font-family    : inherit;
  font-size      : 11.5px;
  font-weight    : 700;
  padding        : 7px 18px;
  border-radius  : 7px;
  border         : 1.5px solid var(--border);
  cursor         : pointer;
  transition     : all 0.14s;
  background     : var(--surface2);
  color          : var(--text1);
  letter-spacing : 0.1px;
  outline        : none;
}

.uim-btn:hover {
  border-color : var(--accent);
  background   : var(--accent-dim);
  color        : var(--text1);
}

.uim-btn:active  { transform: scale(0.97); }

.uim-btn:focus-visible {
  outline        : 2px solid var(--accent);
  outline-offset : 2px;
}

/* primary: 액센트 계열 (확인, 초기화 등 action) */
.uim-btn.uim-primary {
  background   : var(--accent);
  border-color : var(--accent);
  color        : #fff;
}
.uim-btn.uim-primary:hover {
  background   : var(--accent-h);
  border-color : var(--accent-h);
  color        : #fff;
}

/* danger: 파괴적 액션 (삭제, 경고 단독 확인 등) */
.uim-btn.uim-danger {
  background   : var(--danger);
  border-color : var(--danger);
  color        : #fff;
}
.uim-btn.uim-danger:hover {
  background   : #ff6080;
  border-color : #ff6080;
  color        : #fff;
}
`;

// ── 아이콘 SVG 정의 ────────────────────────────────────────────────────────
/**
 * 타입별 인라인 SVG 아이콘.
 * 확장 시 이 객체에 항목만 추가하면 됩니다.
 */
const ICONS = {
  success : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  error   : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8.5"/><line x1="12" y1="12" x2="12" y2="16"/></svg>',
  question: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
};

// ── DOM 초기화 (최초 사용 시 1회 실행) ────────────────────────────────────
/**
 * 스타일, 토스트 컨테이너, 오버레이 컨테이너를 document.body 에 주입합니다.
 * require() 시점이 아닌 최초 사용 시점에 호출하므로 DOM 이 준비된 상태를 보장합니다.
 */
function _init() {
  if (_initialized) return;
  _initialized = true;

  // CSS 주입
  const style = document.createElement('style');
  style.id    = 'uim-styles';
  style.textContent = STYLES;
  document.head.appendChild(style);

  // 토스트 컨테이너
  _toastContainer           = document.createElement('div');
  _toastContainer.className = 'uim-toast-container';
  document.body.appendChild(_toastContainer);

  // MessageBox 오버레이 컨테이너 (다이얼로그들이 여기에 쌓임)
  _overlayContainer    = document.createElement('div');
  _overlayContainer.id = 'uim-overlay-root';
  document.body.appendChild(_overlayContainer);
}

// ────────────────────────────────────────────────────────────────────────────
// 내부 헬퍼
// ────────────────────────────────────────────────────────────────────────────

/**
 * 버튼의 CSS 클래스를 결정합니다.
 *
 * 규칙:
 *   - 버튼 1개    : error → uim-danger, 나머지 → uim-primary
 *   - 버튼 2개 이상:
 *       마지막 버튼(action) : error|warning → uim-danger, 나머지 → uim-primary
 *       나머지 버튼(cancel)  : 스타일 없음 (중립)
 *
 * @param {'error'|'warning'|'info'|'question'|'success'} type - 다이얼로그 타입
 * @param {number} idx   - 현재 버튼 인덱스
 * @param {number} total - 전체 버튼 수
 * @returns {string} CSS 클래스명 (없으면 빈 문자열)
 */
function _getButtonClass(type, idx, total) {
  if (total === 1) {
    return type === 'error' ? 'uim-danger' : 'uim-primary';
  }
  // 마지막 버튼 = 주요 액션
  if (idx === total - 1) {
    return (type === 'error' || type === 'warning') ? 'uim-danger' : 'uim-primary';
  }
  // 취소/중립 버튼
  return '';
}

/**
 * 오버레이를 fade-out 후 DOM 에서 제거하고 콜백을 호출합니다.
 * @param {HTMLElement} overlay
 * @param {Function}    callback
 */
function _closeDialog(overlay, callback) {
  overlay.classList.remove('uim-show');
  setTimeout(() => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    callback();
  }, 200);
}

/**
 * 오버레이 + 다이얼로그 DOM 을 생성하고, 버튼 클릭 또는 키보드 입력 시 resolve 합니다.
 *
 * @param {Object} params
 * @param {string}   params.message    - 본문 메시지
 * @param {string}   [params.title]    - 제목
 * @param {string}   [params.detail]   - 상세 설명 (작은 텍스트)
 * @param {string}   [params.type]     - 타입 ('error'|'warning'|'info'|'question'|'success')
 * @param {string[]} [params.buttons]  - 버튼 레이블 배열
 * @param {number}   [params.defaultId]- Enter 키 또는 기본 포커스 버튼 인덱스
 * @returns {Promise<number>} 클릭된 버튼의 인덱스
 */
function _showDialog(params) {
  _init();

  return new Promise(resolve => {
    const {
      title     = '',
      message   = '',
      detail    = '',
      type      = 'info',
      buttons   = ['확인'],
      defaultId = buttons.length - 1,
    } = params;

    let _settled = false;

    /**
     * 중복 resolve 방지 래퍼.
     * 버튼 클릭과 키보드 이벤트가 동시에 발화할 수 없도록 보호합니다.
     * @param {number} idx
     */
    const settle = (idx) => {
      if (_settled) return;
      _settled = true;
      document.removeEventListener('keydown', onKey);
      _closeDialog(overlay, () => resolve(idx));
    };

    // ── 오버레이 ──────────────────────────────────────────────────────────
    const overlay       = document.createElement('div');
    overlay.className   = 'uim-overlay';

    // ── 다이얼로그 카드 ───────────────────────────────────────────────────
    const dialogEl      = document.createElement('div');
    dialogEl.className  = 'uim-dialog';

    // 헤더 (아이콘 + 제목)
    const header        = document.createElement('div');
    header.className    = 'uim-dialog-header';
    header.innerHTML    = `
      <div class="uim-dialog-icon type-${type}">${ICONS[type] || ICONS.info}</div>
      ${title ? `<div class="uim-dialog-title">${title}</div>` : ''}
    `;

    // 본문 (메시지 + 상세)
    const body          = document.createElement('div');
    body.className      = 'uim-dialog-body';
    body.innerHTML      = `
      <div class="uim-dialog-message">${message}</div>
      ${detail ? `<div class="uim-dialog-detail">${detail}</div>` : ''}
    `;

    // 푸터 (버튼)
    const footer        = document.createElement('div');
    footer.className    = 'uim-dialog-footer';

    buttons.forEach((label, idx) => {
      const btn         = document.createElement('button');
      btn.className     = 'uim-btn';
      btn.textContent   = label;

      const extra = _getButtonClass(type, idx, buttons.length);
      if (extra) btn.classList.add(extra);

      btn.addEventListener('click', () => settle(idx));
      footer.appendChild(btn);
    });

    dialogEl.appendChild(header);
    dialogEl.appendChild(body);
    dialogEl.appendChild(footer);
    overlay.appendChild(dialogEl);
    _overlayContainer.appendChild(overlay);

    // ── 등장 애니메이션 + 포커스 ─────────────────────────────────────────
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('uim-show');
        const focusBtn = footer.children[defaultId] || footer.lastElementChild;
        if (focusBtn) focusBtn.focus();
      });
    });

    // ── 키보드 처리 ───────────────────────────────────────────────────────
    // Enter  : 포커스가 이미 버튼 위에 있으면 버튼 클릭에 위임, 아니면 defaultId resolve
    // Escape : index 0 (취소/첫 번째 버튼)으로 resolve
    const onKey = (e) => {
      if (e.key === 'Enter') {
        // 포커스가 다이얼로그 내 버튼이면 클릭 이벤트에 맡김
        if (document.activeElement && document.activeElement.classList.contains('uim-btn')) return;
        e.preventDefault();
        settle(defaultId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        settle(0);
      }
    };
    document.addEventListener('keydown', onKey);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// MessageToast
// ════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ToastOptions
 * @property {'success'|'warning'|'error'|'info'} [type='info'] - 토스트 타입 (색상 결정)
 * @property {number} [duration=2200] - 자동 소멸 대기 시간 (ms)
 */

const MessageToast = {
  /**
   * 하단 중앙에 자동 소멸 토스트를 표시합니다.
   *
   * @param {string}       message - 표시할 메시지
   * @param {ToastOptions} [opts]
   * @returns {number} 토스트 ID (향후 강제 소멸 등 확장에 활용 가능)
   *
   * @example
   *   MessageToast.show('설정이 저장되었습니다', { type: 'success' });
   *   MessageToast.show('파일을 열 수 없습니다.',  { type: 'error',   duration: 3500 });
   */
  show(message, opts = {}) {
    _init();

    const type     = opts.type     || 'info';
    const duration = opts.duration || 2200;
    const id       = ++_toastIdCounter;

    const el       = document.createElement('div');
    el.className   = `uim-toast type-${type}`;
    el.dataset.id  = id;
    el.innerHTML   = `
      <span class="uim-toast-icon">${ICONS[type] || ICONS.info}</span>
      <span>${message}</span>
    `;
    _toastContainer.appendChild(el);

    // transition 트리거를 위해 두 프레임 후에 show 클래스 추가
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('uim-show'));
    });

    // duration 후 fade-out → 제거
    setTimeout(() => {
      el.classList.remove('uim-show');
      el.classList.add('uim-hide');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    }, duration);

    return id;
  },
};

// ════════════════════════════════════════════════════════════════════════════
// MessageBox
// ════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} MessageBoxOptions
 * @property {string}   [title]       - 다이얼로그 제목
 * @property {string}   [detail]      - 상세 설명 (message 아래 작은 텍스트)
 * @property {'error'|'warning'|'info'|'question'|'success'} [type='info'] - 타입
 * @property {string[]} [buttons]     - 버튼 레이블 배열 (기본: ['확인'])
 * @property {number}   [defaultId]   - Enter 키 / 기본 포커스 버튼 인덱스 (기본: 마지막)
 * @property {string}   [okLabel]     - confirm() 전용 확인 버튼 레이블 (기본: '확인')
 * @property {string}   [cancelLabel] - confirm() 전용 취소 버튼 레이블 (기본: '취소')
 */

const MessageBox = {
  /**
   * 단순 알림 다이얼로그 (버튼 1개).
   * 버튼 클릭 시 resolve 됩니다.
   *
   * @param {string}            message
   * @param {MessageBoxOptions} [opts]
   * @returns {Promise<void>}
   *
   * @example
   *   await MessageBox.alert('소스 ID가 없습니다.', { title: '오류', type: 'error' });
   */
  alert(message, opts = {}) {
    const btnLabel = (opts.buttons && opts.buttons[0]) || '확인';
    return _showDialog({
      title   : opts.title  || '',
      detail  : opts.detail || '',
      type    : opts.type   || 'info',
      message,
      buttons   : [btnLabel],
      defaultId : 0,
    }).then(() => undefined);
  },

  /**
   * 확인 / 취소 다이얼로그.
   * 확인(okLabel) 버튼 클릭 시 true, 취소(cancelLabel) 또는 Escape 시 false 를 반환합니다.
   *
   * @param {string}            message
   * @param {MessageBoxOptions} [opts]
   * @returns {Promise<boolean>}
   *
   * @example
   *   const ok = await MessageBox.confirm('삭제하시겠습니까?', {
   *     title      : '파일 삭제',
   *     detail     : '삭제된 파일은 복구할 수 없습니다.',
   *     type       : 'warning',
   *     okLabel    : '삭제',
   *     cancelLabel: '취소',
   *   });
   */
  confirm(message, opts = {}) {
    const cancelLabel = opts.cancelLabel || '취소';
    const okLabel     = opts.okLabel     || '확인';
    const defaultId   = (opts.defaultId !== undefined) ? opts.defaultId : 0;

    return _showDialog({
      title   : opts.title  || '',
      detail  : opts.detail || '',
      type    : opts.type   || 'question',
      message,
      buttons   : [cancelLabel, okLabel],
      defaultId,
    }).then(idx => idx === 1);
  },

  /**
   * 커스텀 버튼 다이얼로그 (확장용).
   * 클릭된 버튼의 인덱스를 반환합니다.
   *
   * @param {string}            message
   * @param {MessageBoxOptions} [opts]
   * @returns {Promise<number>}
   *
   * @example
   *   const idx = await MessageBox.show('저장하지 않고 닫을까요?', {
   *     title  : '확인',
   *     type   : 'question',
   *     buttons: ['취소', '저장 안 함', '저장'],
   *     defaultId: 2,
   *   });
   */
  show(message, opts = {}) {
    return _showDialog({
      title     : opts.title     || '',
      detail    : opts.detail    || '',
      type      : opts.type      || 'info',
      buttons   : opts.buttons   || ['확인'],
      defaultId : opts.defaultId !== undefined ? opts.defaultId : (opts.buttons ? opts.buttons.length - 1 : 0),
      message,
    });
  },
};

// ── 공개 API ──────────────────────────────────────────────────────────────
module.exports = { MessageToast, MessageBox };
