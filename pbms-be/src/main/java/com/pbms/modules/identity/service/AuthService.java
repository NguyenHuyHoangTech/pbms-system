package com.pbms.modules.identity.service;

import com.pbms.modules.identity.domain.User;
import com.pbms.modules.identity.dto.*;
import com.pbms.modules.identity.repository.UserRepository;

import com.pbms.common.service.EmailService;
import com.pbms.common.security.JwtProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtProvider tokenProvider;

    @Value("${google.client.id}")
    private String googleClientId;

    private static final long OTP_TTL_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 5;

    // In-memory OTP Store (Replaces Redis for local development without requiring Redis server)
    private final ConcurrentHashMap<String, OtpData> otpStore = new ConcurrentHashMap<>();

    private static class OtpData {
        String otpCode;
        long expiryTime;
        int attempts;

        OtpData(String otpCode, long expiryTime) {
            this.otpCode = otpCode;
            this.expiryTime = expiryTime;
            this.attempts = 0;
        }
    }

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role("CUSTOMER")
                .isVerified(false)
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        String otp = generateOtp();
        String cacheKey = "OTP:REGISTER:" + request.getEmail();
        long expiryTime = System.currentTimeMillis() + (OTP_TTL_MINUTES * 60 * 1000);
        
        // Save OTP to in-memory store
        otpStore.put(cacheKey, new OtpData(otp, expiryTime));

        // Send Email
        String htmlContent = "<h3>Your PBMS Verification Code</h3><p>Your OTP is: <b>" + otp + "</b>. It will expire in 5 minutes.</p>";
        emailService.sendHtmlEmail(request.getEmail(), "PBMS Account Verification", htmlContent);
        
        log.info("Generated OTP for {} is {}", request.getEmail(), otp);
    }

    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String cacheKey = "OTP:" + request.getPurpose() + ":" + request.getEmail();

        OtpData otpData = otpStore.get(cacheKey);
        
        if (otpData == null || System.currentTimeMillis() > otpData.expiryTime) {
            otpStore.remove(cacheKey);
            throw new IllegalArgumentException("OTP expired or invalid");
        }

        if (!otpData.otpCode.equals(request.getOtpCode())) {
            // Increment attempts
            otpData.attempts++;
            if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
                otpStore.remove(cacheKey);
                throw new IllegalArgumentException("Max OTP attempts reached. OTP invalidated.");
            }
            throw new IllegalArgumentException("Incorrect OTP Code");
        }

        // OTP is correct
        otpStore.remove(cacheKey);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("INACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if ("REGISTER".equals(request.getPurpose())) {
            user.setIsVerified(true);
            userRepository.save(user);
        }

        // Normalize role: avoid double ROLE_ prefix
        String authority = user.getRole().startsWith("ROLE_") ? user.getRole() : "ROLE_" + user.getRole();
        // Generate Real JWT Token
        String token = tokenProvider.generateToken(user.getEmail(), authority);
        
        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(token)
                .email(user.getEmail())
                .role(authority)
                .fullName(user.getFullName())
                .hasPassword(user.getPasswordHash() != null)
                .linkedGoogle(user.getGoogleId() != null)
                .needsPasswordSetup(false)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng"));

        if (!user.getIsVerified()) {
            // Allow SUPER_ADMIN seed accounts to bypass email verification
            boolean isSuperAdmin = user.getRole().equals("ROLE_SUPER_ADMIN") || user.getRole().equals("SUPER_ADMIN");
            if (!isSuperAdmin) {
                throw new IllegalArgumentException("Tài khoản chưa được xác thực. Vui lòng kiểm tra email và nhập mã OTP.");
            }
            // Auto-verify for admin accounts
            user.setIsVerified(true);
            userRepository.save(user);
        }

        if ("INACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a. Vui lÃ²ng liÃªn há»‡ quáº£n trá»‹ viÃªn.");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Email hoáº·c máº­t kháº©u khÃ´ng Ä‘Ãºng");
        }

        // Normalize role: avoid double ROLE_ prefix
        String authority = user.getRole().startsWith("ROLE_") ? user.getRole() : "ROLE_" + user.getRole();
        // Generate Real JWT
        String token = tokenProvider.generateToken(user.getEmail(), authority);

        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(token)
                .email(user.getEmail())
                .role(authority)
                .fullName(user.getFullName())
                .hasPassword(true)
                .linkedGoogle(user.getGoogleId() != null)
                .needsPasswordSetup(false)
                .build();
    }

    @Transactional
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.getGoogleIdToken());
        
        String email = payload.getEmail(); 
        String googleId = payload.getSubject();
        String fullName = (String) payload.get("name");

        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;
        boolean isNewUser = false;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();

            if ("INACTIVE".equals(user.getStatus())) {
                throw new IllegalArgumentException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            // Update Google ID if not set
            if (user.getGoogleId() == null) {
                user.setGoogleId(googleId);
                userRepository.save(user);
            }
        } else {
            // Create new Google User
            user = User.builder()
                    .email(email)
                    .googleId(googleId)
                    .fullName(fullName)
                    .role("CUSTOMER")
                    .isVerified(true) // Google users are pre-verified
                    .status("ACTIVE")
                    .build();
            userRepository.save(user);
            isNewUser = true;
        }

        // Normalize role: avoid double ROLE_ prefix
        String authority = user.getRole().startsWith("ROLE_") ? user.getRole() : "ROLE_" + user.getRole();
        String token = tokenProvider.generateToken(user.getEmail(), authority);
        boolean hasPassword = user.getPasswordHash() != null;

        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken(token)
                .email(user.getEmail())
                .role(authority)
                .fullName(user.getFullName())
                .hasPassword(hasPassword)
                .linkedGoogle(true)
                .needsPasswordSetup(isNewUser || !hasPassword) // Prompt setup for new Google users
                .build();
    }

    @Transactional
    public void setPassword(String email, SetPasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void linkGoogle(String email, GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = verifyGoogleToken(request.getGoogleIdToken());
        String googleId = payload.getSubject();

        // Check if googleId already exists
        // if (userRepository.findByGoogleId(googleId).isPresent()) throw ConflictException;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setGoogleId(googleId);
        userRepository.save(user);
    }

    @Transactional
    public void sendOtp(String email, String purpose) {
        String otp = generateOtp();
        String cacheKey = "OTP:" + (purpose != null ? purpose : "REGISTER") + ":" + email;
        long expiryTime = System.currentTimeMillis() + (OTP_TTL_MINUTES * 60 * 1000);
        
        otpStore.put(cacheKey, new OtpData(otp, expiryTime));

        String htmlContent = "<h3>M\u00e3 X\u00e1c Nh\u1eadn PBMS</h3><p>M\u00e3 OTP c\u1ee7a b\u1ea1n l\u00e0: <b style='font-size:24px;letter-spacing:4px'>" + otp + "</b></p><p>M\u00e3 s\u1ebd h\u1ebft h\u1ea1n sau 5 ph\u00fat.</p>";
        emailService.sendHtmlEmail(email, "[PBMS] M\u00e3 X\u00e1c Th\u1ef1c", htmlContent);
        
        log.info("Generated OTP for {} is {}", email, otp);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Kh\u00f4ng t\u00ecm th\u1ea5y t\u00e0i kho\u1ea3n v\u1edbi email n\u00e0y."));

        if (!user.getIsVerified()) {
            throw new IllegalArgumentException("T\u00e0i kho\u1ea3n ch\u01b0a \u0111\u01b0\u1ee3c x\u00e1c th\u1ef1c.");
        }

        String otp = generateOtp();
        String cacheKey = "OTP:FORGOT_PASSWORD:" + email;
        long expiryTime = System.currentTimeMillis() + (OTP_TTL_MINUTES * 60 * 1000);
        otpStore.put(cacheKey, new OtpData(otp, expiryTime));

        String htmlContent = "<h3>PBMS Reset Password</h3><p>Your OTP: <b style='font-size:24px;letter-spacing:4px'>" + otp + "</b></p><p>Expires in 5 minutes.</p>";
        emailService.sendHtmlEmail(email, "[PBMS] \u0110\u1eb7t L\u1ea1i M\u1eadt Kh\u1ea9u", htmlContent);
        log.info("Forgot-password OTP for {} is {}", email, otp);
    }

    @Transactional
    public String verifyForgotPasswordOtp(String email, String otp) {
        String cacheKey = "OTP:FORGOT_PASSWORD:" + email;
        OtpData otpData = otpStore.get(cacheKey);

        if (otpData == null || System.currentTimeMillis() > otpData.expiryTime) {
            otpStore.remove(cacheKey);
            throw new IllegalArgumentException("M\u00e3 OTP \u0111\u00e3 h\u1ebft h\u1ea1n ho\u1eb7c kh\u00f4ng h\u1ee3p l\u1ec7.");
        }
        if (!otpData.otpCode.equals(otp)) {
            otpData.attempts++;
            if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
                otpStore.remove(cacheKey);
                throw new IllegalArgumentException("S\u1ed1 l\u1ea7n nh\u1eadp sai v\u01b0\u1ee3t qu\u00e1 gi\u1edbi h\u1ea1n. Vui l\u00f2ng y\u00eau c\u1ea7u m\u00e3 m\u1edbi.");
            }
            throw new IllegalArgumentException("M\u00e3 OTP kh\u00f4ng \u0111\u00fang. C\u00f2n " + (MAX_OTP_ATTEMPTS - otpData.attempts) + " l\u1ea7n th\u1eed.");
        }

        otpStore.remove(cacheKey);
        // Return a temp reset token (short-lived JWT)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return tokenProvider.generateToken(user.getEmail(), "RESET_PASSWORD");
    }

    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("M\u1eadt kh\u1ea9u ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 6 k\u00fd t\u1ef1.");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), new GsonFactory())
                    .setAudience(java.util.Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                return idToken.getPayload();
            } else {
                throw new IllegalArgumentException("Invalid Google ID Token");
            }
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new IllegalArgumentException("Google token verification failed", e);
        }
    }

    public String getOtpForTest(String email, String purpose) {
        String cacheKey = "OTP:" + purpose + ":" + email;
        OtpData otpData = otpStore.get(cacheKey);
        return otpData != null ? otpData.otpCode : "NOT_FOUND";
    }
}

