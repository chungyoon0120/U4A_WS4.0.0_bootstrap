'use strict';

const BETTER_SQLITE3 = require('better-sqlite3');

/**
 * @class MessageDatabase
 * @description better-sqlite3 기반 메시지 클래스 단건 조회 래퍼.
 *              Main 프로세스 전용 (Native Node 모듈).
 */
class MessageDatabase {

    /**
     * @constructor
     * @param {string} dbFilePath - SQLite 데이터베이스 파일 경로
     */
    constructor(dbFilePath) {

        this.db = new BETTER_SQLITE3(dbFilePath, { readonly: true });

        this.messageStmt = this.db.prepare(`
            SELECT
                ARBGB,
                MSGNR,
                TEXT,
                LTEXT
            FROM MESSAGE_CLASS_TEXTS
            WHERE ARBGB = ?
            AND   MSGNR = ?
        `);

    }

    /**
     * 특정 메시지 1건을 동기 방식으로 조회합니다.
     *
     * @param {string} arbgb - 메시지 클래스 ID
     * @param {string} msgnr - 메시지 번호
     * @returns {{ ARBGB: string, MSGNR: string, TEXT: string, LTEXT: string } | null}
     */
    getMessageClassRow(arbgb, msgnr) {

        try {

            return this.messageStmt.get(
                String(arbgb).trim(),
                String(msgnr).trim().padStart(3, '0')
            ) || null;

        } catch (error) {
            console.error('[MessageDatabase] getMessageClassRow error:', error);
            return null;
        }

    }

    /**
     * DB 연결을 명시적으로 닫습니다.
     */
    close() {
        this.db?.close();
    }

}

module.exports = MessageDatabase;
