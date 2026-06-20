import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const LoginScreen = () => {
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpStep, setOtpStep] = useState<1 | 2>(1);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSuccessAuth = (data: any) => {
    const { token, email: userEmail, role } = data.data;
    setAuth(token, userEmail, role);
    
    switch (role) {
      case 'ROLE_SUPER_ADMIN':
        navigate('/admin/users');
        break;
      case 'ROLE_MANAGER':
        navigate('/manager/building-profile');
        break;
      case 'ROLE_STAFF':
        navigate('/staff/shift-management');
        break;
      case 'ROLE_CUSTOMER':
        navigate('/customer/home');
        break;
      default:
        navigate('/login');
        break;
    }
  };

  const loginPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/login', { email, password });
      return response.data;
    },
    onSuccess: handleSuccessAuth,
    onError: (err: any) => {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message;
      
      if (status === 403 && message.includes('ACCOUNT_UNVERIFIED')) {
        setError('Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhập mã OTP để tiếp tục.');
        setLoginMethod('otp');
        setOtpStep(2);
      } else if (status === 403 && message.includes('ACCOUNT_INACTIVE')) {
        setError('Tài khoản đã bị khóa. Vui lòng liên hệ Admin.');
      } else {
        setError(message || 'Login failed. Please check your credentials.');
      }
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/register', { email, password, confirmPassword });
      return response.data;
    },
    onSuccess: () => {
      setSuccessMsg('Registration successful. An OTP has been sent to your email.');
      setError('');
      setView('login');
      setLoginMethod('otp');
      setOtpStep(2);
      setPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Registration failed.');
      setSuccessMsg('');
    }
  });

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/send-otp', { email });
      return response.data;
    },
    onSuccess: () => {
      setOtpStep(2);
      setError('');
      setSuccessMsg('OTP has been sent to your email.');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to send OTP');
      setSuccessMsg('');
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/verify-otp', { email, otpCode });
      return response.data;
    },
    onSuccess: handleSuccessAuth,
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Invalid OTP');
      setSuccessMsg('');
    }
  });

  // --- FORGOT PASSWORD MUTATIONS ---
  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/forgot-password', { email });
      return response.data;
    },
    onSuccess: () => {
      setForgotStep(2);
      setError('');
      setSuccessMsg('Mã OTP đã được gửi đến email của bạn.');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Không tìm thấy tài khoản.');
      setSuccessMsg('');
    }
  });

  const verifyForgotOtpMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/verify-forgot-password', { email, otpCode });
      return response.data;
    },
    onSuccess: (data) => {
      setTempToken(data.data.token);
      setForgotStep(3);
      setError('');
      setSuccessMsg('Xác thực thành công. Vui lòng nhập mật khẩu mới.');
      setOtpCode('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ.');
      setSuccessMsg('');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post('/auth/reset-password', { newPassword: password }, {
        headers: { Authorization: `Bearer ${tempToken}` }
      });
      return response.data;
    },
    onSuccess: () => {
      setSuccessMsg('Đổi mật khẩu thành công! Bạn có thể đăng nhập.');
      setError('');
      setView('login');
      setLoginMethod('password');
      setPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
      setSuccessMsg('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (view === 'register') {
      if (!email || !password || !confirmPassword) return setError('All fields are required');
      if (password !== confirmPassword) return setError('Passwords do not match');
      registerMutation.mutate();
    } else if (view === 'forgot-password') {
      if (forgotStep === 1) {
        if (!email) return setError('Email is required');
        forgotPasswordMutation.mutate();
      } else if (forgotStep === 2) {
        if (!otpCode) return setError('OTP is required');
        verifyForgotOtpMutation.mutate();
      } else if (forgotStep === 3) {
        if (!password || !confirmPassword) return setError('All fields are required');
        if (password !== confirmPassword) return setError('Passwords do not match');
        resetPasswordMutation.mutate();
      }
    } else {
      if (loginMethod === 'password') {
        if (!email || !password) return setError('Email and password are required');
        loginPasswordMutation.mutate();
      } else {
        if (otpStep === 1) {
          if (!email) return setError('Email is required');
          sendOtpMutation.mutate();
        } else {
          if (!otpCode) return setError('OTP is required');
          verifyOtpMutation.mutate();
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {view === 'register' ? 'Đăng ký Tài khoản' : view === 'forgot-password' ? 'Quên Mật khẩu' : 'PBMS Login'}
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{successMsg}</div>}

        {view === 'login' && (
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'password' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setLoginMethod('password'); setError(''); setSuccessMsg(''); }}
            >
              Mật khẩu
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === 'otp' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setLoginMethod('otp'); setOtpStep(1); setError(''); setSuccessMsg(''); }}
            >
              OTP
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field applies to all views EXCEPT Forgot Password Step 3 */}
          {(view !== 'forgot-password' || (view === 'forgot-password' && forgotStep !== 3)) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="user@example.com"
                disabled={loginPasswordMutation.isPending || registerMutation.isPending || sendOtpMutation.isPending || verifyOtpMutation.isPending || forgotStep > 1}
              />
            </div>
          )}

          {/* Register View */}
          {view === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
              >
                {registerMutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
              </button>
              <div className="text-center mt-4 text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button type="button" onClick={() => setView('login')} className="text-blue-600 font-medium hover:underline">
                  Đăng nhập
                </button>
              </div>
            </>
          )}

          {/* Forgot Password View */}
          {view === 'forgot-password' && (
            <>
              {forgotStep === 1 && (
                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
                >
                  {forgotPasswordMutation.isPending ? 'Đang gửi OTP...' : 'Gửi mã xác nhận'}
                </button>
              )}
              
              {forgotStep === 2 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP (6 số)</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tracking-widest text-center"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifyForgotOtpMutation.isPending}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
                  >
                    {verifyForgotOtpMutation.isPending ? 'Đang xác thực...' : 'Xác thực OTP'}
                  </button>
                </>
              )}

              {forgotStep === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
                  >
                    {resetPasswordMutation.isPending ? 'Đang đổi...' : 'Xác nhận đổi mật khẩu'}
                  </button>
                </>
              )}

              <div className="text-center mt-4 text-sm text-gray-600">
                <button type="button" onClick={() => { setView('login'); setForgotStep(1); }} className="text-gray-500 font-medium hover:underline">
                  Quay lại đăng nhập
                </button>
              </div>
            </>
          )}

          {/* Login Password View */}
          {view === 'login' && loginMethod === 'password' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="••••••••"
                />
                <div className="flex justify-end mt-1">
                   <button type="button" onClick={() => { setView('forgot-password'); setForgotStep(1); setError(''); setSuccessMsg(''); }} className="text-xs text-blue-600 hover:underline">
                    Quên mật khẩu?
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loginPasswordMutation.isPending}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
              >
                {loginPasswordMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <div className="text-center mt-4 text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => setView('register')} className="text-blue-600 font-medium hover:underline">
                  Đăng ký ngay
                </button>
              </div>
            </>
          )}

          {/* Login OTP View */}
          {view === 'login' && loginMethod === 'otp' && (
            <>
              {otpStep === 1 ? (
                <button
                  type="submit"
                  disabled={sendOtpMutation.isPending}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
                >
                  {sendOtpMutation.isPending ? 'Đang gửi...' : 'Gửi mã OTP'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP (6 số)</label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none tracking-widest text-center"
                      placeholder="123456"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifyOtpMutation.isPending}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 mt-2"
                  >
                    {verifyOtpMutation.isPending ? 'Đang xác thực...' : 'Xác thực & Đăng nhập'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpStep(1); setOtpCode(''); }}
                    className="w-full py-2 px-4 text-gray-500 hover:text-gray-800 text-sm font-medium mt-2"
                  >
                    Quay lại
                  </button>
                </>
              )}
            </>
          )}
        </form>

        {/* DEV BYPASS SECTION */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-center text-gray-400 font-mono mb-3 uppercase tracking-wider">
            Developer Quick Login Bypass
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleSuccessAuth({ data: { token: 'mock', email: 'mock_admin@pbms.com', role: 'ROLE_SUPER_ADMIN' } })}
              className="py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold rounded-lg transition-colors"
            >
              ADMIN
            </button>
            <button
              onClick={() => handleSuccessAuth({ data: { token: 'mock', email: 'mock_manager@pbms.com', role: 'ROLE_MANAGER' } })}
              className="py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
            >
              MANAGER
            </button>
            <button
              onClick={() => handleSuccessAuth({ data: { token: 'mock', email: 'mock_staff@pbms.com', role: 'ROLE_STAFF' } })}
              className="py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-bold rounded-lg transition-colors"
            >
              STAFF
            </button>
            <button
              onClick={() => handleSuccessAuth({ data: { token: 'mock', email: 'mock_customer@pbms.com', role: 'ROLE_CUSTOMER' } })}
              className="py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold rounded-lg transition-colors"
            >
              CUSTOMER
            </button>
            <button
              onClick={() => navigate('/tester/iot-mock')}
              className="py-2 bg-gray-800 hover:bg-black text-gray-200 text-xs font-bold rounded-lg transition-colors sm:col-span-2"
            >
              TESTER (IoT MOCK)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
