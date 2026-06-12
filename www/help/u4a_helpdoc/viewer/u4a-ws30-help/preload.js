const { contextBridge, ipcRenderer, BrowserWindow, app } = require("electron");

contextBridge.exposeInMainWorld(
   "u4aAPI", {
      setZoom: (channel, data) => {
         ipcRenderer.sendToHost(
            "ipc-message", 
            {
               channel,
               data
            }
         );

      },

      setTheme: (channel, data) => {
         ipcRenderer.sendToHost(
            "ipc-message", 
            {
               channel,
               data
            }
         );
      },  


      setBack: (channel, data) => {
         ipcRenderer.sendToHost(
            "ipc-message", 
            {
               channel,
               data
            }
         );
      },  

      
      setForward: (channel, data) => {
         ipcRenderer.sendToHost(
            "ipc-message", 
            {
               channel,
               data
            }
         );
      },  
      

   }
);