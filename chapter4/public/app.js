const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".nav-link");
const healthBadge = document.getElementById("healthBadge");

const fortuneForm = document.getElementById("fortuneForm");
const fortuneSubmitButton = fortuneForm.querySelector('button[type="submit"]');
const fortuneLoading = document.getElementById("fortuneLoading");
const fortuneEmpty = document.getElementById("fortuneEmpty");
const fortuneResult = document.getElementById("fortuneResult");

const adminLoadForm = document.getElementById("adminLoadForm");
const adminSaveForm = document.getElementById("adminSaveForm");
const adminPassword = document.getElementById("adminPassword");

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

}

navLinks.forEach((button) => {
  button.addEventListener("click", () => activateView(button.dataset.view));
});

fortuneForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  fortuneLoading.hidden = false;
  fortuneEmpty.hidden = true;
  fortuneResult.hidden = true;
  fortuneSubmitButton.disabled = true;
  fortuneSubmitButton.textContent = "운세 확인 중...";

  try {
    const [data] = await Promise.all([
      requestJson("/api/fortune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthYear: document.getElementById("birthYear").value,
          birthMonth: document.getElementById("birthMonth").value,
          birthDay: document.getElementById("birthDay").value,
          birthHour: document.getElementById("birthHour").value,
          calendarType: document.getElementById("calendarType").value
        })
      }),
      new Promise((resolve) => setTimeout(resolve, 650))
    ]);
    renderFortune(data);
  } catch (error) {
    alert(error.message);
    fortuneEmpty.hidden = false;
  } finally {
    fortuneLoading.hidden = true;
    fortuneSubmitButton.disabled = false;
    fortuneSubmitButton.textContent = "오늘의 운세 보기";
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
        fortuneUserPromptTemplate: document.getElementById("fortuneUserPromptTemplate").value
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
