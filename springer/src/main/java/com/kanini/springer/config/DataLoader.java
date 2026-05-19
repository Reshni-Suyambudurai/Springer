package com.kanini.springer.config;

import com.kanini.springer.entity.HiringReq.*;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.enums.Enums.*;
import com.kanini.springer.entity.utils.EmailTemplate;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.InstituteProgramRepository;
import com.kanini.springer.repository.Hiring.ProgramRepository;
import com.kanini.springer.repository.Hiring.RoleRepository;
import com.kanini.springer.repository.Hiring.SkillRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Common.EmailTemplateRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data loader to seed initial/demo data into the database
 * 
 * IMPORTANT: This DataLoader is DISABLED in production environments.
 * In production, use Flyway migrations (V2__Seed_Data.sql) for data seeding.
 * 
 * Enable/Disable via property: app.data-loader.enabled
 * - Set to 'false' in production (application-prod.properties)
 * - Set to 'true' in dev/test (application-dev.properties, application-test.properties)
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(
    name = "app.data-loader.enabled",
    havingValue = "true",
    matchIfMissing = false  // Defaults to disabled if property not set
)
public class DataLoader {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final HiringCycleRepository hiringCycleRepository;
    private final InstituteRepository instituteRepository;
    private final SkillRepository skillRepository;
    private final ProgramRepository programRepository;
    private final InstituteProgramRepository instituteProgramRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final RoundTemplateRepository roundTemplateRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Transactional
    public CommandLineRunner loadData() {
        return args -> {
            log.info("Starting data seeding...");

            // Seed email templates independently so they can be restored
            // even when other master data already exists.
            if (emailTemplateRepository.count() == 0) {
                seedEmailTemplates();
            }

            // Check if main data already exists (check for TA_HEAD instead of just count)
            if (roleRepository.findByRoleName(RoleName.TA_HEAD).isPresent()) {
                log.info("Data already exists. Skipping seed data loading.");
                
                // Ensure INTERN role exists even on existing DBs
                if (roleRepository.findByRoleName(RoleName.INTERN).isEmpty()) {
                    roleRepository.save(createRole(RoleName.INTERN));
                    log.info("Seeded missing INTERN role");
                }
                return;
            }

            // 1. Seed Roles
            seedRoles();

            // 2. Seed Users
            seedUsers();

            // 3. Seed Hiring Cycles
            seedHiringCycles();

            // 4. Seed Institutes
            seedInstitutes();

            // 5. Seed Programs
            seedPrograms();

            // 6. Seed Institute Programs (relationships)
            seedInstitutePrograms();

            // 7. Seed Skills
            seedSkills();

            // 8. Seed Round Templates
            seedRoundTemplates();

            log.info("Data seeding completed successfully!");
        };
    }

    @Bean
    @Transactional
    public CommandLineRunner loadRoundTemplates() {
        return args -> {
            // Seed round templates independently if they don't exist
            if (roundTemplateRepository.count() == 0) {
                seedRoundTemplates();
            }
        };
    }

    private void seedRoles() {
        log.info("Seeding roles...");

        Role[] roles = {
            createRole(RoleName.TA_HEAD),
            createRole(RoleName.TA_MANAGER),
            createRole(RoleName.HIRING_MANAGER),
            createRole(RoleName.MEMBERS),
            createRole(RoleName.HR_OPERATIONS),
            createRole(RoleName.TRAINING_COORDINATOR),
            createRole(RoleName.BU_SPOC),
            createRole(RoleName.SYSTEM_ADMIN),
            createRole(RoleName.INTERN)
        };

        roleRepository.saveAll(java.util.Arrays.asList(roles));
        log.info("Seeded {} roles", roles.length);
    }

    private Role createRole(RoleName roleName) {
        Role role = new Role();
        role.setRoleName(roleName);
        role.setCreatedAt(LocalDateTime.now());
        return role;
    }

    private void seedUsers() {
        log.info("Seeding users...");

        // Get roles
        Role taHeadRole = roleRepository.findByRoleName(RoleName.TA_HEAD).orElseThrow();
        Role taManagerRole = roleRepository.findByRoleName(RoleName.TA_MANAGER).orElseThrow();
        Role hiringManagerRole = roleRepository.findByRoleName(RoleName.HIRING_MANAGER).orElseThrow();
        Role membersRole = roleRepository.findByRoleName(RoleName.MEMBERS).orElseThrow();
        Role adminRole = roleRepository.findByRoleName(RoleName.SYSTEM_ADMIN).orElseThrow();
        Role trainingCoordinatorRole = roleRepository.findByRoleName(RoleName.TRAINING_COORDINATOR).orElseThrow();
        Role internRole = roleRepository.findByRoleName(RoleName.INTERN).orElseThrow();
        // Create users
        User[] users = {
            createUser("Sudha", "sudha@kanini.com", "password123", "Talent Acquisition", "Chennai", taHeadRole),
            createUser("Mozhi", "mozhi@kanini.com", "password123", "Talent Acquisition", "Bangalore", taManagerRole),
            createUser("Priya", "priya@kanini.com", "password123", "Talent Acquisition", "Chennai", taManagerRole),
            createUser("Parthiban", "parthiban@kanini.com", "password123", "Product Engineering", "Bangalore", hiringManagerRole),
            createUser("Ramesh", "ramesh@kanini.com", "password123", "Product Engineering", "Coimbatore", membersRole),
            createUser("Priya Rajagopalan", "priya@kanini.com", "password@123", "Product Engineering", "Coimbatore", membersRole),
            createUser("Mozhiarasan", "mozhi@kanini.com", "password@123", "Product Engineering", "Coimbatore", membersRole),
            createUser("Praveen Kumar", "praveen@kanini.com", "password123", "Product Engineering", "Coimbatore", membersRole),
            createUser("Admin", "admin@kanini.com", "admin@123", "Data Analytics & AI", "Coimbatore", adminRole),
            createUser("Lavanya", "lavanya@kanini.com", "password123", "Data Analytics & AI", "Coimbatore", trainingCoordinatorRole),
            createUser("John", "john@kanini.com", "password123", "Training", "Coimbatore", internRole),
            createUser("Joe", "joe@kanini.com", "password123", "Training", "Coimbatore", internRole)
        };

        userRepository.saveAll(java.util.Arrays.asList(users));
        log.info("Seeded {} users", users.length);
    }

    private User createUser(String name, String email, String password, String department, String location, Role role) {
        User user = new User();
        user.setUsername(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password)); // Password encrypted with BCrypt
        user.setDepartment(department);
        user.setLocation(location);
        user.setRole(role);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }

    private void seedHiringCycles() {
        log.info("Seeding hiring cycles...");

        HiringCycle[] cycles = {
            createHiringCycle(2024, "2024 Campus Hiring", CycleStatus.CLOSED),
            createHiringCycle(2025, "2025 Campus Hiring", CycleStatus.CLOSED),
            createHiringCycle(2026, "2026 Campus Hiring", CycleStatus.OPEN)
        };

        hiringCycleRepository.saveAll(java.util.Arrays.asList(cycles));
        log.info("Seeded {} hiring cycles", cycles.length);
    }

    private HiringCycle createHiringCycle(int year, String name, CycleStatus status) {
        HiringCycle cycle = new HiringCycle();
        cycle.setCycleYear(year);
        cycle.setCycleName(name);
        cycle.setStatus(status);
        cycle.setCreatedAt(LocalDateTime.now());
        return cycle;
    }

    private void seedInstitutes() {
        log.info("Seeding institutes...");

        Institute[] institutes = {
            createInstitute("OTHERS", "TIER_1", "Tamil Nadu", "Chennai"),
            createInstitute("Anna University", "TIER_1", "Tamil Nadu", "Chennai"),
            createInstitute("SSN College of Engineering", "TIER_1", "Tamil Nadu", "Chennai"),
            createInstitute("PSG College of Technology", "TIER_2", "Tamil Nadu", "Coimbatore"),
            createInstitute("Amrita Vishwa Vidyapeetham", "TIER_1", "Tamil Nadu", "Coimbatore"),
            createInstitute("VIT University", "TIER_1", "Tamil Nadu", "Vellore"),
            createInstitute("SRM Institute of Science and Technology", "TIER_2", "Tamil Nadu", "Chennai"),
            createInstitute("Karunya Institute of Technology", "TIER_2", "Tamil Nadu", "Coimbatore"),
            createInstitute("CEG - College of Engineering Guindy", "TIER_1", "Tamil Nadu", "Chennai")
            
        };

        instituteRepository.saveAll(java.util.Arrays.asList(institutes));
        log.info("Seeded {} institutes", institutes.length);
    }

    private Institute createInstitute(String name, String tier, String state, String city) {
        Institute institute = new Institute();
        institute.setInstituteName(name);
        institute.setInstituteTier(InstituteTier.valueOf(tier));
        institute.setState(state);
        institute.setCity(city);
        institute.setIsActive(true);
        institute.setCreatedAt(LocalDateTime.now());
        return institute;
    }

    private void seedSkills() {
        log.info("Seeding skills...");

        // Technical Skills
        String[] technicalSkills = {
            // Programming Languages
            "Java", "Python", "JavaScript", "C++", "C#", "Go", "Rust",
            
            // Web Technologies
            "React", "Angular", "Vue.js", "Node.js", "Spring Boot", "HTML", "CSS",
            
            // Databases
            "MySQL", "PostgreSQL", "MongoDB", "Oracle", "SQL Server",
            
            // Cloud & DevOps
            "AWS", "Azure", "Docker", "Kubernetes", "Jenkins", "Git",
            
            // Data & AI
            "Machine Learning", "Data Analysis", "TensorFlow", "PyTorch", "Pandas",
            
            // Testing
            "Manual Testing", "Selenium", "JUnit", "Jest", "Cypress",
            
            // Others
            "ServiceNow", "Salesforce", "SAP"
        };

        for (String skillName : technicalSkills) {
            Skill skill = new Skill();
            skill.setSkillName(skillName);
            skill.setCategory(SkillCategory.TECHNICAL);
            skillRepository.save(skill);
        }

        // Soft Skills
        String[] softSkills = {
            "Communication", "Problem Solving", "Leadership", "Teamwork", 
            "Time Management", "Adaptability", "Critical Thinking", "Creativity"
        };

        for (String skillName : softSkills) {
            Skill skill = new Skill();
            skill.setSkillName(skillName);
            skill.setCategory(SkillCategory.SOFT_SKILL);
            skillRepository.save(skill);
        }

        log.info("Seeded {} technical skills and {} soft skills", technicalSkills.length, softSkills.length);
    }

    private void seedPrograms() {
        log.info("Seeding programs...");

        // Seed all available degree programs from the enum
        ProgramName[] programs = ProgramName.values();
        
        for (ProgramName programName : programs) {
            Program program = new Program();
            program.setProgramName(programName);
            programRepository.save(program);
        }

        log.info("Seeded {} programs", programs.length);
    }

    private void seedInstitutePrograms() {
        log.info("Seeding institute programs relationships...");

        // Get all institutes and programs
        List<Institute> institutes = instituteRepository.findAll();
        List<Program> programs = programRepository.findAll();

        // Anna University - offers B.Tech, M.Tech, MBA, PhD
        assignProgramsToInstitute(institutes, programs, "Anna University", 
            ProgramName.B_TECH, ProgramName.M_TECH, ProgramName.MBA, ProgramName.PHD);

        // SSN College of Engineering - offers B.E, M.E, M.Tech
        assignProgramsToInstitute(institutes, programs, "SSN College of Engineering", 
            ProgramName.B_E, ProgramName.M_E, ProgramName.M_TECH);

        // PSG College of Technology - offers B.E, M.E, MBA, MCA
        assignProgramsToInstitute(institutes, programs, "PSG College of Technology", 
            ProgramName.B_E, ProgramName.M_E, ProgramName.MBA, ProgramName.MCA);

        // Amrita Vishwa Vidyapeetham - offers B.Tech, M.Tech, MBA, PhD, MCA, M.Sc
        assignProgramsToInstitute(institutes, programs, "Amrita Vishwa Vidyapeetham", 
            ProgramName.B_TECH, ProgramName.M_TECH, ProgramName.MBA, ProgramName.PHD, ProgramName.MCA, ProgramName.M_SC);

        // VIT University - offers B.Tech, M.Tech, MBA, PhD, MCA
        assignProgramsToInstitute(institutes, programs, "VIT University", 
            ProgramName.B_TECH, ProgramName.M_TECH, ProgramName.MBA, ProgramName.PHD, ProgramName.MCA);

        // SRM Institute - offers B.Tech, M.Tech, MBA, BCA, MCA, BBA
        assignProgramsToInstitute(institutes, programs, "SRM Institute of Science and Technology", 
            ProgramName.B_TECH, ProgramName.M_TECH, ProgramName.MBA, ProgramName.BCA, ProgramName.MCA, ProgramName.BBA);

        // Karunya Institute - offers B.E, M.E, MBA, DIPLOMA
        assignProgramsToInstitute(institutes, programs, "Karunya Institute of Technology", 
            ProgramName.B_E, ProgramName.M_E, ProgramName.MBA, ProgramName.DIPLOMA);

        // CEG - College of Engineering Guindy - offers B.E, M.E, M.Tech, PhD
        assignProgramsToInstitute(institutes, programs, "CEG - College of Engineering Guindy", 
            ProgramName.B_E, ProgramName.M_E, ProgramName.M_TECH, ProgramName.PHD);

        log.info("Seeded institute-program relationships for {} institutes", institutes.size());
    }

    private void assignProgramsToInstitute(List<Institute> institutes, List<Program> programs, 
                                           String instituteName, ProgramName... programNames) {
        Institute institute = institutes.stream()
            .filter(i -> i.getInstituteName().contains(instituteName))
            .findFirst().orElse(null);
        
        if (institute != null) {
            for (ProgramName programName : programNames) {
                Program program = programs.stream()
                 .filter(p -> p.getProgramName() == programName)
                 .findFirst().orElse(null);
                
                if (program != null) {
                    InstituteProgram instituteProgram = new InstituteProgram();
                    instituteProgram.setInstitute(institute);
                    instituteProgram.setProgram(program);
                    instituteProgramRepository.save(instituteProgram);
                }
            }
        }
    }

    private void seedRoundTemplates() {
        log.info("Seeding round templates...");

        User createdBy = userRepository.findById(2L).orElse(null);

        // Round 1: Aptitude
        RoundTemplate aptitude = new RoundTemplate();
        aptitude.setRoundNo(1);
        aptitude.setRoundName("Aptitude Round");
        aptitude.setOutoffScore(120);
        aptitude.setMinScore(80);
        aptitude.setWeightage(40);
        aptitude.setSections("[{\"sectionName\":\"Technical\",\"outOf\":30},{\"sectionName\":\"Aptitude\",\"outOf\":20},{\"sectionName\":\"Verbal\",\"outOf\":20},{\"sectionName\":\"Logical\",\"outOf\":20},{\"sectionName\":\"Coding\",\"outOf\":30}]");
        aptitude.setIsActive(true);
        aptitude.setCreatedAt(LocalDateTime.now());
        aptitude.setCreatedBy(createdBy);

        // Round 2: Communication
        RoundTemplate communication = new RoundTemplate();
        communication.setRoundNo(2);
        communication.setRoundName("Communication Round");
        communication.setOutoffScore(100);
        communication.setMinScore(70);
        communication.setWeightage(40);
        communication.setSections("[{\"sectionName\":\"Listening\",\"outOf\":30},{\"sectionName\":\"Writing\",\"outOf\":30},{\"sectionName\":\"Speaking\",\"outOf\":40}]");
        communication.setIsActive(true);
        communication.setCreatedAt(LocalDateTime.now());
        communication.setCreatedBy(createdBy);

        // Round 3: Technical
        RoundTemplate technical = new RoundTemplate();
        technical.setRoundNo(3);
        technical.setRoundName("Technical Round");
        technical.setOutoffScore(100);
        technical.setMinScore(70);
        technical.setWeightage(30);
        technical.setSections("[{\"sectionName\":\"Problem_Solving\",\"outOf\":30},{\"sectionName\":\"Coding_Proficiency\",\"outOf\":30},{\"sectionName\":\"Communication_Skill\",\"outOf\":40}]");
        technical.setIsActive(true);
        technical.setCreatedAt(LocalDateTime.now());
        technical.setCreatedBy(createdBy);

        roundTemplateRepository.saveAll(java.util.Arrays.asList(aptitude, communication, technical));
        log.info("Seeded 3 round templates");
    }

    private void seedEmailTemplates() {
        log.info("Seeding email templates...");

        // ── Document Submission Link ──────────────────────────────────────────
        EmailTemplate submissionTemplate = new EmailTemplate();
        submissionTemplate.setTemplateName("DOCUMENT_SUBMISSION_LINK");
        submissionTemplate.setSubject("Action Required: Submit Your Documents \u2013 Kanini Software Solutions");
        submissionTemplate.setBody(
            "<!DOCTYPE html>" +
            "<html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'>" +
            "<title>Document Submission</title></head>" +
            "<body style='margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f0f2f5;padding:40px 20px;'>" +
            "<tr><td align='center'>" +
            "<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);'>" +

            "<!-- Header -->" +
            "<tr><td style='background:#0F4C81;padding:28px 40px;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
            "<td><img src='cid-right-logo' alt='Kanini Software Solutions' style='height:36px;display:block;'></td>" +
            "<td align='right' style='color:rgba(255,255,255,0.7);font-size:12px;'>Talent Acquisition</td>" +
            "</tr></table>" +
            "</td></tr>" +

            "<!-- Body -->" +
            "<tr><td style='padding:40px 40px 32px;'>" +
            "<p style='margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;'>Document Submission Request</p>" +
            "<h2 style='margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;'>Hello, {{CANDIDATE_NAME}}</h2>" +
            "<p style='margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;'>" +
            "Congratulations on your selection at <strong>Kanini Software Solutions</strong>. As part of your onboarding process, we kindly request you to submit the following documents at your earliest convenience." +
            "</p>" +

            "<!-- Document List -->" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;margin:0 0 28px;'>" +
            "<tr><td style='padding:16px 20px;border-bottom:1px solid #E5E7EB;'>" +
            "<p style='margin:0;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;'>Required Documents</p>" +
            "</td></tr>" +
            "<tr><td style='padding:16px 20px;'>" +
            "<ul style='margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;'>{{DOCUMENT_LIST}}</ul>" +
            "</td></tr></table>" +

            "<!-- CTA Button -->" +
            "<table cellpadding='0' cellspacing='0' style='margin:0 0 28px;'>" +
            "<tr><td style='background:#0F4C81;border-radius:6px;'>" +
            "<a href='{{SUBMISSION_LINK}}' style='display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;'>Submit Documents &rarr;</a>" +
            "</td></tr></table>" +

            "<!-- Deadline -->" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;margin:0 0 28px;'>" +
            "<tr><td style='padding:12px 16px;'>" +
            "<p style='margin:0;font-size:13px;color:#92400E;'>" +
            "<strong>&#9888; Submission Deadline:</strong>&nbsp;{{DEADLINE_DATE}}" +
            "</p></td></tr></table>" +

            "<p style='margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;'>" +
            "If you face any issues accessing the link or have questions, please reach out to us at " +
            "<a href='mailto:hrops.india@kanini.com' style='color:#0F4C81;text-decoration:none;font-weight:600;'>hrops.india@kanini.com</a>." +
            "</p>" +
            "<p style='margin:24px 0 0;font-size:14px;color:#374151;'>Warm regards,</p>" +
            "</td></tr>" +

            "<!-- Signature -->" +
            "<tr><td style='padding:0 40px 32px;'>" +
            "<img src='cid-signature' alt='HR Team Signature' style='height:60px;display:block;'>" +
            "</td></tr>" +

            "<!-- Footer -->" +
            "<tr><td style='background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
            "<td style='font-size:11px;color:#9CA3AF;line-height:1.6;'>" +
            "This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>" +
            "Please do not reply to this email. For assistance, contact <a href='mailto:hrops.india@kanini.com' style='color:#6B7280;'>hrops.india@kanini.com</a>" +
            "</td>" +
            "<td align='right' style='font-size:11px;color:#9CA3AF;white-space:nowrap;'>" +
            "&copy; 2026 Kanini Software Solutions" +
            "</td></tr></table>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>"
        );
        saveOrUpdateTemplate(submissionTemplate);

        // ── Document Rejection ────────────────────────────────────────────────
        EmailTemplate rejectionTemplate = new EmailTemplate();
        rejectionTemplate.setTemplateName("DOCUMENT_REJECTION");
        rejectionTemplate.setSubject("Document Resubmission Required \u2013 Kanini Software Solutions");
        rejectionTemplate.setBody(
            "<!DOCTYPE html>" +
            "<html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'>" +
            "<title>Document Resubmission</title></head>" +
            "<body style='margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f0f2f5;padding:40px 20px;'>" +
            "<tr><td align='center'>" +
            "<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);'>" +

            "<!-- Header -->" +
            "<tr><td style='background:#0F4C81;padding:28px 40px;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
            "<td><img src='cid-right-logo' alt='Kanini Software Solutions' style='height:36px;display:block;'></td>" +
            "<td align='right' style='color:rgba(255,255,255,0.7);font-size:12px;'>Talent Acquisition</td>" +
            "</tr></table>" +
            "</td></tr>" +

            "<!-- Body -->" +
            "<tr><td style='padding:40px 40px 32px;'>" +
            "<p style='margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;'>Document Review Update</p>" +
            "<h2 style='margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;'>Hello, {{CANDIDATE_NAME}}</h2>" +
            "<p style='margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;'>" +
            "Thank you for submitting your documents. After review, we found that the following document requires resubmission." +
            "</p>" +

            "<!-- Rejected Document -->" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;margin:0 0 20px;'>" +
            "<tr><td style='padding:16px 20px;border-bottom:1px solid #FECACA;'>" +
            "<p style='margin:0;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;'>Document Rejected</p>" +
            "</td></tr>" +
            "<tr><td style='padding:16px 20px;'>" +
            "<p style='margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;'>{{DOCUMENT_TYPE}}</p>" +
            "</td></tr></table>" +

            "<!-- Reason -->" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #6B7280;border-radius:0 6px 6px 0;margin:0 0 28px;'>" +
            "<tr><td style='padding:16px 20px;'>" +
            "<p style='margin:0 0 4px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;'>Reason for Rejection</p>" +
            "<p style='margin:0;font-size:14px;color:#374151;line-height:1.6;'>{{REJECTION_REASON}}</p>" +
            "</td></tr></table>" +

            "<!-- CTA Button -->" +
            "<p style='margin:0 0 16px;font-size:14px;color:#374151;'>Please upload a corrected version using the button below:</p>" +
            "<table cellpadding='0' cellspacing='0' style='margin:0 0 28px;'>" +
            "<tr><td style='background:#0F4C81;border-radius:6px;'>" +
            "<a href='{{RESUBMIT_LINK}}' style='display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;'>Resubmit Document &rarr;</a>" +
            "</td></tr></table>" +

            "<p style='margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;'>" +
            "For any queries, please contact us at " +
            "<a href='mailto:hrops.india@kanini.com' style='color:#0F4C81;text-decoration:none;font-weight:600;'>hrops.india@kanini.com</a>." +
            "</p>" +
            "<p style='margin:24px 0 0;font-size:14px;color:#374151;'>Warm regards,</p>" +
            "</td></tr>" +

            "<!-- Signature -->" +
            "<tr><td style='padding:0 40px 32px;'>" +
            "<img src='cid-signature' alt='HR Team Signature' style='height:60px;display:block;'>" +
            "</td></tr>" +

            "<!-- Footer -->" +
            "<tr><td style='background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0'><tr>" +
            "<td style='font-size:11px;color:#9CA3AF;line-height:1.6;'>" +
            "This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>" +
            "Please do not reply to this email. For assistance, contact <a href='mailto:hrops.india@kanini.com' style='color:#6B7280;'>hrops.india@kanini.com</a>" +
            "</td>" +
            "<td align='right' style='font-size:11px;color:#9CA3AF;white-space:nowrap;'>" +
            "&copy; 2026 Kanini Software Solutions" +
            "</td></tr></table>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>"
        );
        saveOrUpdateTemplate(rejectionTemplate);

        // ── Kanini On-Campus Drive ─────────────────────────────────────────────
        EmailTemplate onCampusTemplate = new EmailTemplate();
        onCampusTemplate.setTemplateName("KANINI ONCAMPUS DRIVE");
        onCampusTemplate.setSubject("Request to Conduct Kanini On-Campus Recruitment Drive");
        onCampusTemplate.setBody(
            "<p>Dear Sir/Madam,</p>" +
            "<p> Greetings from Kanini Software Solutions.</p>" +
            "<p>We hope you are doing well.</p>" +
            "<p>We are pleased to express our interest in conducting an <strong>On-Campus Recruitment Drive</strong> at your esteemed institution for the current graduating batch.</p>" +
            "<p>At Kanini Software Solutions, we continuously seek talented and enthusiastic graduates who can contribute to our growing organization. We believe that your institution has a strong pool of capable students, and we would be delighted to engage with them through this recruitment initiative.</p>" +
            "<p><br></p>" +
            "<p>Please find the proposed drive details below:</p>" +
            "<p>Drive Name: {{DRIVE_NAME}}</p>" +
            "<p>Proposed Drive Date: {{DRIVE_DATE}}</p>" +
            "<p>Venue/Location: {{LOCATION}}</p>" +
            "<p>Eligible Departments: {{ELIGIBLE_DEPARTMENTS}}</p>" +
            "<p><br></p>" +
            "<p>We kindly request your support in facilitating the recruitment process and coordinating the necessary arrangements for the drive.</p>" +
            "<p>Additionally, we request you to share the list of eligible students in the prescribed format for further processing.</p>" +
            "<p>Please let us know your confirmation and any additional requirements from our end to proceed with the coordination activities.</p>" +
            "<p>For any queries or further discussion, feel free to contact us at <a href=\"mailto:hrops.india@kanini.com\" rel=\"noopener noreferrer\" target=\"_blank\">hrops.india@kanini.com</a>.</p>" +
            "<p>We look forward to collaborating with your institution.</p>" +
            "<p style=\"text-align: right;\"><br></p>" +
            "<p style=\"text-align: right;\">Warm regards,</p>" +
            "<p style=\"text-align: right;\">Kanini Talent Acquisition Team</p>" +
            "<p style=\"text-align: right;\">Kanini Software Solutions</p>"
        );
        saveOrUpdateTemplate(onCampusTemplate);

        // ── Kanini Off-Campus Drive ────────────────────────────────────────────
        EmailTemplate offCampusTemplate = new EmailTemplate();
        offCampusTemplate.setTemplateName("KANINI OFFCAMPUS DRIVE");
        offCampusTemplate.setSubject("Invitation to Participate in Kanini Off-Campus Recruitment Drive");
        offCampusTemplate.setBody(
            "<p>Dear Sir/Madam,</p>" +
            "<p><br></p>" +
            "<p><strong>Greetings from Kanini Software Solutions.</strong></p>" +
            "<p>We are pleased to invite students from your esteemed institution to participate in our upcoming Off-Campus Recruitment Drive.</p>" +
            "<p>The drive is being organized to identify talented and aspiring graduates for opportunities at Kanini Software Solutions. We would be grateful if your institution could encourage eligible students to participate in the recruitment process.</p>" +
            "<p><br></p>" +
            "<p>Please find the drive details below:</p>" +
            "<p><br></p>" +
            "<p>Drive Date:</p>" +
            "<p>Drive Location:</p>" +
            "<p>Registration Deadline:</p>" +
            "<p><br></p>" +
            "<p>Kindly share the attached student details template with interested candidates and request them to complete the required information accurately.</p>" +
            "<p><br></p>" +
            "<p>Eligible students are advised to carry the necessary documents during the recruitment process, including:</p>" +
            "<p><br></p>" +
            "<p>\u2022 Updated Resume</p>" +
            "<p>\u2022 College ID Card</p>" +
            "<p>\u2022 Personal laptop</p>" +
            "<p><br></p>" +
            "<p>For any queries or clarification, please contact us at <a href=\"mailto:hrops.india@kanini.com\">hrops.india@kanini.com</a>.</p>" +
            "<p><br></p>" +
            "<p>We look forward to your institution's participation and continued collaboration.</p>" +
            "<p style=\"text-align: right;\"><br></p>" +
            "<p style=\"text-align: right;\">Warm regards,</p>" +
            "<p style=\"text-align: right;\"><em>Kanini Talent Acquisition Team</em></p>" +
            "<p style=\"text-align: right;\"><em>Kanini Software Solutions</em></p>" +
            "<p style=\"text-align: right;\"><br></p>" +
            "<p style=\"text-align: right;\"><img src=\"/siganture.png\"></p>"
        );
        saveOrUpdateTemplate(offCampusTemplate);

        // ── Kanini Shortlisted Invite ──────────────────────────────────────────
        EmailTemplate shortlistedTemplate = new EmailTemplate();
        shortlistedTemplate.setTemplateName("KANINI SHORTLISTED INVITE");
        shortlistedTemplate.setSubject("Shortlisted for Drive \u2013 Kanini Software Solutions");
        shortlistedTemplate.setBody(
            "<p>Dear {{CANDIDATE_NAME}},</p>" +
            "<p>Greetings from Kanini Software Solutions.</p>" +
            "<p>We are pleased to inform you that you have been successfully shortlisted to participate in the <strong>{{DRIVE_NAME}}</strong> recruitment drive.</p>" +
            "<p><br></p>" +
            "<p>Please find your drive details below:</p>" +
            "<p><em>Registration Code: </em><strong><em>{{REGISTRATION_CODE}}</em></strong></p>" +
            "<p><em>Drive Date: </em><strong><em>{{START_DATE}}</em></strong></p>" +
            "<p><em>Reporting Batch Time: </em><strong><em>{{BATCH_TIME}}</em></strong></p>" +
            "<p><em>Drive Location: </em><strong><em>{{LOCATION}}</em></strong></p>" +
            "<p><br></p>" +
            "<p>You are requested to report to the venue on time and carry the following documents for verification:</p>" +
            "<p><br></p>" +
            "<p>\u2022 Updated Resume</p>" +
            "<p>\u2022 College ID Card</p>" +
            "<p>\u2022 Personal Laptop for first round</p>" +
            "<p><br></p>" +
            "<p>Kindly ensure that you adhere to the reporting time and maintain professional attire throughout the recruitment process.</p>" +
            "<p>Please keep your Registration Code handy for future communication and verification purposes.</p>" +
            "<p><br></p>" +
            "<p>For any queries or assistance, feel free to contact us at <a href=\"mailto:hrops.india@kanini.com\">hrops.india@kanini.com</a>.</p>" +
            "<p>We wish you all the very best and look forward to meeting you during the drive.</p>" +
            "<p><br></p>" +
            "<p style=\"text-align: right;\">Warm regards,</p>" +
            "<p style=\"text-align: right;\">Kanini Talent Acquisition Team</p>" +
            "<p style=\"text-align: right;\">Kanini Software Solutions</p>" +
            "<p style=\"text-align: right;\"><img src=\"/siganture.png\"></p>"
        );
        saveOrUpdateTemplate(shortlistedTemplate);

        // ── Round Selected ─────────────────────────────────────────────────────
        EmailTemplate roundSelectedTemplate = new EmailTemplate();
        roundSelectedTemplate.setTemplateName("ROUND SELECTED");
        roundSelectedTemplate.setSubject("KANINI SELECTION UPDATE");
        roundSelectedTemplate.setBody(
            "<p>Dear {{NAME}},</p>" +
            "<p><br></p>" +
            "<p>Greetings from Kanini Software Solutions.</p>" +
            "<p><br></p>" +
            "<p>We are pleased to inform you that you have been selected in Round {{ROUND_NO}} of the recruitment process.</p>" +
            "<p><br></p>" +
            "<p>Further details will be shared shortly. Kindly stay prepared and keep checking your email for updates.</p>" +
            "<p><br></p>" +
            "<p>We congratulate you on your progress and wish you the very best.</p>" +
            "<p><br></p>" +
            "<p>Warm regards,</p>" +
            "<p>Kanini Talent Acquisition Team</p>" +
            "<p>Kanini Software Solutions</p>" +
            "<p><img src=\"/siganture.png\"></p>"
        );
        saveOrUpdateTemplate(roundSelectedTemplate);

        // ── Round Hold ─────────────────────────────────────────────────────────
        EmailTemplate roundHoldTemplate = new EmailTemplate();
        roundHoldTemplate.setTemplateName("ROUND HOLD");
        roundHoldTemplate.setSubject("KANINI DRIVE UPDATE");
        roundHoldTemplate.setBody(
            "<p>Dear {{NAME}},</p>" +
            "<p><br></p>" +
            "<p>Greetings from Kanini Software Solutions.</p>" +
            "<p><br></p>" +
            "<p>Thank you for participating in Round {{ROUND_NO}} of our recruitment process.</p>" +
            "<p><br></p>" +
            "<p>We would like to inform you that your profile is currently on hold for further evaluation. Our team is reviewing the next steps, and any updates regarding your candidature will be communicated to you shortly.</p>" +
            "<p><br></p>" +
            "<p>We appreciate your patience and continued interest in Kanini Software Solutions.</p>" +
            "<p><br></p>" +
            "<p>Warm regards,</p>" +
            "<p>Kanini Talent Acquisition Team</p>" +
            "<p>Kanini Software Solutions</p>" +
            "<p><img src=\"/siganture.png\"></p>"
        );
        saveOrUpdateTemplate(roundHoldTemplate);

        // ── Round Rejected ─────────────────────────────────────────────────────
        EmailTemplate roundRejectedTemplate = new EmailTemplate();
        roundRejectedTemplate.setTemplateName("ROUND REJECTED");
        roundRejectedTemplate.setSubject("KANINI DRIVE UPDATE");
        roundRejectedTemplate.setBody(
            "<p>Dear {{NAME}},</p>" +
            "<p><br></p>" +
            "<p>Greetings from Kanini Software Solutions.</p>" +
            "<p><br></p>" +
            "<p>Thank you for participating in Round {{ROUND_NO}} of our recruitment process.</p>" +
            "<p><br></p>" +
            "<p>After careful evaluation, we regret to inform you that you have not been shortlisted for the next round.</p>" +
            "<p><br></p>" +
            "<p>We appreciate your interest in Kanini Software Solutions and thank you for the time and effort invested in the process.</p>" +
            "<p><br></p>" +
            "<p>We wish you all the very best for your future opportunities.</p>" +
            "<p><br></p>" +
            "<p>Warm regards,</p>" +
            "<p>Kanini Talent Acquisition Team</p>" +
            "<p>Kanini Software Solutions</p>" +
            "<p><img src=\"/siganture.png\"></p>"
        );
        saveOrUpdateTemplate(roundRejectedTemplate);

        // ── Round Dropped ──────────────────────────────────────────────────────
        EmailTemplate roundDroppedTemplate = new EmailTemplate();
        roundDroppedTemplate.setTemplateName("ROUND DROPPED");
        roundDroppedTemplate.setSubject("KANINI DRIVE UPDATE");
        roundDroppedTemplate.setBody(
            "<p>Dear {{NAME}},</p>" +
            "<p><br></p>" +
            "<p>Greetings from Kanini Software Solutions.</p>" +
            "<p><br></p>" +
            "<p>This is to inform you that your status for Round {{ROUND_NO}} of the recruitment process has been marked as {{STATUS}}.</p>" +
            "<p><br></p>" +
            "<p>As a result, your candidature will not be considered for further rounds of the current recruitment process.</p>" +
            "<p><br></p>" +
            "<p>We appreciate your interest in Kanini Software Solutions and thank you for your participation.</p>" +
            "<p><br></p>" +
            "<p>We wish you all the very best for your future opportunities.</p>" +
            "<p><br></p>" +
            "<p>Warm regards,</p>" +
            "<p>Kanini Talent Acquisition Team</p>" +
            "<p>Kanini Software Solutions</p>" +
            "<p><img src=\"/siganture.png\"></p>"
        );
        saveOrUpdateTemplate(roundDroppedTemplate);

        log.info("Email templates are seeded/updated successfully");
    }

    private void saveOrUpdateTemplate(EmailTemplate template) {
        emailTemplateRepository.findByTemplateName(template.getTemplateName())
                .ifPresentOrElse(existing -> {
                    existing.setSubject(template.getSubject());
                    existing.setBody(template.getBody());
                    emailTemplateRepository.save(existing);
                }, () -> emailTemplateRepository.save(template));
    }
}
