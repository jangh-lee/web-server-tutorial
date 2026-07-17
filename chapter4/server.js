const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4100);
const publicDir = path.join(__dirname, "public");
const configPath = path.join(__dirname, "data", "prompt-config.json");

app.use(express.json({ limit: "25mb" }));
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

function makeMockCardSpec(fortune) {
  return {
    cardTitle: "The Gentle Star",
    subtitle: fortune.luckyDirection,
    accentColor: "#4f8df7",
    backgroundColor: "#f9fcff",
    frameColor: "#274690",
    symbols: ["star", "moon", "spark"],
    messageTop: fortune.keywords?.[0] || "balance",
    messageBottom: fortune.luckyColor || "hope"
  };
}

function renderTarotSvg(spec) {
  const symbols = Array.isArray(spec.symbols) ? spec.symbols.slice(0, 3) : ["star", "moon", "spark"];
  const symbolMap = {
    star: "✦",
    moon: "☾",
    sun: "☼",
    ribbon: "❦",
    spark: "✧",
    heart: "♡",
    cloud: "☁"
  };
  const icon1 = symbolMap[symbols[0]] || "✦";
  const icon2 = symbolMap[symbols[1]] || "☾";
  const icon3 = symbolMap[symbols[2]] || "✧";
  const backgroundColor = spec.backgroundColor || "#f9fcff";
  const accentColor = spec.accentColor || "#4f8df7";
  const frameColor = spec.frameColor || "#274690";
  const cardTitle = String(spec.cardTitle || "Tarot Card");
  const subtitle = String(spec.subtitle || "");
  const messageTop = String(spec.messageTop || "");
  const messageBottom = String(spec.messageBottom || "");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${backgroundColor}" />
        <stop offset="100%" stop-color="#ffffff" />
      </linearGradient>
    </defs>
    <rect width="720" height="1080" rx="38" fill="url(#bg)" />
    <rect x="28" y="28" width="664" height="1024" rx="32" fill="none" stroke="${frameColor}" stroke-width="8"/>
    <circle cx="360" cy="260" r="120" fill="${accentColor}" opacity="0.15"/>
    <circle cx="360" cy="260" r="88" fill="none" stroke="${accentColor}" stroke-width="5"/>
    <text x="360" y="220" text-anchor="middle" font-size="52" fill="${frameColor}" font-family="Georgia, serif">${icon1}</text>
    <text x="300" y="295" text-anchor="middle" font-size="62" fill="${accentColor}" font-family="Georgia, serif">${icon2}</text>
    <text x="420" y="295" text-anchor="middle" font-size="52" fill="${frameColor}" font-family="Georgia, serif">${icon3}</text>
    <text x="360" y="430" text-anchor="middle" font-size="24" letter-spacing="8" fill="${accentColor}" font-family="Arial, sans-serif">TODAY'S CARD</text>
    <text x="360" y="495" text-anchor="middle" font-size="56" fill="${frameColor}" font-family="Georgia, serif">${cardTitle}</text>
    <text x="360" y="542" text-anchor="middle" font-size="28" fill="${accentColor}" font-family="Arial, sans-serif">${subtitle}</text>
    <line x1="140" y1="620" x2="580" y2="620" stroke="${frameColor}" stroke-width="2" opacity="0.25"/>
    <text x="360" y="700" text-anchor="middle" font-size="30" fill="${frameColor}" font-family="Arial, sans-serif">${messageTop}</text>
    <text x="360" y="780" text-anchor="middle" font-size="22" fill="${accentColor}" font-family="Arial, sans-serif">${messageBottom}</text>
    <rect x="170" y="845" width="380" height="120" rx="26" fill="${accentColor}" opacity="0.1"/>
    <text x="360" y="900" text-anchor="middle" font-size="26" fill="${frameColor}" font-family="Arial, sans-serif">Fortune flows gently when your steps stay steady.</text>
  </svg>`;
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function makeVisionMock() {
  return {
    summary: "파스텔 톤의 카드형 일러스트가 보이며, 중심에는 별과 달 상징이 배치되어 있습니다.",
    mood: "차분하고 포근한 분위기",
    mainObjects: ["타로 카드 프레임", "별", "달"],
    colorPalette: ["하늘색", "아이보리", "남색"],
    tarotInterpretation: "감정의 균형과 직관을 믿으라는 메시지를 전하는 카드처럼 보입니다."
  };
}

app.get("/api/health", async (req, res) => {
  res.json({
    status: "ok",
    service: "chapter4-demo",
    demoMode: isDemoMode()
  });
});

app.get("/api/admin/prompts", async (req, res, next) => {
  try {
    if (req.query.password !== requireEnv("ADMIN_PASSWORD")) {
      return res.status(403).json({ message: "Invalid admin password" });
    }

    const config = await readPromptConfig();
    res.json(config);
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
      fortuneUserPromptTemplate: String(req.body.fortuneUserPromptTemplate || ""),
      tarotSystemPrompt: String(req.body.tarotSystemPrompt || ""),
      tarotUserPromptTemplate: String(req.body.tarotUserPromptTemplate || ""),
      visionSystemPrompt: String(req.body.visionSystemPrompt || ""),
      visionUserPromptTemplate: String(req.body.visionUserPromptTemplate || "")
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

    const result = extractJson(content);
    res.json({ ...result, source: "clova" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/tarot-card", async (req, res, next) => {
  try {
    const fortune = req.body.fortune;
    if (!fortune || !fortune.title || !fortune.summary) {
      return res.status(400).json({ message: "fortune.title and fortune.summary are required" });
    }

    let spec;
    if (isDemoMode()) {
      spec = makeMockCardSpec(fortune);
    } else {
      const prompts = await readPromptConfig();
      const userPrompt = applyTemplate(prompts.tarotUserPromptTemplate, {
        fortuneTitle: fortune.title,
        fortuneSummary: fortune.summary,
        fortuneStrength: fortune.strength || "",
        fortuneCaution: fortune.caution || "",
        fortuneLuckyColor: fortune.luckyColor || "",
        fortuneLuckyDirection: fortune.luckyDirection || ""
      });
      const content = await callClovaChat({
        modelName: requireEnv("CLOVA_TEXT_MODEL") || "HCX-DASH-002",
        messages: [
          { role: "system", content: prompts.tarotSystemPrompt },
          { role: "user", content: userPrompt }
        ]
      });
      spec = extractJson(content);
    }

    const svg = renderTarotSvg(spec);
    res.json({
      spec,
      imageDataUrl: svgToDataUrl(svg),
      svg,
      source: isDemoMode() ? "mock-render" : "clova-render"
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/vision-read", async (req, res, next) => {
  try {
    const { imageUrl, imageBase64, mimeType } = req.body;
    if (!imageUrl && !imageBase64) {
      return res.status(400).json({ message: "imageUrl or imageBase64 is required" });
    }

    if (isDemoMode()) {
      return res.json({ ...makeVisionMock(), source: "mock" });
    }

    const prompts = await readPromptConfig();
    const contentPayload = [];
    if (imageUrl) {
      contentPayload.push({
        type: "image_url",
        imageUrl: { url: imageUrl }
      });
    } else {
      contentPayload.push({
        type: "image_url",
        dataUri: { data: imageBase64.replace(/^data:[^;]+;base64,/, "") }
      });
    }
    contentPayload.push({
      type: "text",
      text: prompts.visionUserPromptTemplate
    });

    const content = await callClovaChat({
      modelName: requireEnv("CLOVA_VISION_MODEL") || "HCX-005",
      messages: [
        { role: "system", content: prompts.visionSystemPrompt },
        { role: "user", content: contentPayload }
      ]
    });

    const result = extractJson(content);
    res.json({ ...result, source: "clova-vision", mimeType: mimeType || null });
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
  console.log(`Chapter 4 demo running on http://localhost:${port}`);
});
