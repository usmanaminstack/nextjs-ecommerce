
import { NextResponse } from 'next/server';

export async function POST() {
  // Dummy session creation
  return NextResponse.json({
    sessionId: 'SESSION_' + Math.random().toString(36).substring(7)
  });
}
