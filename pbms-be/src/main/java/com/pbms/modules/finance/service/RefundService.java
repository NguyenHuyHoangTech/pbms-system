package com.pbms.modules.finance.service;

import com.pbms.modules.finance.domain.RefundRequest;
import com.pbms.modules.finance.dto.RefundRequestDTO;
import com.pbms.modules.finance.repository.RefundRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRequestRepository refundRequestRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<RefundRequestDTO> getAllRefunds() {
        return refundRequestRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public void approveRefund(Long id) {
        RefundRequest request = refundRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hoàn tiền"));
        request.setStatus("REFUNDED");
        refundRequestRepository.save(request);

        // Bắn WebSocket thông báo
        messagingTemplate.convertAndSend("/topic/alerts", "Đơn hoàn tiền " + id + " đã được xử lý thành công.");
    }

    public void rejectRefund(Long id, String reason) {
        RefundRequest request = refundRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hoàn tiền"));
        request.setStatus("REJECTED");
        request.setRejectReason(reason);
        refundRequestRepository.save(request);

        // Bắn WebSocket thông báo
        messagingTemplate.convertAndSend("/topic/alerts", "Đơn hoàn tiền " + id + " bị từ chối: " + reason);
    }

    private RefundRequestDTO mapToDTO(RefundRequest req) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        return RefundRequestDTO.builder()
                .id("REF-" + req.getId())
                .customerName(req.getUser().getFullName() != null ? req.getUser().getFullName() : "Khách Hàng")
                .registeredName(req.getUser().getFullName() != null ? req.getUser().getFullName() : "Khách Hàng")
                .plateNumber("XX-XXXX.XX") // Mock fallback
                .bookingTime(req.getCreatedAt() != null ? req.getCreatedAt().format(formatter) : "")
                .expectedInTime(req.getCancelTime() != null ? req.getCancelTime().plusHours(1).format(formatter) : "")
                .cancelTime(req.getCancelTime() != null ? req.getCancelTime().format(formatter) : "")
                .paidAmount(req.getPaidAmount())
                .penaltyFee(req.getPenaltyFee())
                .refundAmount(req.getRefundAmount())
                .status(req.getStatus())
                .bankName(req.getBankName())
                .accountNumber(req.getAccountNumber())
                .accountName(req.getAccountName())
                .rejectReason(req.getRejectReason())
                .proofUrl(req.getProofUrl())
                .build();
    }
    
    public void uploadProof(Long id, String proofUrl) {
        RefundRequest request = refundRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy yêu cầu hoàn tiền"));
        request.setProofUrl(proofUrl);
        refundRequestRepository.save(request);
    }
}
