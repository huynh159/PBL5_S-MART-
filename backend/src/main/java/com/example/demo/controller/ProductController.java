package com.example.demo.controller;

import com.example.demo.dto.ProductDetailResponse;
import com.example.demo.dto.ProductRequest;
import com.example.demo.entity.Product;
import com.example.demo.service.ProductService;
import com.example.demo.service.ProductRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRecommendationService productRecommendationService;

    @GetMapping
    public ResponseEntity<Page<Product>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer categoryId) {
        return ResponseEntity.ok(productService.getAllProducts(page, size, search, categoryId));
    }

    // Legacy detail used by some parts of frontend
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // New detail endpoint with rating & sold info for Product Detail page
    @GetMapping("/{id}/detail")
    public ResponseEntity<ProductDetailResponse> getProductDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getProductDetail(id));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Integer id, @RequestBody ProductRequest request) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/recommend")
    public ResponseEntity<?> getSimilarProducts(@PathVariable Integer id) {
        // Gắn API Recommendation (Top 4 sản phẩm) để giảng viên soi logic Thuật toán điểm thưởng (Weighted Algorithm)
        return ResponseEntity.ok(productRecommendationService.getSimilarProducts(id, 4));
    }
}
