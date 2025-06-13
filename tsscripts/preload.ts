import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    runPythonCode: (code: string) => ipcRenderer.invoke('run-python-code', code)
});