import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess

app = FastAPI(title="Local MCP Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            
    allow_methods=["*"],
    allow_headers=["*"],
)

class MCPMessage(BaseModel):
    type: str
    payload: dict

# Local MCP 서버 켜졌는지 확인용 path
@app.get("/health")
async def health():
    return {"status": "ok"}

# 프로그램 실행 path 찾기
def find_program_path(program_exe : str):
    try:
        result = subprocess.check_output(["where", program_exe], shell=True, text=True)
        paths = result.strip().split('\n')
        if paths:
            print(paths[0])
            return paths[0]
        return None
    except subprocess.CalledProcessError:
        return None
    
    
# 프로그램 실행 함수
def run_program(program_path: str):
    try:
        subprocess.Popen([program_path])
        return True
    except Exception as e:
        print(f"프로그램 실행 실패: {e}")
        return False

# 새로 추가하는 임의 Python 코드 실행 함수 (비동기)
def run_python_code_sync(code: str) -> str:
    completed = subprocess.run(
        ["python", "-c", code],
        capture_output=True,
        text=True,
    )
    if completed.returncode != 0:
        raise Exception(completed.stderr)
    return completed.stdout

async def run_python_code(code: str) -> str:
    return await asyncio.to_thread(run_python_code_sync, code)

@app.post("/mcp")
async def handle_mcp_message(message: MCPMessage):
    if message.type == "run_program":
        program_exe = message.payload.get("program_exe")
        if not program_exe:
            raise HTTPException(status_code=400, detail="program_exe is required in payload")
        
        program_path = find_program_path(program_exe)
        if not program_path:
            raise HTTPException(status_code=404, detail=f"{program_exe} 경로를 찾을 수 없습니다.")
        
        success = run_program(program_path)
        if not success:
            raise HTTPException(status_code=500, detail=f"{program_exe} 실행에 실패했습니다.")
        
        return {"status": "success", "message": f"{program_exe} 실행 완료"}

    elif message.type == "run_python_code":
        code = message.payload.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="code is required in payload")
        
        try:
            print(code)
            result = await run_python_code(code)
            return {"status": "success", "result": result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Python 코드 실행 실패: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="지원하지 않는 메시지 타입입니다.")