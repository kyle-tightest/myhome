'use server'

import { cookies } from 'next/headers'

// Hardcoded password for household
const APP_PASSWORD = process.env.APP_PASSWORD || 'grocery';

export async function login(formData: FormData) {
  const password = formData.get('password');
  
  if (password === APP_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set('grocery_auth', 'true', { 
      secure: process.env.NODE_ENV === 'production', 
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    return { success: true };
  }
  
  return { success: false, error: 'Invalid password' };
}
