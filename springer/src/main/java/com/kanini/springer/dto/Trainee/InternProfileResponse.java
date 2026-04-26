package com.kanini.springer.dto.Trainee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternProfileResponse {
    private Long profileId;
    private Long userId;
    private String bio;
    private List<ProfileLink> profileLinks;
    private String updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileLink {
        private String platform;
        private String url;
    }
}
