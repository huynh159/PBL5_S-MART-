package com.example.demo.service;

import com.example.demo.entity.Product;
import com.example.demo.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiChatService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;

    public AiChatService(ProductRepository productRepository) {
        this.productRepository = productRepository;
        this.restTemplate = new RestTemplate();
    }

    public String getResponseFromGemini(String userMessage) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        // 1. Lọc sản phẩm đơn giản để cải thiện RAG thay vì nhét toàn bộ data vào
        // Giới hạn 10 sản phẩm để tránh quá tải token và quá tải thông tin nhiễu
        List<Product> products = productRepository.findAll().stream().limit(10).collect(Collectors.toList());

        StringBuilder context = new StringBuilder("Bạn là nhân viên tư vấn bán hàng của shop S-Mart. " +
                "Bạn luôn thân thiện, nhiệt tình và tư vấn ngắn gọn. " +
                "Dưới đây là danh sách sản phẩm hiện có (chỉ tư vấn những sản phẩm này):\n");
        for (Product p : products) {
            context.append(String.format("- Tên: %s, Giá: %,.0f VNĐ, Kho: %d, Mô tả tắt: %s\n",
                    p.getName(), p.getPrice(), p.getStock(), 
                    p.getDescription() != null && p.getDescription().length() > 50 
                            ? p.getDescription().substring(0, 50) + "..." 
                            : p.getDescription()));
        }

        String finalPrompt = context.toString() + "\nKhách hàng hỏi: " + userMessage + "\nTrả lời:";

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        
        parts.put("text", finalPrompt);
        contents.put("parts", List.of(parts));
        requestBody.put("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> contentMap = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> partsList = (List<Map<String, Object>>) contentMap.get("parts");
                    return partsList.get(0).get("text").toString();
                }
            }
        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return "Hệ thống AI đang quá tải (hoặc API Key đã hết lượt gọi). Vui lòng gửi lại câu hỏi sau ít phút!";
            } else if (e.getMessage() != null && e.getMessage().contains("400")) {
                return "Cấu hình API Key của AI không đúng, vui lòng kiểm tra lại!";
            }
            return "Xin lỗi, hiện tại tôi không thể phản hồi. Bạn vui lòng liên hệ trực tiếp Admin để được hỗ trợ nhé! (Lỗi nội bộ: " + e.getMessage() + ")";
        }
        
        return "Xin lỗi hệ thống đang bị quá tải.";
    }
}
