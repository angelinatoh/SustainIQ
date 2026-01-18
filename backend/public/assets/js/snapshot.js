(function () {
  const form = document.getElementById("snapshotForm");
  const resultBox = document.getElementById("resultBox");

  if (!form || !resultBox) return;

  const stageTag = document.getElementById("stageTag");
  const stageTitle = document.getElementById("stageTitle");
  const stageDesc = document.getElementById("stageDesc");
  const scoreNum = document.getElementById("scoreNum");
  const recommendation = document.getElementById("recommendation");
  const nextSteps = document.getElementById("nextSteps");

  const industryEl = document.getElementById("industry");
  const sizeEl = document.getElementById("size");
  const trackingEl = document.getElementById("tracking");
  const challengeEl = document.getElementById("challenge");

  const API_BASE = "http://localhost:3001";
  const STORAGE_KEY = "snapshotResult";

  function setLoading(isLoading) {
    const btn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (btn) {
      btn.disabled = isLoading;
      btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
      btn.textContent = isLoading ? "Generating..." : btn.dataset.originalText;
    }
  }

  function renderResult(data, { scroll = true, save = true } = {}) {
    resultBox.classList.remove("hidden");
    resultBox.style.display = "block";

    stageTag.textContent = `Stage ${data.stage}`;
    stageTitle.textContent = data.title;
    stageDesc.textContent = data.desc;

    scoreNum.textContent = String(data.score);
    recommendation.textContent = `Recommended: ${data.engagement}`;

    nextSteps.innerHTML = "";
    (data.nextSteps || []).forEach((s) => {
      const li = document.createElement("li");
      li.textContent = s;
      nextSteps.appendChild(li);
    });

    if (save) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    if (scroll) {
      const resultContainer = document.getElementById("snapshotResult");
      if (resultContainer) {
        resultContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        renderResult(JSON.parse(saved), { scroll: false, save: false });
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  });

  async function submitToBackend(payload) {
    const res = await fetch(`${API_BASE}/api/snapshot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Backend error (${res.status}): ${text || "No details"}`);
    }

    return res.json();
  }

  function mapToBackendValues({ tracking, size, challenge }) {
    const trackMetrics =
      tracking === "structured" ? "Yes" :
      tracking === "partial" ? "Somewhat" :
      "No";

    const companySize =
      size === "small" ? "1–50" :
      size === "mid" ? "51–200" :
      "201+";

    const mainChallenge =
      challenge === "data" ? "Data collection" :
      challenge === "compliance" ? "Compliance / reporting" :
      challenge === "cost" ? "Cost / operations" :
      challenge === "governance" ? "Governance / ownership" :
      "Targets / strategy"; // story -> treat as strategy

    return { trackMetrics, companySize, challenge: mainChallenge };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const industry = industryEl?.value;
    const size = sizeEl?.value;
    const tracking = trackingEl?.value;
    const challenge = challengeEl?.value;

    if (!industry || !size || !tracking || !challenge) return;

    const mapped = mapToBackendValues({ tracking, size, challenge });

    const payload = {
      industry,
      companySize: mapped.companySize,
      trackMetrics: mapped.trackMetrics,
      challenge: mapped.challenge,
    };

    try {
      setLoading(true);
      const data = await submitToBackend(payload);

      renderResult(data, { save: true, scroll: true });
    } catch (err) {
      console.error(err);
      alert("Could not generate snapshot. Make sure backend is running on localhost:3001.");
    } finally {
      setLoading(false);
    }
  });
})();
