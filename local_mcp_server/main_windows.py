import logging
import shutil
import subprocess
import webbrowser
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  # <--- NEW!


# ---- Logging Setup ----

# Log to a file with rotation if you wish; here we set up both file & console handlers
LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.FileHandler("server.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger("local_mcp.tools")

# ---- FastAPI & Toolkit ----

app = FastAPI()

# --- ADD CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, use exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ToolKit:
    def __init__(self, config=None):
        self.config = config

    def open_webbrowser(self, urls):
        results = []
        for url in urls:
            try:
                logger.info(f"Opening {url} in web browser.")
                webbrowser.open(url)
                results.append({"url": url, "status": "opened"})
            except Exception as e:
                err_msg = f"Failed to open {url}: {e}"
                logger.error(err_msg)
                results.append({"url": url, "status": "error", "error": err_msg})
        return results

    def execute_programs(self, program_names):
        results = []
        for prog in program_names:
            exe_path = shutil.which(prog)
            if exe_path:
                try:
                    logger.info(f"Running {exe_path}")
                    subprocess.Popen([exe_path])
                    results.append(
                        {"program": prog, "path": exe_path, "status": "executed"}
                    )
                except Exception as e:
                    err_msg = f"Failed to launch {exe_path}: {e}"
                    logger.error(err_msg)
                    results.append(
                        {"program": prog, "status": "error", "error": err_msg}
                    )
            else:
                not_found_msg = f"Executable '{prog}' not found in PATH."
                logger.warning(not_found_msg)
                results.append(
                    {"program": prog, "status": "not_found", "error": not_found_msg}
                )
        return results

    def _edit_config(self, config):
        self.config = config
        logger.info(f"Config edited: {config}")
        return {"config": config, "status": "updated"}


toolkit = ToolKit()

tools_dict = {
    "open_webbrowser": toolkit.open_webbrowser,
    "execute_programs": toolkit.execute_programs,
    # Add more tools here!
}


@app.post("/local_actions")
async def implement_local_actions(request: Request):
    body = await request.json()
    actions = body.get("actions_list", [])
    results = []
    any_error = False

    for action in actions:
        for key, value in action.items():
            fn = tools_dict.get(key)
            action_result = {"action": key, "input": value}
            if fn is not None:
                try:
                    individual_results = fn(value)
                    action_result["result"] = individual_results
                    # Check if any item in results is not successful
                    if any(
                            r.get("status") in ("error", "not_found")
                            for r in individual_results
                    ):
                        any_error = True
                except Exception as e:
                    error_msg = f"Exception while running {key}: {e}"
                    logger.exception(error_msg)  # includes stack trace!
                    action_result["result"] = [{"status": "error", "error": error_msg}]
                    any_error = True
            else:
                error_msg = f"Action '{key}' is not implemented."
                logger.error(error_msg)
                action_result["result"] = [{"status": "error", "error": error_msg}]
                any_error = True
            results.append(action_result)

    actions_execution_status = "Done" if not any_error else "Not Fully Done"
    logger.info(f"Actions execution status: {actions_execution_status}")

    return JSONResponse(
        content={"actions_execution": actions_execution_status, "results": results},
        status_code=200,
    )
