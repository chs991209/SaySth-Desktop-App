import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import kill from "tree-kill";

let mainWindow: BrowserWindow | null = null;
//let nextProcess: ChildProcess | null = null;
let mcpProcess: ChildProcess | null = null;

/** Next.js 개발 서버 실행 */
/* function startNextServer() {
  const rendererPath = path.join(__dirname, "../renderer");
  nextProcess = spawn("npm", ["run", "dev"], {
    cwd: rendererPath,
    shell: true,
    stdio: "inherit",
    windowsHide: true,
  });
  console.log(`Next.js Server listening on: http://127.0.0.1:8000`);
} */

/** MCP(FastAPI) 서버 실행 */
function startMCPServer(): ChildProcess {
  const pythonPath = path.join(
    __dirname,
    "..",
    "mcp_server",
    "venv",
    "Scripts",
    "python.exe"
  ); // 가상환경 python 경로
  console.log("__dirname:", __dirname);
  console.log("Trying pythonPath:", pythonPath);
  const args = [
    "-m",
    "uvicorn",
    "main:app",
    "--host",
    "127.0.0.1",
    "--port",
    "8002",
    "--reload",
  ];

  const mcpProcess = spawn(pythonPath, args, {
    cwd: path.join(__dirname, "..", "mcp_server"),
    stdio: "inherit",
    windowsHide: true,
    shell: false,
  });

  mcpProcess.on("error", (err) => {
    console.error("Failed to start MCP server:", err);
  });

  return mcpProcess;
}

/** 프로세스와 자식 프로세스까지 안전하게 종료 */
function killProcessTree(process: ChildProcess | null) {
  if (process?.pid) {
    kill(process.pid, "SIGTERM");
  }
}

/** 임의의 Python 코드 실행 및 결과 Promise 반환 */
function runPythonCode(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const py = spawn("python", ["-c", code]);
    let out = "",
      err = "";

    py.stdout.on("data", (data) => (out += data.toString()));
    py.stderr.on("data", (data) => (err += data.toString()));

    py.on("close", () => (err ? reject(err) : resolve(out)));
  });
}

// 렌더러에서 runPythonCode IPC 처리
ipcMain.handle("run-python", async (_event, code: string) =>
  runPythonCode(code)
);

ipcMain.on("request-from-renderer", async (event, data) => {
  console.log("Received from renderer:", data);

  // 예: FastAPI 서버에 POST 요청 보내기
  // Node.js 내장 fetch(18 이상) 또는 axios, node-fetch 등 사용 가능
  // 예시는 node-fetch 사용 가정
  try {
    // FastAPI 서버 주소
    const fastapiUrl = "http://127.0.0.1:8002/mcp";

    // node-fetch import 필요: npm install node-fetch
    const fetch = (await import("node-fetch")).default;

    const response = await fetch(fastapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log(result);

    // 렌더러로 결과 전송
    event.sender.send("response-from-main", { success: true, data: result });
  } catch (err) {
    console.error("Error communicating with FastAPI:", err);

    // err가 Error 타입인지 체크 후 message 사용
    const errorMessage = err instanceof Error ? err.message : String(err);

    event.sender.send("response-from-main", {
      success: false,
      error: errorMessage,
    });
  }
});

/** 메인 창 생성 및 서버 준비 대기 */
async function createWindow() {
  /* if (isDev) {
    //startNextServer();
    
    // Next.js dev 서버 준비될 때까지 대기 (최대 5초)
    /* try {
      //await waitOn({ resources: ["http://localhost:8000"], timeout: 2000 });
      console.log("Next.js dev 서버가 준비되었습니다.");
    } catch (err) {
      console.error("wait-on: Next.js dev 서버 대기 실패:", err);
      } 
    } */
  startMCPServer();

  // MCP 서버가 준비될 시간을 잠깐 줌 (필요에 따라 조정)
  await new Promise((r) => setTimeout(r, 2000));

  //await startNgrok(8002); // FastAPI 서버 포트

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  //mainWindow.webContents.openDevTools();

  /* if (isDev) {
    mainWindow.loadURL("https://saysthapp.vercel.app/");
    //const indexHtml = path.join(__dirname, "../renderer/out/index.html");
    //mainWindow.loadFile(indexHtml);
  } else {
    const indexHtml = path.join(__dirname, "../renderer/out/index.html");
    mainWindow.loadFile(indexHtml);
  } */

  mainWindow.loadURL("https://saysthapp.vercel.app/");

  mainWindow.on("closed", () => {
    //killProcessTree(nextProcess);
    killProcessTree(mcpProcess);
    mainWindow = null;
  });
}

/** 모든 창이 닫힐 때 서버도 종료하고 앱 종료 */
app.on("window-all-closed", () => {
  //killProcessTree(nextProcess);
  killProcessTree(mcpProcess);
  if (process.platform !== "darwin") app.quit();
});

/** 맥OS용 창 활성화 핸들러 */
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/** 앱 준비되면 실행 */
app.whenReady().then(createWindow);
