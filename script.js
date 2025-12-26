// ================== KHAI BÁO ==================
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const confirmBtn = document.getElementById("confirmChecklist");
const confirmMsg = document.getElementById("confirmMsg");

const changePasswordCb = document.getElementById("changePassword");
const passwordBox = document.getElementById("passwordBox");
const savePasswordBtn = document.getElementById("savePassword");
const passwordInput = document.getElementById("newPassword");
const passwordMsg = document.getElementById("passwordMsg");

const lastDateEl = document.getElementById("lastDate");
const prevDateEl = document.getElementById("prevDate");
const historyList = document.getElementById("historyList");
const behaviorWarning = document.getElementById("behaviorWarning");

// ================== THỜI GIAN ==================
function getCurrentDateTime() {
  return new Date().toLocaleString("vi-VN");
}

// ================== TÍNH ĐIỂM ==================
function updateScore() {
  let score = 0;

  checkboxes.forEach(cb => {
    if (cb.checked) score += Number(cb.dataset.score);
  });

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

  analyzeBehavior(score);
}

checkboxes.forEach(cb => cb.addEventListener("change", updateScore));

// ================== PHÂN TÍCH HÀNH VI ==================
function analyzeBehavior(score) {
  const twoFA = document.getElementById("twoFA");

  if (!twoFA.checked) {
    behaviorWarning.textContent =
      "⚠️ Bạn chưa bật 2FA – đây là rủi ro bảo mật lớn nhất hiện nay.";
  } else if (score < 50) {
    behaviorWarning.textContent =
      "⚠️ Thói quen bảo mật của bạn đang ở mức thấp, cần cải thiện.";
  } else if (score >= 80) {
    behaviorWarning.textContent =
      "✅ Thói quen bảo mật tốt, hãy duy trì thường xuyên.";
  } else {
    behaviorWarning.textContent = "";
  }
}

// ================== ĐỔI MẬT KHẨU ==================
changePasswordCb.addEventListener("change", () => {
  passwordBox.style.display = changePasswordCb.checked ? "block" : "none";
});

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

savePasswordBtn.addEventListener("click", async () => {
  const pwd = passwordInput.value;

  if (pwd.length < 8) {
    passwordMsg.textContent = "❌ Mật khẩu phải ≥ 8 ký tự";
    passwordMsg.style.color = "red";
    return;
  }

  const newHash = await hashPassword(pwd);
  const oldHash = localStorage.getItem("passwordHash");

  if (oldHash && newHash === oldHash) {
    passwordMsg.textContent = "❌ Không được dùng lại mật khẩu cũ";
    passwordMsg.style.color = "red";
    return;
  }

  localStorage.setItem("passwordHash", newHash);
  passwordMsg.textContent = "✅ Mật khẩu đã lưu an toàn";
  passwordMsg.style.color = "green";
  passwordInput.value = "";
});

// ================== LỊCH SỬ CHECKLIST ==================
function getHistory() {
  return JSON.parse(localStorage.getItem("checklistHistory")) || [];
}

function saveHistory(score) {
  const history = getHistory();
  history.push({
    time: getCurrentDateTime(),
    score
  });

  if (history.length > 5) history.shift();
  localStorage.setItem("checklistHistory", JSON.stringify(history));
}

function renderHistory() {
  historyList.innerHTML = "";
  getHistory().forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.time} — ${item.score} điểm`;
    historyList.appendChild(li);
  });
}

// ================== BIỂU ĐỒ ==================
function drawChart() {
  const canvas = document.getElementById("scoreChart");
  const ctx = canvas.getContext("2d");
  const history = getHistory();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (history.length < 2) return;

  const padding = 30;
  const stepX = (canvas.width - padding * 2) / (history.length - 1);

  ctx.beginPath();
  history.forEach((item, i) => {
    const x = padding + i * stepX;
    const y =
      canvas.height -
      padding -
      (item.score / 100) * (canvas.height - padding * 2);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    ctx.arc(x, y, 3, 0, Math.PI * 2);
  });

  ctx.strokeStyle = "#007bff";
  ctx.stroke();
}

// ================== XÁC NHẬN CHECKLIST ==================
confirmBtn.addEventListener("click", () => {
  const score = Number(scoreEl.textContent);

  if (score === 0) {
    confirmMsg.textContent = "⚠️ Vui lòng hoàn thành checklist trước";
    confirmMsg.style.color = "red";
    return;
  }

  const now = getCurrentDateTime();
  const last = localStorage.getItem("lastChecklistDate");

  if (last) localStorage.setItem("previousChecklistDate", last);
  localStorage.setItem("lastChecklistDate", now);

  lastDateEl.textContent = now;
  prevDateEl.textContent =
    localStorage.getItem("previousChecklistDate") || "Chưa có";

  saveHistory(score);
  renderHistory();
  drawChart();

  confirmMsg.textContent = "✅ Checklist đã được lưu thành công";
  confirmMsg.style.color = "green";
});

// ================== LOAD TRANG ==================
window.addEventListener("load", () => {
  lastDateEl.textContent =
    localStorage.getItem("lastChecklistDate") || "Chưa có";
  prevDateEl.textContent =
    localStorage.getItem("previousChecklistDate") || "Chưa có";

  renderHistory();
  drawChart();
});
