import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/api';

export const runtime = 'edge';

const API_URL = API_CONFIG.BASE_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔵 [register/route] Received request:', {
      email: body.email,
      hasPassword: !!body.password,
      hasConfirmPassword: !!body.confirmPassword
    });

    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('📡 [register/route] External API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: `${API_URL}/auth/register`
    });

    const data = await response.json();
    console.log('📥 [register/route] External API data:', {
      data,
      hasError: !!data.error,
      hasMessage: !!data.message,
      errorValue: data.error,
      messageValue: data.message
    });

    if (!response.ok) {
      // Handle error response - check both 'error' and 'message' fields
      let errorMessage = 'Registration failed';

      if (response.status === 409) {
        // 409 Conflict - email already exists
        errorMessage =
          data.error ||
          data.message ||
          'This email is already registered. Please use a different email or sign in.';
        console.log(
          '⚠️ [register/route] 409 Conflict - email already exists:',
          {
            dataError: data.error,
            dataMessage: data.message,
            finalErrorMessage: errorMessage
          }
        );
      } else {
        // Other errors
        errorMessage = data.error || data.message || 'Registration failed';
        console.log('❌ [register/route] Other error:', {
          status: response.status,
          dataError: data.error,
          dataMessage: data.message,
          finalErrorMessage: errorMessage
        });
      }

      const errorResponse = { error: errorMessage };
      console.log('📤 [register/route] Sending error response to client:', {
        errorResponse,
        status: response.status
      });

      return NextResponse.json(errorResponse, { status: response.status });
    }

    // Return success message - email verification is required
    const successResponse = {
      message: data.message || 'Registration successful',
      email: data.email || body.email,
      requiresVerification: true
    };
    console.log(
      '✅ [register/route] Sending success response:',
      successResponse
    );

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error('💥 [register/route] Exception caught:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
