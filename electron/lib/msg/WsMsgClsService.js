'use strict';

const { app }         = require('electron');
const path            = require('path');
const MessageDatabase = require('./MessageDatabase');

/**
 * @class WsMsgClsService
 * @description 언어별 MessageDatabase 인스턴스를 캐시하고
 *              Main global 객체로 Renderer에 노출하는 서비스.
 *
 * [사용 패턴]
 *   Main    : global.WsMsgCls = new WsMsgClsService()
 *   Renderer: remote.getGlobal('WsMsgCls').getRow(langu, arbgb, msgnr)
 */
class WsMsgClsService {

    constructor() {

        /** @type {Map<string, MessageDatabase>} 언어코드 → DB 인스턴스 */
        this._cache = new Map();

    }

    // ─────────────────────────────────────────
    // Private
    // ─────────────────────────────────────────

    /**
     * 패키징 여부에 따라 www 루트 경로를 반환합니다.
     * @returns {string}
     */
    _resolveRootPath() {

        if (app.isPackaged) {
            return path.join(app.getPath('exe'), '..', 'resources', 'www');
        }

        // electron/lib/msg/WsMsgClsService.js → 루트/www
        return path.join(__dirname, '..', '..', '..', 'www');

    }

    /**
     * 언어별 MessageDatabase 인스턴스를 반환합니다. (없으면 신규 생성)
     * @param {string} langu
     * @returns {MessageDatabase | null}
     */
    _getInstance(langu) {

        if (this._cache.has(langu)) {
            return this._cache.get(langu);
        }

        const dbPath = path.join(
            this._resolveRootPath(),
            'MSG', 'WS_COMMON', langu, 'MESSAGE_CLASS.db'
        );

        try {

            const inst = new MessageDatabase(dbPath);
            this._cache.set(langu, inst);
            return inst;

        } catch (error) {

            console.error(`[WsMsgClsService] DB 오픈 실패 (LANGU: ${langu}, PATH: ${dbPath})`, error);
            return null;

        }

    }

    // ─────────────────────────────────────────
    // Public  ←  Renderer에서 remote.getGlobal로 호출하는 인터페이스
    // ─────────────────────────────────────────

    /**
     * 메시지 클래스 행을 동기 조회합니다.
     *
     * @param {string} langu - 언어코드 (예: 'KO', 'EN')
     * @param {string} arbgb - 메시지 클래스 ID
     * @param {string} msgnr - 메시지 번호
     * @returns {{ TEXT: string, LTEXT: string } | null}
     */
    getRow(langu, arbgb, msgnr) {

        const inst = this._getInstance(langu);
        if (!inst) return null;

        return inst.getMessageClassRow(arbgb, msgnr);

    }

    /**
     * DB 연결을 닫고 캐시에서 제거합니다.
     * - langu 지정 시 : 해당 언어만 해제
     * - 생략 시       : 전체 해제 (app before-quit 시 호출)
     *
     * @param {string} [langu]
     */
    close(langu) {

        if (langu) {

            this._cache.get(langu)?.close();
            this._cache.delete(langu);

        } else {

            this._cache.forEach(inst => inst.close());
            this._cache.clear();

        }

    }

}

module.exports = WsMsgClsService;
