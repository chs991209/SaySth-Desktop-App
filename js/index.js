/* Client Side */
const user_input = document.querySelector(".user_input");
const micIcon = document.querySelector(".mic-icon");
const processBar = document.querySelector(".progress_bar");
const favList = document.getElementById("favorite_list");
const favorite_list_container = document.querySelector(
  ".favorite_list_container"
);

let onRecording = false;
let audioChunk = [];
let mediaRecoder;

const AudioType = "audio/wav";

const TEXTPOSTURL = `https://f7bf-59-1-100-185.ngrok-free.app/execute`;
const AUDIOPOSTURL = `https://b728-39-122-179-149.ngrok-free.app/stt_base64`;
/* 
사용자 입력
*/
user_input.addEventListener("keydown", async function (e) {
  if (e.key == "Enter" && user_input.value.trim() !== "") {
    const userMessage = user_input.value.trim();
    try {
      processBar.classList.add("progress");
      const res = await fetch(TEXTPOSTURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // JSON임을 명시
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await res.json();
      user_input.value = "";
      // 파이썬 코드 실행
      run(data.code);
    } catch (e) {
      console.error(`${e}`);
    }
  }
});

async function startRecording() {
  micIcon.innerHTML = `<i class="fa-solid fa-bars-staggered"></i>`;
  micIcon.classList.add("rainbow");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecoder = new MediaRecorder(stream);
    audioChunk = [];

    mediaRecoder.ondataavailable = function (event) {
      audioChunk.push(event.data);
    };

    mediaRecoder.onstop = async function () {
      processBar.classList.add("progress");
      const audioBlob = new Blob(audioChunk, { type: AudioType });

      // FileReader로 Base64 인코딩
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Data URL 전체에서 Base64 부분만 추출
        const base64Data = reader.result.split(",")[1];
        // JSON payload 생성
        const payload = {
          fileName: "voice_file.wav",
          mimeType: AudioType,
          data: base64Data,
        };

        try {
          console.log("JSON 업로드 시작");
          const response = await fetch(AUDIOPOSTURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
          const result = await response.json();
          //console.log("반환값:", result.text);
          // 파이썬 코드 실행
          sendTextToAgent(result.text);
        } catch (err) {
          console.error("업로드 실패:", err);
        }
      };
      reader.readAsDataURL(audioBlob);
    };
    onRecording = true;
    mediaRecoder.start();
  } catch (e) {
    console.log(`마이크 접근 오류 ${e}`);
  }
}

async function run(code) {
  try {
    const result = await runPythonCode(code);
    processBar.classList.remove("progress");
  } catch (e) {
    console.error(`${e}`);
  }
}

async function sendTextToAgent(text) {
  try {
    const res = await fetch(TEXTPOSTURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSON임을 명시
      },
      body: JSON.stringify({ prompt: text }),
    });

    const data = await res.json();
    run(data.code);
  } catch (e) {
    console.error(`${e}`);
  }
}

function stopRecording() {
  /* 녹음 중 일 때 */
  mediaRecoder.stop();
  onRecording = false;
  micIcon.classList.remove("rainbow");
  micIcon.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
}

/* 
마이크 아이콘 선택 시
*/
micIcon.addEventListener("click", (e) => {
  // 마이크 버튼을 처음 눌렀을 시
  if (onRecording === false) {
    startRecording();
  } else {
    stopRecording();
  }
});
