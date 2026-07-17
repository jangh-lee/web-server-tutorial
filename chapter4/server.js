const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4100);
const publicDir = path.join(__dirname, "public");
const configPath = path.join(__dirname, "data", "prompt-config.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

function requireEnv(name) {
  const value = process.env[name];
  return value ? String(value).trim() : "";
}

function isDemoMode() {
  return !requireEnv("CLOVA_API_KEY") && String(process.env.DEMO_MODE_IF_NO_KEY || "true") === "true";
}

async function readPromptConfig() {
  const raw = await fs.readFile(configPath, "utf8");
  return JSON.parse(raw);
}

async function writePromptConfig(data) {
  await fs.writeFile(configPath, JSON.stringify(data, null, 2));
}

function applyTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ""));
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Model response did not contain JSON");
    }
    return JSON.parse(match[0]);
  }
}

async function callClovaChat({ modelName, messages }) {
  const apiKey = requireEnv("CLOVA_API_KEY");
  const baseUrl = requireEnv("CLOVA_BASE_URL") || "https://clovastudio.stream.ntruss.com";

  if (!apiKey) {
    throw new Error("CLOVA_API_KEY is missing");
  }

  const response = await fetch(`${baseUrl}/v3/chat-completions/${modelName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-NCP-CLOVASTUDIO-REQUEST-ID": `chapter4-${Date.now()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      topP: 0.8,
      topK: 0,
      maxTokens: 900,
      temperature: 0.6,
      repetitionPenalty: 1.1,
      includeAiFilters: false
    })
  });

  const data = await response.json();
  if (!response.ok || data.status?.code !== "20000") {
    throw new Error(data.status?.message || `CLOVA request failed with status ${response.status}`);
  }

  return data.result.message.content;
}

function makeMockFortune(payload) {
  return {
    title: "오늘의 별빛 흐름",
    summary: `${payload.birthMonth}월의 부드러운 기운이 들어오는 날입니다. 서두르기보다 순서를 지키면 운이 편안하게 흐릅니다.`,
    energyFlow: "아침보다 오후에 감이 더 또렷해지고, 사람과의 대화에서 힌트를 얻는 흐름입니다.",
    strength: "차분하게 상황을 정리하는 힘이 강합니다.",
    caution: "마감 직전의 즉흥 결정은 조금 늦추는 것이 좋습니다.",
    luckyColor: "민트 블루",
    luckyDirection: "동남",
    luckyTime: "오후 3시~5시",
    score: 82,
    keywords: ["정리", "대화운", "집중"]
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "chapter4-fortune-demo",
    demoMode: isDemoMode()
  });
});

app.get("/api/admin/prompts", async (req, res, next) => {
  try {
    if (req.query.password !== requireEnv("ADMIN_PASSWORD")) {
      return res.status(403).json({ message: "Invalid admin password" });
    }

    res.json(await readPromptConfig());
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/prompts", async (req, res, next) => {
  try {
    if (req.body.password !== requireEnv("ADMIN_PASSWORD")) {
      return res.status(403).json({ message: "Invalid admin password" });
    }

    const nextConfig = {
      fortuneSystemPrompt: String(req.body.fortuneSystemPrompt || ""),
      fortuneUserPromptTemplate: String(req.body.fortuneUserPromptTemplate || "")
    };

    await writePromptConfig(nextConfig);
    res.json({ status: "saved" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/fortune", async (req, res, next) => {
  try {
    const payload = {
      birthYear: req.body.birthYear,
      birthMonth: req.body.birthMonth,
      birthDay: req.body.birthDay,
      birthHour: req.body.birthHour,
      calendarType: req.body.calendarType || "양력",
      todayDate: new Date().toLocaleDateString("ko-KR")
    };

    if (!payload.birthYear || !payload.birthMonth || !payload.birthDay || !payload.birthHour) {
      return res.status(400).json({ message: "birthYear, birthMonth, birthDay, birthHour are required" });
    }

    if (isDemoMode()) {
      return res.json({ ...makeMockFortune(payload), source: "mock" });
    }

    const prompts = await readPromptConfig();
    const userPrompt = applyTemplate(prompts.fortuneUserPromptTemplate, payload);
    const content = await callClovaChat({
      modelName: requireEnv("CLOVA_TEXT_MODEL") || "HCX-DASH-002",
      messages: [
        { role: "system", content: prompts.fortuneSystemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    res.json({ ...extractJson(content), source: "clova" });
  } catch (error) {
    next(error);
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Internal server error" });
});

app.listen(port, () => {
  console.log(`Chapter 4 fortune demo running on http://localhost:${port}`);
});
