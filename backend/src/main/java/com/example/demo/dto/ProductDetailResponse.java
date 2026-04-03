package com.example.demo.dto;

import com.example.demo.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductDetailResponse {

    private Integer id;
    private String name;
    private Double price;
    private String description;
    private Integer stock;
    private String imageUrl;
    private List<String> imageUrls;
    private String brand;
    private Double salePrice;
    private String sku;
    private String status;
    private String variations;

    private double averageRating;
    private long totalSold;

    public static ProductDetailResponse from(Product product,
                                             Double averageRating,
                                             long totalSold) {
        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getPrice())
                .description(product.getDescription())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .imageUrls(product.getImageUrls())
                .brand(product.getBrand())
                .salePrice(product.getSalePrice())
                .sku(product.getSku())
                .status(product.getStatus())
                .variations(product.getVariations())
                .averageRating(averageRating != null ? averageRating : 0.0)
                .totalSold(totalSold)
                .build();
    }
}
