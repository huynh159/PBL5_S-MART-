package com.example.demo.config;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Kiểm tra xem database đã có tài khoản admin chưa
            if (!userRepository.existsByEmail("admin@gmail.com")) {
                User admin = User.builder()
                        .email("admin@gmail.com")
                        .password(passwordEncoder.encode("123456")) // Mật khẩu mặc định
                        .role("ADMIN") // Set quyền ADMIN
                        .isActive(true)
                        .isVerified(true) // Cho phép bỏ qua OTP
                        .build();

                userRepository.save(admin);
                System.out.println(">>> [SEEDER] Đã tạo tài khoản Admin mặc định: admin@gmail.com / 123456 <<<");
            }
        };
    }
}

