package com.example.demo.service;

import com.example.demo.entity.Coupon;
import com.example.demo.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {
    private final CouponRepository couponRepository;

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    public Coupon getCouponById(Integer id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));
    }

    public Coupon applyCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Coupon not found"));

        if (!coupon.getIsActive() || coupon.getExpiryDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Coupon is invalid or expired");
        }

        return coupon;
    }

    public Coupon updateCoupon(Integer id, Coupon couponDetails) {
        Coupon existing = getCouponById(id);
        existing.setCode(couponDetails.getCode());
        existing.setDiscountPercent(couponDetails.getDiscountPercent());
        existing.setExpiryDate(couponDetails.getExpiryDate());
        existing.setIsActive(couponDetails.getIsActive());
        return couponRepository.save(existing);
    }

    public void deleteCoupon(Integer id) {
        couponRepository.deleteById(id);
    }
}

