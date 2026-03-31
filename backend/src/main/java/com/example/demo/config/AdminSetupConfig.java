package com.example.demo.config;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSetupConfig implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@smart.com";
        String adminPassword = "Admin@123";
        
        System.out.println("Checking admin account...");
        
        User admin = userRepository.findByEmail(adminEmail).orElse(null);
        
        if (admin == null) {
            System.out.println("Admin not found. Creating a new admin account...");
            admin = new User();
            admin.setEmail(adminEmail);
        } else {
            System.out.println("Admin found. Updating password to ensure it is correct...");
        }
        
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole("ADMIN");
        admin.setIsActive(true);
        admin.setIsVerified(true);
        
        userRepository.save(admin);
        
        System.out.println("Admin account setup complete. Email: " + adminEmail + ", Password: " + adminPassword);
    }
}
