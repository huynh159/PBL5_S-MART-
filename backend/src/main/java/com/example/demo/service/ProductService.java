package com.example.demo.service;

import com.example.demo.dto.ProductDetailResponse;
import com.example.demo.dto.ProductRequest;
import com.example.demo.entity.Category;
import com.example.demo.entity.Product;
import com.example.demo.repository.ProductRepository;
import com.example.demo.repository.CartItemRepository;
import com.example.demo.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

    public Page<Product> getAllProducts(int page, int size, String search) {
        if (search != null && !search.isEmpty()) {
            return productRepository.findByNameContainingIgnoreCase(search, PageRequest.of(page, size));
        }
        return productRepository.findAll(PageRequest.of(page, size));
    }

    public Product getProductById(Integer id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public ProductDetailResponse getProductDetail(Integer id) {
        Product product = getProductById(id);

        // Tính tổng sold dựa vào OrderItem
        long totalSold = orderItemRepository.findByProductId(id)
                .stream()
                .mapToLong(oi -> oi.getQuantity())
                .sum();

        // Average rating sẽ được tính ở ReviewService + endpoint stats, ở đây có thể để 0 và frontend gọi riêng,
        // hoặc inject ReviewRepository/ReviewService. Để tránh vòng phụ thuộc, giữ 0 và để API stats phụ trách.
        return ProductDetailResponse.from(product, 0.0, totalSold);
    }

    public List<Product> getProductsByCategory(Integer categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public Product createProduct(ProductRequest request) {
        Category category = categoryService.getCategoryById(request.getCategoryId());

        Product product = Product.builder()
                .name(request.getName())
                .price(request.getPrice())
                .description(request.getDescription())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .brand(request.getBrand())
                .salePrice(request.getSalePrice())
                .sku(request.getSku())
                .status(request.getStatus())
                .variations(request.getVariations())
                .category(category)
                .build();

        return productRepository.save(product);
    }

    public Product updateProduct(Integer id, ProductRequest request) {
        Product existing = getProductById(id);
        Category category = categoryService.getCategoryById(request.getCategoryId());

        existing.setName(request.getName());
        existing.setPrice(request.getPrice());
        existing.setDescription(request.getDescription());
        existing.setStock(request.getStock());
        existing.setImageUrl(request.getImageUrl());
        existing.setBrand(request.getBrand());
        existing.setSalePrice(request.getSalePrice());
        existing.setSku(request.getSku());
        existing.setStatus(request.getStatus());
        existing.setVariations(request.getVariations());
        existing.setCategory(category);

        return productRepository.save(existing);
    }

    @Transactional
    public void deleteProduct(Integer id) {
        // Xóa sản phẩm khỏi tất cả giỏ hàng trước khi xóa/ẩn
        cartItemRepository.deleteByProductId(id);

        if (orderItemRepository.existsByProductId(id)) {
            // Thay vì ném lỗi khiến frontend báo "Lỗi khi xóa",
            // tự động chuyển trạng thái sản phẩm sang "HIDDEN" (Soft delete)
            Product product = getProductById(id);
            product.setStatus("HIDDEN");
            productRepository.save(product);
            return;
        }
        
        // Xóa sản phẩm chính
        productRepository.deleteById(id);
    }
}
