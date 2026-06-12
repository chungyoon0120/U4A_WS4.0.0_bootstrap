/**
 * @file popups/drawing/canvas/index.js
 * @description 캔버스 전용 창 — 펜/도형/지우개 드로잉만 담당합니다.
 *
 * ── 설계 원칙 ────────────────────────────────────────────────────────────────
 *  · 이 창은 항상 setFocusable(false) 상태입니다 (window.js 에서 고정).
 *    키보드 입력이 필요 없고, 마우스 이벤트만 수신합니다.
 *    절대 활성화(activate)되지 않으므로 Z-Order 역전이 발생하지 않습니다.
 *
 *  · 툴바 창(toolbar/index.js)과 IPC 채널로 통신합니다:
 *    수신: draw:tool | draw:style | draw:undo | draw:clear | draw:close
 *    송신: draw:action (드로잉 완료 시 → 툴바의 undo 로그 동기화용)
 */

const
    REMOTE   = require('@electron/remote'),
    APP      = REMOTE.app,
    PATH     = require('path'),
    APPPATH  = APP.getAppPath(),
    PATHINFO = require(PATH.join(APPPATH, "ws30", "resources", "pathInfo.js")),
    WSUTIL   = require(PATHINFO.WSUTIL);

'use strict';

const path   = require('path');
const remote = require('@electron/remote');
const store  = remote.require(path.join(__dirname, '../../../core/store'));

const params     = WSUTIL.QueryString.parse(location.href);
const sessionKey = params.sessionKey || '';
const USERINFO   = params.USERINFO   || {};
const browserKey = params.browserKey || '';

const canvasWin = remote.getCurrentWindow();

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('drawCanvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
  const tmp = document.createElement('canvas');
  tmp.width = canvas.width; tmp.height = canvas.height;
  tmp.getContext('2d').drawImage(canvas, 0, 0);
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.drawImage(tmp, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ── 공유 상태 ─────────────────────────────────────────────────────────────────
const _state = {
  tool: 'pen', color: '#FF3B30', size: 4, opacity: 1.0,
  drawing: false, startX: 0, startY: 0, lastX: 0, lastY: 0, snapshot: null,
};

// ── 히스토리 (ImageData 스택) ─────────────────────────────────────────────────
const MAX_HISTORY = 30;
const _imgHistory = [];

function _saveHistory() {
  _imgHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  if (_imgHistory.length > MAX_HISTORY) _imgHistory.shift();
}

function _undoCanvas() {
  if (_imgHistory.length === 0) return;
  ctx.putImageData(_imgHistory.pop(), 0, 0);
}

// ── 스타일 적용 ───────────────────────────────────────────────────────────────
function _applyStyle() {
  ctx.strokeStyle = _state.tool === 'eraser' ? 'rgba(0,0,0,1)' : _state.color;
  ctx.lineWidth   = _state.tool === 'eraser' ? _state.size * 3  : _state.size;
  ctx.globalAlpha = _state.tool === 'eraser' ? 1                : _state.opacity;
  ctx.globalCompositeOperation = _state.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}

// ── 좌표 변환 ─────────────────────────────────────────────────────────────────
function _getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width  / rect.width),
    y: (e.clientY - rect.top)  * (canvas.height / rect.height),
  };
}

// ── 툴바 웹컨텐츠 참조 ────────────────────────────────────────────────────────
function _getToolbarWc() {
  const wcId = store.get('__drawing_toolbar_wc_id__', null);
  if (!wcId) return null;
  const wc = remote.webContents.fromId(wcId);
  return (wc && !wc.isDestroyed()) ? wc : null;
}

/** 드로잉 1회 완료 시 툴바에 알림 (undo 로그 동기화) */
function _notifyAction() {
  const wc = _getToolbarWc();
  if (wc) wc.send('draw:action');
}

// ── 마우스 이벤트 (드로잉 모드 전용) ─────────────────────────────────────────
canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (_state.tool === 'text') return; // 텍스트 모드에서는 캔버스가 마우스 이벤트 무시

  const { x, y } = _getPos(e);
  _saveHistory();
  _applyStyle();
  _state.drawing = true;
  _state.startX = x; _state.startY = y; _state.lastX = x; _state.lastY = y;

  if (['line', 'rect', 'circle'].includes(_state.tool)) {
    _state.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  if (_state.tool === 'pen' || _state.tool === 'eraser') {
    ctx.beginPath(); ctx.moveTo(x, y);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!_state.drawing) return;
  const { x, y } = _getPos(e);
  _applyStyle();
  switch (_state.tool) {
    case 'pen': case 'eraser':
      ctx.lineTo(x, y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); break;
    case 'line':
      ctx.putImageData(_state.snapshot, 0, 0); ctx.beginPath();
      ctx.moveTo(_state.startX, _state.startY); ctx.lineTo(x, y); ctx.stroke(); break;
    case 'rect':
      ctx.putImageData(_state.snapshot, 0, 0); ctx.beginPath();
      ctx.strokeRect(_state.startX, _state.startY, x - _state.startX, y - _state.startY); break;
    case 'circle': {
      ctx.putImageData(_state.snapshot, 0, 0);
      const rx = Math.abs(x - _state.startX) / 2, ry = Math.abs(y - _state.startY) / 2;
      const cx = _state.startX + (x - _state.startX) / 2, cy = _state.startY + (y - _state.startY) / 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); break;
    }
  }
  _state.lastX = x; _state.lastY = y;
});

['mouseup', 'mouseleave'].forEach(ev => {
  canvas.addEventListener(ev, () => {
    if (!_state.drawing) return;
    _state.drawing = false; _state.snapshot = null; ctx.beginPath();
    _notifyAction(); // 드로잉 완료 알림
  });
});

// ── IPC 수신 ─────────────────────────────────────────────────────────────────

/**
 * 텍스트 박스 데이터를 canvas에 래스터라이즈합니다.
 *
 * @param {Array} boxes - toolbar/index.js 의 _serializeTextBoxes() 결과
 *   각 box: { x, y, w, h, rotation, fontSize, opacity, lines: [[{text,color}]] }
 */
function _rasterizeBoxes(boxes) {
  if (!boxes || boxes.length === 0) return;

  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;

  ctx.save();
  boxes.forEach(obj => {
    const cx  = (obj.x + obj.w / 2) * scaleX;
    const cy  = (obj.y + obj.h / 2) * scaleY;
    const rad = obj.rotation * Math.PI / 180;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.translate(-(obj.w * scaleX) / 2, -(obj.h * scaleY) / 2);

    ctx.globalAlpha              = obj.opacity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.font         = `bold ${obj.fontSize * scaleX}px 'Malgun Gothic','Apple SD Gothic Neo',sans-serif`;
    ctx.textBaseline = 'top';

    const lineH = obj.fontSize * scaleX * 1.5;
    const padX  = 8 * scaleX;
    const padY  = 5 * scaleY;

    (obj.lines || []).forEach((segments, lineIdx) => {
      let xOff = padX;
      (segments || []).forEach(({ text: seg, color }) => {
        ctx.fillStyle = color;
        ctx.fillText(seg, xOff, padY + lineIdx * lineH);
        xOff += ctx.measureText(seg).width;
      });
    });

    ctx.restore();
  });
  ctx.restore();
}

// IPC 수신: 툴바 → 캔버스
const { ipcRenderer } = require('electron');

/** 도구 변경 */
ipcRenderer.on('draw:tool', (_, { tool }) => {
  _state.tool = tool;
  // 텍스트 모드 진입: 캔버스 마우스 이벤트 무시 (툴바가 처리)
  canvasWin.setIgnoreMouseEvents(tool === 'text');
});

/** 스타일 변경 */
ipcRenderer.on('draw:style', (_, { color, size, opacity }) => {
  if (color   !== undefined) _state.color   = color;
  if (size    !== undefined) _state.size    = size;
  if (opacity !== undefined) _state.opacity = opacity;
});

/** 실행취소 (캔버스 드로잉) */
ipcRenderer.on('draw:undo', () => { _undoCanvas(); });

/** 전체 지우기 */
ipcRenderer.on('draw:clear', () => {
  _imgHistory.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

/**
 * 드로잉 종료:
 *  1. 툴바가 직렬화한 텍스트 박스를 래스터라이즈
 *  2. 캔버스 창 닫기 (window.js 의 closed 핸들러가 후처리)
 */
ipcRenderer.on('draw:close', (_, boxes) => {
  _rasterizeBoxes(boxes);
  window.close();
});
