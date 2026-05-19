-- =====================================================================
-- Flyway Migration V1: Initial Database Schema
-- =====================================================================
-- Auto-generated from existing Springer database
-- All tables use IF NOT EXISTS for idempotency
-- =====================================================================


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `academy_events` (
  `event_id` bigint NOT NULL AUTO_INCREMENT,
  `batch_number` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `event_date` date NOT NULL,
  `event_time` time(6) DEFAULT NULL,
  `event_type` varchar(255) NOT NULL,
  `program_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  PRIMARY KEY (`event_id`),
  KEY `idx_event_program_id` (`program_id`),
  KEY `idx_event_date` (`event_date`),
  KEY `FK1706hhdbtaqt9yaylnooyow0d` (`created_by`),
  CONSTRAINT `FK1706hhdbtaqt9yaylnooyow0d` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `applications` (
  `application_id` bigint NOT NULL AUTO_INCREMENT,
  `application_status` enum('ALLOTED','DROPPED','FAILED','IN_DRIVE','SELECTED') DEFAULT NULL,
  `batch_time` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `history` text,
  `registration_code` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `candidate_id` bigint DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `drive_id` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`application_id`),
  UNIQUE KEY `uk_app_drive_regcode` (`drive_id`,`registration_code`),
  KEY `idx_app_drive_id` (`drive_id`),
  KEY `idx_app_candidate_id` (`candidate_id`),
  KEY `idx_app_status` (`application_status`),
  KEY `FKcrubfrta4nhljt7g2hjbjfvgs` (`created_by`),
  KEY `FKqjjsmotst20bdd5wrei623a8t` (`updated_by`),
  CONSTRAINT `FKcrubfrta4nhljt7g2hjbjfvgs` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKg4e16cwk1qrad923bpx4hamdh` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`),
  CONSTRAINT `FKgjyeeuns0ogvkudyx0hrdyd3a` FOREIGN KEY (`drive_id`) REFERENCES `drive_schedule` (`drive_id`),
  CONSTRAINT `FKqjjsmotst20bdd5wrei623a8t` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `audit_trail` (
  `log_id` bigint NOT NULL AUTO_INCREMENT,
  `action` enum('APPROVED','CREATED','DELETED','LOCKED','OVERRIDE','REJECTED','STATUS_CHANGED','UNLOCKED','UPDATED','UPLOAD') DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `entity_id` bigint DEFAULT NULL,
  `entity_type` enum('CANDIDATE','DEMAND','DOC','DRIVE','DRIVE_APP','OFFER','ROUND_SCORE','TRAINING','USER') DEFAULT NULL,
  `update_reason` text,
  `updated_at` datetime(6) DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`log_id`),
  KEY `idx_audit_entity_type` (`entity_type`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_updated_by` (`updated_by`),
  CONSTRAINT `FKcb9w4rskaql4ptx53jf2jlf3h` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `batch_allocations` (
  `student_id` bigint NOT NULL AUTO_INCREMENT,
  `attendance_percentage` decimal(5,2) DEFAULT NULL,
  `batch_number` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `image` longblob,
  `is_active` bit(1) DEFAULT NULL,
  `overall_weighted_score` decimal(5,2) DEFAULT NULL,
  `performance` enum('DROPPED','EXCELLENT','GOOD','NEED_LEARNING','PROJECT_READY') DEFAULT NULL,
  `transferred_from_student_id` bigint DEFAULT NULL,
  `candidate_id` bigint DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  KEY `idx_batch_program_id` (`program_id`),
  KEY `FKphlu65s73ul2m6nkm96rv81uh` (`candidate_id`),
  CONSTRAINT `FKkcuf29k47kjhm5rx2w8sb3a8s` FOREIGN KEY (`program_id`) REFERENCES `training_programs` (`program_id`),
  CONSTRAINT `FKphlu65s73ul2m6nkm96rv81uh` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `batch_courses` (
  `batch_course_id` int NOT NULL AUTO_INCREMENT,
  `batch_no` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `end_date` datetime(6) DEFAULT NULL,
  `start_date` datetime(6) DEFAULT NULL,
  `status` enum('ACTIVE','CANCELLED','COMPLETED','PLANNED') DEFAULT NULL,
  `conducted_by` bigint DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `program_id` int DEFAULT NULL,
  PRIMARY KEY (`batch_course_id`),
  UNIQUE KEY `uk_program_batch_course` (`program_id`,`batch_no`,`course_id`),
  KEY `FK5s0kphxr4deropk8uxloy0kqk` (`conducted_by`),
  KEY `FKave5851ctkb3oac4v92qjv9p` (`course_id`),
  CONSTRAINT `FK5s0kphxr4deropk8uxloy0kqk` FOREIGN KEY (`conducted_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKave5851ctkb3oac4v92qjv9p` FOREIGN KEY (`course_id`) REFERENCES `training_courses` (`course_id`),
  CONSTRAINT `FKpwlp5cbwn3vvuf56fsv0l52c2` FOREIGN KEY (`program_id`) REFERENCES `training_programs` (`program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `batch_schedules` (
  `batch_schedule_id` int NOT NULL AUTO_INCREMENT,
  `batch_number` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `end_date` date NOT NULL,
  `start_date` date NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `program_id` int NOT NULL,
  PRIMARY KEY (`batch_schedule_id`),
  UNIQUE KEY `uk_program_batch_schedule` (`program_id`,`batch_number`),
  CONSTRAINT `FKt0ts5s578g9d4jur4biskqsyc` FOREIGN KEY (`program_id`) REFERENCES `training_programs` (`program_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `candidate_registration` (
  `registration_id` bigint NOT NULL AUTO_INCREMENT,
  `aadhaar_no` varchar(12) DEFAULT NULL,
  `cgpa` decimal(4,2) NOT NULL,
  `college_name` varchar(255) NOT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fname` varchar(255) NOT NULL,
  `graduation_year` int NOT NULL,
  `history_of_arrears` int DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `skills` text,
  `status` enum('IMPORTED','PENDING') NOT NULL,
  `submitted_at` datetime(6) NOT NULL,
  `drive_id` bigint NOT NULL,
  `form_id` bigint NOT NULL,
  `institute_id` bigint DEFAULT NULL,
  `application_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`registration_id`),
  KEY `idx_registration_drive_id` (`drive_id`),
  KEY `idx_registration_form_id` (`form_id`),
  KEY `idx_registration_status` (`status`),
  KEY `idx_registration_submitted_at` (`submitted_at`),
  KEY `FKjuc833chsahpjvw45a1c6wveh` (`institute_id`),
  CONSTRAINT `FK3xwxx19o5stpxub93305f7h9` FOREIGN KEY (`drive_id`) REFERENCES `drive_schedule` (`drive_id`),
  CONSTRAINT `FKjm2r1hfla4c9ltr6vg7947fn7` FOREIGN KEY (`form_id`) REFERENCES `form` (`form_id`),
  CONSTRAINT `FKjuc833chsahpjvw45a1c6wveh` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`),
  CONSTRAINT `candidate_registration_chk_1` CHECK ((`history_of_arrears` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `candidate_skills` (
  `candidate_skill_id` int NOT NULL AUTO_INCREMENT,
  `candidate_id` bigint DEFAULT NULL,
  `skill_id` bigint DEFAULT NULL,
  PRIMARY KEY (`candidate_skill_id`),
  UNIQUE KEY `uk_candidate_skill` (`candidate_id`,`skill_id`),
  KEY `FK2fcvgl75ge1wjul9sq4e6aww3` (`skill_id`),
  CONSTRAINT `FK2fcvgl75ge1wjul9sq4e6aww3` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `FKk71gu2subkaxroroxevtc6lu6` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `candidates` (
  `candidate_id` bigint NOT NULL AUTO_INCREMENT,
  `aadhaar_number` varchar(255) DEFAULT NULL,
  `application_stage` enum('ACCEPTED','APPLIED','DROPPED','INVITED','JOINED','NOT_JOINED','OFFERED','OFFER_REJECTED','REJECTED','SCHEDULED','SELECTED','SHORTLISTED') DEFAULT NULL,
  `application_type` enum('PREMIUM','STANDARD') DEFAULT NULL,
  `cgpa` decimal(10,2) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `degree` varchar(255) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `history_of_arrears` int DEFAULT NULL,
  `is_eligible` bit(1) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `lifecycle_status` enum('ACTIVE','CLOSED') DEFAULT NULL,
  `mobile` varchar(255) NOT NULL,
  `passout_year` int DEFAULT NULL,
  `reason` text,
  `status_history` text,
  `updated_at` datetime(6) DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  `drive_id` bigint DEFAULT NULL,
  `institute_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`candidate_id`),
  UNIQUE KEY `uk_candidate_email` (`email`),
  UNIQUE KEY `uk_candidate_aadhaar` (`aadhaar_number`),
  KEY `idx_candidate_institute_id` (`institute_id`),
  KEY `idx_candidate_cycle_id` (`cycle_id`),
  KEY `idx_candidate_drive_id` (`drive_id`),
  KEY `idx_candidate_application_stage` (`application_stage`),
  KEY `idx_candidate_passout_year` (`passout_year`),
  KEY `FKme4fkelukmx2s63tlcrft6hio` (`user_id`),
  CONSTRAINT `FK27x3kl5pldfs37o02ihoj6qaw` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`),
  CONSTRAINT `FKi6vmykloca8daftxucbvdlxmf` FOREIGN KEY (`drive_id`) REFERENCES `drive_schedule` (`drive_id`),
  CONSTRAINT `FKme4fkelukmx2s63tlcrft6hio` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKtndcwk5wxxg903nsxpkkhahu` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `candidates_evaluations` (
  `score_id` bigint NOT NULL AUTO_INCREMENT,
  `review` text,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `score` int DEFAULT NULL,
  `section_score` json DEFAULT NULL,
  `status` enum('ABSENT','FAIL','HOLD','PASS','PENDING','SKIP') NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `reviewed_by` bigint DEFAULT NULL,
  `round_config_id` bigint DEFAULT NULL,
  PRIMARY KEY (`score_id`),
  UNIQUE KEY `uk_eval_app_round_reviewer` (`application_id`,`round_config_id`,`reviewed_by`),
  KEY `idx_eval_application_id` (`application_id`),
  KEY `idx_eval_round_config_id` (`round_config_id`),
  KEY `FKlpv1xtrg876d0pw6skcq2f9fe` (`reviewed_by`),
  CONSTRAINT `FKafop0hs91r5d651ymt7gshonk` FOREIGN KEY (`application_id`) REFERENCES `applications` (`application_id`),
  CONSTRAINT `FKlpv1xtrg876d0pw6skcq2f9fe` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKrn9ndbii5vxotd4n180b5c954` FOREIGN KEY (`round_config_id`) REFERENCES `round_templates` (`round_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `document_submissions` (
  `candidate_document_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `uploaded_file` longblob,
  `uploaded_no` bigint DEFAULT NULL,
  `verification_status` enum('APPROVED','COLLECTED','PENDING','REJECTED') DEFAULT NULL,
  `candidate_id` bigint DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  `document_type_id` bigint DEFAULT NULL,
  PRIMARY KEY (`candidate_document_id`),
  KEY `idx_doc_candidate_id` (`candidate_id`),
  KEY `FK5spcqqect06b2kya03h1vnthr` (`cycle_id`),
  KEY `FKkw8eqe2r473n4sthn72xo37dp` (`document_type_id`),
  CONSTRAINT `FK3otusjlwyca6e1jqc6s1lqwsj` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`),
  CONSTRAINT `FK5spcqqect06b2kya03h1vnthr` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`),
  CONSTRAINT `FKkw8eqe2r473n4sthn72xo37dp` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `document_types` (
  `document_type_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `document_type` enum('DEGREE_CERT','EXPERIENCE_LETTER','ID_PROOF','MARKSHEET','PHOTO','PROVISIONAL_CERT','RELIEVING_LETTER','RESUME') DEFAULT NULL,
  PRIMARY KEY (`document_type_id`),
  UNIQUE KEY `idx_doc_type_enum` (`document_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `drive_schedule` (
  `drive_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `drive_mode` enum('OFF_CAMPUS','ON_CAMPUS') NOT NULL,
  `drive_name` varchar(255) DEFAULT NULL,
  `eligibility_locked` bit(1) DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `status` enum('CLOSED','COMPLETED','CONFIRMED','IN_PROGRESS','PLANNED') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  `institute_id` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  PRIMARY KEY (`drive_id`),
  KEY `idx_drive_cycle_id` (`cycle_id`),
  KEY `idx_drive_institute_id` (`institute_id`),
  KEY `FKtjgls49u98oidcgdlx7aeh01i` (`created_by`),
  KEY `FKcr8viqn401j6ijh49shmwbnne` (`updated_by`),
  CONSTRAINT `FKcr8viqn401j6ijh49shmwbnne` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKf3okgnjyaof2ywd6de7qehjp5` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`),
  CONSTRAINT `FKl2g2scsh9ia73mn059y8fo6rw` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`),
  CONSTRAINT `FKtjgls49u98oidcgdlx7aeh01i` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `drivepanel_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `status` enum('CANCELLED','DRAFT','HOLD','PLANNED','REJECTED','SELECTED') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `application_id` bigint DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `drive_id` bigint DEFAULT NULL,
  `round_config_id` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  UNIQUE KEY `uk_assignment_app_round_user` (`application_id`,`round_config_id`,`user_id`),
  KEY `idx_assignment_drive_id` (`drive_id`),
  KEY `idx_assignment_application_id` (`application_id`),
  KEY `idx_assignment_round_config_id` (`round_config_id`),
  KEY `FKnpqsmiylsyelkmi7j1bfphtv1` (`created_by`),
  KEY `FK87wy22ci4gh29p24gt7uywwsb` (`updated_by`),
  KEY `FK5hla30ka759k7w8qpmd74hp1b` (`user_id`),
  CONSTRAINT `FK5hla30ka759k7w8qpmd74hp1b` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FK87wy22ci4gh29p24gt7uywwsb` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKebk4tj3bgjo1i7rxhlyg8mavj` FOREIGN KEY (`application_id`) REFERENCES `applications` (`application_id`),
  CONSTRAINT `FKnpqsmiylsyelkmi7j1bfphtv1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKq4tmnox09x5rqmll6v5lg17ty` FOREIGN KEY (`drive_id`) REFERENCES `drive_schedule` (`drive_id`),
  CONSTRAINT `FKrs3bsmuclhm3heyrk5cm9922y` FOREIGN KEY (`round_config_id`) REFERENCES `round_templates` (`round_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `email_templates` (
  `template_id` int NOT NULL AUTO_INCREMENT,
  `body` text,
  `subject` text,
  `template_name` text,
  PRIMARY KEY (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `form` (
  `form_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `form_name` varchar(255) NOT NULL,
  `status` bit(1) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `drive_id` bigint NOT NULL,
  PRIMARY KEY (`form_id`),
  KEY `idx_form_drive_id` (`drive_id`),
  KEY `idx_form_status` (`status`),
  CONSTRAINT `FKc7ife5q0o88wcyy3hjlfpr6a0` FOREIGN KEY (`drive_id`) REFERENCES `drive_schedule` (`drive_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `hiring_cycles` (
  `cycle_id` bigint NOT NULL AUTO_INCREMENT,
  `budget` int DEFAULT NULL,
  `compensation_band` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `cycle_name` varchar(255) DEFAULT NULL,
  `cycle_year` int DEFAULT NULL,
  `jd` longblob,
  `status` enum('CLOSED','OPEN') DEFAULT NULL,
  `total_intake` int DEFAULT NULL,
  PRIMARY KEY (`cycle_id`),
  KEY `idx_cycle_year` (`cycle_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `hiring_demand` (
  `demand_id` bigint NOT NULL AUTO_INCREMENT,
  `approval_status` enum('APPROVED','DRAFT','REJECTED','SUBMITTED') DEFAULT NULL,
  `business_unit` enum('DATA_ANALYTICS_AND_AI','PRODUCT_ENGINEERING','SERVICENOW') DEFAULT NULL,
  `compensation_band` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `demand_count` int DEFAULT NULL,
  `job_description` text,
  `updated_at` datetime(6) DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`demand_id`),
  KEY `idx_demand_business_unit` (`business_unit`),
  KEY `FK8wl6i1ald9qu4on24mflmefiw` (`created_by`),
  KEY `FKgagod9c1k679pr0l0q0u1e8si` (`cycle_id`),
  CONSTRAINT `FK8wl6i1ald9qu4on24mflmefiw` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKgagod9c1k679pr0l0q0u1e8si` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `institute_contacts` (
  `tpo_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_primary` bit(1) DEFAULT NULL,
  `tpo_designation` varchar(255) DEFAULT NULL,
  `tpo_email` varchar(255) NOT NULL,
  `tpo_mobile` varchar(255) NOT NULL,
  `tpo_name` varchar(100) NOT NULL,
  `tpo_status` enum('ACTIVE','INACTIVE') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `institute_id` bigint DEFAULT NULL,
  PRIMARY KEY (`tpo_id`),
  KEY `idx_contact_institute_id` (`institute_id`),
  KEY `idx_contact_status` (`tpo_status`),
  CONSTRAINT `FK6h7rh832umch5osrp6fgqb4h0` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `institute_programs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `institute_id` bigint NOT NULL,
  `program_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_institute_program` (`institute_id`,`program_id`),
  KEY `idx_institute_program_institute` (`institute_id`),
  KEY `FKj9ls4dgxvlpln2dxifwadkaeg` (`program_id`),
  CONSTRAINT `FKj9ls4dgxvlpln2dxifwadkaeg` FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`),
  CONSTRAINT `FKm77vw7rtv966in656nqvl8cmf` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `institutes` (
  `institute_id` bigint NOT NULL AUTO_INCREMENT,
  `city` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `institute_name` varchar(200) NOT NULL,
  `institute_tier` enum('TIER_1','TIER_2','TIER_3') DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`institute_id`),
  KEY `idx_institute_tier` (`institute_tier`),
  KEY `idx_institute_location` (`state`,`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `intern_certificates` (
  `certificate_id` bigint NOT NULL AUTO_INCREMENT,
  `certificate_name` varchar(255) NOT NULL,
  `file_data` longblob,
  `issue_date` date DEFAULT NULL,
  `issuer` varchar(255) NOT NULL,
  `uploaded_at` datetime(6) DEFAULT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`certificate_id`),
  KEY `idx_cert_student_id` (`student_id`),
  CONSTRAINT `FK24baicokhp61q54e726s7ae2o` FOREIGN KEY (`student_id`) REFERENCES `batch_allocations` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `intern_profiles` (
  `profile_id` bigint NOT NULL AUTO_INCREMENT,
  `bio` text,
  `profile_links` json DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `uk_intern_profile_user` (`user_id`),
  CONSTRAINT `FKmf7ntibfeknj89nuy3ueecff0` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `intern_warnings` (
  `warning_id` bigint NOT NULL AUTO_INCREMENT,
  `acknowledged_at` datetime(6) DEFAULT NULL,
  `acknowledgement_comment` text,
  `course_id` int DEFAULT NULL,
  `issued_at` datetime(6) DEFAULT NULL,
  `message` text NOT NULL,
  `severity` enum('MINOR','MODERATE','SEVERE') NOT NULL,
  `status` enum('ACKNOWLEDGED','ACTIVE') NOT NULL,
  `warning_type` enum('ATTENDANCE','BEHAVIOUR','OTHER','PERFORMANCE','PUNCTUALITY') NOT NULL,
  `issued_by` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`warning_id`),
  KEY `idx_warning_student_id` (`student_id`),
  KEY `idx_warning_status` (`status`),
  KEY `FK6cqfb0te96bcmfbcd0v9k2riq` (`issued_by`),
  CONSTRAINT `FK6cqfb0te96bcmfbcd0v9k2riq` FOREIGN KEY (`issued_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKau9sj8y94uiedp7i89cica0wc` FOREIGN KEY (`student_id`) REFERENCES `batch_allocations` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `leave_id` bigint NOT NULL AUTO_INCREMENT,
  `applied_at` datetime(6) DEFAULT NULL,
  `from_date` date NOT NULL,
  `leave_type` enum('EMERGENCY','OTHER','PERSONAL','SICK') NOT NULL,
  `reason` text NOT NULL,
  `remarks` text,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `status` enum('APPROVED','PENDING','REJECTED') NOT NULL,
  `to_date` date NOT NULL,
  `reviewed_by` bigint DEFAULT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`leave_id`),
  KEY `idx_leave_student_id` (`student_id`),
  KEY `idx_leave_status` (`status`),
  KEY `FKm6br6lc65loui2q8s547hqyv7` (`reviewed_by`),
  CONSTRAINT `FK98rxmlm0aehnjfxydfd8yb424` FOREIGN KEY (`student_id`) REFERENCES `batch_allocations` (`student_id`),
  CONSTRAINT `FKm6br6lc65loui2q8s547hqyv7` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `manual_override` (
  `override_id` bigint NOT NULL AUTO_INCREMENT,
  `changes` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `entity_id` bigint NOT NULL,
  `entity_type` enum('APPLICATIONS','CANDIDATES','CANDIDATE_EVALUATIONS','DOCUMENT_SUBMISSIONS','DRIVES','HIRING_DEMAND','OFFER_LETTERS','TRAINING_COURSES','TRAINING_SCORES') NOT NULL,
  `override_reason` text NOT NULL,
  `created_by` bigint NOT NULL,
  PRIMARY KEY (`override_id`),
  KEY `idx_override_entity` (`entity_type`,`entity_id`),
  KEY `idx_override_created_by` (`created_by`),
  KEY `idx_override_created_at` (`created_at`),
  CONSTRAINT `FK3mjodtfw5okvtjsfnyix5ldta` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notifications` (
  `notification_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `message` text,
  `type` varchar(255) DEFAULT NULL,
  `sent_by` bigint DEFAULT NULL,
  `sent_to` bigint DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notification_sent_to` (`sent_to`),
  KEY `FKm8ucvadao8pwrotrhxu0cwc6c` (`sent_by`),
  CONSTRAINT `FKjdhmwvw6kgy6qbjb9l9fcvevf` FOREIGN KEY (`sent_to`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKm8ucvadao8pwrotrhxu0cwc6c` FOREIGN KEY (`sent_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `offer_letters` (
  `offer_id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text,
  `issue_date` date DEFAULT NULL,
  `responded_date` date DEFAULT NULL,
  `response` enum('ACCEPTED','DECLINED','EXPIRED','PENDING') DEFAULT NULL,
  `candidate_id` bigint DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`offer_id`),
  KEY `idx_offer_candidate_id` (`candidate_id`),
  KEY `idx_offer_cycle_id` (`cycle_id`),
  CONSTRAINT `FK9rv5b0w8aro9qeh6kgcxonqrd` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`),
  CONSTRAINT `FKn8biukllrlbotqmjdbh82luaw` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `programs` (
  `program_id` bigint NOT NULL AUTO_INCREMENT,
  `program_name` enum('BBA','BCA','B_A','B_COM','B_E','B_SC','B_TECH','DIPLOMA','MBA','MCA','M_A','M_COM','M_E','M_SC','M_TECH','PHD') NOT NULL,
  PRIMARY KEY (`program_id`),
  UNIQUE KEY `UKggtw8utphf0wlcjte2omv69bs` (`program_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `requisition_skills` (
  `demand_skill_id` int NOT NULL AUTO_INCREMENT,
  `demand_id` bigint DEFAULT NULL,
  `skill_id` bigint DEFAULT NULL,
  PRIMARY KEY (`demand_skill_id`),
  UNIQUE KEY `uk_demand_skill` (`demand_id`,`skill_id`),
  KEY `FK7t4qv30mbx50ixw11ngebe36h` (`skill_id`),
  CONSTRAINT `FK7t4qv30mbx50ixw11ngebe36h` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`),
  CONSTRAINT `FKp2b54rd1p8xyppqq62c2s30kt` FOREIGN KEY (`demand_id`) REFERENCES `hiring_demand` (`demand_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `role_name` enum('BU_SPOC','HIRING_MANAGER','HR_OPERATIONS','INTERN','MEMBERS','SYSTEM_ADMIN','TA_HEAD','TA_MANAGER','TRAINING_COORDINATOR') DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `round_templates` (
  `round_config_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `min_score` int DEFAULT NULL,
  `outoff_score` int DEFAULT NULL,
  `round_name` varchar(255) DEFAULT NULL,
  `round_no` int DEFAULT NULL,
  `sections` json DEFAULT NULL,
  `weightage` int DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  PRIMARY KEY (`round_config_id`),
  KEY `idx_round_template_active` (`is_active`),
  KEY `FK6g36cc8e0ck46ay70e1jmffwf` (`created_by`),
  CONSTRAINT `FK6g36cc8e0ck46ay70e1jmffwf` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `skills` (
  `skill_id` bigint NOT NULL AUTO_INCREMENT,
  `category` enum('SOFT_SKILL','TECHNICAL') DEFAULT NULL,
  `skill_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`skill_id`),
  UNIQUE KEY `idx_skill_name` (`skill_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `training_courses` (
  `course_id` int NOT NULL AUTO_INCREMENT,
  `communication_template` json DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `is_communication` tinyint(1) NOT NULL DEFAULT '0',
  `min_score` int DEFAULT NULL,
  `weightage` int DEFAULT NULL,
  PRIMARY KEY (`course_id`),
  KEY `idx_course_name` (`course_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `training_day_attendance` (
  `attendance_id` bigint NOT NULL AUTO_INCREMENT,
  `attendance_date` date NOT NULL,
  `is_present` bit(1) NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uk_student_attendance_date` (`student_id`,`attendance_date`),
  CONSTRAINT `FKs7mew2wm9pr9wj5se16n3ptly` FOREIGN KEY (`student_id`) REFERENCES `batch_allocations` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `training_programs` (
  `program_id` int NOT NULL AUTO_INCREMENT,
  `capacity` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `location` enum('BANGALORE','CHENNAI','COIMBATORE','DELHI','HYDERABAD','MUMBAI','PUNE','REMOTE') DEFAULT NULL,
  `number_of_batches` int DEFAULT NULL,
  `program_name` varchar(255) DEFAULT NULL,
  `program_year` int DEFAULT NULL,
  `status` bit(1) NOT NULL,
  `cycle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`program_id`),
  KEY `idx_program_location` (`location`),
  KEY `FKi461rh61aiok6bxjndj4myq5x` (`cycle_id`),
  CONSTRAINT `FKi461rh61aiok6bxjndj4myq5x` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `training_scores` (
  `score_id` bigint NOT NULL AUTO_INCREMENT,
  `communication_breakdown` json DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `review` text,
  `score` int DEFAULT NULL,
  `status` enum('AVERAGE','BELOW_AVERAGE','EXCELLENT','GOOD') DEFAULT NULL,
  `course_id` int DEFAULT NULL,
  `reviewed_by` bigint DEFAULT NULL,
  `student_id` bigint DEFAULT NULL,
  PRIMARY KEY (`score_id`),
  UNIQUE KEY `uk_student_course` (`student_id`,`course_id`),
  KEY `idx_training_score_course_id` (`course_id`),
  KEY `FK2ih7bunmrx07g68u9c5h2dpxb` (`reviewed_by`),
  CONSTRAINT `FK2ih7bunmrx07g68u9c5h2dpxb` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FK4et4l82w4i1xb1ca48ttoh7lj` FOREIGN KEY (`student_id`) REFERENCES `batch_allocations` (`student_id`),
  CONSTRAINT `FKfpco39b2mpeu8okpof3c061od` FOREIGN KEY (`course_id`) REFERENCES `training_courses` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `role_id` bigint DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_user_role_id` (`role_id`),
  CONSTRAINT `FKp56c1712k691lhsyewcssf40f` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;



