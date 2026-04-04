package com.example.demo.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Integer productId;
    private Integer rating; // 1-5
    private String comment;
    private String images;
    private String variation;
    private Integer orderItemId;
}
