import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  runPythonCode: (code: string) =>
    ipcRenderer.invoke('run-python', code) as Promise<string>
});