package com.pbms.modules.identity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SetPasswordRequest {
    @NotBlank(message = "New password is required")
    private String newPassword;
}
