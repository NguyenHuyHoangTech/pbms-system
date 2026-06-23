package com.pbms.modules.incident.service;

import com.pbms.modules.incident.domain.IncidentTicket;
import com.pbms.modules.incident.dto.IncidentTicketRequest;
import com.pbms.modules.incident.repository.IncidentTicketRepository;
import com.pbms.modules.operation.domain.ParkingSession;
import com.pbms.modules.infrastructure.domain.RfidCard;
import com.pbms.modules.operation.repository.ParkingSessionRepository;
import com.pbms.modules.infrastructure.repository.RfidCardRepository;
import com.pbms.modules.infrastructure.repository.ZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pbms.modules.incident.dto.IncidentTicketDTO;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentTicketRepository incidentTicketRepository;
    private final ParkingSessionRepository sessionRepository;
    private final RfidCardRepository rfidCardRepository;
    private final ZoneRepository zoneRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public IncidentTicket createIncident(IncidentTicketRequest request) {
        ParkingSession session = null;
        if (request.getSessionId() != null) {
            session = sessionRepository.findById(request.getSessionId())
                    .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        }

        IncidentTicket ticket = IncidentTicket.builder()
                .session(session)
                .issueType(request.getIssueType())
                .priority(request.getPriority() != null ? request.getPriority() : "MEDIUM")
                .description(request.getDescription())
                .status("PENDING")
                .fineAmount(request.getFineAmount())
                .uploadedDocUrl(request.getUploadedDocUrl())
                .build();

        if (session != null) {
            if ("LPR_MISMATCH".equals(request.getIssueType()) && request.getCorrectPlateNumber() != null) {
                session.setPlate(request.getCorrectPlateNumber());
                if (session.getRfidCard() != null) {
                    session.getRfidCard().setAssignedPlate(request.getCorrectPlateNumber());
                }
                ticket.setStatus("RESOLVED");
                ticket.setResolvedAt(com.pbms.common.utils.TimeProvider.now());
                ticket.setResolutionNotes("Biển số đã được nhân viên cập nhật tay");
            } 
            else if ("LOST_CARD".equals(request.getIssueType())) {
                if (session.getRfidCard() != null) {
                    session.getRfidCard().setStatus("LOST");
                }
                if (request.getFineAmount() != null) {
                    session.setPenaltyFee(request.getFineAmount());
                }
            }
        }

        if ("ZONE_VIOLATION".equals(request.getIssueType())) {
            if (request.getExpectedZoneId() != null) {
                ticket.setExpectedZone(zoneRepository.findById(request.getExpectedZoneId()).orElse(null));
            }
            if (request.getActualZoneId() != null) {
                ticket.setActualZone(zoneRepository.findById(request.getActualZoneId()).orElse(null));
            }
            messagingTemplate.convertAndSend("/topic/alerts", "Cảnh báo vi phạm khu vực: " + request.getDescription());
        }

        return incidentTicketRepository.save(ticket);
    }

    // Cronjob running at 2:00 AM every day
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void handleOverstayVehicles() {
        log.info("Starting OVERSTAY checking cronjob...");
        List<ParkingSession> activeSessions = sessionRepository.findByStatus("ACTIVE");
        LocalDateTime now = com.pbms.common.utils.TimeProvider.now();

        for (ParkingSession session : activeSessions) {
            if (session.getTimeIn() != null) {
                long hoursInside = ChronoUnit.HOURS.between(session.getTimeIn(), now);
                if (hoursInside >= 72) { // 72 hours
                    IncidentTicket ticket = IncidentTicket.builder()
                            .session(session)
                            .issueType("OVERSTAY")
                            .priority("HIGH")
                            .description(String.format("Xe mang biển số %s đã đỗ quá 72 giờ (Thời gian vào: %s)", 
                                    session.getPlate(), session.getTimeIn().toString()))
                            .status("PENDING")
                            .build();
                    incidentTicketRepository.save(ticket);
                    log.warn("Created OVERSTAY incident for plate: {}", session.getPlate());
                    messagingTemplate.convertAndSend("/topic/alerts", "Phát hiện xe đỗ quá 72 giờ! Biển số: " + session.getPlate());
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<IncidentTicketDTO> getAllIncidents() {
        return incidentTicketRepository.findAllByOrderByIdDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IncidentTicketDTO resolveIncident(Long id, String resolutionNotes) {
        IncidentTicket ticket = incidentTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (!"PENDING".equals(ticket.getStatus())) {
            throw new IllegalStateException("Ticket is already resolved or in a different status");
        }

        ticket.setStatus("RESOLVED");
        ticket.setResolutionNotes(resolutionNotes);
        ticket.setResolvedAt(com.pbms.common.utils.TimeProvider.now());
        
        return mapToDTO(incidentTicketRepository.save(ticket));
    }

    /**
     * PUT /incidents/{id}/process-phase1
     * Staff duyet giai doan 1: Khoa phien do, chuyen sang cho check-out thu cong (GD2)
     */
    @Transactional
    public IncidentTicketDTO processPhase1(Long id) {
        IncidentTicket ticket = incidentTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket #" + id + " khong ton tai"));

        if (!"PENDING".equals(ticket.getStatus())) {
            throw new IllegalStateException("Ticket da duoc xu ly hoac khong o trang thai hop le");
        }

        ticket.setStatus("WAITING_CHECKOUT");
        ticket.setResolutionNotes("[GD1] Nhan vien da xac minh, dang cho thu tien va mo barrier.");

        log.info("Incident #{} moved to WAITING_CHECKOUT (Phase 1 approved)", id);
        messagingTemplate.convertAndSend("/topic/alerts",
                "[GD1 OK] Phien #" + id + " da khoa. Cho thu tien de mo barrier.");

        return mapToDTO(incidentTicketRepository.save(ticket));
    }

    /**
     * PUT /incidents/{id}/reject?reason=...
     * Tu choi xu ly ticket (ly do khong hop le, giay to sai)
     */
    @Transactional
    public IncidentTicketDTO rejectIncident(Long id, String reason) {
        IncidentTicket ticket = incidentTicketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket #" + id + " khong ton tai"));

        if ("RESOLVED".equals(ticket.getStatus()) || "REJECTED".equals(ticket.getStatus())) {
            throw new IllegalStateException("Ticket da o trang thai cuoi, khong the tu choi");
        }

        ticket.setStatus("REJECTED");
        ticket.setResolutionNotes("[TU CHOI] " + reason);
        ticket.setResolvedAt(com.pbms.common.utils.TimeProvider.now());

        log.info("Incident #{} REJECTED. Reason: {}", id, reason);
        return mapToDTO(incidentTicketRepository.save(ticket));
    }

    /**
     * POST /incidents/lost-card
     * Staff xu ly mat the: Danh dau the LOST + tinh phat
     */
    @Transactional
    public IncidentTicketDTO createLostCardIncident(String plate, BigDecimal fee) {
        ParkingSession session = sessionRepository.findByPlateAndStatus(plate.trim().toUpperCase(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException(
                        "Khong tim thay phien do xe ACTIVE cho bien so: " + plate));

        // Danh dau the bi mat
        if (session.getRfidCard() != null) {
            RfidCard card = session.getRfidCard();
            card.setStatus("LOST");
            rfidCardRepository.save(card);
        }

        // Cong phi phat vao phien
        BigDecimal fineAmount = fee != null ? fee : new BigDecimal("200000");
        session.setPenaltyFee(fineAmount);
        sessionRepository.save(session);

        IncidentTicket ticket = IncidentTicket.builder()
                .session(session)
                .issueType("LOST_CARD")
                .priority("HIGH")
                .description(String.format(
                        "Khach khai bao mat the. Bien so: %s. Phi phat: %s VND.",
                        plate, fineAmount.toPlainString()))
                .status("PENDING")
                .fineAmount(fineAmount)
                .build();

        log.info("LOST_CARD incident created for plate: {}, fine: {}", plate, fineAmount);
        messagingTemplate.convertAndSend("/topic/alerts",
                "[MAT THE] Bien so " + plate + " da bao mat the. Phi phat: " + fineAmount.toPlainString() + " VND");

        return mapToDTO(incidentTicketRepository.save(ticket));
    }

    /**
     * POST /incidents/adjust-fee
     * Manager can thiep dieu chinh phi cho phien do xe
     */
    @Transactional
    public IncidentTicketDTO adjustFeeIncident(String plate, BigDecimal liveFee, String reason) {
        ParkingSession session = sessionRepository.findByPlateAndStatus(plate.trim().toUpperCase(), "ACTIVE")
                .orElseThrow(() -> new IllegalArgumentException(
                        "Khong tim thay phien do xe ACTIVE cho bien so: " + plate));

        BigDecimal oldFee = session.getTotalFee();
        session.setTotalFee(liveFee);
        sessionRepository.save(session);

        String desc = String.format(
                "Manager dieu chinh phi. Bien so: %s | Phi cu: %s | Phi moi: %s VND | Ly do: %s",
                plate,
                oldFee != null ? oldFee.toPlainString() : "chua tinh",
                liveFee.toPlainString(),
                reason != null ? reason : "Khong co");

        IncidentTicket ticket = IncidentTicket.builder()
                .session(session)
                .issueType("FEE_ADJUSTMENT")
                .priority("MEDIUM")
                .description(desc)
                .status("RESOLVED")
                .fineAmount(liveFee)
                .resolvedAt(com.pbms.common.utils.TimeProvider.now())
                .resolutionNotes("[TU DONG] Gianh quyen can thiep phi boi Manager")
                .build();

        log.info("FEE_ADJUSTMENT incident: plate={}, newFee={}", plate, liveFee);
        return mapToDTO(incidentTicketRepository.save(ticket));
    }

    private IncidentTicketDTO mapToDTO(IncidentTicket ticket) {
        return IncidentTicketDTO.builder()
                .id(ticket.getId())
                .plateNumber(ticket.getSession() != null ? ticket.getSession().getPlate() : null)
                .issueType(ticket.getIssueType())
                .priority(ticket.getPriority())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .fineAmount(ticket.getFineAmount())
                .resolutionNotes(ticket.getResolutionNotes())
                .resolvedAt(ticket.getResolvedAt())
                .createdAt(ticket.getCreatedAt())
                .uploadedDocUrl(ticket.getUploadedDocUrl())
                .expectedZoneName(ticket.getExpectedZone() != null ? ticket.getExpectedZone().getZoneName() : null)
                .actualZoneName(ticket.getActualZone() != null ? ticket.getActualZone().getZoneName() : null)
                .build();
    }
}
