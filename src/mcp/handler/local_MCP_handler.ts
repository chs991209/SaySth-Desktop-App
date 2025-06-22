import {spawn, ChildProcess} from "child_process";
import * as path from "path";
import kill from "tree-kill";


/** MCP(FastAPI) 서버 실행 */
export function startMCPServer(): ChildProcess {
    const pythonPath: string = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "mcp_server", // 내쪽에선 mcp_server로 잡아야하는 듯
        "venv",
        "Scripts",
        "python.exe"
    ); // 가상환경 python 경로
    console.log("__dirname:", __dirname);
    console.log("Trying pythonPath:", pythonPath);
    const args: string[] = [
        "-m",
        "uvicorn",
        "main_windows:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8002",
        "--reload",
    ];

    const mcpProcess: ChildProcess = spawn(pythonPath, args, {
        cwd: path.join(__dirname, "..","..", "..", "local_mcp_server"),
        stdio: "inherit",
        windowsHide: true,
        shell: false,
    });

    mcpProcess.on("error", (err): void => {
        console.error("Failed to start MCP server:", err);
    });

    return mcpProcess;
};

/** 프로세스와 자식 프로세스까지 안전하게 종료 */
export function killProcessTree(process: ChildProcess | null): void {
    if (process?.pid) {
        kill(process.pid, "SIGTERM");
    }
}