const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
      result?.message ||
      "Something went wrong."
    );
  }

  return result;
}

export async function registerUser({ name, email, password, confirmPassword }) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, confirmPassword }),
  });
}

export async function loginUser({ email, password, rememberMe = false }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export async function demoLogin() {
  return request("/auth/demo", {
    method: "POST",
  });
}

export async function getCurrentUser(token) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logoutUser(token) {
  return request("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
