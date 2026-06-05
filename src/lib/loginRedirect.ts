/** Build a safe login URL that returns the user to `returnTo` after sign-in. */
export function loginRedirectUrl(returnTo: string = '/'): string {
  const safe =
    returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.startsWith('/login')
      ? returnTo
      : '/';
  return `/login?redirect=${encodeURIComponent(safe)}`;
}
