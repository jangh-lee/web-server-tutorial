const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".nav-link");
const healthBadge = document.getElementById("healthBadge");

const fortuneForm = document.getElementById("fortuneForm");
const fortuneEmpty = document.getElementById("fortuneEmpty");
const fortuneResult = document.getElementById("fortuneResult");

const cardForm = document.getElementById("cardForm");
const cardPreviewEmpty = document.getElementById("cardPreviewEmpty");
const cardPreview = document.getElementById("cardPreview");
const cardImage = document.getElementById("cardImage");
const cardSpec = document.getElementById("cardSpec");

const visionForm = document.getElementById("visionForm");
const visionEmpty = document.getElementById("visionEmpty");
const visionResult = document.getElementById("visionResult");

const adminLoadForm = document.getElementById("adminLoadForm");
const adminSaveForm = document.getElementById("adminSaveForm");
const adminPassword = document.getElementById("adminPassword");

let latestFortune = null;

function activateView(target) {
  navLinks.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === target);
  });

  views.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === target);
  });
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || `Request failed: ${response.status}`);
  }
  return data;
}

function renderFortune(data) {
  latestFortune = data;
  fortuneEmpty.hidden = true;
  fortuneResult.hidden = false;
  fortuneResult.innerHTML = `
    <div class="fortune-title">
      <h3>${data.title}</h3>
      <span class="score-badge">${data.score}점</span>
    </div>
    <div class="fortune-box"><strong>오늘의 요약</strong><div>${data.summary}</div></div>
    <div class="fortune-grid">
      <div class="fortune-box"><strong>기운의 흐름</strong><div>${data.energyFlow}</div></div>
      <div class="fortune-box"><strong>강점</strong><div>${data.strength}</div></div>
      <div class="fortune-box"><strong>주의점</strong><div>${data.caution}</div></div>
      <div class="fortune-box"><strong>행운 포인트</strong><div>색상: ${data.luckyColor}<br>방향: ${data.luckyDirection}<br>시간: ${data.luckyTime}</div></div>
    </div>
    <div class="fortune-box"><strong>키워드</strong><div>${(data.keywords || []).join(", ")}</div></div>
  `;

  document.getElementById("cardTitleInput").value = data.title || "";
  document.getElementById("cardSummaryInput").value = data.summary || "";
  document.getElementById("cardStrengthInput").value = data.strength || "";
  document.getElementById("cardCautionInput").value = data.caution || "";
  document.getElementById("cardColorInput").value = data.luckyColor || "";
  document.getElementById("cardDirectionInput").value = data.luckyDirection || "";
}

navLinks.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});

fortuneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await requestJson("/api/fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthYear: document.getElementById("birthYear").value,
        birthMonth: document.getElementById("birthMonth").value,
        birthDay: document.getElementById("birthDay").value,
        birthHour: document.getElementById("birthHour").value,
        calendarType: document.getElementById("calendarType").value
      })
    });
    renderFortune(data);
  } catch (error) {
    alert(error.message);
  }
});

cardForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const payload = {
      fortune: {
        title: document.getElementById("cardTitleInput").value,
        summary: document.getElementById("cardSummaryInput").value,
        strength: document.getElementById("cardStrengthInput").value,
        caution: document.getElementById("cardCautionInput").value,
        luckyColor: document.getElementById("cardColorInput").value,
        luckyDirection: document.getElementById("cardDirectionInput").value
      }
    };
    const data = await requestJson("/api/tarot-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    cardPreviewEmpty.hidden = true;
    cardPreview.hidden = false;
    cardImage.src = data.imageDataUrl;
    cardSpec.textContent = JSON.stringify(data.spec, null, 2);
  } catch (error) {
    alert(error.message);
  }
});

visionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const file = document.getElementById("visionFile").files[0];
    let imageBase64 = "";
    let mimeType = "";

    if (file) {
      imageBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      mimeType = file.type;
    }

    const data = await requestJson("/api/vision-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl: document.getElementById("visionImageUrl").value,
        imageBase64,
        mimeType
      })
    });

    visionEmpty.hidden = true;
    visionResult.hidden = false;
    visionResult.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    alert(error.message);
  }
});

adminLoadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const password = adminPassword.value;
    const data = await requestJson(`/api/admin/prompts?password=${encodeURIComponent(password)}`);
    Object.entries(data).forEach(([key, value]) => {
      const field = document.getElementById(key);
      if (field) {
        field.value = value;
      }
    });
    adminSaveForm.hidden = false;
  } catch (error) {
    alert(error.message);
  }
});

adminSaveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await requestJson("/api/admin/prompts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: adminPassword.value,
        fortuneSystemPrompt: document.getElementById("fortuneSystemPrompt").value,
        fortuneUserPromptTemplate: document.getElementById("fortuneUserPromptTemplate").value,
        tarotSystemPrompt: document.getElementById("tarotSystemPrompt").value,
        tarotUserPromptTemplate: document.getElementById("tarotUserPromptTemplate").value,
        visionSystemPrompt: document.getElementById("visionSystemPrompt").value,
        visionUserPromptTemplate: document.getElementById("visionUserPromptTemplate").value
      })
    });
    alert("프롬프트가 저장되었습니다.");
  } catch (error) {
    alert(error.message);
  }
});

async function checkHealth() {
  try {
    const data = await requestJson("/api/health");
    healthBadge.className = `health-badge ${data.demoMode ? "pending" : "ok"}`;
    healthBadge.textContent = data.demoMode ? "Demo Mode" : "CLOVA Connected";
  } catch (error) {
    healthBadge.className = "health-badge fail";
    healthBadge.textContent = "API Error";
  }
}

checkHealth();
