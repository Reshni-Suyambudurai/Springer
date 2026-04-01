package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Hiring.SkillRequest;
import com.kanini.springer.dto.Hiring.SkillResponse;
import com.kanini.springer.service.Hiring.ISkills;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Skills Management", description = "APIs for managing technical and soft skills")
public class SkillsController {
    
    private final ISkills skillService;
    
    /**
     * Create a new skill
     * POST /api/skills
     */
    @PostMapping
    @Operation(summary = "Create a new skill", description = "Creates a new skill with a unique name")
    public ResponseEntity<ApiResponse<SkillResponse>> createSkill(@Valid @RequestBody SkillRequest request) {
        SkillResponse response = skillService.createSkill(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill created successfully", response));
    }
    
    /**
     * Get skill by ID
     * GET /api/skills/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get skill by ID", description = "Retrieves a specific skill by its ID")
    public ResponseEntity<ApiResponse<SkillResponse>> getSkillById(@PathVariable Long id) {
        SkillResponse response = skillService.getSkillById(id);
        return ResponseEntity.ok(ApiResponse.success("Skill retrieved successfully", response));
    }
    
    /**
     * Get all skills
     * GET /api/skills
     */
    @GetMapping
    @Operation(summary = "Get all skills", description = "Retrieves all skills in the system")
    public ResponseEntity<ApiResponse<List<SkillResponse>>> getAllSkills() {
        List<SkillResponse> skills = skillService.getAllSkills();
        return ResponseEntity.ok(ApiResponse.success("Skills retrieved successfully", skills));
    }
    
    /**
     * Get skill by name
     * GET /api/skills/name/{skillName}
     */
    @GetMapping("/name/{skillName}")
    @Operation(summary = "Get skill by name", description = "Retrieves a skill by its exact name")
    public ResponseEntity<ApiResponse<SkillResponse>> getSkillByName(@PathVariable String skillName) {
        SkillResponse response = skillService.getSkillByName(skillName);
        return ResponseEntity.ok(ApiResponse.success("Skill retrieved successfully", response));
    }
    
    /**
     * Update skill
     * PUT /api/skills/{id}
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update skill", description = "Updates an existing skill's details")
    public ResponseEntity<ApiResponse<SkillResponse>> updateSkill(
            @PathVariable Long id,
            @Valid @RequestBody SkillRequest request) {
        SkillResponse response = skillService.updateSkill(id, request);
        return ResponseEntity.ok(ApiResponse.success("Skill updated successfully", response));
    }
    
    /**
     * Delete skill
     * DELETE /api/skills/{id}
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete skill", description = "Deletes a skill if not referenced in demands or candidates")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable Long id) {
        skillService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.success("Skill deleted successfully", null));
    }

    
}
