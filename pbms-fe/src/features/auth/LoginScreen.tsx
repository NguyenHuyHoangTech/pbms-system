import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../core/api/axiosClient';
import { useAuthStore } from '../../core/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

type View = 'login' | 'register' | 'forgot-password' | 'setup-password';

export const LoginScreen = () => {
  const [view, setView] = useState<View>('login');
  const [regStep, setRegStep] = useState<1 | 2>(1);      // 1=form, 2=otp
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1=email, 2=otp, 3=new-password
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const msg = err.response?.data?.message || err.message || 'Login Failed';
      setError(msg);
    }
  });

  // --- REGISTER ---
  const registerMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/register', { email, password, confirmPassword, fullName })).data,
    onSuccess: () => { setSuccessMsg('Registration Success! OTP sent to emaile'); setError(''); setRegStep(2); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Failede Registration'); setSuccessMsg(''); }
  });

  const verifyRegisterOtpMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/verify-otp', { email, otpCode, purpose: 'REGISTER' })).data,
    onSuccess: (data) => { setSuccessMsg('authentication Success! Go to Logine page'); setError(''); setTimeout(() => goToLogin(), 1500); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Invalid OTP code'); }
  });

  // --- FORGOT PASSWORD ---
  const forgotMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/forgot-password', { email })).data,
    onSuccess: () => { setForgotStep(2); setSuccessMsg('OTP sent to emaile'); setError(''); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Accounte not found'); setSuccessMsg(''); }
  });

  const verifyForgotOtpMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/verify-forgot-password', { email, otpCode })).data,
    onSuccess: (data) => {
      setResetToken(data.data);
      setForgotStep(3);
      setOtpCode('');
      setPassword('');
      setConfirmPassword('');
      setSuccessMsg('authentication Success! Enter new Passworde'); setError('');
    },
    onError: (err: any) => { setError(err.response?.data?.message || 'Invalid OTP code'); setSuccessMsg(''); }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/reset-password', { newPassword: password, confirmPassword }, { headers: { Authorization: `Bearer ${resetToken}` } })).data,
    onSuccess: () => { setSuccessMsg('Change Password Success! Please Logine'); setError(''); setTimeout(() => goToLogin(), 1500); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Change Password Failede'); setSuccessMsg(''); }
  });

  // --- SEND OTP (resend) ---
  const sendOtpMutation = useMutation({
    mutationFn: async (purpose: string) => (await axiosClient.post('/auth/send-otp', { email, purpose })).data,
    onSuccess: () => { setSuccessMsg('New OTP has been sent to emaile'); setError(''); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Send OTP Failede'); }
  });

  // --- GOOGLE LOGIN ---
  const googleLoginMutation = useMutation({
    mutationFn: async (credential: string) => (await axiosClient.post('/auth/login/google', { googleIdToken: credential })).data,
    onSuccess: handleSuccessAuth,
    onError: (err: any) => { setError(err.response?.data?.message || 'Login Google Failed.'); }
  });

  // --- SETUP PASSWORD (after Google login) ---
  const setupPasswordMutation = useMutation({
    mutationFn: async () => (await axiosClient.post('/auth/set-password', { newPassword: password, confirmPassword }, { headers: { Authorization: `Bearer ${setupToken}` } })).data,
    onSuccess: () => {
      const store = useAuthStore.getState();
      store.setAuth(setupToken, store.email!, store.role!, store.name || '', true, store.authProvider === 'GOOGLE');
      setSuccessMsg('Set up Password Success!');
      setTimeout(() => navigateByRole(useAuthStore.getState().role || ''), 1000);
    },
    onError: (err: any) => { setError(err.response?.data?.message || 'Password Failede Settings'); }
  });

  const goToLogin = () => { setView('login'); setEmail(''); setPassword(''); setConfirmPassword(''); setOtpCode(''); setRegStep(1); setForgotStep(1); setIsOtpMode(false); clearMessages(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); clearMessages();
    if (view === 'login') {
      if (!email || !password) return setError('Please enter your full email and Passworde');
      loginMutation.mutate();
    } else if (view === 'register') {
      if (regStep === 1) {
        if (!email || !password || !fullName || !confirmPassword) return setError('Please enter all required information');
        if (password !== confirmPassword) return setError('Password Confirm unavailable');
        if (!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,20}$/.test(password)) {
          return setError('Password must be between 8-20 characters, including uppercase, lowercase, numeric, and special characters');
        }
        registerMutation.mutate();
      } else {
        if (!otpCode) return setError('Please enter code,');
        verifyRegisterOtpMutation.mutate();
      }
    } else if (view === 'forgot-password') {
      if (forgotStep === 1) {
        if (!email) return setError('Please enter an emaile');
        forgotMutation.mutate();
      } else if (forgotStep === 2) {
        if (!otpCode) return setError('Please enter code,');
        verifyForgotOtpMutation.mutate();
      } else {
        if (!password || !confirmPassword) return setError('Please enter a new Passworde');
        if (password !== confirmPassword) return setError('Password Confirm unavailable');
        if (!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,20}$/.test(password)) {
          return setError('Password must be between 8-20 characters, including uppercase, lowercase, numeric, and special characters');
        }
        resetPasswordMutation.mutate();
      }
    } else if (view === 'setup-password') {
      if (!password || !confirmPassword) return setError('Please enter Passworde');
      if (password !== confirmPassword) return setError('Password Confirm unavailable');
      if (!/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_]).{8,20}$/.test(password)) {
        return setError('Password must be between 8-20 characters, including uppercase, lowercase, numeric, and special characters');
      }
      setupPasswordMutation.mutate();
    }
  };

  const inputCls = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-800 placeholder-gray-400";
  const btnPrimary = "w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const btnSecondary = "text-sm text-blue-600 font-medium hover:underline disabled:opacity-50";
  const btnGhost = "text-sm text-gray-500 hover:text-gray-700 transition-colors";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  const titles: Record<View, string> = {
    login: '🅿 PBMS Login',
    register: 'Create an account',
    'forgot-password': 'Lost your password?',
    'setup-password': 'Password Settings',
  };

  const isAnyPending = loginMutation.isPending || registerMutation.isPending || verifyRegisterOtpMutation.isPending || forgotMutation.isPending || verifyForgotOtpMutation.isPending || resetPasswordMutation.isPending || setupPasswordMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-md w-full m-4 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">{titles[view]}</h2>

        {view === 'forgot-password' && (
          <div className="flex justify-center gap-2 mb-6 mt-3">
            {['Enter Email', 'Authentication OTP', 'New Password '].map((label, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${forgotStep > i + 1 ? 'bg-green-500 text-white' : forgotStep === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{forgotStep > i + 1 ? '✓' : i + 1}</div>
                {i < 2 && <div className={`w-8 h-0.5 ${forgotStep > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}

        {view === 'register' && regStep === 1 && <p className="text-center text-sm text-gray-500 mb-5">Fill in the information to create a new account</p>}
        {view === 'register' && regStep === 2 && <p className="text-center text-sm text-gray-500 mb-5">Enter the OTP sent to <span className="font-semibold text-gray-700">{email}</span></p>}
        {view === 'setup-password' && <p className="text-center text-sm text-gray-500 mb-5">google account has been verified, please set up a Password to Login by email later</p>}

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2"><span>⚠️</span><span>{error}</span></div>}
        {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2"><span>✅</span><span>{successMsg}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ============ LOGIN VIEW ============ */}
          {view === 'login' && (
            <>
              <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" disabled={isAnyPending} /></div>
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="••••••••" disabled={isAnyPending} />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <button type="button" onClick={() => { setView('forgot-password'); setForgotStep(1); clearMessages(); }} className="text-xs text-blue-600 hover:underline">Forgot Passwordo</button>
                </div>
              </div>
              <button type="submit" disabled={isAnyPending} className={btnPrimary}>{loginMutation.isPending ? 'Logineee in progress' : 'Login'}</button>
              <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"/></div><div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">Or</span></div></div>
              <div className="flex justify-center">
                <GoogleLogin onSuccess={cr => { if (cr.credential) googleLoginMutation.mutate(cr.credential); }} onError={() => setError('Login Google Failed.')} useOneTap theme="outline" size="large" text="signin_with" shape="rectangular" />
              </div>
              <p className="text-center mt-4 text-sm text-gray-500">None Account? <button type="button" onClick={() => { setView('register'); clearMessages(); setRegStep(1); }} className={btnSecondary}>Apply Now</button></p>
            </>
          )}

          {/* ============ REGISTER VIEW ============ */}
          {view === 'register' && (
            <>
              <div><label className={labelCls}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" disabled={regStep === 2 || isAnyPending} /></div>
              <div><label className={labelCls}>Full name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} placeholder="Nguyen Van A" disabled={regStep === 2 || isAnyPending} /></div>
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="At least 6 characters" disabled={regStep === 2 || isAnyPending} />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="••••••••" disabled={regStep === 2 || isAnyPending} />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>

              {regStep === 1 && <button type="submit" disabled={isAnyPending} className={btnPrimary}>{registerMutation.isPending ? 'Sending OTPeee code' : 'Register & Obtain OTP'}</button>}

              {regStep === 2 && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <label className={labelCls}>OTP Code (6 digits)</label>
                    <div className="flex gap-2">
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} className={`${inputCls} flex-1 tracking-widest text-center text-lg font-bold`} placeholder="123456" maxLength={6} autoFocus />
                      <button type="button" onClick={() => sendOtpMutation.mutate('REGISTER')} disabled={sendOtpMutation.isPending} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg whitespace-nowrap disabled:opacity-50">
                        {sendOtpMutation.isPending ? 'Sendingieee' : 'Deliver Again'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isAnyPending} className={`${btnPrimary} !bg-green-600 hover:!bg-green-700`}>{verifyRegisterOtpMutation.isPending ? 'Confirmeee in progress' : 'Confirm & Finish'}</button>
                  <div className="text-center"><button type="button" onClick={() => { setRegStep(1); clearMessages(); }} className={btnGhost}>← Edit Info</button></div>
                </div>
              )}
              <p className="text-center text-sm text-gray-500">Already have an accounto <button type="button" onClick={() => goToLogin()} className={btnSecondary}>Login</button></p>
            </>
          )}

          {/* ============ FORGOT PASSWORD VIEW ============ */}
          {view === 'forgot-password' && (
            <>
              {forgotStep === 1 && (
                <>
                  <div><label className={labelCls}>Email Account</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="user@example.com" disabled={isAnyPending} /></div>
                  <button type="submit" disabled={isAnyPending} className={btnPrimary}>{forgotMutation.isPending ? 'Sending OTPeee' : 'Send Confirmation Code'}</button>
                </>
              )}
              {forgotStep === 2 && (
                <>
                  <div>
                    <label className={labelCls}>OTP Code (6 digits)</label>
                    <div className="flex gap-2">
                      <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} className={`${inputCls} flex-1 tracking-widest text-center text-lg font-bold`} placeholder="123456" maxLength={6} autoFocus />
                      <button type="button" onClick={() => sendOtpMutation.mutate('FORGOT_PASSWORD')} disabled={sendOtpMutation.isPending} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg whitespace-nowrap disabled:opacity-50">
                        {sendOtpMutation.isPending ? 'Sendingieee' : 'Deliver Again'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isAnyPending} className={btnPrimary}>{verifyForgotOtpMutation.isPending ? 'Validatingceee' : 'Authentication OTP'}</button>
                  <div className="text-center"><button type="button" onClick={() => { setForgotStep(1); setOtpCode(''); clearMessages(); }} className={btnGhost}>Change email</button></div>
                </>
              )}
              {forgotStep === 3 && (
                <>
                  <div>
                    <label className={labelCls}>New Password </label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="At least 6 characters" disabled={isAnyPending} autoFocus />
                      <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Confirm password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="••••••••" disabled={isAnyPending} />
                      <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isAnyPending} className={btnPrimary}>{resetPasswordMutation.isPending ? 'Ongoingueee' : 'Confirm Password Change'}</button>
                </>
              )}
              <div className="text-center"><button type="button" onClick={() => goToLogin()} className={btnGhost}>← Back to Login</button></div>
            </>
          )}

          {/* ============ SETUP PASSWORD (after Google login) ============ */}
          {view === 'setup-password' && (
            <>
              <div>
                <label className={labelCls}>New Password </label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="At least 6 characters" disabled={isAnyPending} autoFocus />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputCls} pr-10`} placeholder="••••••••" disabled={isAnyPending} />
                  <button type="button" tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isAnyPending} className={btnPrimary}>{setupPasswordMutation.isPending ? 'Setting upeee' : 'Password Settings'}</button>
              <div className="text-center">
                <button type="button" onClick={() => navigateByRole(useAuthStore.getState().role || '')} className={btnGhost}>Skip, go to System →</button>
              </div>
            </>
          )}

        </form>
      </div>
    </div>
  );
};
