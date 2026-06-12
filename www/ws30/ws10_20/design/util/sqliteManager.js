/**
 * SQLite 공통 처리 클래스
 *
 * 특징:
 * - better-sqlite3 npm 사용
 * - 동기 방식 처리
 * - Promise / async / await 사용하지 않음
 * - constructor에서 DB 연결 즉시 수행
 * - 특정 테이블에 종속되지 않는 공통 모듈
 * - createTable 시 primaryKey / unique 정보를 내부 등록
 * - upsertData 시 conflictColumns, updateColumns 자동 결정
 * - Object / Array<Object> 기반 insert, upsert 지원
 * - 다건 insert / upsert 시 chunk 단위 multi-row SQL 실행
 */
export default class SqliteManager {

    /**
     * @param {string} dbPath SQLite DB 파일 경로
     */
    constructor(dbPath) {

        if (!dbPath || typeof dbPath !== "string") {
            throw new Error("DB 파일 경로가 올바르지 않습니다.");
        }

        this.dbPath = dbPath;

        /**
         * 테이블별 스키마 정보 저장소
         */
        this.tableSchemas = {};

        /**
         * Electron renderer 환경 기준
         */
        const Database = parent.require("better-sqlite3");

        /**
         * better-sqlite3는 생성 시점에 DB 연결이 동기적으로 수행된다.
         * 연결 실패 시 constructor에서 바로 throw 된다.
         */
        this.db = new Database(this.dbPath);

    }

    /**
     * 바인딩 파라미터 정규화
     *
     * @param {Array|Object} params 바인딩 파라미터
     * @returns {Array}
     */
    normalizeParams(params = []) {

        if (Array.isArray(params)) {
            return params;
        }

        if (params && typeof params === "object") {
            return [params];
        }

        return [];

    }

    /**
     * INSERT, UPDATE, DELETE, CREATE, ALTER, DROP 실행
     *
     * @param {string} sql 실행 SQL
     * @param {Array|Object} params 바인딩 파라미터
     * @returns {{lastID: number|string|bigint, changes: number}}
     */
    run(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("실행할 SQL이 올바르지 않습니다.");
        }

        const stmt = this.db.prepare(sql);
        const bindParams = this.normalizeParams(params);
        const info = stmt.run(...bindParams);

        return {
            lastID: info.lastInsertRowid,
            changes: info.changes
        };

    }

    /**
     * 단건 SELECT 실행
     *
     * @param {string} sql SELECT SQL
     * @param {Array|Object} params 바인딩 파라미터
     * @returns {Object|undefined}
     */
    get(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("조회 SQL이 올바르지 않습니다.");
        }

        const stmt = this.db.prepare(sql);
        const bindParams = this.normalizeParams(params);

        return stmt.get(...bindParams);

    }

    /**
     * 다건 SELECT 실행
     *
     * @param {string} sql SELECT SQL
     * @param {Array|Object} params 바인딩 파라미터
     * @returns {Array}
     */
    all(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("조회 SQL이 올바르지 않습니다.");
        }

        const stmt = this.db.prepare(sql);
        const bindParams = this.normalizeParams(params);

        return stmt.all(...bindParams);

    }

    /**
     * 테이블명, 컬럼명 검증
     */
    validateIdentifier(name) {

        if (!name || typeof name !== "string") {
            throw new Error("식별자명이 올바르지 않습니다.");
        }

        const regex = /^[A-Za-z_][A-Za-z0-9_]*$/;

        if (!regex.test(name)) {
            throw new Error(`허용되지 않는 식별자명입니다: ${name}`);
        }

    }

    /**
     * 여러 식별자 검증
     */
    validateIdentifiers(names = []) {

        if (!Array.isArray(names)) {
            throw new Error("식별자 목록은 Array 형식이어야 합니다.");
        }

        for (const name of names) {
            this.validateIdentifier(name);
        }

    }

    /**
     * 테이블 스키마 정보 등록
     */
    registerTableSchema(options = {}) {

        const {
            tableName,
            primaryKey = [],
            unique = []
        } = options;

        this.validateIdentifier(tableName);

        if (Array.isArray(primaryKey) && primaryKey.length > 0) {
            this.validateIdentifiers(primaryKey);
        }

        if (Array.isArray(unique) && unique.length > 0) {

            for (const uniqueColumns of unique) {

                if (!Array.isArray(uniqueColumns)) {
                    throw new Error("unique 정보는 string array의 array 형식이어야 합니다.");
                }

                this.validateIdentifiers(uniqueColumns);

            }

        }

        this.tableSchemas[tableName] = {
            tableName,
            primaryKey,
            unique
        };

    }

    /**
     * UPSERT 충돌 기준 컬럼 결정
     */
    resolveConflictColumns(tableName, conflictColumns = []) {

        this.validateIdentifier(tableName);

        if (Array.isArray(conflictColumns) && conflictColumns.length > 0) {
            this.validateIdentifiers(conflictColumns);
            return conflictColumns;
        }

        const schema = this.tableSchemas[tableName];

        if (!schema) {
            throw new Error(
                `UPSERT 기준 컬럼을 찾을 수 없습니다. createTable 또는 registerTableSchema로 테이블 key 정보를 먼저 등록하세요: ${tableName}`
            );
        }

        if (Array.isArray(schema.primaryKey) && schema.primaryKey.length > 0) {
            return schema.primaryKey;
        }

        if (
            Array.isArray(schema.unique) &&
            schema.unique.length > 0 &&
            Array.isArray(schema.unique[0]) &&
            schema.unique[0].length > 0
        ) {
            return schema.unique[0];
        }

        throw new Error(`UPSERT에 사용할 primaryKey 또는 unique 정보가 없습니다: ${tableName}`);

    }

    /**
     * UPSERT 갱신 대상 컬럼 결정
     */
    resolveUpdateColumns(columns, conflictColumns, updateColumns = []) {

        if (Array.isArray(updateColumns) && updateColumns.length > 0) {
            this.validateIdentifiers(updateColumns);
            return updateColumns;
        }

        return columns.filter((column) => {
            return !conflictColumns.includes(column);
        });

    }

    /**
     * 저장 데이터 정규화
     */
    normalizeRows(data) {

        if (!data) {
            throw new Error("저장할 데이터가 없습니다.");
        }

        const rows = Array.isArray(data) ? data : [data];

        if (rows.length === 0) {
            throw new Error("저장할 데이터가 없습니다.");
        }

        for (const row of rows) {

            if (!row || typeof row !== "object" || Array.isArray(row)) {
                throw new Error("저장 데이터는 Object 또는 Object Array 형식이어야 합니다.");
            }

            if (Object.keys(row).length === 0) {
                throw new Error("비어 있는 Object는 저장할 수 없습니다.");
            }

        }

        return rows;

    }

    /**
     * Array 데이터를 chunk 단위로 분할
     */
    chunkArray(array, size) {

        if (!Array.isArray(array)) {
            throw new Error("chunk 대상은 Array여야 합니다.");
        }

        if (!Number.isInteger(size) || size <= 0) {
            throw new Error("chunkSize는 1 이상의 정수여야 합니다.");
        }

        const chunks = [];

        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }

        return chunks;

    }

    /**
     * 모든 row의 컬럼 구성이 동일한지 확인
     */
    validateSameColumns(rows) {

        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("검증할 row 데이터가 없습니다.");
        }

        const baseColumns = Object.keys(rows[0]);

        if (baseColumns.length === 0) {
            throw new Error("기준 row의 컬럼 정보가 없습니다.");
        }

        this.validateIdentifiers(baseColumns);

        const baseKey = baseColumns.join("|");

        for (const row of rows) {

            const columns = Object.keys(row);
            const key = columns.join("|");

            this.validateIdentifiers(columns);

            if (key !== baseKey) {
                throw new Error("Array 데이터의 컬럼 구성이 서로 다릅니다. 동일한 컬럼 구조로 전달해야 합니다.");
            }

        }

        return baseColumns;

    }

    /**
     * multi-row INSERT / UPSERT용 VALUES절과 params 구성
     */
    buildMultiRowValues(rows, columns) {

        const oneRowPlaceholders = `(${columns.map(() => "?").join(", ")})`;

        const placeholders = rows
            .map(() => oneRowPlaceholders)
            .join(", ");

        const params = [];

        for (const row of rows) {
            for (const column of columns) {
                params.push(row[column]);
            }
        }

        return {
            placeholders,
            params
        };

    }

    /**
     * WHERE절 구성
     */
    buildWhereClause(where = {}) {

        const keys = Object.keys(where);

        if (keys.length === 0) {
            return {
                clause: "",
                params: []
            };
        }

        const conditions = [];
        const params = [];

        for (const key of keys) {

            this.validateIdentifier(key);

            conditions.push(`${key} = ?`);
            params.push(where[key]);

        }

        return {
            clause: `WHERE ${conditions.join(" AND ")}`,
            params
        };

    }

    /**
     * SET절 구성
     */
    buildSetClause(data = {}) {

        const keys = Object.keys(data);

        if (keys.length === 0) {
            throw new Error("SET절을 구성할 데이터가 없습니다.");
        }

        const sets = [];
        const params = [];

        for (const key of keys) {

            this.validateIdentifier(key);

            sets.push(`${key} = ?`);
            params.push(data[key]);

        }

        return {
            clause: `SET ${sets.join(", ")}`,
            params
        };

    }

    /**
     * CREATE TABLE SQL 생성
     */
    buildCreateTableSql(options = {}) {

        const {
            tableName,
            columns = [],
            primaryKey = [],
            unique = []
        } = options;

        this.validateIdentifier(tableName);

        if (!Array.isArray(columns) || columns.length === 0) {
            throw new Error("테이블 컬럼 정보가 없습니다.");
        }

        const tableDefs = [];

        for (const columnDef of columns) {

            if (!columnDef || typeof columnDef !== "string") {
                throw new Error("컬럼 정의가 올바르지 않습니다.");
            }

            tableDefs.push(columnDef);

        }

        if (Array.isArray(primaryKey) && primaryKey.length > 0) {
            this.validateIdentifiers(primaryKey);
            tableDefs.push(`PRIMARY KEY (${primaryKey.join(", ")})`);
        }

        if (Array.isArray(unique) && unique.length > 0) {

            for (const uniqueColumns of unique) {

                if (!Array.isArray(uniqueColumns) || uniqueColumns.length === 0) {
                    continue;
                }

                this.validateIdentifiers(uniqueColumns);
                tableDefs.push(`UNIQUE (${uniqueColumns.join(", ")})`);

            }

        }

        return `
            CREATE TABLE IF NOT EXISTS ${tableName} (
                ${tableDefs.join(",\n                ")}
            )
        `;

    }

    /**
     * 테이블 생성
     */
    createTable(options = {}) {

        if (options.sql) {

            if (options.tableName) {
                this.registerTableSchema({
                    tableName: options.tableName,
                    primaryKey: options.primaryKey || [],
                    unique: options.unique || []
                });
            }

            return this.run(options.sql, options.params || []);

        }

        const sql = this.buildCreateTableSql(options);

        const result = this.run(sql);

        this.registerTableSchema({
            tableName: options.tableName,
            primaryKey: options.primaryKey || [],
            unique: options.unique || []
        });

        return result;

    }

    /**
     * 테이블 구조 변경
     */
    alterTable(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("ALTER TABLE SQL이 전달되지 않았습니다.");
        }

        return this.run(sql, params);

    }

    /**
     * 컬럼 추가
     */
    addColumn(options = {}) {

        const {
            tableName,
            columnDef
        } = options;

        this.validateIdentifier(tableName);

        if (!columnDef || typeof columnDef !== "string") {
            throw new Error("추가할 컬럼 정의가 없습니다.");
        }

        const sql = `
            ALTER TABLE ${tableName}
            ADD COLUMN ${columnDef}
        `;

        return this.run(sql);

    }

    /**
     * 테이블 삭제
     */
    dropTable(tableName) {

        this.validateIdentifier(tableName);

        delete this.tableSchemas[tableName];

        const sql = `
            DROP TABLE IF EXISTS ${tableName}
        `;

        return this.run(sql);

    }

    /**
     * 데이터 저장
     *
     * 중복 key 발생 시 오류 발생.
     * 중복 시 갱신하려면 upsertData 사용.
     */
    insertData(options = {}) {

        const {
            tableName,
            data,
            chunkSize = 300
        } = options;

        this.validateIdentifier(tableName);

        const rows = this.normalizeRows(data);

        const columns = this.validateSameColumns(rows);

        const chunks = this.chunkArray(rows, chunkSize);

        const results = [];

        for (const chunk of chunks) {

            const { placeholders, params } = this.buildMultiRowValues(chunk, columns);

            const sql = `
                INSERT INTO ${tableName} (
                    ${columns.join(", ")}
                ) VALUES
                    ${placeholders}
            `;

            const result = this.run(sql, params);

            results.push(result);

        }

        return {
            count: rows.length,
            chunks: chunks.length,
            results
        };

    }

    /**
     * 데이터 저장 또는 갱신
     */
    upsertData(options = {}) {

        const {
            tableName,
            data,
            conflictColumns = [],
            updateColumns = [],
            chunkSize = 300
        } = options;

        this.validateIdentifier(tableName);

        const rows = this.normalizeRows(data);

        const columns = this.validateSameColumns(rows);

        const resolvedConflictColumns = this.resolveConflictColumns(
            tableName,
            conflictColumns
        );

        for (const conflictColumn of resolvedConflictColumns) {
            if (!columns.includes(conflictColumn)) {
                throw new Error(`conflictColumns에 지정된 컬럼이 data에 존재하지 않습니다: ${conflictColumn}`);
            }
        }

        const resolvedUpdateColumns = this.resolveUpdateColumns(
            columns,
            resolvedConflictColumns,
            updateColumns
        );

        this.validateIdentifiers(resolvedUpdateColumns);

        if (resolvedUpdateColumns.length === 0) {
            throw new Error("갱신할 컬럼 정보가 없습니다.");
        }

        for (const updateColumn of resolvedUpdateColumns) {
            if (!columns.includes(updateColumn)) {
                throw new Error(`updateColumns에 지정된 컬럼이 data에 존재하지 않습니다: ${updateColumn}`);
            }
        }

        const updateSet = resolvedUpdateColumns
            .map((column) => `${column} = excluded.${column}`)
            .join(", ");

        const chunks = this.chunkArray(rows, chunkSize);

        const results = [];

        for (const chunk of chunks) {

            const { placeholders, params } = this.buildMultiRowValues(chunk, columns);

            const sql = `
                INSERT INTO ${tableName} (
                    ${columns.join(", ")}
                ) VALUES
                    ${placeholders}
                ON CONFLICT(${resolvedConflictColumns.join(", ")})
                DO UPDATE SET
                    ${updateSet}
            `;

            const result = this.run(sql, params);

            results.push(result);

        }

        return {
            count: rows.length,
            chunks: chunks.length,
            results
        };

    }

    /**
     * 데이터 검색
     */
    selectData(options = {}) {

        const {
            tableName,
            columns = ["*"],
            where = {},
            single = false,
            orderBy = ""
        } = options;

        this.validateIdentifier(tableName);

        let selectColumns = "*";

        if (Array.isArray(columns) && columns.length > 0 && columns[0] !== "*") {
            this.validateIdentifiers(columns);
            selectColumns = columns.join(", ");
        }

        const whereResult = this.buildWhereClause(where);

        let orderByClause = "";

        if (orderBy) {
            orderByClause = `ORDER BY ${orderBy}`;
        }

        const sql = `
            SELECT
                ${selectColumns}
            FROM ${tableName}
            ${whereResult.clause}
            ${orderByClause}
        `;

        if (single === true) {
            return this.get(sql, whereResult.params);
        }

        return this.all(sql, whereResult.params);

    }

    /**
     * 데이터 삭제
     */
    deleteData(options = {}) {

        const {
            tableName,
            where
        } = options;

        this.validateIdentifier(tableName);

        if (!where || Object.keys(where).length === 0) {
            throw new Error("삭제 조건이 없습니다. 전체 삭제 방지를 위해 WHERE 조건은 필수입니다.");
        }

        const whereResult = this.buildWhereClause(where);

        const sql = `
            DELETE FROM ${tableName}
            ${whereResult.clause}
        `;

        return this.run(sql, whereResult.params);

    }

    /**
     * 데이터 수정
     */
    updateData(options = {}) {

        const {
            tableName,
            data,
            where
        } = options;

        this.validateIdentifier(tableName);

        if (!data || Object.keys(data).length === 0) {
            throw new Error("수정할 데이터가 없습니다.");
        }

        if (!where || Object.keys(where).length === 0) {
            throw new Error("수정 조건이 없습니다. 전체 업데이트 방지를 위해 WHERE 조건은 필수입니다.");
        }

        const setResult = this.buildSetClause(data);
        const whereResult = this.buildWhereClause(where);

        const sql = `
            UPDATE ${tableName}
            ${setResult.clause}
            ${whereResult.clause}
        `;

        const params = [
            ...setResult.params,
            ...whereResult.params
        ];

        return this.run(sql, params);

    }

    /**
     * SQL 직접 실행
     */
    execute(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("실행할 SQL이 전달되지 않았습니다.");
        }

        return this.run(sql, params);

    }

    /**
     * SQL 직접 조회
     */
    query(sql, params = [], options = {}) {

        if (!sql || typeof sql !== "string") {
            throw new Error("조회 SQL이 전달되지 않았습니다.");
        }

        if (options.single === true) {
            return this.get(sql, params);
        }

        return this.all(sql, params);

    }

    /**
     * Transaction 처리
     *
     * better-sqlite3는 transaction 처리를 동기 함수로 관리할 수 있다.
     */
    transaction(callback) {

        if (typeof callback !== "function") {
            throw new Error("transaction callback이 전달되지 않았습니다.");
        }

        const tx = this.db.transaction(callback);

        return tx();

    }

    /**
     * DB 연결 종료
     */
    close() {

        if (!this.db) {
            return;
        }

        this.db.close();
        this.db = null;

    }

}