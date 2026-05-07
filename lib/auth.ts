interface UserInfo {
  name: string;
  email: string;
  preferred_username: string;
  roles: string[];
}

let _userInfo: UserInfo | null = null;

export const initKeycloak = (onAuthenticated: () => void): void => {
  fetch('/api/me')
    .then((res) => {
      // 401 = server present but not authenticated → redirect to login
      if (res.status === 401) {
        window.location.href = '/auth/login';
        return null;
      }
      // 404 = no server (static / GitHub Pages build) → proceed without auth
      if (!res.ok) return null;
      return res.json() as Promise<UserInfo>;
    })
    .then((data) => {
      if (data) _userInfo = data;
      onAuthenticated();
    })
    .catch(() => {
      // Network error or no server → proceed without auth
      onAuthenticated();
    });
};

export const getRoles = (): string[] => _userInfo?.roles ?? [];

export const hasRole = (_role: string): boolean => _userInfo !== null;

export const getUserInfo = (): UserInfo => _userInfo ?? {
  name: '',
  email: '',
  preferred_username: '',
  roles: [],
};

export const logout = (): void => {
  window.location.href = '/auth/logout';
};

export default { authenticated: _userInfo !== null };
