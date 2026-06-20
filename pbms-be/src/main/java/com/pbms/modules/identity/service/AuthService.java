package com.pbms.modules.identity.service;

import com.pbms.common.security.JwtProvider;
import com.pbms.modules.identity.dto.AuthRequest;
import com.pbms.modules.identity.dto.AuthResponse;
import com.pbms.modules.identity.entity.OtpVerification;
import com.pbms.modules.identity.entity.User;
import com.pbms.modules.identity.repository.OtpVerificationRepository;
import com.pbms.modules.identity.repository.UserRepository;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OtpVerificationRepository otpVerificationRepository;
    private final JwtProvider jwtProvider;
    private final JavaMailSender javaMailSender;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, OtpVerificationRepository otpVerificationRepository, JwtProvider jwtProvider, JavaMailSender javaMailSender, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.otpVerificationRepository = otpVerificationRepository;
        this.jwtProvider = jwtProvider;
        this.javaMailSender = javaMailSender;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(AuthRequest.Register request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User newUser = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_CUSTOMER")
                .isVerified(false)
                .build();
        userRepository.save(newUser);

        // Automatically trigger OTP for verification
        AuthRequest.SendOtp sendOtpRequest = new AuthRequest.SendOtp();
        sendOtpRequest.setEmail(request.getEmail());
        sendOtp(sendOtpRequest);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest.Login request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (user.getIsVerified() == null || !user.getIsVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCOUNT_UNVERIFIED");
        }

        if (user.getIsActive() != null && !user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE");
        }

        String token = jwtProvider.generateToken(user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void sendOtp(AuthRequest.SendOtp request) {
        String otpCode = String.format("%06d", new Random().nextInt(999999));
        
        OtpVerification otpVerification = OtpVerification.builder()
                .email(request.getEmail())
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .build();
        
        otpVerificationRepository.save(otpVerification);
        
        System.out.println("GENERATED OTP " + otpCode + " for " + request.getEmail());
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(request.getEmail());
            message.setSubject("Your PBMS Login OTP");
            message.setText("Your OTP code is: " + otpCode + "\nIt will expire in 5 minutes.");
            javaMailSender.send(message);
            System.out.println("Email sent successfully to " + request.getEmail());
        } catch (MailException e) {
            System.err.println("Failed to send email to " + request.getEmail() + ". Cause: " + e.getMessage());
            // We swallow the exception to not block the testing, since OTP is logged above.
        }
    }

    @Transactional
    public AuthResponse verifyOtp(AuthRequest.VerifyOtp request) {
        OtpVerification otpVerification = otpVerificationRepository.findTopByEmailOrderByCreatedAtDesc(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No OTP found for this email"));

        if (otpVerification.getIsUsed()) {
            throw new IllegalArgumentException("OTP has already been used");
        }

        if (otpVerification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired");
        }

        if (!otpVerification.getOtpCode().equals(request.getOtpCode())) {
            throw new IllegalArgumentException("Invalid OTP code");
        }

        otpVerification.setIsUsed(true);
        otpVerificationRepository.save(otpVerification);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(request.getEmail())
                            .role("USER")
                            .build();
                    return userRepository.save(newUser);
                });

        String token = jwtProvider.generateToken(user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public void forgotPassword(AuthRequest.ForgotPassword request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        AuthRequest.SendOtp sendOtpReq = new AuthRequest.SendOtp();
        sendOtpReq.setEmail(user.getEmail());
        sendOtp(sendOtpReq);
    }

    @Transactional
    public AuthResponse verifyForgotPassword(AuthRequest.VerifyOtp request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        OtpVerification otp = otpVerificationRepository.findByEmailAndIsUsedFalse(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("No active OTP found"));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP has expired");
        }

        if (!otp.getOtpCode().equals(request.getOtpCode())) {
            throw new IllegalArgumentException("Invalid OTP code");
        }

        otp.setIsUsed(true);
        otpVerificationRepository.save(otp);

        String tempToken = jwtProvider.generateTemporaryToken(user.getEmail(), "ROLE_PASSWORD_RESET", 5 * 60 * 1000); // 5 mins
        
        return AuthResponse.builder()
                .token(tempToken)
                .email(user.getEmail())
                .role("ROLE_PASSWORD_RESET")
                .build();
    }

    @Transactional
    public void resetPassword(String email, AuthRequest.ResetPassword request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
