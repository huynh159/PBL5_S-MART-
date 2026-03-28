package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coupon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 50)
    private String code;
    
    @Column(name = "discount_percent")
    private Integer discountPercent;
    
    @Column(name = "expiry_date")
    private LocalDate expiryDate;
    
    @Column(name = "is_active")
    private Boolean isActive;
}
