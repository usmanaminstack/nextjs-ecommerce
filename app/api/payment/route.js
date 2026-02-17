
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();

  // Normally you call your real payment gateway API here
  // We just redirect to a fake payment page
  return NextResponse.json({
    success: true,
    paymentUrl: 'https://example.com/payment?sessionId=' + body.sessionId
  });
}
