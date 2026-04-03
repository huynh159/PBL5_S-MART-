package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private Double price;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private Integer stock;

    private String imageUrl;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    private String brand;
    private Double salePrice;
    
    @Column(unique = true)
    private String sku;

    private String status; // "ACTIVE" or "HIDDEN"

    @Column(columnDefinition = "LONGTEXT")
    private String variations; // store sizes/colors as comma separated or JSON

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;
}
