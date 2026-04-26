package com.kanini.springer.dto.Trainee;

import lombok.Data;

import java.util.List;

@Data
public class InternProfileRequest {
    private String bio;
    private List<ProfileLink> profileLinks;

    @Data
    public static class ProfileLink {
        private String platform;
        private String url;
    }
}
