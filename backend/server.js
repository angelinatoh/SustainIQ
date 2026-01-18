const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());


const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

// ====== simple JSON "DB" ======
const DB_PATH = path.join(__dirname, "db.json");

function safeParseJSON(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) return { submissions: [] };

  const raw = fs.readFileSync(DB_PATH, "utf-8");
  const data = safeParseJSON(raw, { submissions: [] });

  // Ensure correct shape
  if (!data || typeof data !== "object") return { submissions: [] };
  if (!Array.isArray(data.submissions)) data.submissions = [];
  return data;
}

function writeDB(data) {
  // Ensure folder exists (mostly for safety)
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// ====== scoring logic (edit anytime) ======
function computeResult({ industry, companySize, trackMetrics, challenge }) {
  let score = 20;

  // Tracking ESG metrics
  if (trackMetrics === "Yes") score += 25;
  else if (trackMetrics === "Somewhat") score += 15;
  else score += 5;

  // Company size (bigger = usually more resources)
  if (companySize === "1–50") score += 5;
  else if (companySize === "51–200") score += 10;
  else score += 15;

  // Main challenge (some imply earlier maturity)
  if (challenge === "Data collection") score += 5;
  if (challenge === "Compliance / reporting") score += 10;
  if (challenge === "Targets / strategy") score += 15;

  // clamp 0-100
  score = Math.max(0, Math.min(100, score));

  let stage = 1;
  let title = "Starting Point";
  let desc =
    "You're at the beginning — focus on baselines, boundaries, and KPI ownership.";
  let engagement = "ESG Foundation Sprint (baseline + KPI dictionary + data ownership).";
  let nextSteps = [
    "Define measurement boundaries (energy, waste, emissions).",
    "Create a KPI dictionary (what, how, owner, cadence).",
    "Set 12 core KPIs you can track reliably.",
    "Assign owners and start a monthly review cadence."
  ];

  if (score >= 40 && score < 70) {
    stage = 2;
    title = "Build Momentum";
    desc = "You have the basics — now standardize data capture and expand coverage.";
    engagement = "ESG Ops Pack (data workflows + KPI tracking + review cadence).";
    nextSteps = [
      "Standardize data collection templates and sources.",
      "Introduce monthly KPI reviews and action tracking.",
      "Add supplier / scope data where relevant.",
      "Document controls and evidence collection."
    ];
  }

  if (score >= 70) {
    stage = 3;
    title = "Reporting & Scale";
    desc =
      "You're tracking well — now strengthen governance and turn progress into stakeholder-ready reporting.";
    engagement =
      "ESG Reporting Pack (report structure + evidence checklist + leadership dashboard).";
    nextSteps = [
      "Create a reporting narrative linked to KPIs and initiatives.",
      "Build an evidence checklist for audit / review readiness.",
      "Improve governance: cadence, owners, escalation paths.",
      "Publish quarterly progress updates for stakeholders."
    ];
  }

  return { score, stage, title, desc, engagement, nextSteps };
}

// ✅ Health check (useful for Render)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "SustainIQ", time: new Date().toISOString() });
});

// ====== API: compute + save snapshot ======
app.post("/api/snapshot", (req, res) => {
  const payload = req.body || {};

  // Basic validation (prevents weird crashes)
  const required = ["companySize", "trackMetrics", "challenge"];
  const missing = required.filter((k) => !payload[k]);
  if (missing.length) {
    return res.status(400).json({
      error: "Missing required fields",
      missing
    });
  }

  const result = computeResult(payload);

  const db = readDB();
  const entry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    input: payload,
    result
  };

  db.submissions.unshift(entry);
  writeDB(db);

  res.json(result);
});

// ====== API: list history ======
app.get("/api/snapshots", (req, res) => {
  const db = readDB();
  res.json(db.submissions);
});

// ✅ SPA fallback (if user goes to /dashboard etc. and you want index.html)
app.get("*", (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  return res.status(404).send("index.html not found in /public");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
