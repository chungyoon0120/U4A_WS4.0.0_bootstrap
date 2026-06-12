# 1. DB 생성시
```js
_sqlite.createTable({
    tableName: "테이블명",
    columns: [
        "컬럼 정보",
    ],
    primaryKey: ["KEY 필드명"]
});
```

## 예시
```js
_sqlite.createTable({
    tableName: "UI_ATTR_PRESET",
    columns: [
        "LIBVER TEXT NOT NULL",
        "UNAME TEXT NOT NULL",
        "UIATK TEXT NOT NULL",
        "UIOBK TEXT NOT NULL",
        "UIATV TEXT",
        "UIATY TEXT"
    ],
    primaryKey: ["LIBVER", "UNAME", "UIATK"]
});
```


# 2. DB 데이터 저장
```js
_sqlite.upsertData({
    tableName: "테이블명",
    data: 저장 정보(OBJECT, ARRAY)
});
```

## 예시

- 단일건 저장.
```js
_sqlite.upsertData({
    tableName: "UI_ATTR_PRESET",
    data: {
        LIBVER : oAPP.attr.metadata.METADATA.LIBVER,
        UNAME  : oAPP.attr.metadata.USERINFO.UNAME,
        UIATK  : sAttr.UIATK,
        UIOBK  : sAttr.UIOBK,
        UIATV  : sAttr.UIATV,
        UIATY  : sAttr.UIATY,
    }
});
```

- N건 저장
```js
_sqlite.upsertData({
    tableName: "UI_ATTR_PRESET",
    data: [{
        LIBVER : oAPP.attr.metadata.METADATA.LIBVER,
        UNAME  : oAPP.attr.metadata.USERINFO.UNAME,
        UIATK  : sAttr.UIATK,
        UIOBK  : sAttr.UIOBK,
        UIATV  : sAttr.UIATV,
        UIATY  : sAttr.UIATY,
    },
    {
        LIBVER : oAPP.attr.metadata.METADATA.LIBVER,
        UNAME  : oAPP.attr.metadata.USERINFO.UNAME,
        UIATK  : sAttr.UIATK,
        UIOBK  : sAttr.UIOBK,
        UIATV  : sAttr.UIATV,
        UIATY  : sAttr.UIATY,
    }]
});
```


# 3. DB 데이터 검색
```js
_presetlist = _sqlite.selectData({
    tableName: "테이블명",
    where : 조건 정보
});
```

## 예시

```js
_presetlist = _sqlite.selectData({
    tableName: "UI_ATTR_PRESET",
    where : {
        LIBVER : "1.120.21",
        SYSID  : "UHA",
        UNAME  : "PES",
    }            
});
```


# 4. DB 데이터 삭제
```js
_sqlite.execute(
    `DELETE FROM 테이블명
        WHERE 조건 정보
    [
        조건 값
    ]
);
```

## 예시
```js
_sqlite.execute(
    `DELETE FROM UI_ATTR_PRESET
        WHERE LIBVER = ?
        AND SYSID  = ?
        AND UNAME  = ?
        AND UIATK IN (?, ?, ?)`,
    [
        "1.120.21",
        "UHA",
        "PES",
        ["TEST01", "TEST022", "TEST03"]
    ]
);
```


# 테이블 필드 정보 업데이트시

- 현재 버전 정보 얻기.
```js
_oVersion = _sqlite.query("PRAGMA user_version", [], {
    single: true
});
```

- user_version이 DB의 버전정보( 없으면 0번 버전으로 구성)
```js
let _iVersion = _oVersion?.user_version || 0;

- 최초 생성된 경우라면 0 이기에 1번 버전으로 업데이트.

if(_iVersion < 1){

    _sqlite.execute("PRAGMA user_version = 1");

    _iVersion = 1;

}
```

- 필드 정보를 업데이트 해야하는경우
(2 번 버전에서 UIASN 필드를 추가.)
```js
if(_iVersion < 2){

    _sqlite.addColumn({
        tableName: "UI_ATTR_PRESET",
        columnDef: "UIASN TEXT DEFAULT ''"
    });

    _sqlite.execute("PRAGMA user_version = 2");

    _iVersion = 2;

}
```
