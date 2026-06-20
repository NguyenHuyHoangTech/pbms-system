package com.pbms.modules.identity.controller;

import com.pbms.common.dto.ApiResponse;
import com.pbms.modules.identity.dto.AuthRequest;
import com.pbms.modules.identity.dto.AuthResponse;
import com.pbms.modules.identity.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody AuthRequest.Register request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", "Please check your email for the OTP"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody AuthRequest.Login request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody AuthRequest.SendOtp request) {
        authService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", "Please check your email"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody AuthRequest.VerifyOtp request) {
        AuthResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response, "OTP verified successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody AuthRequest.ForgotPassword request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully", "Please check your email for the OTP"));
    }

    @PostMapping("/verify-forgot-password")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyForgotPassword(@Valid @RequestBody AuthRequest.VerifyOtp request) {
        AuthResponse response = authService.verifyForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(response, "OTP verified successfully. Use the temporary token to reset password."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody AuthRequest.ResetPassword request, java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "Unauthorized"));
        }
        authService.resetPassword(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully", "You can now login with your new password"));
    }
}
