package com.pbms.modules.system.service;

import com.pbms.modules.system.domain.SystemConfig;
import com.pbms.modules.system.repository.SystemConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SystemConfigService {

    private final SystemConfigRepository repository;

    public SystemConfigService(SystemConfigRepository repository) {
        this.repository = repository;
    }

    public List<SystemConfig> getAllConfigs() {
        return repository.findAll();
    }

    public SystemConfig getConfigByKey(String key) {
        return repository.findByConfigKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Config not found with key: " + key));
    }

    @Transactional
    public SystemConfig createConfig(SystemConfig config) {
        if (repository.findByConfigKey(config.getConfigKey()).isPresent()) {
            throw new IllegalArgumentException("Config key already exists: " + config.getConfigKey());
        }
        return repository.save(config);
    }

    @Transactional
    public SystemConfig updateConfig(Long id, SystemConfig configDetails) {
        SystemConfig config = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Config not found with id: " + id));

        config.setConfigValue(configDetails.getConfigValue());
        config.setDescription(configDetails.getDescription());
        
        return repository.save(config);
    }

    @Transactional
    public void deleteConfig(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Config not found with id: " + id);
        }
        repository.deleteById(id);
    }

    public void testSmtpConnection(String email, String appPassword) {
        org.springframework.mail.javamail.JavaMailSenderImpl mailSender = new org.springframework.mail.javamail.JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(email);
        mailSender.setPassword(appPassword);

        java.util.Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        // Enforce 5000ms timeout
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");

        try {
            mailSender.testConnection();
        } catch (jakarta.mail.MessagingException e) {
            throw new IllegalArgumentException("SMTP Connection failed: " + e.getMessage());
        }
    }
}
