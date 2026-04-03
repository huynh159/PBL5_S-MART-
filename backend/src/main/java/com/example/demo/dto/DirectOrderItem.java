package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DirectOrderItem {
    private Integer productId;
    private Integer quantity;
    private String color;
    private String size;
    private Double price;
}

