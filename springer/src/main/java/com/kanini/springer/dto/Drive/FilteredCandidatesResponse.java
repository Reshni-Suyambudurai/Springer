package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilteredCandidatesResponse {
    private Page<CandidateResponse> page;
    private List<Long> allCandidateIds;
}
