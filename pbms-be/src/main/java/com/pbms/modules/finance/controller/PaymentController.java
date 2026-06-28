package com.pbms.modules.finance.controller;

import com.pbms.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.pbms.modules.finance.strategy.PayPalStrategy;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PayPalStrategy payPalStrategy;

    /**
     * POST /api/v1/payments/generate-link
     * Sinh link thanh toan (Mock)
     */
    @PostMapping("/generate-link")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePaymentLink(@RequestBody Map<String, Object> requestBody) {
        try {
            Long sessionId = requestBody.get("sessionId") != null ? Long.valueOf(requestBody.get("sessionId").toString()) : null;
            Long reservationId = requestBody.get("reservationId") != null ? Long.valueOf(requestBody.get("reservationId").toString()) : null;
            Double amount = requestBody.get("amount") != null ? Double.valueOf(requestBody.get("amount").toString()) : 0.0;
            String gateway = (String) requestBody.get("gateway"); // VNPAY, PAYOS

            Map<String, Object> response = new HashMap<>();
            
            // Generate a fake payment link for testing or use PayPal
            String paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=" + UUID.randomUUID().toString();
            String orderId = UUID.randomUUID().toString();
            if ("PAYOS".equalsIgnoreCase(gateway)) {
                paymentUrl = "https://pay.payos.vn/web/" + orderId;
            } else if ("PAYPAL".equalsIgnoreCase(gateway)) {
                orderId = "order_" + System.currentTimeMillis();
                paymentUrl = payPalStrategy.generatePaymentUrl(amount, orderId);
            }

            response.put("paymentUrl", paymentUrl);
            response.put("amount", amount);
            response.put("sessionId", sessionId);
            response.put("reservationId", reservationId);
            response.put("gateway", gateway);
            response.put("status", "PENDING");

            return ResponseEntity.ok(ApiResponse.success(response, "Generated payment link successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Here's the payment link:" + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/payments/paypal/capture
     * XÃ¡c nháº­n Ä‘Æ¡n hÃ ng PayPal
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
                return ResponseEntity.ok(ApiResponse.success(Map.of("status", "COMPLETED"), "Payment is the same"));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(400, "Payment of goods or completion of goods"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Error: " + e.getMessage()));
        }
    }
}

