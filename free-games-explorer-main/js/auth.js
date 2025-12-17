const AUTH_STORAGE_KEY = "fge_user";

function getCurrentUser() {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function setCurrentUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        const current = window.location.pathname.split("/").pop() || "index.html";
        window.location.href = `login.html?redirect=${encodeURIComponent(current)}`;
        return null;
    }
    return user;
}

function updateHeaderAuthUI() {
    const user = getCurrentUser();

    const loginLink = document.querySelector(".login-btn");
    if (!loginLink) return;

    const headerRight = loginLink.closest(".header-right") || loginLink.parentElement;

    const existing = document.querySelector(".user-chip");
    if (existing) existing.remove();

    if (!user) {
        loginLink.textContent = "Log in";
        loginLink.setAttribute("href", "login.html");
        return;
    }

    const chip = document.createElement("div");
    chip.className = "user-chip";
    chip.textContent = `Hi, ${user.username}`;

    headerRight.insertBefore(chip, loginLink);

    loginLink.textContent = "Log out";
    loginLink.setAttribute("href", "#");

    loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
        window.location.href = "index.html";
    }, { once: true });
}

document.addEventListener("DOMContentLoaded", updateHeaderAuthUI);
