package com.example.demo.service.impl;

import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender javaMailSender;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã OTP Đăng Ký Tài Khoản Sport Shop");
        message.setText("Xin chào,\n\nMã OTP để xác thực tài khoản của bạn là: " + otp + "\n\nOTP sẽ hết hạn sau 5 phút.");
        
        javaMailSender.send(message);
    }
}

