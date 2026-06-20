import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/v1/auth/send-otp', async ({ request }) => {
    const body = await request.json() as { email: string };
    if (!body.email) {
      return HttpResponse.json(
        { status: 'ERROR', code: 400, message: 'Email is required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      status: 'SUCCESS',
      code: 200,
      message: 'OTP sent successfully',
      data: 'Please check your email',
      timestamp: new Date().toISOString()
    });
  }),

  http.post('/api/v1/auth/verify-otp', async ({ request }) => {
    const body = await request.json() as { email: string, otpCode: string };
    if (body.otpCode === '123456') { // Mock correct OTP
      return HttpResponse.json({
        status: 'SUCCESS',
        code: 200,
        message: 'OTP verified successfully',
        data: {
          token: 'mocked-jwt-token-for-testing',
          email: body.email,
          role: 'MANAGER'
        },
        timestamp: new Date().toISOString()
      });
    }
    return HttpResponse.json(
      { status: 'ERROR', code: 400, message: 'Invalid OTP code' },
      { status: 400 }
    );
  }),

  http.get('/api/v1/system/building-profile', () => {
    return HttpResponse.json({
      status: 'SUCCESS',
      code: 200,
      message: 'Profile fetched successfully',
      data: {
        id: 1,
        name: 'PBMS Default Building',
        address: '123 Main St, City',
        hotline: '1800-123-456',
        operatingHours: '24/7',
        rules: '1. No smoking.'
      },
      timestamp: new Date().toISOString()
    });
  }),

  http.put('/api/v1/system/building-profile', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      status: 'SUCCESS',
      code: 200,
      message: 'Profile updated successfully',
      data: body,
      timestamp: new Date().toISOString()
    });
  }),
];
