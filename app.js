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

const users = [
  { email: "admin@school.edu", password: "Admin123", role: "Admin", name: "Nguyễn Văn A" },
  { email: "manager@school.edu", password: "Manager123", role: "Manager", name: "Trần Thị B" },
  { email: "user@school.edu", password: "User123", role: "Người sử dụng", name: "Lê Văn C" },
];

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
    if (qrPreview) {
      qrPreview.innerHTML = "";
      new QRCode(qrPreview, {
        text: `QLCSVC|${session.role}|LAB-122`,
        width: 120,
        height: 120,
      });
    }
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

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const remember = document.getElementById("remember").checked;
  const savePassword = document.getElementById("savePassword").checked;
  const user = users.find((item) => item.email === email && item.password === password);

  if (user) {
    if (savePassword) {
      storage.set("savedCredentials", { email, password });
    } else {
      storage.remove("savedCredentials");
    }
    login(user, remember);
  } else {
    alert("Sai thông tin đăng nhập. Vui lòng thử lại.");
  }
});

forgotBtn.addEventListener("click", () => {
  forgotModal.classList.remove("hidden");
});

closeModal.addEventListener("click", () => {
  forgotModal.classList.add("hidden");
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
