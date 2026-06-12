/**
 * SQLite 공통 처리 클래스
 *
 * 특징:
 * - sqlite3 npm 사용
 * - constructor 내부에서 require("sqlite3") 처리
 * - callback 기반 sqlite3 API를 Promise로 감싸 async / await 지원
 * - DB 연결 성공/실패를 호출처에서 await db.ready 로 확인 가능
 * - 특정 테이블에 종속되지 않는 공통 모듈
 * - createTable 시 테이블 스키마 정보(primaryKey, unique)를 내부 등록
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
        this.db = null;

        /**
         * 테이블별 스키마 정보 저장소
         *
         * 예:
         * this.tableSchemas["ZTB_UI_ATTR"] = {
         *     tableName: "ZTB_UI_ATTR",
         *     primaryKey: ["LIBVER", "UNAME", "UIATK"],
         *     unique: []
         * };
         */
        this.tableSchemas = {};

        /**
         * npm module은 constructor 내부에서 require 처리
         */
        const sqlite3 = parent.require("sqlite3").verbose();

        /**
         * DB 연결 결과 Promise
         *
         * 호출처 사용 예:
         * const db = new SqliteManager("./sample.db");
         * await db.ready;
         */
        this.ready = new Promise((resolve, reject) => {

            this.db = new sqlite3.Database(this.dbPath, (err) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    dbPath: this.dbPath,
                    message: "SQLite DB 연결 성공"
                });

            });

        });

    }

    /**
     * DB 연결 완료 대기
     *
     * @returns {Promise<Object>}
     */
    async waitReady() {
        return await this.ready;
    }

    /**
     * INSERT, UPDATE, DELETE, CREATE, ALTER, DROP 실행
     *
     * @param {string} sql 실행 SQL
     * @param {Array} params 바인딩 파라미터
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async run(sql, params = []) {

        await this.waitReady();

        if (!sql || typeof sql !== "string") {
            throw new Error("실행할 SQL이 올바르지 않습니다.");
        }

        return new Promise((resolve, reject) => {

            this.db.run(sql, params, function (err) {

                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });

            });

        });

    }

    /**
     * 단건 SELECT 실행
     *
     * @param {string} sql SELECT SQL
     * @param {Array} params 바인딩 파라미터
     * @returns {Promise<Object|undefined>}
     */
    async get(sql, params = []) {

        await this.waitReady();

        if (!sql || typeof sql !== "string") {
            throw new Error("조회 SQL이 올바르지 않습니다.");
        }

        return new Promise((resolve, reject) => {

            this.db.get(sql, params, (err, row) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(row);

            });

        });

    }

    /**
     * 다건 SELECT 실행
     *
     * @param {string} sql SELECT SQL
     * @param {Array} params 바인딩 파라미터
     * @returns {Promise<Array>}
     */
    async all(sql, params = []) {

        await this.waitReady();

        if (!sql || typeof sql !== "string") {
            throw new Error("조회 SQL이 올바르지 않습니다.");
        }

        return new Promise((resolve, reject) => {

            this.db.all(sql, params, (err, rows) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(rows);

            });

        });

    }

    /**
     * 테이블명, 컬럼명 검증
     *
     * tableName, columnName은 parameter binding이 불가능하므로
     * 영문, 숫자, underscore만 허용한다.
     *
     * @param {string} name 식별자명
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
     *
     * @param {string[]} names 식별자 목록
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
     *
     * createTable을 통해 생성하지 않은 테이블이거나,
     * 이미 존재하는 테이블의 key 정보를 수동으로 등록할 때 사용한다.
     *
     * 사용 예:
     * db.registerTableSchema({
     *     tableName: "ZTB_UI_ATTR",
     *     primaryKey: ["LIBVER", "UNAME", "UIATK"]
     * });
     *
     * @param {Object} options
     * @param {string} options.tableName 테이블명
     * @param {string[]} [options.primaryKey=[]] Primary Key 컬럼
     * @param {string[][]} [options.unique=[]] Unique 컬럼 조합
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
     *
     * 우선순위:
     * 1. 호출처에서 conflictColumns를 직접 전달한 경우
     * 2. createTable 또는 registerTableSchema로 등록된 primaryKey
     * 3. 등록된 unique 중 첫 번째 unique 조합
     *
     * @param {string} tableName 테이블명
     * @param {string[]} conflictColumns 호출처 전달 conflictColumns
     * @returns {string[]}
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
     *
     * 우선순위:
     * 1. 호출처에서 updateColumns를 직접 전달한 경우
     * 2. data 컬럼 중 conflictColumns를 제외한 나머지 컬럼 자동 사용
     *
     * @param {string[]} columns data 컬럼 목록
     * @param {string[]} conflictColumns 충돌 기준 컬럼
     * @param {string[]} updateColumns 호출처 전달 updateColumns
     * @returns {string[]}
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
     *
     * Object 또는 Object Array를 받아 항상 Array로 반환한다.
     *
     * @param {Object|Object[]} data 저장 데이터
     * @returns {Object[]}
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
     * Array 데이터를 chunk 단위로 분할한다.
     *
     * @param {Array} array 원본 배열
     * @param {number} size chunk 크기
     * @returns {Array[]}
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
     * 모든 row의 컬럼 구성이 동일한지 확인한다.
     *
     * @param {Object[]} rows 저장 row 목록
     * @returns {string[]} 기준 컬럼 목록
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
     * multi-row INSERT / UPSERT용 VALUES절과 params를 구성한다.
     *
     * @param {Object[]} rows 저장 row 목록
     * @param {string[]} columns 컬럼 목록
     * @returns {{placeholders: string, params: Array}}
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
     *
     * @param {Object} where WHERE 조건 객체
     * @returns {{clause: string, params: Array}}
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
     *
     * @param {Object} data 수정 데이터
     * @returns {{clause: string, params: Array}}
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
     *
     * @param {Object} options 생성 옵션
     * @returns {string}
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
     *
     * 방식 1. 테이블명 + 컬럼정보 기반 생성
     *
     * await db.createTable({
     *     tableName: "ZTB_UI_ATTR",
     *     columns: [
     *         "LIBVER TEXT NOT NULL",
     *         "UNAME TEXT NOT NULL",
     *         "UIATK TEXT NOT NULL",
     *         "UIOBK TEXT NOT NULL",
     *         "UIATV TEXT"
     *     ],
     *     primaryKey: ["LIBVER", "UNAME", "UIATK"]
     * });
     *
     * 방식 2. SQL 직접 전달
     *
     * await db.createTable({
     *     tableName: "ZTB_UI_ATTR",
     *     primaryKey: ["LIBVER", "UNAME", "UIATK"],
     *     sql: "CREATE TABLE IF NOT EXISTS ..."
     * });
     *
     * @param {Object} options 생성 옵션
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async createTable(options = {}) {

        if (options.sql) {

            if (options.tableName) {
                this.registerTableSchema({
                    tableName: options.tableName,
                    primaryKey: options.primaryKey || [],
                    unique: options.unique || []
                });
            }

            return await this.run(options.sql, options.params || []);

        }

        const sql = this.buildCreateTableSql(options);

        const result = await this.run(sql);

        this.registerTableSchema({
            tableName: options.tableName,
            primaryKey: options.primaryKey || [],
            unique: options.unique || []
        });

        return result;

    }

    /**
     * 테이블 구조 변경
     *
     * @param {string} sql ALTER TABLE SQL
     * @param {Array} params 바인딩 파라미터
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async alterTable(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("ALTER TABLE SQL이 전달되지 않았습니다.");
        }

        return await this.run(sql, params);

    }

    /**
     * 컬럼 추가
     *
     * @param {Object} options 옵션
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async addColumn(options = {}) {

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

        return await this.run(sql);

    }

    /**
     * 테이블 삭제
     *
     * @param {string} tableName 테이블명
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async dropTable(tableName) {

        this.validateIdentifier(tableName);

        delete this.tableSchemas[tableName];

        const sql = `
            DROP TABLE IF EXISTS ${tableName}
        `;

        return await this.run(sql);

    }

    /**
     * 데이터 저장
     *
     * Object 또는 Object Array를 저장한다.
     * Array인 경우 chunkSize 단위로 나누어 multi-row INSERT를 실행한다.
     *
     * 중복 key 발생 시 오류가 발생한다.
     * 중복 시 갱신하려면 upsertData를 사용한다.
     *
     * @param {Object} options 옵션
     * @param {string} options.tableName 테이블명
     * @param {Object|Object[]} options.data 저장 데이터
     * @param {number} [options.chunkSize=300] chunk 크기
     * @returns {Promise<{count: number, chunks: number, results: Array}>}
     */
    async insertData(options = {}) {

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

            const result = await this.run(sql, params);

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
     *
     * Object 또는 Object Array를 저장/갱신한다.
     * Array인 경우 chunkSize 단위로 나누어 multi-row UPSERT를 실행한다.
     *
     * conflictColumns 생략 시:
     * - createTable 또는 registerTableSchema에 등록된 primaryKey를 자동 사용한다.
     * - primaryKey가 없으면 unique 첫 번째 조합을 사용한다.
     *
     * updateColumns 생략 시:
     * - data 컬럼 중 conflictColumns를 제외한 나머지 컬럼을 자동 update 대상으로 사용한다.
     *
     * 사용 예:
     * await db.upsertData({
     *     tableName: "ZTB_UI_ATTR",
     *     data: rows,
     *     chunkSize: 300
     * });
     *
     * @param {Object} options 옵션
     * @param {string} options.tableName 테이블명
     * @param {Object|Object[]} options.data 저장 데이터
     * @param {string[]} [options.conflictColumns=[]] 충돌 기준 컬럼
     * @param {string[]} [options.updateColumns=[]] 충돌 시 갱신할 컬럼
     * @param {number} [options.chunkSize=300] chunk 크기
     * @returns {Promise<{count: number, chunks: number, results: Array}>}
     */
    async upsertData(options = {}) {

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

            const result = await this.run(sql, params);

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
     *
     * @param {Object} options 옵션
     * @returns {Promise<Object|Array>}
     */
    async selectData(options = {}) {

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
            /**
             * orderBy는 SQL 조각이므로 호출처에서 검증된 값만 전달해야 한다.
             */
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
            return await this.get(sql, whereResult.params);
        }

        return await this.all(sql, whereResult.params);

    }

    /**
     * 데이터 삭제
     *
     * where가 비어 있으면 전체 삭제 방지를 위해 오류 발생
     *
     * @param {Object} options 옵션
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async deleteData(options = {}) {

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

        return await this.run(sql, whereResult.params);

    }

    /**
     * 데이터 수정
     *
     * @param {Object} options 옵션
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async updateData(options = {}) {

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

        return await this.run(sql, params);

    }

    /**
     * SQL 직접 실행
     *
     * CREATE INDEX, DROP INDEX, PRAGMA 등 공통 메소드로 커버하지 못하는 SQL 실행용
     *
     * @param {string} sql 실행 SQL
     * @param {Array} params 바인딩 파라미터
     * @returns {Promise<{lastID: number, changes: number}>}
     */
    async execute(sql, params = []) {

        if (!sql || typeof sql !== "string") {
            throw new Error("실행할 SQL이 전달되지 않았습니다.");
        }

        return await this.run(sql, params);

    }

    /**
     * SQL 직접 조회
     *
     * @param {string} sql 조회 SQL
     * @param {Array} params 바인딩 파라미터
     * @param {Object} options 조회 옵션
     * @returns {Promise<Object|Array>}
     */
    async query(sql, params = [], options = {}) {

        if (!sql || typeof sql !== "string") {
            throw new Error("조회 SQL이 전달되지 않았습니다.");
        }

        if (options.single === true) {
            return await this.get(sql, params);
        }

        return await this.all(sql, params);

    }

    /**
     * Transaction 처리
     *
     * 사용 예:
     * await db.transaction(async () => {
     *     await db.insertData(...);
     *     await db.updateData(...);
     * });
     *
     * @param {Function} callback Transaction 내부에서 수행할 async callback
     * @returns {Promise<*>}
     */
    async transaction(callback) {

        if (typeof callback !== "function") {
            throw new Error("transaction callback이 전달되지 않았습니다.");
        }

        await this.run("BEGIN TRANSACTION");

        try {

            const result = await callback();

            await this.run("COMMIT");

            return result;

        } catch (err) {

            await this.run("ROLLBACK");

            throw err;

        }

    }

    /**
     * DB 연결 종료
     *
     * @returns {Promise<void>}
     */
    async close() {

        return new Promise((resolve, reject) => {

            if (!this.db) {
                resolve();
                return;
            }

            this.db.close((err) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve();

            });

        });

    }

}