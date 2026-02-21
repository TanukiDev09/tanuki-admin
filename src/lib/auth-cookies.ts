import { cookies } from 'next/headers';

const TOKEN_NAME = 'token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function setAuthCookie(token: string) {
  try {
    const cookieStore = await cookies();

    cookieStore.set(TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SEVEN_DAYS_MS / 1000, // 7 days in seconds
    });
  } catch (error) {
    console.error('[Auth Cookies] Error setting cookie:', error);
    throw error;
  }
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function getAuthCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}
