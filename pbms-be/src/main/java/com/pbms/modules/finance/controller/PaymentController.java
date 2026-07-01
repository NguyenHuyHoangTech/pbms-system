package com.pbms.modules.finance.controller;

import com.pbms.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.pbms.modules.finance.strategy.PayPalStrategy;
import com.pbms.modules.finance.strategy.PayOsStrategy;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PayPalStrategy payPalStrategy;
    private final PayOsStrategy payOsStrategy;

    /**
     * POST /api/v1/payments/generate-link
     * Generate payment link
     */
    @PostMapping("/generate-link")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePaymentLink(@RequestBody Map<String, Object> requestBody) {
        try {
            Long sessionId = requestBody.get("sessionId") != null ? Long.valueOf(requestBody.get("sessionId").toString()) : null;
            Long reservationId = requestBody.get("reservationId") != null ? Long.valueOf(requestBody.get("reservationId").toString()) : null;
            Double amount = requestBody.get("amount") != null ? Double.valueOf(requestBody.get("amount").toString()) : 0.0;
            String gateway = (String) requestBody.get("gateway"); // VNPAY, PAYOS, PAYPAL

            Map<String, Object> response = new HashMap<>();
            
            String paymentUrl = "";
            String orderId = UUID.randomUUID().toString();
            String qrCode = null;

            if ("PAYOS".equalsIgnoreCase(gateway)) {
                Map<String, String> payosData = payOsStrategy.generatePayOsLink(amount, orderId);
                paymentUrl = payosData.get("checkoutUrl");
                qrCode = payosData.get("qrCode");
                orderId = payosData.get("orderCode"); // update orderId to the PayOS generated integer ID
            } else if ("PAYPAL".equalsIgnoreCase(gateway)) {
                orderId = "order_" + System.currentTimeMillis();
                paymentUrl = payPalStrategy.generatePaymentUrl(amount, orderId);
            } else {
                paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=" + orderId;
            }

            response.put("paymentUrl", paymentUrl);
            response.put("amount", amount);
            response.put("sessionId", sessionId);
            response.put("reservationId", reservationId);
            response.put("gateway", gateway);
            response.put("status", "PENDING");
            response.put("orderId", orderId);
            if (qrCode != null) {
                response.put("qrCode", qrCode);
            }

            return ResponseEntity.ok(ApiResponse.success(response, "Generated payment link successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Cannot generate payment link: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/payments/paypal/capture
     * Capture PayPal order
     */
    @PostMapping("/paypal/capture")
    public ResponseEntity<ApiResponse<Map<String, Object>>> capturePayPalOrder(@RequestBody Map<String, String> requestBody) {
        try {
            String token = requestBody.get("token");
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, "Token is required"));
            }
            boolean success = payPalStrategy.captureOrder(token);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("status", "COMPLETED"), "Payment captured successfully"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, "Payment capture failed"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/payments/payos/capture
     * Capture PayOS order
     */
    @PostMapping("/payos/capture")
    public ResponseEntity<ApiResponse<Map<String, Object>>> capturePayOsOrder(@RequestBody Map<String, String> requestBody) {
        try {
            String token = requestBody.get("token"); // orderCode
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, "Order code token is required"));
            }
            boolean success = payOsStrategy.captureOrder(token);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(Map.of("status", "COMPLETED"), "Payment captured successfully"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, "Payment capture failed or still pending"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }
}

