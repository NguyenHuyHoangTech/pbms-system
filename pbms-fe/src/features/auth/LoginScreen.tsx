import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

type View = 'login' | 'register' | 'forgot-password' | 'setup-password';

export const LoginScreen = () => {
  const [view, setView] = useState<View>('login');
  const [regStep, setRegStep] = useState<1 | 2>(1);      // 1=form, 2=otp
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1=email, 2=otp, 3=new-password

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [setupToken, setSetupToken] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isOtpMode, setIsOtpMode] = useState(false); // login OTP mode

  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const clearMessages = () => { setError(''); setSuccessMsg(''); };

  const navigateByRole = (role: string) => {
    switch (role) {
      case 'ROLE_SUPER_ADMIN': navigate('/admin/users'); break;
      case 'ROLE_MANAGER': navigate('/manager/building-profile'); break;
      case 'ROLE_STAFF': navigate('/staff/shift-management'); break;
      case 'ROLE_CUSTOMER': navigate('/customer/home'); break;
      default: navigate('/login');
    }
  };

  const handleSuccessAuth = (data: any) => {
    const d = data.data;
    setAuth(d.accessToken, d.email, d.role, d.fullName, d.hasPassword, d.linkedGoogle);
    if (d.needsPasswordSetup) {
      setSetupToken(d.accessToken);
      setView('setup-password');
    } else {
      navigateByRole(d.role);
    }
  };

  // --- LOGIN ---
  const loginMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/login', { email, password })).data,
    onSuccess: handleSuccessAuth,
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setError(msg);
    }
  });

  // --- REGISTER ---
  const registerMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/register', { email, password, confirmPassword, fullName })).data,
    onSuccess: () => { setSuccessMsg('Đăng ký thành công! Mã OTP đã gửi đến email.'); setError(''); setRegStep(2); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Đăng ký thất bại.'); setSuccessMsg(''); }
  });

  const verifyRegisterOtpMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/verify-otp', { email, otpCode, purpose: 'REGISTER' })).data,
    onSuccess: (data) => { setSuccessMsg('Xác thực thành công! Chuyển đến trang đăng nhập.'); setError(''); setTimeout(() => goToLogin(), 1500); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Mã OTP không hợp lệ.'); }
  });

  // --- FORGOT PASSWORD ---
  const forgotMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/forgot-password', { email })).data,
    onSuccess: () => { setForgotStep(2); setSuccessMsg('Mã OTP đã gửi đến email.'); setError(''); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Không tìm thấy tài khoản.'); setSuccessMsg(''); }
  });

  const verifyForgotOtpMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/verify-forgot-password', { email, otpCode })).data,
    onSuccess: (data) => {
      setResetToken(data.data);
      setForgotStep(3);
      setOtpCode('');
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg('Xác thực thành công! Nhập mật khẩu mới.'); setError('');
    },
    onError: (err: any) => { setError(err.response?.data?.message || 'Mã OTP không hợp lệ.'); setSuccessMsg(''); }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/reset-password', { newPassword: password, confirmPassword }, { headers: { Authorization: `Bearer ${resetToken}` } })).data,
    onSuccess: () => { setSuccessMsg('Đổi mật khẩu thành công! Hãy đăng nhập.'); setError(''); setTimeout(() => goToLogin(), 1500); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Đổi mật khẩu thất bại.'); setSuccessMsg(''); }
  });

  // --- SEND OTP (resend) ---
  const sendOtpMutation = useMutation({
    mutationFn: async (purpose: string) => (await axiosClient.post('/auth/send-otp', { email, purpose })).data,
    onSuccess: () => { setSuccessMsg('Mã OTP mới đã được gửi đến email.'); setError(''); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Gửi OTP thất bại.'); }
  });

  // --- GOOGLE LOGIN ---
  const googleLoginMutation = useMutation({
    mutationFn: async (credential: string) => (await axiosClient.post('/auth/login/google', { googleIdToken: credential })).data,
    onSuccess: handleSuccessAuth,
    onError: (err: any) => { setError(err.response?.data?.message || 'Đăng nhập Google thất bại.'); }
  });

  // --- SETUP PASSWORD (after Google login) ---
  const setupPasswordMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/set-password', { newPassword: password, confirmPassword }, { headers: { Authorization: `Bearer ${setupToken}` } })).data,
    onSuccess: () => {
      const store = useAuthStore.getState();
      store.setAuth(setupToken, store.email!, store.role!, store.name || '', true, store.authProvider === 'GOOGLE');
      setSuccessMsg('Thiết lập mật khẩu thành công!');
      setTimeout(() => navigateByRole(useAuthStore.getState().role || ''), 1000);
    },
    onError: (err: any) => { setError(err.response?.data?.message || 'Thiết lập mật khẩu thất bại.'); }
  });

  const goToLogin = () => { setView('login'); setEmail(''); setPassword(''); setConfirmPassword(''); setOtpCode(''); setRegStep(1); setForgotStep(1); setIsOtpMode(false); clearMessages(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    if (view === 'login') {
      if (!email || !password) return setError('Vui lòng nhập email và mật khẩu.');
      loginMutation.mutate();
    } else if (view === 'register') {
      if (regStep === 1) {
        if (!email || !fullName || !password || !confirmPassword) return setError('Vui lòng điền đầy đủ thông tin.');
        if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
        if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');
        registerMutation.mutate();
      } else {
        if (!otpCode) return setError('Vui lòng nhập mã OTP.');
        verifyRegisterOtpMutation.mutate();
      }
    } else if (view === 'forgot-password') {
      if (forgotStep === 1) {
        if (!email) return setError('Vui lòng nhập email.');
        forgotMutation.mutate();
      } else if (forgotStep === 2) {
        if (!otpCode) return setError('Vui lòng nhập mã OTP.');
        verifyForgotOtpMutation.mutate();
      } else {
        if (!password || !confirmPassword) return setError('Vui lòng nhập mật khẩu mới.');
        if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
        if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');
        resetPasswordMutation.mutate();
      }
    } else if (view === 'setup-password') {
      if (!password || !confirmPassword) return setError('Vui lòng nhập mật khẩu.');
      if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');
      if (password.length < 6) return setError('Mật khẩu phải có ít nhất 6 ký tự.');
      setupPasswordMutation.mutate();
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-800 placeholder-gray-400";
  const btnPrimary = "w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const btnSecondary = "text-sm text-blue-600 font-medium hover:underline disabled:opacity-50";
  const btnGhost = "text-sm text-gray-500 hover:text-gray-700 transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  const titles: Record<View, string> = {
    login: '🅿 PBMS Đăng nhập',
    register: 'Tạo tài khoản',
    'forgot-password': 'Quên mật khẩu',
    'setup-password': 'Thiết lập mật khẩu',
  };

  const isAnyPending = loginMutation.isPending || registerMutation.isPending || verifyRegisterOtpMutation.isPending || forgotMutation.isPending || verifyForgotOtpMutation.isPending || resetPasswordMutation.isPending || setupPasswordMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-md w-full m-4 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{titles[view]}</h2>

        {view === 'forgot-password' && (
          <div className="flex justify-center gap-2 mb-6 mt-3">
            {['Nhập email', 'Xác thực OTP', 'Mật khẩu mới'].map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${forgotStep > i + 1 ? 'bg-green-500 text-white' : forgotStep === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{forgotStep > i + 1 ? '✓' : i + 1}</div>
                {i < 2 && <div className={`w-8 h-0.5 ${forgotStep > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {view === 'register' && regStep === 1 && <p className="text-center text-sm text-gray-500 mb-5">Điền thông tin để tạo tài khoản mới</p>}
        {view === 'register' && regStep === 2 && <p className="text-center text-sm text-gray-500 mb-5">Nhập mã OTP đã gửi đến <span className="font-semibold text-gray-700">{email}</span></p>}
        {view === 'setup-password' && <p className="text-center text-sm text-gray-500 mb-5">Tài khoản Google đã được xác thực. Hãy thiết lập mật khẩu để đăng nhập bằng email sau này.</p>}

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2"><span>⚠️</span><span>{error}</span></div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2"><span>✅</span><span>{successMsg}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ============ LOGIN VIEW ============ */}
          {view === 'login' && (
            <>
              <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" disabled={isAnyPending} /></div>
              <div>
                <label className={labelCls}>Mật khẩu</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" disabled={isAnyPending} />
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => { setView('forgot-password'); setForgotStep(1); clearMessages(); }} className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</button>
                </div>
              </div>
              <button type="submit" disabled={isAnyPending} className={btnPrimary}>{loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
              <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div><div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">Hoặc</span></div></div>
              <div className="flex justify-center">
                <GoogleLogin onSuccess={cr => { if (cr.credential) googleLoginMutation.mutate(cr.credential); }} onError={() => setError('Đăng nhập Google thất bại.')} useOneTap theme="outline" size="large" text="signin_with" shape="rectangular" />
              </div>
              <p className="text-center mt-4 text-sm text-gray-500">Chưa có tài khoản? <button type="button" onClick={() => { setView('register'); clearMessages(); setRegStep(1); }} className={btnSecondary}>Đăng ký ngay</button></p>
            </>
          )}

          {/* ============ REGISTER VIEW ============ */}
          {view === 'register' && (
            <>
              <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" disabled={regStep === 2 || isAnyPending} /></div>
              <div><label className={labelCls}>Họ và tên</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" disabled={regStep === 2 || isAnyPending} /></div>
              <div><label className={labelCls}>Mật khẩu</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Ít nhất 6 ký tự" disabled={regStep === 2 || isAnyPending} /></div>
              <div><label className={labelCls}>Xác nhận mật khẩu</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="••••••••" disabled={regStep === 2 || isAnyPending} /></div>

              {regStep === 1 && <button type="submit" disabled={isAnyPending} className={btnPrimary}>{registerMutation.isPending ? 'Đang gửi mã OTP...' : 'Đăng ký & Lấy mã OTP'}</button>}

              {regStep === 2 && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <label className={labelCls}>Mã OTP (6 chữ số)</label>
                    <div className="flex gap-2">
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} className={`${inputCls} flex-1 tracking-widest text-center text-lg font-bold`} placeholder="123456" maxLength={6} autoFocus />
                      <button type="button" onClick={() => sendOtpMutation.mutate('REGISTER')} disabled={sendOtpMutation.isPending} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg whitespace-nowrap disabled:opacity-50">
                        {sendOtpMutation.isPending ? 'Đang gửi...' : 'Gửi lại'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isAnyPending} className={`${btnPrimary} !bg-green-600 hover:!bg-green-700`}>{verifyRegisterOtpMutation.isPending ? 'Đang xác nhận...' : 'Xác nhận & Hoàn tất'}</button>
                  <div className="text-center"><button type="button" onClick={() => { setRegStep(1); clearMessages(); }} className={btnGhost}>← Sửa thông tin</button></div>
                </div>
              )}
              <p className="text-center text-sm text-gray-500">Đã có tài khoản? <button type="button" onClick={() => goToLogin()} className={btnSecondary}>Đăng nhập</button></p>
            </>
          )}

          {/* ============ FORGOT PASSWORD VIEW ============ */}
          {view === 'forgot-password' && (
            <>
              {forgotStep === 1 && (
                <>
                  <div><label className={labelCls}>Email tài khoản</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" disabled={isAnyPending} /></div>
                  <button type="submit" disabled={isAnyPending} className={btnPrimary}>{forgotMutation.isPending ? 'Đang gửi OTP...' : 'Gửi mã xác nhận'}</button>
                </>
              )}
              {forgotStep === 2 && (
                <>
                  <div>
                    <label className={labelCls}>Mã OTP (6 chữ số)</label>
                    <div className="flex gap-2">
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} className={`${inputCls} flex-1 tracking-widest text-center text-lg font-bold`} placeholder="123456" maxLength={6} autoFocus />
                      <button type="button" onClick={() => sendOtpMutation.mutate('FORGOT_PASSWORD')} disabled={sendOtpMutation.isPending} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg whitespace-nowrap disabled:opacity-50">
                        {sendOtpMutation.isPending ? 'Đang gửi...' : 'Gửi lại'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isAnyPending} className={btnPrimary}>{verifyForgotOtpMutation.isPending ? 'Đang xác thực...' : 'Xác thực OTP'}</button>
                  <div className="text-center"><button type="button" onClick={() => { setForgotStep(1); setOtpCode(''); clearMessages(); }} className={btnGhost}>← Thay đổi email</button></div>
                </>
              )}
              {forgotStep === 3 && (
                <>
                  <div><label className={labelCls}>Mật khẩu mới</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Ít nhất 6 ký tự" disabled={isAnyPending} autoFocus /></div>
                  <div><label className={labelCls}>Xác nhận mật khẩu mới</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="••••••••" disabled={isAnyPending} /></div>
                  <button type="submit" disabled={isAnyPending} className={btnPrimary}>{resetPasswordMutation.isPending ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}</button>
                </>
              )}
              <div className="text-center"><button type="button" onClick={() => goToLogin()} className={btnGhost}>← Quay lại đăng nhập</button></div>
            </>
          )}

          {/* ============ SETUP PASSWORD (after Google login) ============ */}
          {view === 'setup-password' && (
            <>
              <div><label className={labelCls}>Mật khẩu mới</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Ít nhất 6 ký tự" disabled={isAnyPending} autoFocus /></div>
              <div><label className={labelCls}>Xác nhận mật khẩu</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="••••••••" disabled={isAnyPending} /></div>
              <button type="submit" disabled={isAnyPending} className={btnPrimary}>{setupPasswordMutation.isPending ? 'Đang thiết lập...' : 'Thiết lập mật khẩu'}</button>
              <div className="text-center">
                <button type="button" onClick={() => navigateByRole(useAuthStore.getState().role || '')} className={btnGhost}>Bỏ qua, vào hệ thống →</button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
};
