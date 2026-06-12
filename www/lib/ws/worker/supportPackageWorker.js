const FS = require("fs");
// const ASAR  = require("asar");
const ASAR = require("@electron/asar");
const spawn = require("child_process").spawn;
const PATH = require("path");
const ADMZIP = require("adm-zip");

const FS_EXTRA = require("fs-extra");

// 공통 응답 구조
const TY_RES = {
    PRCCD: "",      // 수행중인 프로세스 코드
    RETCD: "",      // 수행 결과에 대한 코드    
    ACTCD: "",      // 수행중인 행위에 대한 코드    
    STCOD: "",      // 수행 결과에 대한 상태 코드
    MSGNR: "",      // 메시지 번호
    RTMSG: "",      // 수행 결과에 대한 메시지 (화면 출력용 X)
    PARAM: "",      // 수행 결과에 대한 데이터 
};


/**
 * @description
 * 패치 업데이트 시, 이벤트 종류
 * 
 * @events
 * update-available-SP      업데이트 항목 존재
 * download-progress-SP     다운로드 중..
 * update-install-SP        다운로드 이후에 asar 압축 및 인스톨할 때
 * update-downloaded-SP     다운로드 완료시
 * update-error-SP          오류 발생시
 * update-error-console-SP  다운로드 중 콘솔오류 대상
 */


// 프로세스 Enum
const PRC = {
    DOWN_LOADING: "download-progress-SP",  // 다운로드 중
    DOWN_FINISH: "update-downloaded-SP",  // 다운로드 완료
    UPDATE_INSTALL: "update-install-SP",     // 다운로드 이후에 asar 압축 및 인스톨할 때
    UPDATE_ERROR: "update-error-SP",       // 다운로드 오류
    UPDATE_ERROR_CONSOLE: "update-error-console-SP" // 다운로드 중 콘솔오류 대상

};



/**
 * Worker onmessage 
 */
self.onmessage = async function (e) {

    // 공통 응답 구조
    var oRES = JSON.parse(JSON.stringify(TY_RES));

    // 필수 파라미터 누락!!
    var oIF_DATA = e?.data || undefined;

    if (!oIF_DATA) {

        oRES.PRCCD = PRC.UPDATE_ERROR;
        oRES.STCOD = "onmessage-E001";
        oRES.RTMSG = "필수 파라미터 누락!!";
        oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

        self.postMessage(oRES);

        return;
    }

    // 프로세스 코드가 없다면 오류!!
    if (!oIF_DATA?.PRCCD) {

        oRES.PRCCD = PRC.UPDATE_ERROR;
        oRES.STCOD = "onmessage-E002";
        oRES.RTMSG = "필수 파라미터 누락!!";
        oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

        self.postMessage(oRES);

        return;
    }


    try {

        let oPARAM = oIF_DATA.PARAM;

        self[oIF_DATA.PRCCD](oPARAM);

    } catch (error) {

        oRES.PRCCD = PRC.UPDATE_ERROR;
        oRES.STCOD = "onmessage-E003";
        oRES.RTMSG = "잘못된 PRCCD";
        oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

        // Error Log
        var sErrLog = error && error?.toString() || "";
        sErrLog += error && error?.stack || "";

        oRES.PARAM = {
            LOG: sErrLog
        }

        self.postMessage(oRES);

        return;

    }

};


/************************************************************************
 * @function - PowerShell로 SP 파일 다운로드
 ************************************************************************/
function _getSuppPackDataFromPowerShell(oPARAM) {

    return new Promise(function (resolve) {

        // 설치 파일 정보
        let oFileInfo = oPARAM.FILE_INFO;

        oFileInfo.TRANSFERRED = 0;

        var oRES = JSON.parse(JSON.stringify(TY_RES));

        oRES.PRCCD = PRC.DOWN_LOADING; // 다운로드 중
        oRES.PARAM = {
            FILE_INFO: oFileInfo
        };

        self.postMessage(oRES);

        /**
         * @since   2026-02-09 15:27:05
         * @version v3.5.9-3
         * @author  soccerhs
         * @description
         * 
         * 패치 업그레이드 방식 변경
         * - 기존: powershell
         * - 변경: executor node.exe
         */

        // let aParams = [
        //     "-ExecutionPolicy", "Bypass",
        //     "-File", oPARAM.PS_SP_PATH,
        //     "-BaseUrl", oPARAM.BASE_URL,
        //     "-sapClient", oPARAM.SAP_CLIENT,
        //     "-sapUser", oPARAM.SAP_USER,
        //     "-sapPassword", oPARAM.SAP_PW,
        //     "-spPath", oPARAM.SP_DOWN_PATH,
        //     "-ndPath", oPARAM.ND_DOWN_PATH,
        //     "-JsonInput", JSON.stringify(oPARAM.FILE_INFO),
        //     "-logPath", oPARAM.LOG_FLD_PATH
        // ];

        // /**
        //  * @since   2025-12-10 18:01:22
        //  * @version v3.5.6-17
        //  * @author  soccerhs
        //  * @description
        //  * 
        //  * 파워쉘로 패치 업데이트용 쉘 실행 시 https 인증서 오류 회피 파라미터 추가
        //  * 
        //  */
        // if(oPARAM.SKIP_CERT === true){
        //     aParams.push("-SkipCertificateCheck");
        // }

        // PowerShell 프로세스 생성
        // const ps = spawn("powershell.exe" ,aParams);

        /**
         * SUPPORT PATCH 실행 파라미터 구성
         */
        let aParams = [
            `--PRCCD=UPGRADE`,                                  // 프로세스 코드 (UPGRADE)
            `--ACTCD=ws_support_patch_02`,                      // 액션 코드 (ws_support_patch_02)
            `--SAP_USER=${oPARAM.SAP_USER}`,                    // SAP 접속 계정
            `--SAP_PW=${oPARAM.SAP_PW}`,                        // SAP 접속 비밀번호
            `--SAP_CLIENT=${oPARAM.SAP_CLIENT}`,                // SAP 클라이언트
            `--BASE_URL=${oPARAM.BASE_URL}`,                    // (프로토콜 + 호스트 + 포트) 
            `--SP_DOWN_PATH=${oPARAM.SP_DOWN_PATH}`,            // 서포트 패치 다운로드 경로 파일명 포함 (app.zip)
            `--LOG_FLD_PATH=${oPARAM.LOG_FLD_PATH}`,            // [폴더] 로그 저장 폴더 경로
            `--FILE_INFO=${JSON.stringify(oPARAM.FILE_INFO)}`   // 해더 메타 (JSON String)
        ];

        const ps = spawn(oPARAM.EXE_NODE_PATH, aParams);

        // 실행 결과 출력
        ps.stdout.on("data", (data) => {

            // 분할 다운로드 수행 횟수에 상관없이 공백이 날라오는 경우가 있음.
            // 테스트 결과 공백일 경우는 리턴해도 수행 해야할 총 횟수에는 영향이 없음.
            if (!data?.toString()?.trim()) {
                return;
            }

            let sData = data?.toString();

            let sLog = `[Node Executer] Patch 업데이트 파일 다운로드 중..: ${sData}`;

            /**
             * @since   2025-11-05
             * @version v3.5.6-16
             * @author  soccerhs
             * 
             * @description
             *  [기존] 
             *      - powershell에서 패치 파일 다운로드 진행 중,
             *        Write-Host 출력(stdout)을 다운로드 성공 신호로 인식하여 퍼센트 계산함
             *  [변경]
             *      - stdout 로그 중 단순 로그 용으로 Write-Host를 사용하는 경우가 있어서,
             *        특정 키워드(CHUNK_DOWN_OK) 포함 시에만 다운로드 성공으로 간주하도록 수정함
             */
            if (sData.includes("CHUNK_DOWN_OK") === true) {

                // 다운로드 수행 횟수 증가
                oFileInfo.TRANSFERRED++;

            }

            var oRES = JSON.parse(JSON.stringify(TY_RES));

            oRES.PRCCD = PRC.DOWN_LOADING; // 다운로드 중
            oRES.PARAM = {
                FILE_INFO: oFileInfo,
                LOG: sLog
            };

            self.postMessage(oRES);

        });

        // 에러 메시지 출력
        ps.stderr.on("data", (data) => {

            let sLog = `Patch 업데이트 다운로드 중 에러: ${data.toString()}`;

            // console.error(sLog);            
            // console.trace();

            // if (!ps.killed) {              
            //     ps.kill();
            //     console.log("kill-1");
            // }

            // return resolve({ SUBRC: 999, LOG: sLog });

            /**
             * @since   2025-11-05
             * @version v3.5.6-16
             * @author  soccerhs
             * 
             * @description
             * - powershell 에서 발생되는 오류 메시지를 받으면 child_process를 중지 시키지 않고 
             *   콘솔 오류만 발생시키는 로직으로 수정함             
             */
            var oRES = JSON.parse(JSON.stringify(TY_RES));

            oRES.PRCCD = PRC.UPDATE_ERROR_CONSOLE; // 다운로드 중 콘솔오류 대상
            oRES.PARAM = {
                LOG: sLog
            };

            self.postMessage(oRES);

        });

        // 실행 완료 이벤트 처리
        ps.on("close", (code) => {

            if (!ps.killed) {
                ps.kill();
            }

            return resolve({ SUBRC: code });

        });

    });

} // end of _getSuppPackDataFromPowerShell


/************************************************************************
 * @function - Waiting
 ************************************************************************/
function _fnWaiting(iTime = 1000) {

    return new Promise(function (resolve) {

        setTimeout(function () {

            resolve();

        }, iTime);

    });

} // end of _fnWaiting

/************************************************************************
 * @function - 압축 해제
 ************************************************************************/
function _zipExtractAsync(sSourcePath, sTargetPath, pOverwrite) {

    return new Promise(function (resolve) {

        try {
            var zip = new ADMZIP(sSourcePath);

            zip.extractAllToAsync(sTargetPath, pOverwrite, (err) => {

                if (err) {
                    resolve({ RETCD: "E" });
                    return;
                }

                resolve({ RETCD: "S" });

            });

        } catch (error) {
            return resolve({ RETCD: "E" });
        }

    });

} // end of _zipExtractAsync

/**
 * @since   2026-05-23 00:15:17
 * @version v3.6.4-0
 * @author  soccerhs
 * @description
 * 
 *  패치 zip 내 extraResources 파일을 resources 폴더로 이동(move) 처리하던 로직에서
 *  원본 파일이 삭제되는 버그 발생 → move 에서 copy 로 변경하여 원본 유지
 * 
 */

/********************************************************************************
 * @function _moveExtRes
 * @description aExtRes 목록을 기준으로 sRootRes → sTargetRes 로 파일/디렉토리를 복사한다.
 *              원본은 삭제하지 않는다.
 *
 * @param {string} sRootRes              - 복사 원본 루트 경로
 * @param {string} sTargetRes            - 복사 대상 루트 경로
 * @param {Array<string|Object>} aExtRes - 복사할 리소스 목록
 *   - {string}   vRes          : 원본/대상 동일 경로
 *   - {string}   vRes.from     : 원본 상대 경로
 *   - {string}   vRes.to       : 대상 상대 경로
 *   - {string[]} vRes.filter   : 복사할 파일 패턴 목록 (생략 시 전체 복사)
 * @returns {Promise<void>}
 ********************************************************************************/
async function _moveExtRes(sRootRes, sTargetRes, aExtRes) {

    const sAppRoot = PATH.join(sRootRes);

    for (const vRes of aExtRes) {

        const bIsObj = typeof vRes === "object";

        // 문자열형이면 from/to 동일, 객체형이면 각각 분리
        const sRelFrom = (bIsObj ? vRes.from : vRes).replace(/^\.?[\\/]/, "");
        const sRelTo   = (bIsObj ? vRes.to   : vRes).replace(/^\.?[\\/]/, "");

        const sSrcPath = PATH.join(sAppRoot,   sRelFrom);
        const sDstPath = PATH.join(sTargetRes, sRelTo);

        // 원본 경로가 존재하지 않으면 skip
        if (!FS.existsSync(sSrcPath)) {
            continue;
        }

        const oCopyOpt = { overwrite: true };

        // filter 패턴이 정의된 경우 일치하는 파일만 복사
        if (bIsObj && vRes.filter) {

            oCopyOpt.filter = (sPath) => {

                const sRelPath = PATH.relative(sSrcPath, sPath).replace(/\\/g, "/");

                // "**/*" 이면 전체 허용, 그 외 패턴 문자열 포함 여부로 판단
                return vRes.filter.some(sPattern =>
                    sPattern === "**/*" ||
                    sRelPath.includes(sPattern.replace(/\*\*/g, "").replace(/\*/g, ""))
                );

            };

        }

        await FS_EXTRA.copy(sSrcPath, sDstPath, oCopyOpt);

    }

} // end of _moveExtRes

/**
 * @since 2025-02-27
 * @description
 * U4A Workspace CDN Update는 추후 다시 결정..
 * 
 * 
 *  
 */
function _updateSuppPackFromCDN(oPARAM) {







} // end of _getSuppPackDataFromCDN


/**
 * @since   2025-11-10 12:26:07
 * @version v3.5.6-16
 * @author  soccerhs
 * @description
 * 
 * - 폴더 또는 파일 강제 삭제
 * - 폴더 경로를 지정 시, 하위 전체까지 삭제됨.
 */
async function _removeFolderAndFile(sPath) {

    if (!sPath) {
        return;
    }

    if (FS.existsSync(sPath) === false) {
        return;
    }

    try {
        FS.rmSync(sPath, { recursive: true, force: true });
    } catch (error) {

    }

} // end of _removeFolderAndFile

/**
 * 지정한 디렉토리의 1레벨 하위 파일 중 확장자가 "wsx"인 파일을 모두 삭제
 * @param {string} dirPath - 대상 디렉토리 경로
 */
function deleteWsxFiles(dirPath) {
    try {
        // 디렉토리 내 파일/폴더 목록 조회
        const entries = FS.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile()) {
                const ext = PATH.extname(entry.name).toLowerCase();
                if (ext === ".wsx") {
                    const fullPath = PATH.join(dirPath, entry.name);

                    try {
                        FS.unlinkSync(fullPath);
                        console.log(`🗑️ Deleted: ${fullPath}`);
                    } catch (err) {
                        console.error(`❌ Failed to delete: ${fullPath}`, err.message);
                    }
                }
            }
        }

        console.log("✅ WSX file cleanup complete.");
    } catch (err) {
        console.error("❌ Error reading directory:", err.message);
    }
}

/**
 * WS Patch Update
 */
self.WS_PATCH_UPDATE = async function (oPARAM) {

    try {

        // 공통 응답 구조
        var oRES = JSON.parse(JSON.stringify(TY_RES));

        // 리소스 경로
        var sResourcePath = oPARAM.RESOURCE_PATH;

        // 기존 asar 파일을 압축을 해제할 임시 폴더 경로
        var LV_APP_PATH = PATH.join(sResourcePath, "app");

        // 기존 asar 파일을 압축 해제할 임시 폴더 생성
        FS.mkdirSync(LV_APP_PATH, { recursive: true });

        // 기존 asar 파일 경로
        var LV_ASAR_PATH = PATH.join(sResourcePath, "app.asar");

        // 기존 asar 파일이 있는지 체크
        if (FS.existsSync(LV_ASAR_PATH) === false) {

            oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
            oRES.STCOD = `WS_PATCH_UPDATE-E001`; // app.asar 파일 없음!!
            oRES.MSGNR = "M22";  // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

            self.postMessage(oRES);

            return;
        }


        // // --------------------------------------------
        // // 업데이트 방식에 따른 분기처리
        // // --------------------------------------------

        //     let bIsCdn = oPARAM.ISCDN;
        //     if(bIsCdn === true){

        //         // CDN 방식 업데이트
        //         _updateSuppPackFromCDN(oPARAM);

        //         return;
        //     }



        // --------------------------------------------
        // ☝️step1. Patch 파일을 쉘로 다운 받는다.
        // --------------------------------------------

        let oShellResult = await _getSuppPackDataFromPowerShell(oPARAM);
        if (oShellResult.SUBRC !== 0) {

            oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
            oRES.STCOD = `WS_PATCH_UPDATE-E002-SUBRC:${oShellResult.SUBRC}`;
            oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.
            oRES.PARAM = {
                LOG: oShellResult?.LOG || "" // PowerShell 오류 로그
            };

            self.postMessage(oRES);

            return;

        }

        oRES.PRCCD = PRC.UPDATE_INSTALL; // asar 압축 및 인스톨

        self.postMessage(oRES);


        // --------------------------------------------
        // ☝️step2. asar 소스파일 압축해제 처리
        // --------------------------------------------
        try {

            await ASAR.extractAll(LV_ASAR_PATH, LV_APP_PATH);

        } catch (err) {

            oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
            oRES.STCOD = `WS_PATCH_UPDATE-E003`; // asar 파일 압축 풀다가 오류 발생
            oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.
            oRES.PARAM = {
                LOG: err && err?.toString() || "" // 오류 로그
            };

            self.postMessage(oRES);

            return;
        }

        // --------------------------------------------
        // ☝️step3. 다운받은 app.zip 파일 압축 해제
        // --------------------------------------------

        // 압축 해제 대상 파일
        var sSourcePath = PATH.join(sResourcePath, "app.zip");

        //#region 경로 수정
        //#endregion


        /**
         * @since   2026-05-22 14:22:49
         * @version v3.6.3-0
         * @author  soccerhs
         * @description
         * 
         * Cordova Electron -> Pure Electron 플랫폼 변경으로 인한
         * zip 파일 압축 푸는 경로 변경.
         * 
         */
        // var sTargetPath = sResourcePath;
        var sTargetPath = PATH.join(LV_APP_PATH, "www");

        let oAppZipExtResult = await _zipExtractAsync(sSourcePath, sTargetPath, true);
        if (oAppZipExtResult.RETCD === "E") {

            oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
            oRES.STCOD = `WS_PATCH_UPDATE-E004`; // 다운받은 app.zip 파일 압축 풀다가 오류 발생
            oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

            self.postMessage(oRES);

            return;

        }

        await _fnWaiting(500);

        // --------------------------------------------
        // ☝️step4. ExtraResource 대상 파일 이동
        // --------------------------------------------
        
        let aExtraResources = [
            "./www/MSG"
        ];
        
        try {
            await _moveExtRes(LV_APP_PATH, sResourcePath, aExtraResources);
        } catch (error) {

            console.error(error);

            oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
            oRES.STCOD = `WS_PATCH_UPDATE-E004-1`;
            oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

            self.postMessage(oRES);

            return;
        }

        //app.zip 다운로드처리 전 이전 쓰레기 File 제거
        try { FS.unlinkSync(sSourcePath); } catch (err) { }

        await _fnWaiting(500);

        // --------------------------------------------
        // ☝️step6. node_modules.zip 파일이 존재할 경우 압축 해제
        // --------------------------------------------

        // 압축 해제 대상 파일
        var sSourcePath = PATH.join(sResourcePath, "node_modules.zip");

        if (FS.existsSync(sSourcePath) === true) {

            let oNDZipExtResult = await _zipExtractAsync(sSourcePath, sTargetPath, true);
            if (oNDZipExtResult.RETCD === "E") {

                oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
                oRES.STCOD = `WS_PATCH_UPDATE-E005`; // 다운받은 node_modules.zip 파일 압축 풀다가 오류 발생
                oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.

                self.postMessage(oRES);

                return;
            }

        }


        // --------------------------------------------
        // ☝️step7. asar 소스파일 압축 처리 
        // --------------------------------------------

        try {

            await ASAR.createPackage(LV_APP_PATH, LV_ASAR_PATH);

        } catch (err) {

            oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
            oRES.STCOD = `WS_PATCH_UPDATE-E006`; // app.asar 만들다가 오류
            oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.
            oRES.PARAM = {
                LOG: err && err?.toString() || "" // PowerShell 오류 로그
            };

            self.postMessage(oRES);

            // res({ RETCD: "E", RTMSG: GS_MSG.M21 }); //app.asar 소스 압축 하는 과정에서 오류가 발생하였습니다

            return;
        }

        await _fnWaiting(500);

        //압축 해제한 폴더 삭제 처리 
        FS.rmdir(LV_APP_PATH, {
            recursive: true, force: true
        }, (error) => {

        });

        await _fnWaiting(500);


        // --------------------------------------------
        // ☝️step8. 패치 업데이트 완료!!!
        // --------------------------------------------

        oRES.PRCCD = PRC.DOWN_FINISH; // 다운로드 완료

        self.postMessage(oRES);

    } catch (error) {

        oRES.PRCCD = PRC.UPDATE_ERROR; // 오류
        oRES.STCOD = `WS_PATCH_UPDATE-E998`; // 알수 없는 오류 발생
        oRES.MSGNR = "M22"; // 패치 업데이트 진행 과정에 문제가 발생하였습니다.
        oRES.PARAM = {
            LOG: error && error?.stack && error?.toString() || ""
        };

        self.postMessage(oRES);

        return;

    } finally {

        /**
         * @since   2025-11-10 12:17:33
         * @version v3.5.6-16
         * @author  soccerhs
         * @description
         * 
         * - 패치 다운로드 시 오류가 발생한 경우,
         *   사전에 생성한 임시 폴더 및 파일등을 삭제한다.
         */

        await _removeFolderAndFile(PATH.join(sResourcePath, "app"));

        await _removeFolderAndFile(PATH.join(sResourcePath, "app.zip"));

        await _removeFolderAndFile(PATH.join(sResourcePath, "node_modules.zip"));

        // 패치 파일 조각이 있다면 전체 제거
        deleteWsxFiles(sResourcePath);

    }

};