package com.example.demo.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductRequest {
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
    private Integer categoryId;
}
