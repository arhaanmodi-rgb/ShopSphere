const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: UserProfile;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

export function getStoredUser(): UserProfile | null {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile): void {
  localStorage.setItem("user", JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem("user");
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e: { msg?: string }) => e.msg || "").join(", ")
        : "Login failed. Please check your credentials.";
    throw new Error(errorMsg);
  }

  setToken(data.access_token);
  if (data.user) {
    setStoredUser(data.user);
  }

  return data;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map((e: { msg?: string }) => e.msg || "").join(", ")
        : "Registration failed. Please check your inputs.";
    throw new Error(errorMsg);
  }

  return data;
}

export async function getMe(): Promise<UserProfile> {
  const token = getToken();
  if (!token) {
    throw new Error("No authorization token found");
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    logout();
    throw new Error(data.detail || "Session expired");
  }

  setStoredUser(data);
  return data;
}

export function logout(): void {
  removeToken();
  removeStoredUser();
}

export function isLoggedIn(): boolean {
  return !!getToken();
}