/* Client Side */
const user_input = document.querySelector(".user_input");
const micIcon = document.querySelector(".mic-icon");

let onRecording = false;
let audioChunk = [];
let mediaRecoder;

const AudioType = 'audio/wav';

const TEXTPOSTURL = `https://526b-59-1-100-185.ngrok-free.app/receive-text`;
const AUDIOPOSTURL = `https://481b-39-122-179-149.ngrok-free.app/stt_base64`;

/* 
사용자 입력
*/
user_input.addEventListener("keydown", async function (e) {
  if (e.key == "Enter" && user_input.value.trim() !== "") {
    const userMessage = user_input.value.trim();
    console.log(userMessage);
    try{
      const res = await fetch(TEXTPOSTURL, {
        method : 'POST',
        headers: {
          "Content-Type": "application/json"   // JSON임을 명시
        },
        body: JSON.stringify({"text": userMessage })
      });
      console.log(JSON.stringify({"text": userMessage }));
      
      const data = await res.json();
      console.log(`Response : ${data}`);
      user_input.value = "";
    } catch(e){
      console.error(`${e}`);
    }
  }
});

async function startRecording() {
  micIcon.innerHTML = `<i class="fa-solid fa-bars-staggered"></i>`;
  micIcon.classList.add('rainbow');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecoder = new MediaRecorder(stream);
    audioChunk = [];

    mediaRecoder.ondataavailable = function (event) {
      audioChunk.push(event.data);
    };

    mediaRecoder.onstop = async function () {
      const audioBlob = new Blob(audioChunk, { type: AudioType });
      console.log('Blob 준비:', audioBlob);

      // FileReader로 Base64 인코딩
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Data URL 전체에서 Base64 부분만 추출
        const base64Data = reader.result.split(',')[1];
        // JSON payload 생성
        const payload = {
          fileName: 'voice_file.wav',
          mimeType: AudioType,
          data: base64Data
        };
        console.log(payload);
        
        try {
          console.log('JSON 업로드 시작');
          const response = await fetch(AUDIOPOSTURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error(`서버 오류: ${response.status}`);
          const result = await response.json();
          console.log('업로드 성공:', result);
        } catch (err) {
          console.error('업로드 실패:', err);
        }
      };
      reader.readAsDataURL(audioBlob);
      
      reader.onload = function () {
        const base64audio = reader.result;
        localStorage.setItem("recorded file", base64audio);
      };
    };
    onRecording = true;
    mediaRecoder.start();
  } catch (e) {
    console.log(`마이크 접근 오류 ${e}`);
  }
}

function stopRecording() {
  /* 녹음 중 일 때 */
  mediaRecoder.stop();
  onRecording = false;  
  micIcon.classList.remove('rainbow');
  micIcon.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
}

/* 
마이크 아이콘 선택 시
*/
micIcon.addEventListener("click", (e) => {
  // 마이크 버튼을 처음 눌렀을 시
  if (onRecording === false) {
    startRecording();
  } else{    
    stopRecording();
  }
});