// Skill Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Hiring

export type SkillCategory = "TECHNICAL" | "SOFT_SKILL";

export interface SkillRequest {
  skillName: string;
  category: SkillCategory;
}

export interface SkillResponse {
  skillId: number;
  skillName: string;
  category: SkillCategory;
}

