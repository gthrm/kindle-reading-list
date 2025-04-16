import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    console.log('API/user: Received GET request');
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      console.log('API/user: No token found in cookies');
      return NextResponse.json(
        { message: 'Not authenticated', success: false },
        { status: 401 }
      )
    }

    console.log('API/user: Found token in cookies');
    
    try {
      // Получаем секретный ключ напрямую из переменных окружения
      const secret = process.env.NEXTAUTH_SECRET;
      console.log('API/user: NEXTAUTH_SECRET is', secret ? `${secret.substring(0, 3)}...` : 'undefined');
      
      if (!secret) {
        console.error('API/user: JWT secret is not set');
        throw new Error('JWT secret is not set');
      }
      
      // Используем jose для верификации токена
      const textEncoder = new TextEncoder();
      const secretKey = textEncoder.encode(secret);
      
      console.log('API/user: Verifying token with jose...');
      const { payload } = await jwtVerify(token, secretKey);
      console.log('API/user: Token verification successful, user ID:', payload.id);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true
        }
      })
      
      if (!user) {
        console.error('API/user: User not found with ID:', payload.id);
        return NextResponse.json(
          { message: 'User not found', success: false },
          { status: 404 }
        )
      }
      
      console.log('API/user: User found, returning data');
      return NextResponse.json({ user, success: true })
    } catch (error) {
      console.error('API/user: Token verification failed:', error);
      return NextResponse.json(
        { message: 'Invalid authentication token', success: false },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('API/user: Server error:', error)
    return NextResponse.json(
      { message: 'Server error', success: false },
      { status: 500 }
    )
  }
} 