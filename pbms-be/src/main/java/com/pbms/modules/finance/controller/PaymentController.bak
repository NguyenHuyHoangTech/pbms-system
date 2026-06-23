package com.pbms.modules.finance.controller;

import com.pbms.modules.operation.entity.ParkingSession;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.Data;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final ParkingSessionRepository sessionRepository;

    @Data
    public static class PaymentRequestDTO {
        private Long sessionId;
        private String gateway;
    }

    @PostMapping("/generate-link")
    @Transactional
    public ResponseEntity<?> generatePaymentLink(@RequestBody PaymentRequestDTO dto) {
        // Facade pattern: Simulate immediate success
        if (dto.getSessionId() != null) {
            ParkingSession session = sessionRepository.findById(dto.getSessionId())
                    .orElseThrow(() -> new RuntimeException("Session not found"));
            session.setStatus("PAID");
            sessionRepository.save(session);
        }

        // Return dummy URL
        String dummyUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?dummy=" + System.currentTimeMillis();
        return ResponseEntity.ok(dummyUrl);
    }
}
