import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Remove the token cookie
    cookieStore.set('token', '', {
      expires: new Date(0),
      httpOnly: true,
      path: '/',
    })
    
    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Error logging out' },
      { status: 500 }
    )
  }
} 