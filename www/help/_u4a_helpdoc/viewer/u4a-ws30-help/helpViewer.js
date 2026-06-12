



// helpViewer.js
// U4A WS3.0 Help Viewer (Function Style)

const remote = require("@electron/remote");
const { BrowserWindow, app } = remote.require("electron");
const path = require('path');
const fs = require('fs');


function openHelpViewer(options = {}) {

   const {
      width = 1300,
      height = 900,
      helpSiteRoot,
      parent = undefined,
   } = options;

   // // 이미 열려있으면 포커스만
   // if (helpWindow && !helpWindow.isDestroyed()) {
   //    helpWindow.show();
   //    helpWindow.focus();
   //    return helpWindow;
   // }

   let helpWindow = null;

   //Helper viewer html path 
   let indexPath = path.join(__dirname, 'docMain.html');
   
   if (!fs.existsSync(indexPath)) {
      throw new Error(`[U4A HelpViewer] index.html not found: ${indexPath}`);
   }

   helpWindow = new BrowserWindow({
      width,
      height,
      title: 'U4A WS3.0 Help',
      parent: parent || undefined,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      minWidth: 800,      // 최소 너비
      minHeight: 600,     // 최소 높이      
      show: false,
      frame: false,          // ⭐ 기본 타이틀바 제거
      webPreferences: {
         contextIsolation: false,
         nodeIntegration: true,
         webviewTag: true,
         webSecurity: false,
      }
   });

   const remoteMain = require('@electron/remote');
   remoteMain.require('@electron/remote/main').enable(helpWindow.webContents);

   // if(!app.isPackaged){
   //    helpWindow.webContents.openDevTools({ mode: 'detach' });
   // }


   const _options = {
            ...options, 
            isdev: !app.isPackaged,
   };
   //    helpSiteRoot      //도큐멘트 mkdosc 빌드 root 폴더 경로
   //    version = '',     // 문서 버전 번호
   //    theme = 'dark',   // "dark" : "light",
   //    startMenuId = '', // 초기 보여줄 메뉴 ID
   //    languages:"en", //ko, en

   helpWindow.loadFile(
      toFilePath(indexPath),
      {
         query: {
            options: encodeURIComponent(JSON.stringify(_options))
         }
      }
   );


   helpWindow.on('closed', () => {
      helpWindow = null;

      if(!app.isPackaged){
         remote.getCurrentWindow().close();
      }

   });

   return helpWindow;
}


function toFilePath(filePath) {
  // file:// 제거
  let cleanPath = filePath.replace(/^file:[\/\\]+/i, '');
  // 백슬래시 → 슬래시
  cleanPath = cleanPath.replace(/\\/g, '/');
  // Windows 드라이브 문자 앞 슬래시 제거 (예: /D:/... → D:/...)
  cleanPath = cleanPath.replace(/^\/([a-zA-Z]:)/, '$1');
  return cleanPath;

}

// function resolveSitePath(sitePath) {

//    if (sitePath) {
//       return path.resolve(sitePath);
//    }

//    // 1️⃣ 실행 위치 기준
//    const runtimePath = path.join(process.cwd(), 'site');
//    if (fs.existsSync(runtimePath)) {
//       return runtimePath;
//    }

//    // 2️⃣ 패키징된 Electron 기준
//    const appPath = path.join(app.getAppPath(), 'site');
//    if (fs.existsSync(appPath)) {
//       return appPath;
//    }

//    throw new Error('[U4A HelpViewer] site folder not found.');
// }

module.exports = openHelpViewer;