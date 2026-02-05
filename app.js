const API_BASE_URL = "https://script.google.com/macros/s/AKfycbysVUoCaCqREw1GSvvSwuyE1unw6btxgMa9ooII2Jv4vqX6IuLoXP3GaJZ7u1XqMQax/exec";

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const forgotBtn = document.getElementById("forgotBtn");
const forgotModal = document.getElementById("forgotModal");
const closeModal = document.getElementById("closeModal");
const logoutBtn = document.getElementById("logoutBtn");
const switchTheme = document.getElementById("switchTheme");
const profileName = document.getElementById("profileName");
const profileRole = document.getElementById("profileRole");
const qrPreview = document.getElementById("qrPreview");
const devicesTable = document.querySelector("#devices .table");

let cachedDevices = [];

const storage = {
  get(key) {
    return JSON.parse(localStorage.getItem(key));
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

const apiUrl = (path, token) => {
  const params = new URLSearchParams({ path });
  if (token) {
    params.set("token", token);
  }
  return `${API_BASE_URL}?${params.toString()}`;
};

const apiRequest = async (path, options = {}) => {
  if (!API_BASE_URL || API_BASE_URL.includes("REPLACE_WITH")) {
    throw new Error("Vui lòng cập nhật API_BASE_URL trong app.js");
  }
  const session = storage.get("session");
  const headers = {
    "Content-Type": "text/plain;charset=utf-8",
    ...(options.headers || {}),
  };

  const response = await fetch(apiUrl(path, session?.token), {
    ...options,
    headers,
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Có lỗi xảy ra, vui lòng thử lại");
  }
  return data.data;
};

const login = (user, remember) => {
  const expiresAt = remember
    ? Date.now() + 3 * 24 * 60 * 60 * 1000
    : Date.now() + 2 * 60 * 60 * 1000;
  storage.set("session", { ...user, expiresAt });
  renderSession();
};

const renderSession = () => {
  const session = storage.get("session");
  if (session && session.expiresAt > Date.now()) {
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    profileName.textContent = session.name;
    profileRole.textContent = session.role;
    updateRoleUI(session.role);
    refreshDevices();
    return;
  }
  loginSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
};

const updateRoleUI = (role) => {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    if (role === "Người sử dụng" && item.dataset.tab === "users") {
      item.classList.add("hidden");
    } else if (role === "Manager" && item.dataset.tab === "settings") {
      item.classList.add("hidden");
    } else {
      item.classList.remove("hidden");
    }
  });
};

const renderDevices = (devices) => {
  if (!devicesTable) {
    return;
  }
  const rows = devicesTable.querySelectorAll(".table-row");
  rows.forEach((row, index) => {
    if (index !== 0) {
      row.remove();
    }
  });

  devices.forEach((device) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <span>${device.code || ""}</span>
      <span>${device.name || ""}</span>
      <span>${device.location || ""}</span>
      <span class="badge ${statusBadgeClass_(device.status)}">${device.status || ""}</span>
      <span>
        <button class="ghost" data-id="${device.id}">Cập nhật</button>
        <button class="ghost" data-id="${device.id}">Sửa</button>
      </span>
    `;
    devicesTable.appendChild(row);
  });

  updateQrPreview(devices[0]);
};

const statusBadgeClass_ = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("hỏng")) return "warning";
  if (value.includes("sửa")) return "info";
  return "success";
};

const updateQrPreview = (device) => {
  if (!qrPreview) {
    return;
  }
  qrPreview.innerHTML = "";
  if (!device) {
    return;
  }
  const qrText = device.qr_link || `${window.location.origin}?device=${device.id}`;
  new QRCode(qrPreview, {
    text: qrText,
    width: 120,
    height: 120,
  });
};

const refreshDevices = async () => {
  try {
    const devices = await apiRequest("devices", { method: "GET" });
    cachedDevices = devices;
    renderDevices(devices);
  } catch (error) {
    console.error(error);
  }
};

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const remember = document.getElementById("remember").checked;
  const savePassword = document.getElementById("savePassword").checked;

  try {
    const data = await apiRequest("login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (savePassword) {
      storage.set("savedCredentials", { email, password });
    } else {
      storage.remove("savedCredentials");
    }
    login(data, remember);
  } catch (error) {
    alert(error.message);
  }
});

const hideForgotModal = () => {
  forgotModal.classList.add("hidden");
};

forgotBtn.addEventListener("click", () => {
  forgotModal.classList.remove("hidden");
});

closeModal.addEventListener("click", hideForgotModal);

forgotModal.addEventListener("click", (event) => {
  if (event.target === forgotModal) {
    hideForgotModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideForgotModal();
  }
});

logoutBtn.addEventListener("click", () => {
  storage.remove("session");
  renderSession();
});

switchTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

const applySavedCredentials = () => {
  const saved = storage.get("savedCredentials");
  if (saved) {
    document.getElementById("email").value = saved.email;
    document.getElementById("password").value = saved.password;
    document.getElementById("savePassword").checked = true;
  }
};

const initTabs = () => {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((btn) => btn.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
      const target = document.getElementById(item.dataset.tab);
      if (target) {
        target.classList.add("active");
      }
    });
  });
};

applySavedCredentials();
initTabs();
renderSession();
