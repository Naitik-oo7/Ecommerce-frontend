export function setCookie(name: string, value: string, maxAgeSeconds: number = 60 * 60 * 24 * 7) {
  const maxAgePart = maxAgeSeconds > 0 ? `; max-age=${maxAgeSeconds}` : '';
  document.cookie = `${name}=${value}; path=/${maxAgePart}; SameSite=Lax`;
}

export function removeCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}
