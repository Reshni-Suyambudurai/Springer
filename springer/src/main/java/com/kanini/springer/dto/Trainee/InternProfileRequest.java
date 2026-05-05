package com.kanini.springer.dto.Trainee;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class InternProfileRequest {
    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;

    @Size(max = 10, message = "Maximum 10 profile links allowed")
    private List<@Valid ProfileLink> profileLinks;

    @Data
    public static class ProfileLink {
        @NotBlank(message = "Platform name is required")
        @Size(max = 50, message = "Platform name cannot exceed 50 characters")
        private String platform;

        @NotBlank(message = "URL is required")
        @Size(max = 500, message = "URL cannot exceed 500 characters")
        @Pattern(regexp = "^https?://.*", message = "URL must start with http:// or https://")
        private String url;
    }
}
