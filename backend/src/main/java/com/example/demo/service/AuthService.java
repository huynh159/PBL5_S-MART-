package com.example.demo.service;

import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.VerifyOtpRequest;
import com.example.demo.dto.ForgotPasswordRequest;
import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.GoogleLoginRequest;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.AuthResponse;

public interface AuthService {
    MessageResponse register(RegisterRequest request);
    MessageResponse verifyOtp(VerifyOtpRequest request);
    MessageResponse forgotPassword(ForgotPasswordRequest request);
    MessageResponse resetPassword(ResetPasswordRequest request);
    AuthResponse googleLogin(GoogleLoginRequest request);
    AuthResponse login(LoginRequest request);
}
