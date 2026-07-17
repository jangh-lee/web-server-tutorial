const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".nav-link");
const healthBadge = document.getElementById("healthBadge");

const fortuneForm = document.getElementById("fortuneForm");
const fortuneSubmitButton = fortuneForm.querySelector('button[type="submit"]');
const fortuneLoading = document.getElementById("fortuneLoading");
const fortuneEmpty = document.getElementById("fortuneEmpty");
const fortuneResult = document.getElementById("fortuneResult");

const ragForm = document.getElementById("ragForm");
const ragPrompt = document.getElementById("ragPrompt");
const ragSubmitButton = document.getElementById("ragSubmitButton");
const ragConversation = document.getElementById("ragConversation");
const ragWelcome = document.getElementById("ragWelcome");
const newChatButton = document.getElementById("newChatButton");

const adminLoadForm = document.getElementById("adminLoadForm");
const adminSaveForm = document.getElementById("adminSaveForm");
const adminPassword = document.getElementById("adminPassword");
let ragMessages = [];

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

function createRagMessage(role, content, metadata = null) {
  const message = document.createElement("article");
  message.className = `rag-message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "rag-avatar";
  avatar.textContent = role === "user" ? "나" : "AI";

  const body = document.createElement("div");
  body.className = "rag-message-body";
  const label = document.createElement("strong");
  label.textContent = role === "user" ? "You" : "RAG Assistant";
  const text = document.createElement("div");
  text.className = "rag-answer-text";
  text.textContent = content;
  body.append(label, text);

  if (metadata?.sources?.length) {
    const sources = document.createElement("div");
    sources.className = "rag-sources";
    const sourceLabel = document.createElement("span");
    sourceLabel.textContent = "참고한 문서";
    sources.append(sourceLabel);
    metadata.sources.forEach((source) => {
      const chip = document.createElement("span");
      chip.className = "source-chip";
      chip.textContent = source.title;
      chip.title = source.source;
      sources.append(chip);
    });
    body.append(sources);
  }

  if (metadata?.searchQueries?.length || metadata?.usage?.totalTokens) {
    const details = document.createElement("div");
    details.className = "rag-response-meta";
    if (metadata.searchQueries?.length) {
      details.textContent = `검색어: ${metadata.searchQueries.join(", ")}`;
    }
    if (metadata.usage?.totalTokens) {
      details.textContent += `${details.textContent ? " · " : ""}토큰: ${metadata.usage.totalTokens}`;
    }
    body.append(details);
  }

  message.append(avatar, body);
  ragConversation.append(message);
  ragConversation.scrollTop = ragConversation.scrollHeight;
  return message;
}

function createRagLoading() {
  const message = createRagMessage("assistant", "");
  message.classList.add("is-loading");
  const text = message.querySelector(".rag-answer-text");
  text.innerHTML = '<span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span><em>문서를 검색하고 답변을 정리하는 중...</em>';
  return message;
}

async function submitRagQuestion(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion || ragSubmitButton.disabled) {
    return;
  }

  ragWelcome.hidden = true;
  ragMessages.push({ role: "user", content: cleanQuestion });
  createRagMessage("user", cleanQuestion);
  ragPrompt.value = "";
  ragPrompt.style.height = "auto";
  ragSubmitButton.disabled = true;
  ragSubmitButton.textContent = "검색 중";
  const loadingMessage = createRagLoading();

  try {
    const data = await requestJson("/api/rag/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: ragMessages })
    });
    loadingMessage.remove();
    ragMessages.push({ role: "assistant", content: data.answer });
    createRagMessage("assistant", data.answer, data);
  } catch (error) {
    loadingMessage.remove();
    createRagMessage("assistant", `답변을 가져오지 못했습니다. ${error.message}`);
  } finally {
    ragSubmitButton.disabled = false;
    ragSubmitButton.textContent = "전송";
    ragPrompt.focus();
  }
}

ragForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitRagQuestion(ragPrompt.value);
});

ragPrompt.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    ragForm.requestSubmit();
  }
});

ragPrompt.addEventListener("input", () => {
  ragPrompt.style.height = "auto";
  ragPrompt.style.height = `${Math.min(ragPrompt.scrollHeight, 180)}px`;
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => submitRagQuestion(button.dataset.question));
});

newChatButton.addEventListener("click", () => {
  ragMessages = [];
  ragConversation.querySelectorAll(".rag-message").forEach((message) => message.remove());
  ragWelcome.hidden = false;
  ragPrompt.value = "";
  ragPrompt.focus();
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
        ragSystemPrompt: document.getElementById("ragSystemPrompt").value
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
