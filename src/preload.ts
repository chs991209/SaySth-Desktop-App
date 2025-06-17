import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  runPythonCode: (code: string) =>
    ipcRenderer.invoke("run-python", code) as Promise<string>,

  // Next.js 클라이언트에서 메인 프로세스로 메시지 보내기 (일반 메시지)
  sendRequest: (data: any) => ipcRenderer.send("request-from-renderer", data),

  // 메인 프로세스가 보낸 응답을 받기 위한 콜백 등록
  onResponse: (callback: (response: any) => void) =>
    ipcRenderer.on("response-from-main", (event, response) =>
      callback(response)
    ),
});
