const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const behaviorWarning = document.getElementById("behaviorWarning");
const chartTimeInfo = document.getElementById("chartTimeInfo");

const confirmBtn = document.getElementById("confirmChecklist");
const confirmMsg = document.getElementById("confirmMsg");

const changePasswordCb = document.getElementById("changePassword");
const passwordBox = document.getElementById("passwordBox");
const passwordInput = document.getElementById("newPassword");
const savePasswordBtn = document.getElementById("savePassword");
const passwordMsg = document.getElementById("passwordMsg");

passwordBox.style.display = "none";
let chart;

/* ===== TIME ===== */
function getCurrentDateTime() {
  return new Date().toLocaleString("vi-VN");
}

function getCurrentDate() {
  return new Date().toLocaleDateString("vi-VN");
}

/* ===== SCORE ===== */
function updateScore() {
  let score = 0;
  checkboxes.forEach(cb => cb.checked && (score += Number(cb.dataset.score)));
  scoreEl.textContent = score;

  if (score >= 80) {
    levelEl.textContent = "🟢 An toàn tốt";
    levelEl.style.color = "green";
  } else if (score >= 50) {
    levelEl.textContent = "🟡 Mức trung bình";
    levelEl.style.color = "orange";
  } else {
    levelEl.textContent = "🔴 Nguy cơ cao";
    levelEl.style.color = "red";
  }
}

/* ===== ANALYSIS ===== */
function analyzeBehavior() {
  const rules = [
    ["twoFA", "⚠️ Chưa bật xác thực 2 lớp (2FA)."],
    ["noReusePassword", "⚠️ Có nguy cơ dùng lại mật khẩu."],
    ["changePassword", "⚠️ Không đổi mật khẩu định kỳ."],
    ["phishingAware", "⚠️ Dễ bị lừa qua email/link giả mạo."],
    ["passwordManager", "⚠️ Không dùng Password Manager."],
    ["checkLogin", "⚠️ Không kiểm tra đăng nhập bất thường."]
  ];

  const warnings = rules
    .filter(([id]) => !document.getElementById(id).checked)
    .map(r => r[1]);

  if (warnings.length === 0) {
    behaviorWarning.innerHTML = "✅ Bạn có thói quen bảo mật rất tốt!";
    behaviorWarning.style.color = "green";
  } else {
    behaviorWarning.innerHTML = warnings.join("<br>");
    behaviorWarning.style.color = warnings.length > 3 ? "red" : "orange";
  }
}

/* ===== PASSWORD ===== */
changePasswordCb.addEventListener("change", () => {
  passwordBox.style.display = changePasswordCb.checked ? "block" : "none";
});

async function hashPassword(pwd) {
  const data = new TextEncoder().encode(pwd);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,"0")).join("");
}

savePasswordBtn.addEventListener("click", async () => {
  const pwd = passwordInput.value;
  if (pwd.length < 8) {
    passwordMsg.textContent = "❌ Mật khẩu ≥ 8 ký tự";
    passwordMsg.style.color = "red";
    return;
  }

  const newHash = await hashPassword(pwd);
  const history = JSON.parse(localStorage.getItem("passwordHistory") || "[]");

  if (history.includes(newHash)) {
    passwordMsg.textContent = "❌ Không được dùng lại mật khẩu cũ";
    passwordMsg.style.color = "red";
    return;
  }

  history.push(newHash);
  localStorage.setItem("passwordHistory", JSON.stringify(history.slice(-5)));

  passwordMsg.textContent = "✅ Mật khẩu đã lưu an toàn";
  passwordMsg.style.color = "green";
  passwordInput.value = "";
});

/* ===== CHART ===== */
function renderChart() {
  const ctx = document.getElementById("scoreChart");
  if (!ctx) return;

  const history = JSON.parse(localStorage.getItem("scoreHistory") || "[]");

  const labels = history.map(item => item.date);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Security Score",
        data: history.map(item => item.score),
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });

  chartTimeInfo.innerHTML = history
    .map(item => `🕒 ${item.datetime}`)
    .join("<br>");
}

/* ===== CONFIRM ===== */
confirmBtn.addEventListener("click", () => {
  const score = Number(scoreEl.textContent);
  if (score === 0) {
    confirmMsg.textContent = "⚠️ Vui lòng hoàn thành checklist";
    confirmMsg.style.color = "red";
    return;
  }

  const now = getCurrentDateTime();
  const date = getCurrentDate();

  const history = JSON.parse(localStorage.getItem("scoreHistory") || "[]");
  history.push({ score, date, datetime: now });
  localStorage.setItem("scoreHistory", JSON.stringify(history.slice(-5)));

  localStorage.setItem("previousChecklistDate", localStorage.getItem("lastChecklistDate"));
  localStorage.setItem("lastChecklistDate", now);

  document.getElementById("lastDate").textContent = now;
  document.getElementById("prevDate").textContent =
    localStorage.getItem("previousChecklistDate") || "Chưa có";

  analyzeBehavior();
  renderChart();

  confirmMsg.textContent = "✅ Checklist đã được lưu & phân tích";
  confirmMsg.style.color = "green";
});

/* ===== INIT ===== */
checkboxes.forEach(cb => cb.addEventListener("change", updateScore));

window.addEventListener("load", () => {
  updateScore();
  renderChart();
});
