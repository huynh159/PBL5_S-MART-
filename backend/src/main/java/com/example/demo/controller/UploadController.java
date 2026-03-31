package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class UploadController {
    
    public static String UPLOAD_DIRECTORY = System.getProperty("user.dir") + "/uploads";

    @PostMapping("/image")
    public ResponseEntity<java.util.Map<String, String>> uploadImage(@RequestParam("image") MultipartFile file) {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        if (file.isEmpty()) {
            response.put("message", "Vui lòng chọn file");
            return ResponseEntity.badRequest().body(response);
        }
        try {
            File uploadDir = new File(UPLOAD_DIRECTORY);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9\\.\\-]", "_");
            Path fileNameAndPath = Paths.get(UPLOAD_DIRECTORY, fileName);
            Files.write(fileNameAndPath, file.getBytes());
            // Return URL
            String url = "http://localhost:8080/uploads/" + fileName;
            response.put("url", url);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            e.printStackTrace();
            response.put("message", "Lỗi khi tải file");
            return ResponseEntity.status(500).body(response);
        }
    }
}
