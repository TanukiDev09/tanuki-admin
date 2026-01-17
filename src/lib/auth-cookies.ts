import { cookies } from 'next/headers';

const TOKEN_NAME = 'token';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_DAY_MS / 1000,
    // expires: new Date(Date.now() + ONE_DAY_MS), // maxAge is usually sufficient and preferred
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function getAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}
