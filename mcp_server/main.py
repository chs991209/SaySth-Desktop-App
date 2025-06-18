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

# actionsList 형태 모델 정의
class Action(BaseModel):
    execute_programs: list[str] = None
    open_webbrowser: list[str] = None

class ActionsListPayload(BaseModel):
    actionsList: list[Action]

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
def execute_programs(program_path: str):
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

async def open_webbrowser(code: str) -> str:
    return await asyncio.to_thread(run_python_code_sync, code)

@app.post("/mcp")
async def mcp(payload: ActionsListPayload):
    results = []
    for action in payload.actionsList:
        if action.execute_programs:
            for program_exe in action.execute_programs:
                program_path = find_program_path(program_exe)
                if not program_path:
                    raise HTTPException(status_code=404, detail=f"{program_exe} 경로를 찾을 수 없습니다.")
                success = execute_programs(program_path)
                if not success:
                    raise HTTPException(status_code=500, detail=f"{program_exe} 실행에 실패했습니다.")
                results.append({"action": "execute_programs", "program": program_exe, "status": "success"})
        elif action.open_webbrowser:
            for url in action.open_webbrowser:
                # open_webbrowser 함수는 내부적으로 run_python_code_sync를 쓰는데,
                # 웹브라우저 실행용 Python 코드로 url을 열도록 실행
                # 예: import webbrowser; webbrowser.open("https://...")
                code = f'import webbrowser; webbrowser.open("{url}")'
                try:
                    await open_webbrowser(code)
                    results.append({"action": "open_webbrowser", "url": url, "status": "success"})
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"웹브라우저 열기 실패: {str(e)}")
        else:
            # 알 수 없는 액션 타입이거나 빈 액션
            continue
    return {"status": "all actions executed", "results": results}