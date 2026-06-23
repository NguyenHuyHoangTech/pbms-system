package com.pbms.common.aspect;

import com.pbms.common.annotation.LogAudit;
import com.pbms.modules.identity.domain.User;
import com.pbms.modules.identity.repository.UserRepository;
import com.pbms.modules.system.domain.AuditLog;
import com.pbms.modules.system.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @AfterReturning(pointcut = "@annotation(logAudit)", returning = "result")
    public void logAfter(JoinPoint joinPoint, LogAudit logAudit, Object result) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User actor = null;
            if (auth != null && auth.getName() != null && !auth.getName().equals("anonymousUser")) {
                // Find user by email (which is set as principal name in JWT filter)
                actor = userRepository.findByEmail(auth.getName()).orElse(null);
            }

            String ipAddress = "";
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = request.getRemoteAddr();
            }

            // A very simple serialization for demo purposes. 
            // In a real scenario, use ObjectMapper to convert args to JSON.
            String newValue = Arrays.toString(joinPoint.getArgs());

            AuditLog auditLog = AuditLog.builder()
                    .actor(actor)
                    .action(logAudit.action())
                    .resource(logAudit.resource().isEmpty() ? joinPoint.getSignature().getDeclaringTypeName() : logAudit.resource())
                    .description(logAudit.description())
                    .newValue(newValue)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);
            
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
        }
    }
}
