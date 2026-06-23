package com.pbms.modules.operation.service;

import com.pbms.modules.operation.domain.MonthlyTicket;
import com.pbms.modules.operation.dto.MonthlyTicketDTO;
import com.pbms.modules.operation.repository.MonthlyTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import com.pbms.modules.operation.repository.VehicleTypeRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonthlyTicketService {

    private final MonthlyTicketRepository monthlyTicketRepository;
    private final VehicleTypeRepository vehicleTypeRepository;
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional(readOnly = true)
    public List<MonthlyTicketDTO> getAllTickets() {
        List<MonthlyTicket> tickets = monthlyTicketRepository.findAll();
        LocalDateTime now = com.pbms.common.utils.TimeProvider.now();

        return tickets.stream().map(ticket -> {
            String derivedStatus = ticket.getStatus();
            
            if ("ACTIVE".equals(derivedStatus)) {
                if (ticket.getValidUntil().isBefore(now)) {
                    derivedStatus = "EXPIRED";
                } else if (ChronoUnit.DAYS.between(now, ticket.getValidUntil()) <= 7) {
                    derivedStatus = "EXPIRING_SOON";
                }
            }

            return MonthlyTicketDTO.builder()
                    .id("MP-" + ticket.getId())
                    .user(ticket.getUser() != null ? ticket.getUser().getFullName() : "Guest")
                    .email(ticket.getUser() != null ? ticket.getUser().getEmail() : "")
                    .phone("") // phone doesn't exist on User
                    .plate(ticket.getPlate())
                    .type(ticket.getVehicleType() != null ? ticket.getVehicleType().getTypeName() : "N/A")
                    .status(derivedStatus)
                    .startDate(ticket.getValidFrom().format(FORMATTER))
                    .endDate(ticket.getValidUntil().format(FORMATTER))
                    .build();
        }).collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 1 * * ?") // Runs at 1:00 AM every day
    @Transactional
    public void expireMonthlyTickets() {
        log.info("Running expireMonthlyTickets cronjob...");
        List<MonthlyTicket> allTickets = monthlyTicketRepository.findAll();
        LocalDateTime now = com.pbms.common.utils.TimeProvider.now();

        for (MonthlyTicket ticket : allTickets) {
            if ("ACTIVE".equals(ticket.getStatus()) && ticket.getValidUntil().isBefore(now)) {
                ticket.setStatus("EXPIRED");
                monthlyTicketRepository.save(ticket);
                log.info("Monthly Ticket ID {} (Plate: {}) has been marked as EXPIRED", ticket.getId(), ticket.getPlate());
            }
        }
    }

    @Transactional
    public MonthlyTicketDTO createTicket(Map<String, Object> payload) {
        String plate = (String) payload.get("plateNumber");
        String vehicleTypeId = (String) payload.get("vehicleTypeId"); // Could be CAR or MOTORBIKE or numeric
        int months = payload.get("duration") != null ? Integer.parseInt(payload.get("duration").toString()) : 1;
        
        MonthlyTicket ticket = MonthlyTicket.builder()
                .plate(plate)
                .validFrom(com.pbms.common.utils.TimeProvider.now())
                .validUntil(com.pbms.common.utils.TimeProvider.now().plusMonths(months))
                .status("ACTIVE")
                .autoRenew(false)
                .build();
                
        // Fetch vehicleType if needed (simplification for mock data removal)
        monthlyTicketRepository.save(ticket);
        
        return MonthlyTicketDTO.builder()
                .id("MP-" + ticket.getId())
                .plate(ticket.getPlate())
                .status(ticket.getStatus())
                .startDate(ticket.getValidFrom().format(FORMATTER))
                .endDate(ticket.getValidUntil().format(FORMATTER))
                .build();
    }

    @Transactional
    public MonthlyTicketDTO renewTicket(Long id, int durationMonths) {
        MonthlyTicket ticket = monthlyTicketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vé tháng"));
                
        LocalDateTime newEndDate;
        if (ticket.getValidUntil().isAfter(com.pbms.common.utils.TimeProvider.now())) {
            newEndDate = ticket.getValidUntil().plusMonths(durationMonths);
        } else {
            newEndDate = com.pbms.common.utils.TimeProvider.now().plusMonths(durationMonths);
            ticket.setValidFrom(com.pbms.common.utils.TimeProvider.now());
            ticket.setStatus("ACTIVE");
        }
        ticket.setValidUntil(newEndDate);
        monthlyTicketRepository.save(ticket);
        
        return MonthlyTicketDTO.builder()
                .id("MP-" + ticket.getId())
                .plate(ticket.getPlate())
                .status(ticket.getStatus())
                .startDate(ticket.getValidFrom().format(FORMATTER))
                .endDate(ticket.getValidUntil().format(FORMATTER))
                .build();
    }
}
