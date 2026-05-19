-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: Springer
-- ------------------------------------------------------
-- Server version	8.0.45

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

--
-- Table structure for table `academy_events`
--

DROP TABLE IF EXISTS `academy_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academy_events` (
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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academy_events`
--

LOCK TABLES `academy_events` WRITE;
/*!40000 ALTER TABLE `academy_events` DISABLE KEYS */;
INSERT INTO `academy_events` VALUES (1,1,'2026-05-11 11:09:21.000000','End of module assessment for Java Fundamentals','2026-05-16','10:00:00.000000','ASSESSMENT',2,'Java Assessment','OFFLINE',10),(2,1,'2026-05-11 11:09:21.000000','Introduction session for Spring Boot module','2026-05-19','09:00:00.000000','SESSION',2,'Spring Boot Kickoff','OFFLINE',10),(3,1,'2026-05-11 11:09:21.000000','Weekly progress review with all Batch 1 interns','2026-05-12','15:00:00.000000','REVIEW',2,'Weekly Review - Batch 1','ONLINE',10),(4,2,'2026-05-11 11:09:21.000000','Weekly progress review with all Batch 2 interns','2026-05-12','16:00:00.000000','REVIEW',2,'Weekly Review - Batch 2','ONLINE',10),(5,NULL,'2026-05-11 11:09:21.000000','TCS team visiting to review intern progress','2026-05-20','11:00:00.000000','CLIENT_VISIT',2,'Client Visit - TCS','OFFLINE',1),(6,NULL,'2026-05-11 11:09:21.000000','Monthly all-hands for the entire training program','2026-05-30','14:00:00.000000','MEETING',2,'All Hands Meeting','ONLINE',1),(7,1,'2026-05-13 13:32:56.000000','End-of-module assessment covering all Java Fundamentals topics','2026-05-16','10:00:00.000000','ASSESSMENT',1,'Java Final Assessment','Lab 3',10),(8,1,'2026-05-13 13:32:56.000000','Introduction to Spring Boot framework and project setup','2026-05-19','09:30:00.000000','SESSION',1,'Spring Boot Kickoff','Training Room A',10),(9,1,'2026-05-13 13:32:56.000000','Weekly progress review and Q&A for Batch 1','2026-05-12','15:00:00.000000','REVIEW',1,'Weekly Standup - Week 2','ONLINE',10),(10,1,'2026-05-13 13:32:56.000000','Weekly progress review and Q&A for Batch 1','2026-05-19','15:00:00.000000','REVIEW',1,'Weekly Standup - Week 3','ONLINE',10),(11,1,'2026-05-13 13:32:56.000000','Mid-module check on REST APIs and JPA basics','2026-05-23','10:00:00.000000','ASSESSMENT',1,'Spring Boot Mid Assessment','Lab 3',10),(12,1,'2026-05-13 13:32:56.000000','One-on-one mentoring session with senior developers','2026-05-26','14:00:00.000000','MEETING',1,'Mentor Connect Session','Conference Room B',10),(13,1,'2026-05-13 13:32:56.000000','Hands-on workshop on React and TypeScript basics','2026-06-02','09:00:00.000000','SESSION',1,'React Workshop','Training Room A',10),(14,NULL,'2026-05-13 13:32:56.000000','Present mini projects to client stakeholders','2026-06-15','11:00:00.000000','CLIENT_VISIT',1,'Client Demo Day','Board Room',10),(15,NULL,'2026-05-13 13:32:56.000000','End-of-program project presentations','2026-07-24','10:00:00.000000','ASSESSMENT',1,'Final Presentation','Auditorium',10);
/*!40000 ALTER TABLE `academy_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `application_id` bigint NOT NULL AUTO_INCREMENT,
  `application_status` enum('ALLOTED','DROPPED','FAILED','IN_DRIVE','SELECTED') DEFAULT NULL,
  `batch_time` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `registration_code` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `candidate_id` bigint DEFAULT NULL,
  `created_by` bigint DEFAULT NULL,
  `drive_id` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `history` text,
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

--
-- Dumping data for table `applications`
--

LOCK TABLES `applications` WRITE;
/*!40000 ALTER TABLE `applications` DISABLE KEYS */;
/*!40000 ALTER TABLE `applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_trail`
--

DROP TABLE IF EXISTS `audit_trail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_trail` (
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_trail`
--

LOCK TABLES `audit_trail` WRITE;
/*!40000 ALTER TABLE `audit_trail` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_trail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_allocations`
--

DROP TABLE IF EXISTS `batch_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_allocations` (
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
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_allocations`
--

LOCK TABLES `batch_allocations` WRITE;
/*!40000 ALTER TABLE `batch_allocations` DISABLE KEYS */;
INSERT INTO `batch_allocations` VALUES (4,95.00,2,'2026-05-11 11:09:20.000000',NULL,_binary '',72.80,'GOOD',NULL,4,2),(5,68.00,2,'2026-05-11 11:09:20.000000',NULL,_binary '',55.40,'NEED_LEARNING',NULL,5,2),(6,98.00,2,'2026-05-11 11:09:20.000000',NULL,_binary '',91.00,'EXCELLENT',NULL,6,2),(10,85.71,1,'2026-05-12 18:10:34.000000',NULL,_binary '',85.20,'EXCELLENT',NULL,24,1),(11,100.00,1,'2026-05-12 18:10:34.000000',NULL,_binary '',78.50,'GOOD',NULL,25,1),(12,71.43,1,'2026-05-12 18:10:34.000000',NULL,_binary '',62.00,'NEED_LEARNING',NULL,26,1),(13,99.99,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,36,1),(14,90.96,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,76,1),(15,94.84,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,96,1),(16,61.32,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,136,1),(17,82.08,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,156,1),(18,86.42,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,196,1),(19,85.89,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,216,1),(20,70.18,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,256,1),(21,73.22,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,276,1),(22,95.55,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,316,1),(23,78.10,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,336,1),(24,83.85,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,376,1),(25,84.93,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,396,1),(26,73.11,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,436,1),(27,90.76,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,456,1),(28,94.49,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,496,1),(29,60.15,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,516,1),(30,77.29,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,556,1),(31,66.01,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,576,1),(32,78.19,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,616,1),(33,92.91,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,636,1),(34,89.97,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,676,1),(35,71.13,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,696,1),(36,65.74,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,736,1),(37,95.32,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,756,1),(38,99.36,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,796,1),(39,70.83,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,816,1),(40,76.07,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,856,1),(41,67.88,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,876,1),(42,91.18,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,916,1),(43,72.24,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,936,1),(44,67.68,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,976,1),(45,61.67,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,996,1),(46,85.34,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1036,1),(47,61.65,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1056,1),(48,72.26,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1096,1),(49,76.35,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1116,1),(50,64.97,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1156,1),(51,75.77,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1176,1),(52,83.97,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1216,1),(53,92.55,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1236,1),(54,70.83,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1276,1),(55,96.51,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1296,1),(56,90.03,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1336,1),(57,60.65,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1356,1),(58,93.15,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1396,1),(59,63.80,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1416,1),(60,99.56,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1456,1),(61,86.40,1,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1476,1),(62,73.33,2,'2026-05-15 16:09:25.000000',NULL,_binary '',NULL,'EXCELLENT',NULL,1516,1);
/*!40000 ALTER TABLE `batch_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_courses`
--

DROP TABLE IF EXISTS `batch_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_courses` (
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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_courses`
--

LOCK TABLES `batch_courses` WRITE;
/*!40000 ALTER TABLE `batch_courses` DISABLE KEYS */;
INSERT INTO `batch_courses` VALUES (36,1,'2026-05-11 18:16:00.000000','2026-05-16 17:00:00.000000','2026-05-05 09:00:00.000000','COMPLETED',10,21,2),(37,1,'2026-05-11 18:16:00.000000','2026-05-31 00:00:00.000000','2026-05-15 00:00:00.000000','ACTIVE',10,22,2),(38,1,'2026-05-11 18:16:00.000000','2026-06-12 00:00:00.000000','2026-05-11 00:00:00.000000','ACTIVE',10,23,2),(39,1,'2026-05-11 18:16:00.000000','2026-06-20 00:00:00.000000','2026-06-16 00:00:00.000000','PLANNED',10,24,2),(40,1,'2026-05-11 18:16:00.000000','2026-05-11 00:00:00.000000','2026-05-05 00:00:00.000000','COMPLETED',10,25,2),(41,1,'2026-05-11 18:16:00.000000','2026-06-27 17:00:00.000000','2026-05-05 09:00:00.000000','ACTIVE',10,26,2),(42,2,'2026-05-11 18:16:00.000000','2026-05-07 00:00:00.000000','2026-05-05 00:00:00.000000','COMPLETED',10,21,2),(43,2,'2026-05-11 18:16:00.000000','2026-06-05 00:00:00.000000','2026-05-12 00:00:00.000000','PLANNED',10,22,2),(44,2,'2026-05-11 18:16:00.000000','2026-05-12 00:00:00.000000','2026-05-06 00:00:00.000000','PLANNED',10,23,2),(45,2,'2026-05-11 18:16:00.000000','2026-05-02 00:00:00.000000','2026-05-01 00:00:00.000000','COMPLETED',10,24,2),(46,2,'2026-05-11 18:16:00.000000','2026-07-04 17:00:00.000000','2026-06-29 09:00:00.000000','PLANNED',10,25,2),(47,2,'2026-05-11 18:16:00.000000','2026-07-04 17:00:00.000000','2026-05-12 09:00:00.000000','PLANNED',10,26,2),(48,1,'2026-05-13 13:32:56.000000','2026-05-16 17:00:00.000000','2026-05-05 09:00:00.000000','COMPLETED',10,21,1),(49,1,'2026-05-13 13:32:56.000000','2026-05-30 17:00:00.000000','2026-05-19 09:00:00.000000','ACTIVE',10,22,1),(50,1,'2026-05-13 13:32:56.000000','2026-06-13 17:00:00.000000','2026-06-02 09:00:00.000000','PLANNED',10,23,1),(51,1,'2026-05-13 13:32:56.000000','2026-06-27 17:00:00.000000','2026-06-16 09:00:00.000000','PLANNED',10,24,1),(52,1,'2026-05-13 13:32:56.000000','2026-07-11 17:00:00.000000','2026-06-30 09:00:00.000000','PLANNED',10,25,1),(53,1,'2026-05-13 13:32:56.000000','2026-07-25 17:00:00.000000','2026-07-14 09:00:00.000000','PLANNED',10,26,1);
/*!40000 ALTER TABLE `batch_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `batch_schedules`
--

DROP TABLE IF EXISTS `batch_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `batch_schedules` (
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_schedules`
--

LOCK TABLES `batch_schedules` WRITE;
/*!40000 ALTER TABLE `batch_schedules` DISABLE KEYS */;
INSERT INTO `batch_schedules` VALUES (1,1,'2026-05-11 11:09:20.000000','2026-06-27','2026-05-05','2026-05-11 11:09:20.000000',2),(2,2,'2026-05-11 11:09:20.000000','2026-07-04','2026-05-12','2026-05-11 11:09:20.000000',2),(3,1,'2026-05-13 13:32:56.000000','2026-07-25','2026-05-05','2026-05-13 13:32:56.000000',1);
/*!40000 ALTER TABLE `batch_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_registration`
--

DROP TABLE IF EXISTS `candidate_registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_registration` (
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

--
-- Dumping data for table `candidate_registration`
--

LOCK TABLES `candidate_registration` WRITE;
/*!40000 ALTER TABLE `candidate_registration` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_registration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidate_skills`
--

DROP TABLE IF EXISTS `candidate_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidate_skills` (
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

--
-- Dumping data for table `candidate_skills`
--

LOCK TABLES `candidate_skills` WRITE;
/*!40000 ALTER TABLE `candidate_skills` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidate_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidates`
--

DROP TABLE IF EXISTS `candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates` (
  `candidate_id` bigint NOT NULL AUTO_INCREMENT,
  `aadhaar_number` varchar(255) DEFAULT NULL,
  `application_stage` enum('APPLIED','DROPPED','INVITED','JOINED','NOT_JOINED','OFFERED','OFFER_ACCEPTED','OFFER_REJECTED','REJECTED','SCHEDULED','SELECTED','SHORTLISTED') DEFAULT NULL,
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
  `institute_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `drive_id` bigint DEFAULT NULL,
  PRIMARY KEY (`candidate_id`),
  UNIQUE KEY `uk_candidate_email` (`email`),
  UNIQUE KEY `uk_candidate_aadhaar` (`aadhaar_number`),
  KEY `idx_candidate_institute_id` (`institute_id`),
  KEY `idx_candidate_cycle_id` (`cycle_id`),
  KEY `idx_candidate_application_stage` (`application_stage`),
  KEY `idx_candidate_passout_year` (`passout_year`),
  KEY `FKme4fkelukmx2s63tlcrft6hio` (`user_id`),
  KEY `idx_candidate_drive_id` (`drive_id`),
  CONSTRAINT `FK27x3kl5pldfs37o02ihoj6qaw` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`),
  CONSTRAINT `FKi6vmykloca8daftxucbvdlxmf` FOREIGN KEY (`drive_id`) REFERENCES `drive_schedule` (`drive_id`),
  CONSTRAINT `FKme4fkelukmx2s63tlcrft6hio` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKtndcwk5wxxg903nsxpkkhahu` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates`
--

LOCK TABLES `candidates` WRITE;
/*!40000 ALTER TABLE `candidates` DISABLE KEYS */;
INSERT INTO `candidates` VALUES (4,'123456789004','OFFERED','STANDARD',8.20,'2026-05-08 12:59:16.000000','2004-07-18','B.E','Electronics','kavitharajan.work@gmail.com','Kavitha',0,_binary '','Rajan','ACTIVE','9876543213',2026,NULL,NULL,'2026-05-08 12:59:16.000000',3,5,17,2),(5,'123456789005','SELECTED','STANDARD',7.90,'2026-05-08 12:59:16.000000','2003-11-25','B.Tech','Computer Science','arunprakash.kanini@gmail.com','Arun',1,_binary '','Prakash','ACTIVE','9876543214',2026,NULL,NULL,'2026-05-08 12:59:16.000000',3,3,18,3),(6,'123456789006','OFFER_ACCEPTED','PREMIUM',9.20,'2026-05-08 12:59:16.000000','2004-09-02','B.Tech','Data Science','divyalakshmi.tech@gmail.com','Divya',0,_binary '','Lakshmi','ACTIVE','9876543215',2026,NULL,NULL,'2026-05-08 12:59:16.000000',3,3,19,4),(7,'123456789007','SELECTED','STANDARD',8.70,'2026-05-08 12:59:16.000000','2004-02-14','B.Tech','Computer Science','rahulsharma.springer@gmail.com','Rahul',0,_binary '','Sharma','ACTIVE','9876543216',2026,NULL,NULL,'2026-05-08 12:59:16.000000',3,6,NULL,NULL),(8,'123456789008','OFFERED','STANDARD',8.40,'2026-05-08 12:59:16.000000','2004-06-30','B.E','Information Technology','meenakrishnan.2026@gmail.com','Meena',0,_binary '','Krishnan','ACTIVE','9876543217',2026,NULL,NULL,'2026-05-08 12:59:16.000000',3,6,NULL,NULL),(9,'123456789009','SELECTED','STANDARD',7.80,'2026-05-08 12:59:16.000000','2003-12-05','B.Tech','Mechanical','vikramsundar.kanini@gmail.com','Vikram',1,_binary '','Sundar','ACTIVE','9876543218',2026,NULL,NULL,'2026-05-08 12:59:16.000000',3,1,NULL,NULL),(10,'123456789010','JOINED','PREMIUM',9.00,'2026-05-08 12:59:16.000000','2004-04-20','B.Tech','Computer Science','anithavenkatesh.2026@gmail.com','Anitha',0,_binary '','Venkatesh','ACTIVE','9876543219',2026,NULL,'Updated to JOINED by Mozhi on 12/5/26 - 10:20pm.','2026-05-12 22:20:01.395630',3,5,NULL,NULL),(24,'123456789002','JOINED','STANDARD',8.80,'2026-05-12 18:10:34.000000','2004-05-22','B.Tech','Computer Science','knowledgeiq255@gmail.com','Srinivath',0,_binary '','Mohan','ACTIVE','9876543211',2026,NULL,NULL,NULL,3,NULL,23,5),(25,'123456789001','JOINED','STANDARD',8.50,'2026-05-12 18:10:34.000000','2004-03-15','B.Tech','Computer Science','manoharbavigadda@gmail.com','Manohar',0,_binary '','Bavigadda','ACTIVE','9876543210',2026,NULL,NULL,NULL,3,NULL,24,1),(26,'123456789003','JOINED','STANDARD',9.10,'2026-05-12 18:10:34.000000','2004-01-10','B.Tech','Information Technology','pradeepkumar.dev@gmail.com','Pradeep',0,_binary '','Kumar','ACTIVE','9876543212',2026,NULL,NULL,NULL,3,NULL,25,2),(27,'100000000001','APPLIED','STANDARD',5.54,'2026-05-15 16:09:19.000000','2003-05-15','B.Tech','Information Technology','bharath.sharma27@gmail.com','Bharath',1,_binary '\0','Sharma','ACTIVE','9268969324',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,2,NULL,2),(28,'100000000002','APPLIED','STANDARD',8.07,'2026-05-15 16:09:19.000000','2002-05-15','M.E.','Electronics','chitra.patel28@gmail.com','Chitra',0,_binary '','Patel','ACTIVE','9645615971',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,3,NULL,3),(29,'100000000003','SHORTLISTED','STANDARD',9.62,'2026-05-15 16:09:19.000000','2005-05-15','M.Tech','Mechanical','deepak.reddy29@gmail.com','Deepak',0,_binary '','Reddy','ACTIVE','9672566581',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,4,NULL,4),(30,'100000000004','SELECTED','STANDARD',6.28,'2026-05-15 16:09:19.000000','2003-05-15','MCA','Electrical','esha.nair30@gmail.com','Esha',0,_binary '','Nair','ACTIVE','9395451944',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,5,NULL,5),(31,'100000000005','APPLIED','STANDARD',8.75,'2026-05-15 16:09:19.000000','2005-05-15','B.E.','Civil','farhan.menon31@gmail.com','Farhan',0,_binary '','Menon','ACTIVE','9162131896',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,6,NULL,1),(32,'100000000006','OFFERED','STANDARD',8.37,'2026-05-15 16:09:19.000000','2005-05-15','B.Tech','AI & ML','gayathri.rao32@gmail.com','Gayathri',0,_binary '','Rao','ACTIVE','9579640964',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,7,NULL,2),(33,'100000000007','APPLIED','STANDARD',5.41,'2026-05-15 16:09:19.000000','2003-05-15','M.E.','Data Science','hari.gupta33@gmail.com','Hari',0,_binary '\0','Gupta','ACTIVE','9684175265',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,8,NULL,3),(34,'100000000008','OFFER_ACCEPTED','STANDARD',9.61,'2026-05-15 16:09:19.000000','2004-05-15','M.Tech','Computer Science','ishita.singh34@gmail.com','Ishita',0,_binary '','Singh','ACTIVE','9721206329',2026,NULL,NULL,'2026-05-15 16:09:19.000000',3,1,NULL,4),(35,'100000000009','SHORTLISTED','STANDARD',7.02,'2026-05-15 16:09:20.000000','2003-05-15','MCA','Information Technology','jayesh.joshi35@gmail.com','Jayesh',0,_binary '','Joshi','ACTIVE','9955582765',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,5),(36,'100000000010','OFFERED','STANDARD',5.24,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','Electronics','kavya.iyer36@gmail.com','Kavya',0,_binary '\0','Iyer','ACTIVE','9347184251',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,11,3),(37,'100000000011','APPLIED','STANDARD',9.20,'2026-05-15 16:09:20.000000','2004-05-15','B.Tech','Mechanical','lakshmi.pillai37@gmail.com','Lakshmi',0,_binary '','Pillai','ACTIVE','9682002458',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,2),(38,'100000000012','OFFERED','STANDARD',6.31,'2026-05-15 16:09:20.000000','2002-05-15','M.E.','Electrical','mohan.das38@gmail.com','Mohan',2,_binary '\0','Das','ACTIVE','9804927142',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,3),(39,'100000000013','APPLIED','STANDARD',5.06,'2026-05-15 16:09:20.000000','2002-05-15','M.Tech','Civil','nandini.bhat39@gmail.com','Nandini',2,_binary '\0','Bhat','ACTIVE','9111145636',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,6,NULL,4),(40,'100000000014','APPLIED','STANDARD',6.11,'2026-05-15 16:09:20.000000','2002-05-15','MCA','AI & ML','om.hegde40@gmail.com','Om',0,_binary '','Hegde','ACTIVE','9342556787',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,5),(41,'100000000015','REJECTED','STANDARD',6.31,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','Data Science','priya.shetty41@gmail.com','Priya',0,_binary '','Shetty','ACTIVE','9502991611',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,8,NULL,1),(42,'100000000016','OFFER_ACCEPTED','STANDARD',7.76,'2026-05-15 16:09:20.000000','2004-05-15','B.Tech','Computer Science','rahul.mishra42@gmail.com','Rahul',0,_binary '','Mishra','ACTIVE','9177698484',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,1,NULL,2),(43,'100000000017','APPLIED','STANDARD',9.39,'2026-05-15 16:09:20.000000','2003-05-15','M.E.','Information Technology','sanjay.verma43@gmail.com','Sanjay',0,_binary '','Verma','ACTIVE','9654855723',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,3),(44,'100000000018','OFFERED','STANDARD',8.04,'2026-05-15 16:09:20.000000','2005-05-15','M.Tech','Electronics','tara.chauhan44@gmail.com','Tara',0,_binary '','Chauhan','ACTIVE','9221944120',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,4),(45,'100000000019','APPLIED','STANDARD',6.48,'2026-05-15 16:09:20.000000','2004-05-15','MCA','Mechanical','uma.agarwal45@gmail.com','Uma',0,_binary '','Agarwal','ACTIVE','9083527844',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,5),(46,'100000000020','DROPPED','STANDARD',7.70,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','Electrical','vikram.pandey46@gmail.com','Vikram',0,_binary '','Pandey','ACTIVE','9672584881',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,1),(47,'100000000021','SHORTLISTED','STANDARD',6.33,'2026-05-15 16:09:20.000000','2002-05-15','B.Tech','Civil','waseem.saxena47@gmail.com','Waseem',0,_binary '','Saxena','ACTIVE','9930867360',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,6,NULL,2),(48,'100000000022','APPLIED','STANDARD',6.95,'2026-05-15 16:09:20.000000','2004-05-15','M.E.','AI & ML','yamini.thakur48@gmail.com','Yamini',0,_binary '','Thakur','ACTIVE','9808137615',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,3),(49,'100000000023','APPLIED','STANDARD',7.63,'2026-05-15 16:09:20.000000','2003-05-15','M.Tech','Data Science','zain.bose49@gmail.com','Zain',0,_binary '','Bose','ACTIVE','9790953992',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,8,NULL,4),(50,'100000000024','OFFER_ACCEPTED','STANDARD',5.09,'2026-05-15 16:09:20.000000','2002-05-15','MCA','Computer Science','aditi.dutta50@gmail.com','Aditi',0,_binary '\0','Dutta','ACTIVE','9838080933',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,1,NULL,5),(51,'100000000025','APPLIED','STANDARD',7.50,'2026-05-15 16:09:20.000000','2005-05-15','B.E.','Information Technology','bhanu.ghosh51@gmail.com','Bhanu',0,_binary '','Ghosh','ACTIVE','9394494934',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,1),(52,'100000000026','APPLIED','STANDARD',9.57,'2026-05-15 16:09:20.000000','2003-05-15','B.Tech','Electronics','chinmay.mukherjee52@gmail.com','Chinmay',0,_binary '','Mukherjee','ACTIVE','9427215169',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,2),(53,'100000000027','SHORTLISTED','STANDARD',9.21,'2026-05-15 16:09:20.000000','2002-05-15','M.E.','Mechanical','divya.sen53@gmail.com','Divya',0,_binary '','Sen','ACTIVE','9580721427',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,3),(54,'100000000028','SELECTED','STANDARD',7.65,'2026-05-15 16:09:20.000000','2002-05-15','M.Tech','Electrical','ekta.banerjee54@gmail.com','Ekta',3,_binary '\0','Banerjee','ACTIVE','9583029166',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,4),(55,'100000000029','APPLIED','STANDARD',8.65,'2026-05-15 16:09:20.000000','2005-05-15','MCA','Civil','faisal.chatterjee55@gmail.com','Faisal',1,_binary '\0','Chatterjee','ACTIVE','9910216083',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,6,NULL,5),(56,'100000000030','REJECTED','STANDARD',9.11,'2026-05-15 16:09:20.000000','2003-05-15','B.E.','AI & ML','gita.rajan56@gmail.com','Gita',0,_binary '','Rajan','ACTIVE','9892674950',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,1),(57,'100000000031','APPLIED','STANDARD',7.57,'2026-05-15 16:09:20.000000','2003-05-15','B.Tech','Data Science','himanshu.subramaniam57@gmail.com','Himanshu',0,_binary '','Subramaniam','ACTIVE','9110145608',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,8,NULL,2),(58,'100000000032','OFFER_ACCEPTED','STANDARD',7.30,'2026-05-15 16:09:20.000000','2004-05-15','M.E.','Computer Science','isha.venkatesh58@gmail.com','Isha',0,_binary '','Venkatesh','ACTIVE','9473280818',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,1,NULL,3),(59,'100000000033','SHORTLISTED','STANDARD',9.80,'2026-05-15 16:09:20.000000','2003-05-15','M.Tech','Information Technology','jatin.krishnan59@gmail.com','Jatin',0,_binary '','Krishnan','ACTIVE','9039998590',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,4),(60,'100000000034','APPLIED','STANDARD',9.95,'2026-05-15 16:09:20.000000','2004-05-15','MCA','Electronics','keerthana.sundaram60@gmail.com','Keerthana',0,_binary '','Sundaram','ACTIVE','9502098301',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,5),(61,'100000000035','APPLIED','STANDARD',5.53,'2026-05-15 16:09:20.000000','2003-05-15','B.E.','Mechanical','lalitha.gopal61@gmail.com','Lalitha',0,_binary '\0','Gopal','ACTIVE','9979839775',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,1),(62,'100000000036','OFFERED','STANDARD',5.81,'2026-05-15 16:09:20.000000','2004-05-15','B.Tech','Electrical','mani.naidu62@gmail.com','Mani',0,_binary '\0','Naidu','ACTIVE','9415088949',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,2),(63,'100000000037','APPLIED','STANDARD',5.10,'2026-05-15 16:09:20.000000','2004-05-15','M.E.','Civil','neha.choudhury63@gmail.com','Neha',0,_binary '\0','Choudhury','ACTIVE','9008496003',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,6,NULL,3),(64,'100000000038','APPLIED','STANDARD',7.77,'2026-05-15 16:09:20.000000','2004-05-15','M.Tech','AI & ML','omkar.mahajan64@gmail.com','Omkar',3,_binary '\0','Mahajan','ACTIVE','9291932171',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,4),(65,'100000000039','SHORTLISTED','STANDARD',6.80,'2026-05-15 16:09:20.000000','2002-05-15','MCA','Data Science','pallavi.kapur65@gmail.com','Pallavi',0,_binary '','Kapur','ACTIVE','9738749806',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,8,NULL,5),(66,'100000000040','DROPPED','STANDARD',8.58,'2026-05-15 16:09:20.000000','2005-05-15','B.E.','Computer Science','rajesh.kumar66@gmail.com','Rajesh',0,_binary '','Kumar','ACTIVE','9447200274',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,1,NULL,1),(67,'100000000041','APPLIED','STANDARD',7.95,'2026-05-15 16:09:20.000000','2003-05-15','B.Tech','Information Technology','sahil.sharma67@gmail.com','Sahil',0,_binary '','Sharma','ACTIVE','9550968093',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,2),(68,'100000000042','OFFERED','STANDARD',7.99,'2026-05-15 16:09:20.000000','2003-05-15','M.E.','Electronics','tanvi.patel68@gmail.com','Tanvi',3,_binary '\0','Patel','ACTIVE','9758842058',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,3),(69,'100000000043','APPLIED','STANDARD',5.23,'2026-05-15 16:09:20.000000','2002-05-15','M.Tech','Mechanical','usha.reddy69@gmail.com','Usha',0,_binary '\0','Reddy','ACTIVE','9002010966',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,4),(70,'100000000044','SELECTED','STANDARD',7.84,'2026-05-15 16:09:20.000000','2004-05-15','MCA','Electrical','varun.nair70@gmail.com','Varun',3,_binary '\0','Nair','ACTIVE','9313164403',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,5),(71,'100000000045','REJECTED','STANDARD',8.56,'2026-05-15 16:09:20.000000','2003-05-15','B.E.','Civil','yash.menon71@gmail.com','Yash',0,_binary '','Menon','ACTIVE','9893793624',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,6,NULL,1),(72,'100000000046','APPLIED','STANDARD',7.22,'2026-05-15 16:09:20.000000','2005-05-15','B.Tech','AI & ML','aishwarya.rao72@gmail.com','Aishwarya',0,_binary '','Rao','ACTIVE','9246685517',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,2),(73,'100000000047','APPLIED','STANDARD',8.35,'2026-05-15 16:09:20.000000','2002-05-15','M.E.','Data Science','balaji.gupta73@gmail.com','Balaji',0,_binary '','Gupta','ACTIVE','9986717604',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,8,NULL,3),(74,'100000000048','OFFER_ACCEPTED','STANDARD',7.70,'2026-05-15 16:09:20.000000','2002-05-15','M.Tech','Computer Science','chaitra.singh74@gmail.com','Chaitra',0,_binary '','Singh','ACTIVE','9462619889',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,1,NULL,4),(75,'100000000049','APPLIED','STANDARD',9.80,'2026-05-15 16:09:20.000000','2002-05-15','MCA','Information Technology','dhruv.joshi75@gmail.com','Dhruv',0,_binary '','Joshi','ACTIVE','9754504194',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,5),(76,'100000000050','JOINED','STANDARD',6.31,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','Electronics','shruti.iyer76@gmail.com','Shruti',0,_binary '','Iyer','ACTIVE','9322735883',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,12,4),(77,'100000000051','SHORTLISTED','STANDARD',5.77,'2026-05-15 16:09:20.000000','2003-05-15','B.Tech','Mechanical','rohan.pillai77@gmail.com','Rohan',0,_binary '\0','Pillai','ACTIVE','9583576284',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,2),(78,'100000000052','SELECTED','STANDARD',6.42,'2026-05-15 16:09:20.000000','2002-05-15','M.E.','Electrical','sneha.das78@gmail.com','Sneha',0,_binary '','Das','ACTIVE','9025067168',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,3),(79,'100000000053','APPLIED','STANDARD',5.12,'2026-05-15 16:09:20.000000','2003-05-15','M.Tech','Civil','kiran.bhat79@gmail.com','Kiran',0,_binary '\0','Bhat','ACTIVE','9328367675',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,6,NULL,4),(80,'100000000054','OFFERED','STANDARD',5.98,'2026-05-15 16:09:20.000000','2004-05-15','MCA','AI & ML','meena.hegde80@gmail.com','Meena',0,_binary '\0','Hegde','ACTIVE','9599680242',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,5),(81,'100000000055','APPLIED','STANDARD',7.38,'2026-05-15 16:09:20.000000','2005-05-15','B.E.','Data Science','anusha.shetty81@gmail.com','Anusha',0,_binary '','Shetty','ACTIVE','9092549510',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,8,NULL,1),(82,'100000000056','OFFER_ACCEPTED','STANDARD',7.80,'2026-05-15 16:09:20.000000','2002-05-15','B.Tech','Computer Science','arvind.mishra82@gmail.com','Arvind',0,_binary '','Mishra','ACTIVE','9170390426',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,1,NULL,2),(83,'100000000057','SHORTLISTED','STANDARD',7.25,'2026-05-15 16:09:20.000000','2003-05-15','M.E.','Information Technology','brinda.verma83@gmail.com','Brinda',0,_binary '','Verma','ACTIVE','9947413913',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,2,NULL,3),(84,'100000000058','APPLIED','STANDARD',8.91,'2026-05-15 16:09:20.000000','2002-05-15','M.Tech','Electronics','kartik.chauhan84@gmail.com','Kartik',0,_binary '','Chauhan','ACTIVE','9161356260',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,4),(85,'100000000059','APPLIED','STANDARD',8.49,'2026-05-15 16:09:20.000000','2004-05-15','MCA','Mechanical','revathi.agarwal85@gmail.com','Revathi',0,_binary '','Agarwal','ACTIVE','9604678178',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,4,NULL,5),(86,'100000000060','DROPPED','STANDARD',9.31,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','Electrical','suresh.pandey86@gmail.com','Suresh',0,_binary '','Pandey','ACTIVE','9334766261',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,5,NULL,1),(96,'100000000070','JOINED','STANDARD',6.48,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','AI & ML','arun.rajan96@gmail.com','Arun',0,_binary '','Rajan','ACTIVE','9564151575',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,5),(136,'100000000110','JOINED','STANDARD',8.76,'2026-05-15 16:09:20.000000','2004-05-15','B.E.','AI & ML','rajesh.rajan136@gmail.com','Rajesh',0,_binary '','Rajan','ACTIVE','9071457825',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,1),(156,'100000000130','OFFER_ACCEPTED','STANDARD',7.03,'2026-05-15 16:09:20.000000','2004-05-15','B.E.','Electronics','suresh.iyer156@gmail.com','Suresh',0,_binary '','Iyer','ACTIVE','9965022347',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,2),(196,'100000000170','SELECTED','STANDARD',8.53,'2026-05-15 16:09:20.000000','2005-05-15','B.E.','Electronics','gita.iyer196@gmail.com','Gita',0,_binary '','Iyer','ACTIVE','9301705498',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,3),(216,'100000000190','JOINED','STANDARD',5.39,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','AI & ML','shruti.rajan216@gmail.com','Shruti',0,_binary '\0','Rajan','ACTIVE','9791334310',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,4),(256,'100000000230','JOINED','STANDARD',5.43,'2026-05-15 16:09:20.000000','2004-05-15','B.E.','AI & ML','vikram.rajan256@gmail.com','Vikram',0,_binary '\0','Rajan','ACTIVE','9363005379',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,5),(276,'100000000250','JOINED','STANDARD',6.94,'2026-05-15 16:09:20.000000','2004-05-15','B.E.','Electronics','rajesh.iyer276@gmail.com','Rajesh',0,_binary '','Iyer','ACTIVE','9609791315',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,1),(316,'100000000290','OFFERED','STANDARD',5.21,'2026-05-15 16:09:20.000000','2002-05-15','B.E.','Electronics','kavya.iyer316@gmail.com','Kavya',0,_binary '\0','Iyer','ACTIVE','9277266148',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,3,NULL,2),(336,'100000000310','SELECTED','STANDARD',9.81,'2026-05-15 16:09:20.000000','2004-05-15','B.E.','AI & ML','gita.rajan336@gmail.com','Gita',0,_binary '','Rajan','ACTIVE','9046742160',2026,NULL,NULL,'2026-05-15 16:09:20.000000',3,7,NULL,3),(376,'100000000350','JOINED','STANDARD',5.59,'2026-05-15 16:09:21.000000','2002-05-15','B.E.','AI & ML','arun.rajan376@gmail.com','Arun',0,_binary '\0','Rajan','ACTIVE','9519326532',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,7,NULL,4),(396,'100000000370','JOINED','STANDARD',7.55,'2026-05-15 16:09:21.000000','2004-05-15','B.E.','Electronics','vikram.iyer396@gmail.com','Vikram',3,_binary '\0','Iyer','ACTIVE','9895161146',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,3,NULL,5),(436,'100000000410','OFFER_ACCEPTED','STANDARD',6.44,'2026-05-15 16:09:21.000000','2005-05-15','B.E.','Electronics','suresh.iyer436@gmail.com','Suresh',0,_binary '','Iyer','ACTIVE','9679019333',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,3,NULL,1),(456,'100000000430','OFFERED','STANDARD',7.70,'2026-05-15 16:09:21.000000','2005-05-15','B.E.','AI & ML','kavya.rajan456@gmail.com','Kavya',0,_binary '','Rajan','ACTIVE','9381858576',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,7,NULL,2),(496,'100000000470','JOINED','STANDARD',9.98,'2026-05-15 16:09:21.000000','2002-05-15','B.E.','AI & ML','shruti.rajan496@gmail.com','Shruti',0,_binary '','Rajan','ACTIVE','9928800607',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,7,NULL,3),(516,'100000000490','JOINED','STANDARD',9.32,'2026-05-15 16:09:21.000000','2003-05-15','B.E.','Electronics','arun.iyer516@gmail.com','Arun',0,_binary '','Iyer','ACTIVE','9223514939',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,3,NULL,4),(556,'100000000530','JOINED','STANDARD',7.58,'2026-05-15 16:09:21.000000','2004-05-15','B.E.','Electronics','rajesh.iyer556@gmail.com','Rajesh',0,_binary '','Iyer','ACTIVE','9740531598',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,3,NULL,5),(576,'100000000550','OFFER_ACCEPTED','STANDARD',8.89,'2026-05-15 16:09:21.000000','2005-05-15','B.E.','AI & ML','suresh.rajan576@gmail.com','Suresh',0,_binary '','Rajan','ACTIVE','9804209047',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,7,NULL,1),(616,'100000000590','SELECTED','STANDARD',6.74,'2026-05-15 16:09:21.000000','2003-05-15','B.E.','AI & ML','gita.rajan616@gmail.com','Gita',0,_binary '','Rajan','ACTIVE','9733898676',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,7,NULL,2),(636,'100000000610','JOINED','STANDARD',7.66,'2026-05-15 16:09:21.000000','2003-05-15','B.E.','Electronics','shruti.iyer636@gmail.com','Shruti',0,_binary '','Iyer','ACTIVE','9543785775',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,3,NULL,3),(676,'100000000650','JOINED','STANDARD',9.57,'2026-05-15 16:09:21.000000','2004-05-15','B.E.','Electronics','vikram.iyer676@gmail.com','Vikram',0,_binary '','Iyer','ACTIVE','9643556767',2026,NULL,NULL,'2026-05-15 16:09:21.000000',3,3,NULL,4),(696,'100000000670','JOINED','STANDARD',9.53,'2026-05-15 16:09:22.000000','2004-05-15','B.E.','AI & ML','rajesh.rajan696@gmail.com','Rajesh',0,_binary '','Rajan','ACTIVE','9711192799',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,7,NULL,5),(736,'100000000710','OFFERED','STANDARD',7.89,'2026-05-15 16:09:22.000000','2004-05-15','B.E.','AI & ML','kavya.rajan736@gmail.com','Kavya',0,_binary '','Rajan','ACTIVE','9289605407',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,7,NULL,1),(756,'100000000730','SELECTED','STANDARD',9.02,'2026-05-15 16:09:22.000000','2005-05-15','B.E.','Electronics','gita.iyer756@gmail.com','Gita',0,_binary '','Iyer','ACTIVE','9897051452',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,3,NULL,2),(796,'100000000770','JOINED','STANDARD',5.27,'2026-05-15 16:09:22.000000','2005-05-15','B.E.','Electronics','arun.iyer796@gmail.com','Arun',2,_binary '\0','Iyer','ACTIVE','9500827909',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,3,NULL,3),(816,'100000000790','JOINED','STANDARD',9.66,'2026-05-15 16:09:22.000000','2003-05-15','B.E.','AI & ML','vikram.rajan816@gmail.com','Vikram',0,_binary '','Rajan','ACTIVE','9793305292',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,7,NULL,4),(856,'100000000830','OFFER_ACCEPTED','STANDARD',5.34,'2026-05-15 16:09:22.000000','2004-05-15','B.E.','AI & ML','suresh.rajan856@gmail.com','Suresh',0,_binary '\0','Rajan','ACTIVE','9011725064',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,7,NULL,5),(876,'100000000850','OFFERED','STANDARD',8.79,'2026-05-15 16:09:22.000000','2003-05-15','B.E.','Electronics','kavya.iyer876@gmail.com','Kavya',0,_binary '','Iyer','ACTIVE','9535176560',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,3,NULL,1),(916,'100000000890','JOINED','STANDARD',5.91,'2026-05-15 16:09:22.000000','2005-05-15','B.E.','Electronics','shruti.iyer916@gmail.com','Shruti',0,_binary '\0','Iyer','ACTIVE','9126504929',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,3,NULL,2),(936,'100000000910','JOINED','STANDARD',8.81,'2026-05-15 16:09:22.000000','2004-05-15','B.E.','AI & ML','arun.rajan936@gmail.com','Arun',2,_binary '\0','Rajan','ACTIVE','9607067802',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,7,NULL,3),(976,'100000000950','JOINED','STANDARD',6.53,'2026-05-15 16:09:22.000000','2003-05-15','B.E.','AI & ML','rajesh.rajan976@gmail.com','Rajesh',1,_binary '\0','Rajan','ACTIVE','9885221133',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,7,NULL,4),(996,'100000000970','OFFER_ACCEPTED','STANDARD',9.89,'2026-05-15 16:09:22.000000','2005-05-15','B.E.','Electronics','suresh.iyer996@gmail.com','Suresh',2,_binary '\0','Iyer','ACTIVE','9724792990',2026,NULL,NULL,'2026-05-15 16:09:22.000000',3,3,NULL,5),(1036,'100000001010','SELECTED','STANDARD',8.24,'2026-05-15 16:09:23.000000','2003-05-15','B.E.','Electronics','gita.iyer1036@gmail.com','Gita',0,_binary '','Iyer','ACTIVE','9317864399',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,1),(1056,'100000001030','JOINED','STANDARD',8.77,'2026-05-15 16:09:23.000000','2005-05-15','B.E.','AI & ML','shruti.rajan1056@gmail.com','Shruti',2,_binary '\0','Rajan','ACTIVE','9932146729',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,7,NULL,2),(1096,'100000001070','JOINED','STANDARD',7.72,'2026-05-15 16:09:23.000000','2003-05-15','B.E.','AI & ML','vikram.rajan1096@gmail.com','Vikram',0,_binary '','Rajan','ACTIVE','9498108778',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,7,NULL,3),(1116,'100000001090','JOINED','STANDARD',5.85,'2026-05-15 16:09:23.000000','2004-05-15','B.E.','Electronics','rajesh.iyer1116@gmail.com','Rajesh',0,_binary '\0','Iyer','ACTIVE','9223748501',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,4),(1156,'100000001130','OFFERED','STANDARD',8.72,'2026-05-15 16:09:23.000000','2004-05-15','B.E.','Electronics','kavya.iyer1156@gmail.com','Kavya',0,_binary '','Iyer','ACTIVE','9872221019',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,5),(1176,'100000001150','SELECTED','STANDARD',7.52,'2026-05-15 16:09:23.000000','2005-05-15','B.E.','AI & ML','gita.rajan1176@gmail.com','Gita',1,_binary '\0','Rajan','ACTIVE','9917808654',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,7,NULL,1),(1216,'100000001190','JOINED','STANDARD',6.74,'2026-05-15 16:09:23.000000','2004-05-15','B.E.','AI & ML','arun.rajan1216@gmail.com','Arun',0,_binary '','Rajan','ACTIVE','9091682804',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,7,NULL,2),(1236,'100000001210','JOINED','STANDARD',5.05,'2026-05-15 16:09:23.000000','2005-05-15','B.E.','Electronics','vikram.iyer1236@gmail.com','Vikram',0,_binary '\0','Iyer','ACTIVE','9813246888',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,3),(1276,'100000001250','OFFER_ACCEPTED','STANDARD',7.66,'2026-05-15 16:09:23.000000','2003-05-15','B.E.','Electronics','suresh.iyer1276@gmail.com','Suresh',0,_binary '','Iyer','ACTIVE','9739838439',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,4),(1296,'100000001270','OFFERED','STANDARD',7.58,'2026-05-15 16:09:23.000000','2004-05-15','B.E.','AI & ML','kavya.rajan1296@gmail.com','Kavya',1,_binary '\0','Rajan','ACTIVE','9871743114',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,7,NULL,5),(1336,'100000001310','JOINED','STANDARD',7.30,'2026-05-15 16:09:23.000000','2005-05-15','B.E.','AI & ML','shruti.rajan1336@gmail.com','Shruti',0,_binary '','Rajan','ACTIVE','9397212085',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,7,NULL,1),(1356,'100000001330','JOINED','STANDARD',5.78,'2026-05-15 16:09:23.000000','2004-05-15','B.E.','Electronics','arun.iyer1356@gmail.com','Arun',0,_binary '\0','Iyer','ACTIVE','9533872062',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,2),(1396,'100000001370','JOINED','STANDARD',9.45,'2026-05-15 16:09:23.000000','2004-05-15','B.E.','Electronics','rajesh.iyer1396@gmail.com','Rajesh',0,_binary '','Iyer','ACTIVE','9686810170',2026,NULL,NULL,'2026-05-15 16:09:23.000000',3,3,NULL,3),(1416,'100000001390','OFFER_ACCEPTED','STANDARD',7.48,'2026-05-15 16:09:24.000000','2005-05-15','B.E.','AI & ML','suresh.rajan1416@gmail.com','Suresh',1,_binary '\0','Rajan','ACTIVE','9242027537',2026,NULL,NULL,'2026-05-15 16:09:24.000000',3,7,NULL,4),(1456,'100000001430','SELECTED','STANDARD',9.79,'2026-05-15 16:09:24.000000','2002-05-15','B.E.','AI & ML','gita.rajan1456@gmail.com','Gita',0,_binary '','Rajan','ACTIVE','9481813014',2026,NULL,NULL,'2026-05-15 16:09:24.000000',3,7,NULL,5),(1476,'100000001450','JOINED','STANDARD',9.00,'2026-05-15 16:09:24.000000','2005-05-15','B.E.','Electronics','shruti.iyer1476@gmail.com','Shruti',0,_binary '','Iyer','ACTIVE','9291549305',2026,NULL,NULL,'2026-05-15 16:09:24.000000',3,3,NULL,1),(1516,'100000001490','JOINED','STANDARD',8.72,'2026-05-15 16:09:24.000000','2002-05-15','B.E.','Electronics','vikram.iyer1516@gmail.com','Vikram',2,_binary '\0','Iyer','ACTIVE','9585945289',2026,NULL,NULL,'2026-05-15 16:09:24.000000',3,3,NULL,2),(1527,'100000001501','APPLIED','STANDARD',6.87,'2026-05-15 16:09:24.000000','2002-05-15','B.Tech','Civil','himanshu.saxena1527@gmail.com','Himanshu',0,_binary '','Saxena','ACTIVE','9425311493',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,2,NULL,6),(1528,'100000001502','APPLIED','STANDARD',8.76,'2026-05-15 16:09:24.000000','2003-05-15','M.E.','AI & ML','isha.thakur1528@gmail.com','Isha',0,_binary '','Thakur','ACTIVE','9459280623',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,3,NULL,6),(1529,'100000001503','SHORTLISTED','STANDARD',7.41,'2026-05-15 16:09:24.000000','2004-05-15','M.Tech','Data Science','jatin.bose1529@gmail.com','Jatin',0,_binary '','Bose','ACTIVE','9083030878',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,4,NULL,6),(1530,'100000001504','OFFER_ACCEPTED','STANDARD',6.68,'2026-05-15 16:09:24.000000','2003-05-15','MCA','Computer Science','keerthana.dutta1530@gmail.com','Keerthana',0,_binary '','Dutta','ACTIVE','9277868888',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,5,NULL,6),(1531,'100000001505','APPLIED','STANDARD',7.34,'2026-05-15 16:09:24.000000','2003-05-15','B.E.','Information Technology','lalitha.ghosh1531@gmail.com','Lalitha',0,_binary '','Ghosh','ACTIVE','9243775835',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,6,NULL,6),(1532,'100000001506','OFFERED','STANDARD',5.24,'2026-05-15 16:09:24.000000','2005-05-15','B.Tech','Electronics','mani.mukherjee1532@gmail.com','Mani',0,_binary '\0','Mukherjee','ACTIVE','9396662796',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,1,NULL,6),(1533,'100000001507','APPLIED','STANDARD',6.39,'2026-05-15 16:09:24.000000','2004-05-15','M.E.','Mechanical','neha.sen1533@gmail.com','Neha',0,_binary '','Sen','ACTIVE','9309504792',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,2,NULL,6),(1534,'100000001508','SELECTED','STANDARD',8.49,'2026-05-15 16:09:24.000000','2002-05-15','M.Tech','Electrical','omkar.banerjee1534@gmail.com','Omkar',0,_binary '','Banerjee','ACTIVE','9030465234',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,3,NULL,6),(1535,'100000001509','SHORTLISTED','STANDARD',5.73,'2026-05-15 16:09:24.000000','2003-05-15','MCA','Civil','pallavi.chatterjee1535@gmail.com','Pallavi',0,_binary '\0','Chatterjee','ACTIVE','9379695134',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,4,NULL,6),(1536,'100000001510','JOINED','STANDARD',6.59,'2026-05-15 16:09:24.000000','2004-05-15','B.E.','AI & ML','rajesh.rajan1536@gmail.com','Rajesh',0,_binary '','Rajan','ACTIVE','9767755223',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,5,NULL,6),(1537,'100000001511','APPLIED','STANDARD',7.26,'2026-05-15 16:09:24.000000','2005-05-15','B.Tech','Data Science','sahil.subramaniam1537@gmail.com','Sahil',0,_binary '','Subramaniam','ACTIVE','9584744003',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,6,NULL,6),(1538,'100000001512','OFFER_ACCEPTED','STANDARD',6.77,'2026-05-15 16:09:24.000000','2005-05-15','M.E.','Computer Science','tanvi.venkatesh1538@gmail.com','Tanvi',0,_binary '','Venkatesh','ACTIVE','9379028286',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,1,NULL,6),(1539,'100000001513','APPLIED','STANDARD',9.42,'2026-05-15 16:09:24.000000','2002-05-15','M.Tech','Information Technology','usha.krishnan1539@gmail.com','Usha',0,_binary '','Krishnan','ACTIVE','9642446173',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,2,NULL,6),(1540,'100000001514','APPLIED','STANDARD',9.00,'2026-05-15 16:09:24.000000','2003-05-15','MCA','Electronics','varun.sundaram1540@gmail.com','Varun',0,_binary '','Sundaram','ACTIVE','9657754428',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,3,NULL,6),(1541,'100000001515','REJECTED','STANDARD',8.34,'2026-05-15 16:09:24.000000','2005-05-15','B.E.','Mechanical','yash.gopal1541@gmail.com','Yash',0,_binary '','Gopal','ACTIVE','9571637179',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,4,NULL,6),(1542,'100000001516','SELECTED','STANDARD',7.80,'2026-05-15 16:09:24.000000','2004-05-15','B.Tech','Electrical','aishwarya.naidu1542@gmail.com','Aishwarya',0,_binary '','Naidu','ACTIVE','9793452068',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,5,NULL,6),(1543,'100000001517','APPLIED','STANDARD',9.95,'2026-05-15 16:09:24.000000','2002-05-15','M.E.','Civil','balaji.choudhury1543@gmail.com','Balaji',0,_binary '','Choudhury','ACTIVE','9851456078',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,6,NULL,6),(1544,'100000001518','OFFERED','STANDARD',9.63,'2026-05-15 16:09:24.000000','2003-05-15','M.Tech','AI & ML','chaitra.mahajan1544@gmail.com','Chaitra',0,_binary '','Mahajan','ACTIVE','9779825700',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,1,NULL,6),(1545,'100000001519','APPLIED','STANDARD',7.65,'2026-05-15 16:09:24.000000','2002-05-15','MCA','Data Science','dhruv.kapur1545@gmail.com','Dhruv',0,_binary '','Kapur','ACTIVE','9512281084',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,2,NULL,6),(1546,'100000001520','DROPPED','STANDARD',9.00,'2026-05-15 16:09:24.000000','2004-05-15','B.E.','Computer Science','shruti.kumar1546@gmail.com','Shruti',0,_binary '','Kumar','ACTIVE','9546538350',2025,NULL,NULL,'2026-05-15 16:09:24.000000',2,3,NULL,6);
/*!40000 ALTER TABLE `candidates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `candidates_evaluations`
--

DROP TABLE IF EXISTS `candidates_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `candidates_evaluations` (
  `score_id` bigint NOT NULL AUTO_INCREMENT,
  `review` text,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `score` int DEFAULT NULL,
  `section_score` json DEFAULT NULL,
  `status` enum('ABSENT','FAIL','HOLD','PASS','PENDING') NOT NULL,
  `application_id` bigint DEFAULT NULL,
  `reviewed_by` bigint DEFAULT NULL,
  `round_config_id` bigint DEFAULT NULL,
  PRIMARY KEY (`score_id`),
  UNIQUE KEY `uk_eval_app_round` (`application_id`,`round_config_id`),
  UNIQUE KEY `uk_eval_app_round_reviewer` (`application_id`,`round_config_id`,`reviewed_by`),
  KEY `idx_eval_application_id` (`application_id`),
  KEY `idx_eval_round_config_id` (`round_config_id`),
  KEY `FKlpv1xtrg876d0pw6skcq2f9fe` (`reviewed_by`),
  CONSTRAINT `FKafop0hs91r5d651ymt7gshonk` FOREIGN KEY (`application_id`) REFERENCES `applications` (`application_id`),
  CONSTRAINT `FKlpv1xtrg876d0pw6skcq2f9fe` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKrn9ndbii5vxotd4n180b5c954` FOREIGN KEY (`round_config_id`) REFERENCES `round_templates` (`round_config_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `candidates_evaluations`
--

LOCK TABLES `candidates_evaluations` WRITE;
/*!40000 ALTER TABLE `candidates_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `candidates_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_submissions`
--

DROP TABLE IF EXISTS `document_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_submissions` (
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
) ENGINE=InnoDB AUTO_INCREMENT=2076 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_submissions`
--

LOCK TABLES `document_submissions` WRITE;
/*!40000 ALTER TABLE `document_submissions` DISABLE KEYS */;
INSERT INTO `document_submissions` VALUES (14,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',4,3,9),(15,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',4,3,10),(16,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',5,3,9),(17,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',5,3,10),(18,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',5,3,11),(19,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',5,3,12),(20,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',6,3,9),(21,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',6,3,10),(22,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',6,3,11),(23,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',7,3,9),(24,'2026-05-11 11:09:20.000000',NULL,NULL,'PENDING',7,3,10),(25,'2026-05-11 11:09:20.000000',NULL,NULL,'PENDING',8,3,9),(26,'2026-05-11 11:09:20.000000',NULL,NULL,'REJECTED',9,3,9),(27,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',9,3,10),(28,'2026-05-11 11:09:20.000000',NULL,NULL,'APPROVED',9,3,11),(29,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',30,3,10),(30,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',30,3,9),(31,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',30,3,8),(32,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',32,3,10),(33,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',32,3,9),(34,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',32,3,8),(35,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',34,3,10),(36,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',34,3,9),(37,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',34,3,8),(38,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',36,3,10),(39,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',36,3,9),(40,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',36,3,8),(41,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',38,3,10),(42,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',38,3,9),(43,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',38,3,8),(44,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',42,3,10),(45,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',42,3,9),(46,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',42,3,8),(47,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',44,3,10),(48,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',44,3,9),(49,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',44,3,8),(50,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',50,3,10),(51,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',50,3,9),(52,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',50,3,8),(53,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',54,3,10),(54,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',54,3,9),(55,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',54,3,8),(56,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',58,3,10),(57,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',58,3,9),(58,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',58,3,8),(59,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',62,3,10),(60,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',62,3,9),(61,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',62,3,8),(62,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',68,3,10),(63,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',68,3,9),(64,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',68,3,8),(65,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',70,3,10),(66,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',70,3,9),(67,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',70,3,8),(68,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',74,3,10),(69,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',74,3,9),(70,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',74,3,8),(71,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',76,3,10),(72,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',76,3,9),(73,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',76,3,8),(74,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',78,3,10),(75,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',78,3,9),(76,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',78,3,8),(77,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',80,3,10),(78,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',80,3,9),(79,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',80,3,8),(80,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',82,3,10),(81,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',82,3,9),(82,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',82,3,8),(92,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',96,3,10),(93,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',96,3,9),(94,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',96,3,8),(125,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',136,3,10),(126,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',136,3,9),(127,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',136,3,8),(146,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',156,3,10),(147,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',156,3,9),(148,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',156,3,8),(179,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',196,3,10),(180,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',196,3,9),(181,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',196,3,8),(200,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',216,3,10),(201,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',216,3,9),(202,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',216,3,8),(233,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',256,3,10),(234,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',256,3,9),(235,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',256,3,8),(254,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',276,3,10),(255,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',276,3,9),(256,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',276,3,8),(287,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',316,3,10),(288,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',316,3,9),(289,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',316,3,8),(308,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',336,3,10),(309,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',336,3,9),(310,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',336,3,8),(341,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',376,3,10),(342,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',376,3,9),(343,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',376,3,8),(362,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',396,3,10),(363,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',396,3,9),(364,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',396,3,8),(395,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',436,3,10),(396,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',436,3,9),(397,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',436,3,8),(416,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',456,3,10),(417,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',456,3,9),(418,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',456,3,8),(449,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',496,3,10),(450,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',496,3,9),(451,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',496,3,8),(470,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',516,3,10),(471,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',516,3,9),(472,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',516,3,8),(503,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',556,3,10),(504,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',556,3,9),(505,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',556,3,8),(524,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',576,3,10),(525,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',576,3,9),(526,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',576,3,8),(557,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',616,3,10),(558,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',616,3,9),(559,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',616,3,8),(578,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',636,3,10),(579,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',636,3,9),(580,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',636,3,8),(611,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',676,3,10),(612,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',676,3,9),(613,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',676,3,8),(632,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',696,3,10),(633,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',696,3,9),(634,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',696,3,8),(665,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',736,3,10),(666,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',736,3,9),(667,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',736,3,8),(686,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',756,3,10),(687,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',756,3,9),(688,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',756,3,8),(719,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',796,3,10),(720,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',796,3,9),(721,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',796,3,8),(740,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',816,3,10),(741,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',816,3,9),(742,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',816,3,8),(773,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',856,3,10),(774,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',856,3,9),(775,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',856,3,8),(794,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',876,3,10),(795,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',876,3,9),(796,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',876,3,8),(827,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',916,3,10),(828,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',916,3,9),(829,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',916,3,8),(848,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',936,3,10),(849,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',936,3,9),(850,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',936,3,8),(881,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',976,3,10),(882,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',976,3,9),(883,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',976,3,8),(902,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',996,3,10),(903,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',996,3,9),(904,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',996,3,8),(935,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1036,3,10),(936,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1036,3,9),(937,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1036,3,8),(956,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1056,3,10),(957,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1056,3,9),(958,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1056,3,8),(989,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1096,3,10),(990,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1096,3,9),(991,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1096,3,8),(1010,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1116,3,10),(1011,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1116,3,9),(1012,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1116,3,8),(1043,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1156,3,10),(1044,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1156,3,9),(1045,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1156,3,8),(1064,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1176,3,10),(1065,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1176,3,9),(1066,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1176,3,8),(1097,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1216,3,10),(1098,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1216,3,9),(1099,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1216,3,8),(1118,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1236,3,10),(1119,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1236,3,9),(1120,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1236,3,8),(1151,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1276,3,10),(1152,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1276,3,9),(1153,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1276,3,8),(1172,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1296,3,10),(1173,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1296,3,9),(1174,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1296,3,8),(1205,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1336,3,10),(1206,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1336,3,9),(1207,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1336,3,8),(1226,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1356,3,10),(1227,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1356,3,9),(1228,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1356,3,8),(1259,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1396,3,10),(1260,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1396,3,9),(1261,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1396,3,8),(1280,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1416,3,10),(1281,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1416,3,9),(1282,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1416,3,8),(1313,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1456,3,10),(1314,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1456,3,9),(1315,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1456,3,8),(1334,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1476,3,10),(1335,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1476,3,9),(1336,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1476,3,8),(1367,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1516,3,10),(1368,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1516,3,9),(1369,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1516,3,8),(1379,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1530,2,10),(1380,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1530,2,9),(1381,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1530,2,8),(1382,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',1532,2,10),(1383,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',1532,2,9),(1384,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',1532,2,8),(1385,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',1534,2,10),(1386,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',1534,2,9),(1387,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',1534,2,8),(1388,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1536,2,10),(1389,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1536,2,9),(1390,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1536,2,8),(1391,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1538,2,10),(1392,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1538,2,9),(1393,'2026-05-15 16:10:31.000000',NULL,NULL,'APPROVED',1538,2,8),(1394,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',1542,2,10),(1395,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',1542,2,9),(1396,'2026-05-15 16:10:31.000000',NULL,NULL,'PENDING',1542,2,8),(1397,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',1544,2,10),(1398,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',1544,2,9),(1399,'2026-05-15 16:10:31.000000',NULL,NULL,'COLLECTED',1544,2,8);
/*!40000 ALTER TABLE `document_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `document_type_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `document_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`document_type_id`),
  UNIQUE KEY `idx_doc_type_enum` (`document_type`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (8,'2026-05-08 13:00:42.674459','EXPERIENCE_LETTER'),(9,'2026-05-11 11:09:20.000000','RESUME'),(10,'2026-05-11 11:09:20.000000','PHOTO'),(11,'2026-05-11 11:09:20.000000','ID_PROOF'),(12,'2026-05-11 11:09:20.000000','MARKSHEET');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drive_schedule`
--

DROP TABLE IF EXISTS `drive_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drive_schedule` (
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drive_schedule`
--

LOCK TABLES `drive_schedule` WRITE;
/*!40000 ALTER TABLE `drive_schedule` DISABLE KEYS */;
INSERT INTO `drive_schedule` VALUES (1,'2026-05-15 16:09:19.000000','Campus hiring at Anna University','ON_CAMPUS','Anna University Drive 2026',NULL,'2026-02-17','Chennai','2026-02-15','COMPLETED',NULL,2,3,1,NULL),(2,'2026-05-15 16:09:19.000000','Campus hiring at SSN','ON_CAMPUS','SSN College Drive 2026',NULL,'2026-03-03','Chennai','2026-03-01','COMPLETED',NULL,2,3,2,NULL),(3,'2026-05-15 16:09:19.000000','Campus hiring at PSG','ON_CAMPUS','PSG Drive 2026',NULL,'2026-04-12','Coimbatore','2026-04-10','IN_PROGRESS',NULL,2,3,3,NULL),(4,'2026-05-15 16:09:19.000000','Campus hiring at VIT','ON_CAMPUS','VIT Drive 2026',NULL,'2026-05-22','Vellore','2026-05-20','PLANNED',NULL,2,3,5,NULL),(5,'2026-05-15 16:09:19.000000','Off-campus hiring pool','OFF_CAMPUS','Off-Campus Pool 2026',NULL,'2026-12-31','Remote','2026-01-01','IN_PROGRESS',NULL,2,3,NULL,NULL),(6,'2026-05-15 16:09:19.000000','Campus hiring 2025','ON_CAMPUS','Anna University Drive 2025',NULL,'2025-03-17','Chennai','2025-03-15','COMPLETED',NULL,2,2,1,NULL);
/*!40000 ALTER TABLE `drive_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivepanel_assignments`
--

DROP TABLE IF EXISTS `drivepanel_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drivepanel_assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_active` bit(1) DEFAULT NULL,
  `status` enum('CANCELLED','DRAFT','PLANNED','REJECTED','SELECTED') DEFAULT NULL,
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

--
-- Dumping data for table `drivepanel_assignments`
--

LOCK TABLES `drivepanel_assignments` WRITE;
/*!40000 ALTER TABLE `drivepanel_assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `drivepanel_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `template_id` int NOT NULL AUTO_INCREMENT,
  `body` text,
  `subject` text,
  `template_name` text,
  PRIMARY KEY (`template_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES (1,'<!DOCTYPE html><html lang=\'en\'><head><meta charset=\'UTF-8\'><meta name=\'viewport\' content=\'width=device-width,initial-scale=1.0\'><title>Document Submission</title></head><body style=\'margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background-color:#f0f2f5;padding:40px 20px;\'><tr><td align=\'center\'><table width=\'600\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);\'><!-- Header --><tr><td style=\'background:#0F4C81;padding:28px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td><img src=\'cid-right-logo\' alt=\'Kanini Software Solutions\' style=\'height:36px;display:block;\'></td><td align=\'right\' style=\'color:rgba(255,255,255,0.7);font-size:12px;\'>Talent Acquisition</td></tr></table></td></tr><!-- Body --><tr><td style=\'padding:40px 40px 32px;\'><p style=\'margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;\'>Document Submission Request</p><h2 style=\'margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;\'>Hello, {{CANDIDATE_NAME}}</h2><p style=\'margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;\'>Congratulations on your selection at <strong>Kanini Software Solutions</strong>. As part of your onboarding process, we kindly request you to submit the following documents at your earliest convenience.</p><!-- Document List --><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;margin:0 0 28px;\'><tr><td style=\'padding:16px 20px;border-bottom:1px solid #E5E7EB;\'><p style=\'margin:0;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;\'>Required Documents</p></td></tr><tr><td style=\'padding:16px 20px;\'><ul style=\'margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;\'>{{DOCUMENT_LIST}}</ul></td></tr></table><!-- CTA Button --><table cellpadding=\'0\' cellspacing=\'0\' style=\'margin:0 0 28px;\'><tr><td style=\'background:#0F4C81;border-radius:6px;\'><a href=\'{{SUBMISSION_LINK}}\' style=\'display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;\'>Submit Documents &rarr;</a></td></tr></table><!-- Deadline --><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;margin:0 0 28px;\'><tr><td style=\'padding:12px 16px;\'><p style=\'margin:0;font-size:13px;color:#92400E;\'><strong>&#9888; Submission Deadline:</strong>&nbsp;{{DEADLINE_DATE}}</p></td></tr></table><p style=\'margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;\'>If you face any issues accessing the link or have questions, please reach out to us at <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#0F4C81;text-decoration:none;font-weight:600;\'>hrops.india@kanini.com</a>.</p><p style=\'margin:24px 0 0;font-size:14px;color:#374151;\'>Warm regards,</p></td></tr><!-- Signature --><tr><td style=\'padding:0 40px 32px;\'><img src=\'cid-signature\' alt=\'HR Team Signature\' style=\'height:60px;display:block;\'></td></tr><!-- Footer --><tr><td style=\'background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td style=\'font-size:11px;color:#9CA3AF;line-height:1.6;\'>This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>Please do not reply to this email. For assistance, contact <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#6B7280;\'>hrops.india@kanini.com</a></td><td align=\'right\' style=\'font-size:11px;color:#9CA3AF;white-space:nowrap;\'>&copy; 2026 Kanini Software Solutions</td></tr></table></td></tr></table></td></tr></table></body></html>','Action Required: Submit Your Documents ΓÇô Kanini Software Solutions','DOCUMENT_SUBMISSION_LINK'),(2,'<!DOCTYPE html><html lang=\'en\'><head><meta charset=\'UTF-8\'><meta name=\'viewport\' content=\'width=device-width,initial-scale=1.0\'><title>Document Resubmission</title></head><body style=\'margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background-color:#f0f2f5;padding:40px 20px;\'><tr><td align=\'center\'><table width=\'600\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);\'><!-- Header --><tr><td style=\'background:#0F4C81;padding:28px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td><img src=\'cid-right-logo\' alt=\'Kanini Software Solutions\' style=\'height:36px;display:block;\'></td><td align=\'right\' style=\'color:rgba(255,255,255,0.7);font-size:12px;\'>Talent Acquisition</td></tr></table></td></tr><!-- Body --><tr><td style=\'padding:40px 40px 32px;\'><p style=\'margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;\'>Document Review Update</p><h2 style=\'margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;\'>Hello, {{CANDIDATE_NAME}}</h2><p style=\'margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;\'>Thank you for submitting your documents. After review, we found that the following document requires resubmission.</p><!-- Rejected Document --><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;margin:0 0 20px;\'><tr><td style=\'padding:16px 20px;border-bottom:1px solid #FECACA;\'><p style=\'margin:0;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;\'>Document Rejected</p></td></tr><tr><td style=\'padding:16px 20px;\'><p style=\'margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;\'>{{DOCUMENT_TYPE}}</p></td></tr></table><!-- Reason --><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #6B7280;border-radius:0 6px 6px 0;margin:0 0 28px;\'><tr><td style=\'padding:16px 20px;\'><p style=\'margin:0 0 4px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;\'>Reason for Rejection</p><p style=\'margin:0;font-size:14px;color:#374151;line-height:1.6;\'>{{REJECTION_REASON}}</p></td></tr></table><!-- CTA Button --><p style=\'margin:0 0 16px;font-size:14px;color:#374151;\'>Please upload a corrected version using the button below:</p><table cellpadding=\'0\' cellspacing=\'0\' style=\'margin:0 0 28px;\'><tr><td style=\'background:#0F4C81;border-radius:6px;\'><a href=\'{{RESUBMIT_LINK}}\' style=\'display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;\'>Resubmit Document &rarr;</a></td></tr></table><p style=\'margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;\'>For any queries, please contact us at <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#0F4C81;text-decoration:none;font-weight:600;\'>hrops.india@kanini.com</a>.</p><p style=\'margin:24px 0 0;font-size:14px;color:#374151;\'>Warm regards,</p></td></tr><!-- Signature --><tr><td style=\'padding:0 40px 32px;\'><img src=\'cid-signature\' alt=\'HR Team Signature\' style=\'height:60px;display:block;\'></td></tr><!-- Footer --><tr><td style=\'background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td style=\'font-size:11px;color:#9CA3AF;line-height:1.6;\'>This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>Please do not reply to this email. For assistance, contact <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#6B7280;\'>hrops.india@kanini.com</a></td><td align=\'right\' style=\'font-size:11px;color:#9CA3AF;white-space:nowrap;\'>&copy; 2026 Kanini Software Solutions</td></tr></table></td></tr></table></td></tr></table></body></html>','Document Resubmission Required ΓÇô Kanini Software Solutions','DOCUMENT_REJECTION'),(3,'<!DOCTYPE html><html lang=\'en\'><head><meta charset=\'UTF-8\'><meta name=\'viewport\' content=\'width=device-width,initial-scale=1.0\'><title>Document Submission</title></head><body style=\'margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background-color:#f0f2f5;padding:40px 20px;\'><tr><td align=\'center\'><table width=\'600\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);\'><tr><td style=\'background:#0F4C81;padding:28px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td><img src=\'cid-right-logo\' alt=\'Kanini Software Solutions\' style=\'height:36px;display:block;\'></td><td align=\'right\' style=\'color:rgba(255,255,255,0.7);font-size:12px;\'>Talent Acquisition</td></tr></table></td></tr><tr><td style=\'padding:40px 40px 32px;\'><p style=\'margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;\'>Document Submission Request</p><h2 style=\'margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;\'>Hello, {{CANDIDATE_NAME}}</h2><p style=\'margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;\'>Congratulations on your selection at <strong>Kanini Software Solutions</strong>. As part of your onboarding process, we kindly request you to submit the following documents at your earliest convenience.</p><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;margin:0 0 28px;\'><tr><td style=\'padding:16px 20px;border-bottom:1px solid #E5E7EB;\'><p style=\'margin:0;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;\'>Required Documents</p></td></tr><tr><td style=\'padding:16px 20px;\'><ul style=\'margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;\'>{{DOCUMENT_LIST}}</ul></td></tr></table><table cellpadding=\'0\' cellspacing=\'0\' style=\'margin:0 0 28px;\'><tr><td style=\'background:#0F4C81;border-radius:6px;\'><a href=\'{{SUBMISSION_LINK}}\' style=\'display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;\'>Submit Documents &rarr;</a></td></tr></table><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#FEF3C7;border:1px solid #FCD34D;border-radius:6px;margin:0 0 28px;\'><tr><td style=\'padding:12px 16px;\'><p style=\'margin:0;font-size:13px;color:#92400E;\'><strong>&#9888; Submission Deadline:</strong>&nbsp;{{DEADLINE_DATE}}</p></td></tr></table><p style=\'margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;\'>If you face any issues accessing the link or have questions, please reach out to us at <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#0F4C81;text-decoration:none;font-weight:600;\'>hrops.india@kanini.com</a>.</p><p style=\'margin:24px 0 0;font-size:14px;color:#374151;\'>Warm regards,</p></td></tr><tr><td style=\'padding:0 40px 32px;\'><img src=\'cid-signature\' alt=\'HR Team Signature\' style=\'height:60px;display:block;\'></td></tr><tr><td style=\'background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td style=\'font-size:11px;color:#9CA3AF;line-height:1.6;\'>This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>Please do not reply to this email. For assistance, contact <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#6B7280;\'>hrops.india@kanini.com</a></td><td align=\'right\' style=\'font-size:11px;color:#9CA3AF;white-space:nowrap;\'>&copy; 2026 Kanini Software Solutions</td></tr></table></td></tr></table></td></tr></table></body></html>','Action Required: Submit Your Documents ΓÇô Kanini Software Solutions','DOCUMENT_SUBMISSION_LINK'),(4,'<!DOCTYPE html><html lang=\'en\'><head><meta charset=\'UTF-8\'><meta name=\'viewport\' content=\'width=device-width,initial-scale=1.0\'><title>Document Resubmission</title></head><body style=\'margin:0;padding:0;background-color:#f0f2f5;font-family:Arial,Helvetica,sans-serif;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background-color:#f0f2f5;padding:40px 20px;\'><tr><td align=\'center\'><table width=\'600\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.1);\'><tr><td style=\'background:#0F4C81;padding:28px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td><img src=\'cid-right-logo\' alt=\'Kanini Software Solutions\' style=\'height:36px;display:block;\'></td><td align=\'right\' style=\'color:rgba(255,255,255,0.7);font-size:12px;\'>Talent Acquisition</td></tr></table></td></tr><tr><td style=\'padding:40px 40px 32px;\'><p style=\'margin:0 0 8px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;\'>Document Review Update</p><h2 style=\'margin:0 0 24px;font-size:22px;color:#111827;font-weight:700;line-height:1.3;\'>Hello, {{CANDIDATE_NAME}}</h2><p style=\'margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;\'>Thank you for submitting your documents. After review, we found that the following document requires resubmission.</p><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#FEF2F2;border:1px solid #FECACA;border-radius:6px;margin:0 0 20px;\'><tr><td style=\'padding:16px 20px;border-bottom:1px solid #FECACA;\'><p style=\'margin:0;font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;letter-spacing:0.5px;\'>Document Rejected</p></td></tr><tr><td style=\'padding:16px 20px;\'><p style=\'margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;\'>{{DOCUMENT_TYPE}}</p></td></tr></table><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\' style=\'background:#F9FAFB;border:1px solid #E5E7EB;border-left:4px solid #6B7280;border-radius:0 6px 6px 0;margin:0 0 28px;\'><tr><td style=\'padding:16px 20px;\'><p style=\'margin:0 0 4px;font-size:12px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;\'>Reason for Rejection</p><p style=\'margin:0;font-size:14px;color:#374151;line-height:1.6;\'>{{REJECTION_REASON}}</p></td></tr></table><p style=\'margin:0 0 16px;font-size:14px;color:#374151;\'>Please upload a corrected version using the button below:</p><table cellpadding=\'0\' cellspacing=\'0\' style=\'margin:0 0 28px;\'><tr><td style=\'background:#0F4C81;border-radius:6px;\'><a href=\'{{RESUBMIT_LINK}}\' style=\'display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;\'>Resubmit Document &rarr;</a></td></tr></table><p style=\'margin:0 0 8px;font-size:14px;color:#374151;line-height:1.7;\'>For any queries, please contact us at <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#0F4C81;text-decoration:none;font-weight:600;\'>hrops.india@kanini.com</a>.</p><p style=\'margin:24px 0 0;font-size:14px;color:#374151;\'>Warm regards,</p></td></tr><tr><td style=\'padding:0 40px 32px;\'><img src=\'cid-signature\' alt=\'HR Team Signature\' style=\'height:60px;display:block;\'></td></tr><tr><td style=\'background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 40px;\'><table width=\'100%\' cellpadding=\'0\' cellspacing=\'0\'><tr><td style=\'font-size:11px;color:#9CA3AF;line-height:1.6;\'>This is an automated message from <strong>Springer</strong> &ndash; Kanini HRMS.<br>Please do not reply to this email. For assistance, contact <a href=\'mailto:hrops.india@kanini.com\' style=\'color:#6B7280;\'>hrops.india@kanini.com</a></td><td align=\'right\' style=\'font-size:11px;color:#9CA3AF;white-space:nowrap;\'>&copy; 2026 Kanini Software Solutions</td></tr></table></td></tr></table></td></tr></table></body></html>','Document Resubmission Required ΓÇô Kanini Software Solutions','DOCUMENT_REJECTION'),(5,'<p>Dear Sir/Madam,</p><p> Greetings from Kanini Software Solutions.</p><p>We hope you are doing well.</p><p>We are pleased to express our interest in conducting an <strong>On-Campus Recruitment Drive</strong> at your esteemed institution for the current graduating batch.</p><p>At Kanini Software Solutions, we continuously seek talented and enthusiastic graduates who can contribute to our growing organization. We believe that your institution has a strong pool of capable students, and we would be delighted to engage with them through this recruitment initiative.</p><p><br></p><p>Please find the proposed drive details below:</p><p>Drive Name: {{DRIVE_NAME}}</p><p>Proposed Drive Date: {{DRIVE_DATE}}</p><p>Venue/Location: {{LOCATION}}</p><p>Eligible Departments: {{ELIGIBLE_DEPARTMENTS}}</p><p><br></p><p>We kindly request your support in facilitating the recruitment process and coordinating the necessary arrangements for the drive.</p><p>Additionally, we request you to share the list of eligible students in the prescribed format for further processing.</p><p>Please let us know your confirmation and any additional requirements from our end to proceed with the coordination activities.</p><p>For any queries or further discussion, feel free to contact us at <a href=\"mailto:hrops.india@kanini.com\" rel=\"noopener noreferrer\" target=\"_blank\">hrops.india@kanini.com</a>.</p><p>We look forward to collaborating with your institution.</p><p style=\"text-align: right;\"><br></p><p style=\"text-align: right;\">Warm regards,</p><p style=\"text-align: right;\">Kanini Talent Acquisition Team</p><p style=\"text-align: right;\">Kanini Software Solutions</p>','Request to Conduct Kanini On-Campus Recruitment Drive','KANINI ONCAMPUS DRIVE'),(6,'<p>Dear Sir/Madam,</p><p><br></p><p><strong>Greetings from Kanini Software Solutions.</strong></p><p>We are pleased to invite students from your esteemed institution to participate in our upcoming Off-Campus Recruitment Drive.</p><p>The drive is being organized to identify talented and aspiring graduates for opportunities at Kanini Software Solutions. We would be grateful if your institution could encourage eligible students to participate in the recruitment process.</p><p><br></p><p>Please find the drive details below:</p><p><br></p><p>Drive Date:</p><p>Drive Location:</p><p>Registration Deadline:</p><p><br></p><p>Kindly share the attached student details template with interested candidates and request them to complete the required information accurately.</p><p><br></p><p>Eligible students are advised to carry the necessary documents during the recruitment process, including:</p><p><br></p><p>ΓÇó Updated Resume</p><p>ΓÇó College ID Card</p><p>ΓÇó Personal laptop</p><p><br></p><p>For any queries or clarification, please contact us at <a href=\"mailto:hrops.india@kanini.com\">hrops.india@kanini.com</a>.</p><p><br></p><p>We look forward to your institution\'s participation and continued collaboration.</p><p style=\"text-align: right;\"><br></p><p style=\"text-align: right;\">Warm regards,</p><p style=\"text-align: right;\"><em>Kanini Talent Acquisition Team</em></p><p style=\"text-align: right;\"><em>Kanini Software Solutions</em></p><p style=\"text-align: right;\"><br></p><p style=\"text-align: right;\"><img src=\"/siganture.png\"></p>','Invitation to Participate in Kanini Off-Campus Recruitment Drive','KANINI OFFCAMPUS DRIVE'),(7,'<p>Dear {{CANDIDATE_NAME}},</p><p>Greetings from Kanini Software Solutions.</p><p>We are pleased to inform you that you have been successfully shortlisted to participate in the <strong>{{DRIVE_NAME}}</strong> recruitment drive.</p><p><br></p><p>Please find your drive details below:</p><p><em>Registration Code: </em><strong><em>{{REGISTRATION_CODE}}</em></strong></p><p><em>Drive Date: </em><strong><em>{{START_DATE}}</em></strong></p><p><em>Reporting Batch Time: </em><strong><em>{{BATCH_TIME}}</em></strong></p><p><em>Drive Location: </em><strong><em>{{LOCATION}}</em></strong></p><p><br></p><p>You are requested to report to the venue on time and carry the following documents for verification:</p><p><br></p><p>ΓÇó Updated Resume</p><p>ΓÇó College ID Card</p><p>ΓÇó Personal Laptop for first round</p><p><br></p><p>Kindly ensure that you adhere to the reporting time and maintain professional attire throughout the recruitment process.</p><p>Please keep your Registration Code handy for future communication and verification purposes.</p><p><br></p><p>For any queries or assistance, feel free to contact us at <a href=\"mailto:hrops.india@kanini.com\">hrops.india@kanini.com</a>.</p><p>We wish you all the very best and look forward to meeting you during the drive.</p><p><br></p><p style=\"text-align: right;\">Warm regards,</p><p style=\"text-align: right;\">Kanini Talent Acquisition Team</p><p style=\"text-align: right;\">Kanini Software Solutions</p><p style=\"text-align: right;\"><img src=\"/siganture.png\"></p>','Shortlisted for Drive ΓÇô Kanini Software Solutions','KANINI SHORTLISTED INVITE'),(8,'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>We are pleased to inform you that you have been selected in Round {{ROUND_NO}} of the recruitment process.</p><p><br></p><p>Further details will be shared shortly. Kindly stay prepared and keep checking your email for updates.</p><p><br></p><p>We congratulate you on your progress and wish you the very best.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src=\"/siganture.png\"></p>','KANINI SELECTION UPDATE','ROUND SELECTED'),(9,'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>Thank you for participating in Round {{ROUND_NO}} of our recruitment process.</p><p><br></p><p>We would like to inform you that your profile is currently on hold for further evaluation. Our team is reviewing the next steps, and any updates regarding your candidature will be communicated to you shortly.</p><p><br></p><p>We appreciate your patience and continued interest in Kanini Software Solutions.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src=\"/siganture.png\"></p>','KANINI DRIVE UPDATE','ROUND HOLD'),(10,'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>Thank you for participating in Round {{ROUND_NO}} of our recruitment process.</p><p><br></p><p>After careful evaluation, we regret to inform you that you have not been shortlisted for the next round.</p><p><br></p><p>We appreciate your interest in Kanini Software Solutions and thank you for the time and effort invested in the process.</p><p><br></p><p>We wish you all the very best for your future opportunities.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src=\"/siganture.png\"></p>','KANINI DRIVE UPDATE','ROUND REJECTED'),(11,'<p>Dear {{NAME}},</p><p><br></p><p>Greetings from Kanini Software Solutions.</p><p><br></p><p>This is to inform you that your status for Round {{ROUND_NO}} of the recruitment process has been marked as {{STATUS}}.</p><p><br></p><p>As a result, your candidature will not be considered for further rounds of the current recruitment process.</p><p><br></p><p>We appreciate your interest in Kanini Software Solutions and thank you for your participation.</p><p><br></p><p>We wish you all the very best for your future opportunities.</p><p><br></p><p>Warm regards,</p><p>Kanini Talent Acquisition Team</p><p>Kanini Software Solutions</p><p><img src=\"/siganture.png\"></p>','KANINI DRIVE UPDATE','ROUND DROPPED');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flyway_schema_history`
--

DROP TABLE IF EXISTS `flyway_schema_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flyway_schema_history` (
  `installed_rank` int NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `description` varchar(200) NOT NULL,
  `type` varchar(20) NOT NULL,
  `script` varchar(1000) NOT NULL,
  `checksum` int DEFAULT NULL,
  `installed_by` varchar(100) NOT NULL,
  `installed_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `execution_time` int NOT NULL,
  `success` tinyint(1) NOT NULL,
  PRIMARY KEY (`installed_rank`),
  KEY `flyway_schema_history_s_idx` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flyway_schema_history`
--

LOCK TABLES `flyway_schema_history` WRITE;
/*!40000 ALTER TABLE `flyway_schema_history` DISABLE KEYS */;
INSERT INTO `flyway_schema_history` VALUES (1,'0','<< Flyway Baseline >>','BASELINE','<< Flyway Baseline >>',NULL,'root','2026-05-15 09:50:01',0,1),(2,'1','Initial Schema','SQL','V1__Initial_Schema.sql',1198923343,'root','2026-05-15 09:50:02',292,1),(3,'2','Seed Data','SQL','V2__Seed_Data.sql',-687841293,'root','2026-05-15 09:50:02',59,1);
/*!40000 ALTER TABLE `flyway_schema_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `form`
--

DROP TABLE IF EXISTS `form`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `form` (
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

--
-- Dumping data for table `form`
--

LOCK TABLES `form` WRITE;
/*!40000 ALTER TABLE `form` DISABLE KEYS */;
/*!40000 ALTER TABLE `form` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hiring_cycles`
--

DROP TABLE IF EXISTS `hiring_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hiring_cycles` (
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hiring_cycles`
--

LOCK TABLES `hiring_cycles` WRITE;
/*!40000 ALTER TABLE `hiring_cycles` DISABLE KEYS */;
INSERT INTO `hiring_cycles` VALUES (2,NULL,NULL,'2026-05-05 17:35:35.469970','2025 Campus Hiring',2025,NULL,'CLOSED',NULL),(3,NULL,NULL,'2026-05-05 17:35:35.474673','2026 Campus Hiring',2026,NULL,'OPEN',NULL);
/*!40000 ALTER TABLE `hiring_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hiring_demand`
--

DROP TABLE IF EXISTS `hiring_demand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hiring_demand` (
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

--
-- Dumping data for table `hiring_demand`
--

LOCK TABLES `hiring_demand` WRITE;
/*!40000 ALTER TABLE `hiring_demand` DISABLE KEYS */;
/*!40000 ALTER TABLE `hiring_demand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institute_contacts`
--

DROP TABLE IF EXISTS `institute_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institute_contacts` (
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

--
-- Dumping data for table `institute_contacts`
--

LOCK TABLES `institute_contacts` WRITE;
/*!40000 ALTER TABLE `institute_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `institute_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institute_programs`
--

DROP TABLE IF EXISTS `institute_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institute_programs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `institute_id` bigint NOT NULL,
  `program_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_institute_program` (`institute_id`,`program_id`),
  KEY `idx_institute_program_institute` (`institute_id`),
  KEY `FKj9ls4dgxvlpln2dxifwadkaeg` (`program_id`),
  CONSTRAINT `FKj9ls4dgxvlpln2dxifwadkaeg` FOREIGN KEY (`program_id`) REFERENCES `programs` (`program_id`),
  CONSTRAINT `FKm77vw7rtv966in656nqvl8cmf` FOREIGN KEY (`institute_id`) REFERENCES `institutes` (`institute_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `institute_programs`
--

LOCK TABLES `institute_programs` WRITE;
/*!40000 ALTER TABLE `institute_programs` DISABLE KEYS */;
INSERT INTO `institute_programs` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,16),(7,2,2),(5,2,6),(6,2,7),(10,3,3),(11,3,4),(8,3,6),(9,3,7),(12,4,1),(13,4,2),(14,4,3),(16,4,4),(17,4,9),(15,4,16),(18,5,1),(19,5,2),(20,5,3),(22,5,4),(21,5,16),(23,6,1),(24,6,2),(25,6,3),(27,6,4),(26,6,5),(28,6,10),(31,7,3),(29,7,6),(30,7,7),(32,7,15),(35,8,2),(33,8,6),(34,8,7),(36,8,16);
/*!40000 ALTER TABLE `institute_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institutes`
--

DROP TABLE IF EXISTS `institutes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institutes` (
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `institutes`
--

LOCK TABLES `institutes` WRITE;
/*!40000 ALTER TABLE `institutes` DISABLE KEYS */;
INSERT INTO `institutes` VALUES (1,'Chennai','2026-05-05 17:35:35.483442','Anna University','TIER_1',_binary '','Tamil Nadu'),(2,'Chennai','2026-05-05 17:35:35.488463','SSN College of Engineering','TIER_1',_binary '','Tamil Nadu'),(3,'Coimbatore','2026-05-05 17:35:35.492160','PSG College of Technology','TIER_2',_binary '','Tamil Nadu'),(4,'Coimbatore','2026-05-05 17:35:35.495093','Amrita Vishwa Vidyapeetham','TIER_1',_binary '','Tamil Nadu'),(5,'Vellore','2026-05-05 17:35:35.498661','VIT University','TIER_1',_binary '','Tamil Nadu'),(6,'Chennai','2026-05-05 17:35:35.501665','SRM Institute of Science and Technology','TIER_2',_binary '','Tamil Nadu'),(7,'Coimbatore','2026-05-05 17:35:35.505674','Karunya Institute of Technology','TIER_2',_binary '','Tamil Nadu'),(8,'Chennai','2026-05-05 17:35:35.509461','CEG - College of Engineering Guindy','TIER_1',_binary '','Tamil Nadu'),(9,'Chennai','2026-05-05 17:35:35.512292','OTHERS College','TIER_1',_binary '','Tamil Nadu');
/*!40000 ALTER TABLE `institutes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intern_certificates`
--

DROP TABLE IF EXISTS `intern_certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intern_certificates` (
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intern_certificates`
--

LOCK TABLES `intern_certificates` WRITE;
/*!40000 ALTER TABLE `intern_certificates` DISABLE KEYS */;
INSERT INTO `intern_certificates` VALUES (1,'Java Fundamentals Completion',NULL,'2026-05-16','Kanini Academy','2026-05-13 13:32:56.000000',10),(2,'Java Fundamentals Completion',NULL,'2026-05-16','Kanini Academy','2026-05-13 13:32:56.000000',11),(3,'AWS Cloud Practitioner',NULL,'2026-04-20','Amazon Web Services','2026-05-13 13:32:56.000000',10),(4,'Git & GitHub Essentials',NULL,'2026-05-01','Kanini Academy','2026-05-13 13:32:56.000000',11);
/*!40000 ALTER TABLE `intern_certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intern_profiles`
--

DROP TABLE IF EXISTS `intern_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intern_profiles` (
  `profile_id` bigint NOT NULL AUTO_INCREMENT,
  `bio` text,
  `profile_links` json DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `uk_intern_profile_user` (`user_id`),
  CONSTRAINT `FKmf7ntibfeknj89nuy3ueecff0` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intern_profiles`
--

LOCK TABLES `intern_profiles` WRITE;
/*!40000 ALTER TABLE `intern_profiles` DISABLE KEYS */;
INSERT INTO `intern_profiles` VALUES (1,'Full-stack developer passionate about Java and cloud technologies. B.Tech CSE from Anna University.','{\"github\": \"https://github.com/srinivath-m\", \"linkedin\": \"https://linkedin.com/in/srinivathmohan\"}','2026-05-13 13:32:56.000000',23),(2,'Aspiring software engineer with interest in backend development and microservices. B.Tech CSE from Anna University.','{\"github\": \"https://github.com/manoharbavigadda\", \"linkedin\": \"https://linkedin.com/in/manoharbavigadda\"}','2026-05-13 13:32:56.000000',24),(3,'Tech enthusiast focused on data engineering and Python. B.Tech IT from VIT.','{\"github\": \"https://github.com/pradeep-kumar\", \"linkedin\": \"https://linkedin.com/in/pradeepkumar-dev\"}','2026-05-13 13:32:56.000000',25);
/*!40000 ALTER TABLE `intern_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `intern_warnings`
--

DROP TABLE IF EXISTS `intern_warnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `intern_warnings` (
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `intern_warnings`
--

LOCK TABLES `intern_warnings` WRITE;
/*!40000 ALTER TABLE `intern_warnings` DISABLE KEYS */;
INSERT INTO `intern_warnings` VALUES (2,NULL,NULL,NULL,'2026-05-11 11:09:21.000000','Your attendance has dropped to 68% which is below the required 75%. Continued absence may result in program termination. Please discuss with your coordinator.','SEVERE','ACTIVE','ATTENDANCE',10,5),(4,NULL,NULL,NULL,'2026-05-13 09:00:00.000000','Your attendance has dropped to 71%. The minimum required is 75%. Please ensure regular attendance.','MODERATE','ACTIVE','ATTENDANCE',10,12),(5,NULL,NULL,21,'2026-05-16 18:00:00.000000','Your Java Fundamentals score (58) is below the minimum passing score of 60. Please attend remedial sessions.','MINOR','ACTIVE','PERFORMANCE',10,12),(6,'2026-05-09 18:30:00.000000','Apologies, I had transport issues. I will plan better.',NULL,'2026-05-09 17:00:00.000000','You were late to 2 sessions this week. Please be on time for all scheduled sessions.','MINOR','ACKNOWLEDGED','PUNCTUALITY',10,11);
/*!40000 ALTER TABLE `intern_warnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES (3,'2026-05-11 11:09:21.000000','2026-05-05','EMERGENCY','Family emergency at home','Take care. Submit medical certificate if needed.','2026-05-11 11:09:21.000000','APPROVED','2026-05-05',10,5),(4,'2026-05-11 11:09:21.000000','2026-05-07','SICK','Stomach infection',NULL,'2026-05-11 11:09:21.000000','APPROVED','2026-05-07',10,5),(7,'2026-05-06 20:00:00.000000','2026-05-07','SICK','Fever and headache, unable to attend training.','Get well soon. Please share medical certificate.','2026-05-07 08:00:00.000000','APPROVED','2026-05-07',10,10),(8,'2026-05-05 18:00:00.000000','2026-05-06','PERSONAL','Need to visit bank for account opening.','Approved. Please complete pending assignments.','2026-05-06 08:00:00.000000','APPROVED','2026-05-06',10,12),(9,'2026-05-07 21:00:00.000000','2026-05-08','SICK','Food poisoning.',NULL,'2026-05-08 08:00:00.000000','APPROVED','2026-05-08',10,12),(10,'2026-05-13 10:00:00.000000','2026-05-20','PERSONAL','Family function - need to travel home.',NULL,NULL,'PENDING','2026-05-20',NULL,11);
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manual_override`
--

DROP TABLE IF EXISTS `manual_override`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_override` (
  `override_id` bigint NOT NULL AUTO_INCREMENT,
  `changes` json NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `entity_id` bigint NOT NULL,
  `entity_type` enum('CANDIDATES','CANDIDATE_EVALUATIONS','DOCUMENT_SUBMISSIONS','DRIVES','HIRING_DEMAND','OFFER_LETTERS','TRAINING_COURSES','TRAINING_SCORES') NOT NULL,
  `override_reason` text NOT NULL,
  `created_by` bigint NOT NULL,
  PRIMARY KEY (`override_id`),
  KEY `idx_override_entity` (`entity_type`,`entity_id`),
  KEY `idx_override_created_by` (`created_by`),
  KEY `idx_override_created_at` (`created_at`),
  CONSTRAINT `FK3mjodtfw5okvtjsfnyix5ldta` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manual_override`
--

LOCK TABLES `manual_override` WRITE;
/*!40000 ALTER TABLE `manual_override` DISABLE KEYS */;
/*!40000 ALTER TABLE `manual_override` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (14,'2026-05-12 15:52:33.403964',_binary '','Course \'Python\' (Batch 1) has been rescheduled ΓÇö New dates: 2026-05-05 to 2026-05-11','COURSE_RESCHEDULE',NULL,10),(15,'2026-05-12 15:52:46.780119',_binary '','Course \'SQL & Database\' (Batch 1) has been rescheduled ΓÇö New dates: 2026-06-16 to 2026-06-20','COURSE_RESCHEDULE',NULL,10),(16,'2026-05-12 15:53:07.110339',_binary '','Course \'React & TypeScript\' (Batch 1) has been rescheduled ΓÇö New dates: 2026-05-13 to 2026-06-12','COURSE_RESCHEDULE',NULL,10),(17,'2026-05-12 15:53:16.729862',_binary '','Course \'React & TypeScript\' (Batch 1) has been rescheduled ΓÇö New dates: 2026-05-12 to 2026-06-12','COURSE_RESCHEDULE',NULL,10),(18,'2026-05-12 15:53:36.366297',_binary '','Course \'React & TypeScript\' (Batch 1) has been rescheduled ΓÇö New dates: 2026-05-11 to 2026-06-12','COURSE_RESCHEDULE',NULL,10);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offer_letters`
--

DROP TABLE IF EXISTS `offer_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offer_letters` (
  `offer_id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text,
  `issue_date` date DEFAULT NULL,
  `responded_date` date DEFAULT NULL,
  `response` enum('EXPIRED','OFFER_ACCEPTED','OFFER_DECLINED','PENDING') DEFAULT NULL,
  `candidate_id` bigint DEFAULT NULL,
  `cycle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`offer_id`),
  KEY `idx_offer_candidate_id` (`candidate_id`),
  KEY `idx_offer_cycle_id` (`cycle_id`),
  CONSTRAINT `FK9rv5b0w8aro9qeh6kgcxonqrd` FOREIGN KEY (`cycle_id`) REFERENCES `hiring_cycles` (`cycle_id`),
  CONSTRAINT `FKn8biukllrlbotqmjdbh82luaw` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`candidate_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offer_letters`
--

LOCK TABLES `offer_letters` WRITE;
/*!40000 ALTER TABLE `offer_letters` DISABLE KEYS */;
INSERT INTO `offer_letters` VALUES (5,NULL,'2026-04-02','2026-04-06','OFFER_ACCEPTED',4,3),(6,NULL,'2026-04-03','2026-04-07','OFFER_ACCEPTED',5,3),(7,NULL,'2026-04-03','2026-04-08','OFFER_ACCEPTED',6,3);
/*!40000 ALTER TABLE `offer_letters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `program_id` bigint NOT NULL AUTO_INCREMENT,
  `program_name` enum('BBA','BCA','B_A','B_COM','B_E','B_SC','B_TECH','DIPLOMA','MBA','MCA','M_A','M_COM','M_E','M_SC','M_TECH','PHD') NOT NULL,
  PRIMARY KEY (`program_id`),
  UNIQUE KEY `UKggtw8utphf0wlcjte2omv69bs` (`program_name`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
--

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
INSERT INTO `programs` VALUES (10,'BBA'),(5,'BCA'),(13,'B_A'),(11,'B_COM'),(6,'B_E'),(8,'B_SC'),(1,'B_TECH'),(15,'DIPLOMA'),(3,'MBA'),(4,'MCA'),(14,'M_A'),(12,'M_COM'),(7,'M_E'),(9,'M_SC'),(2,'M_TECH'),(16,'PHD');
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `requisition_skills`
--

DROP TABLE IF EXISTS `requisition_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `requisition_skills` (
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

--
-- Dumping data for table `requisition_skills`
--

LOCK TABLES `requisition_skills` WRITE;
/*!40000 ALTER TABLE `requisition_skills` DISABLE KEYS */;
/*!40000 ALTER TABLE `requisition_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `role_name` enum('BU_SPOC','HIRING_MANAGER','HR_OPERATIONS','INTERN','MEMBERS','SYSTEM_ADMIN','TA_HEAD','TA_MANAGER','TRAINING_COORDINATOR') DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `idx_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'2026-05-05 17:35:33.184548','TA_HEAD'),(2,'2026-05-05 17:35:33.197378','TA_MANAGER'),(3,'2026-05-05 17:35:33.200372','HIRING_MANAGER'),(4,'2026-05-05 17:35:33.203144','MEMBERS'),(5,'2026-05-05 17:35:33.205408','HR_OPERATIONS'),(6,'2026-05-05 17:35:33.207918','TRAINING_COORDINATOR'),(7,'2026-05-05 17:35:33.211181','BU_SPOC'),(8,'2026-05-05 17:35:33.214196','SYSTEM_ADMIN'),(9,'2026-05-05 17:35:33.216876','INTERN');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `round_templates`
--

DROP TABLE IF EXISTS `round_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `round_templates` (
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `round_templates`
--

LOCK TABLES `round_templates` WRITE;
/*!40000 ALTER TABLE `round_templates` DISABLE KEYS */;
INSERT INTO `round_templates` VALUES (1,'2026-05-15 15:20:02.000000',_binary '',80,120,'Aptitude Round',1,'[{\"outOf\": 30, \"sectionName\": \"Technical\"}, {\"outOf\": 20, \"sectionName\": \"Aptitude\"}, {\"outOf\": 20, \"sectionName\": \"Verbal\"}, {\"outOf\": 20, \"sectionName\": \"Logical\"}, {\"outOf\": 30, \"sectionName\": \"Coding\"}]',40,1),(2,'2026-05-15 15:20:02.000000',_binary '',70,100,'Communication Round',2,'[{\"outOf\": 30, \"sectionName\": \"Listening\"}, {\"outOf\": 30, \"sectionName\": \"Writing\"}, {\"outOf\": 40, \"sectionName\": \"Speaking\"}]',40,1),(3,'2026-05-15 15:20:02.000000',_binary '',70,100,'Technical Round',3,'[{\"outOf\": 30, \"sectionName\": \"Problem_Solving\"}, {\"outOf\": 30, \"sectionName\": \"Coding_Proficiency\"}, {\"outOf\": 40, \"sectionName\": \"Communication_Skill\"}]',30,1);
/*!40000 ALTER TABLE `round_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `skill_id` bigint NOT NULL AUTO_INCREMENT,
  `category` enum('SOFT_SKILL','TECHNICAL') DEFAULT NULL,
  `skill_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`skill_id`),
  UNIQUE KEY `idx_skill_name` (`skill_name`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,'TECHNICAL','Java'),(2,'TECHNICAL','Python'),(3,'TECHNICAL','JavaScript'),(4,'TECHNICAL','C++'),(5,'TECHNICAL','C#'),(6,'TECHNICAL','Go'),(7,'TECHNICAL','Rust'),(8,'TECHNICAL','React'),(9,'TECHNICAL','Angular'),(10,'TECHNICAL','Vue.js'),(11,'TECHNICAL','Node.js'),(12,'TECHNICAL','Spring Boot'),(13,'TECHNICAL','HTML'),(14,'TECHNICAL','CSS'),(15,'TECHNICAL','MySQL'),(16,'TECHNICAL','PostgreSQL'),(17,'TECHNICAL','MongoDB'),(18,'TECHNICAL','Oracle'),(19,'TECHNICAL','SQL Server'),(20,'TECHNICAL','AWS'),(21,'TECHNICAL','Azure'),(22,'TECHNICAL','Docker'),(23,'TECHNICAL','Kubernetes'),(24,'TECHNICAL','Jenkins'),(25,'TECHNICAL','Git'),(26,'TECHNICAL','Machine Learning'),(27,'TECHNICAL','Data Analysis'),(28,'TECHNICAL','TensorFlow'),(29,'TECHNICAL','PyTorch'),(30,'TECHNICAL','Pandas'),(31,'TECHNICAL','Manual Testing'),(32,'TECHNICAL','Selenium'),(33,'TECHNICAL','JUnit'),(34,'TECHNICAL','Jest'),(35,'TECHNICAL','Cypress'),(36,'TECHNICAL','ServiceNow'),(37,'TECHNICAL','Salesforce'),(38,'TECHNICAL','SAP'),(39,'SOFT_SKILL','Communication'),(40,'SOFT_SKILL','Problem Solving'),(41,'SOFT_SKILL','Leadership'),(42,'SOFT_SKILL','Teamwork'),(43,'SOFT_SKILL','Time Management'),(44,'SOFT_SKILL','Adaptability'),(45,'SOFT_SKILL','Critical Thinking'),(46,'SOFT_SKILL','Creativity');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_courses`
--

DROP TABLE IF EXISTS `training_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_courses` (
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
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_courses`
--

LOCK TABLES `training_courses` WRITE;
/*!40000 ALTER TABLE `training_courses` DISABLE KEYS */;
INSERT INTO `training_courses` VALUES (21,NULL,'Java Fundamentals','2026-05-11 18:16:00.000000','Core Java concepts including OOP, collections, streams, and exception handling',0,60,25),(22,NULL,'Spring Boot','2026-05-11 18:16:00.000000','Spring Boot framework, REST APIs, JPA, security, and microservices basics',0,60,25),(23,NULL,'React & TypeScript','2026-05-11 18:16:00.000000','Frontend development with React 18, TypeScript, hooks, and state management',0,60,20),(24,NULL,'SQL & Database','2026-05-11 18:16:00.000000','Relational database design, MySQL queries, joins, indexing, and optimization',0,60,15),(25,NULL,'Python','2026-05-11 18:16:00.000000','Python programming fundamentals, data structures, and scripting',0,60,15),(26,'[{\"name\": \"Grammar\", \"maxScore\": 20}, {\"name\": \"Proactiveness\", \"maxScore\": 20}, {\"name\": \"Fluency\", \"maxScore\": 10}]','Communication Skills','2026-05-11 18:16:00.000000','Professional communication, presentation skills, and email etiquette',1,50,NULL);
/*!40000 ALTER TABLE `training_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_day_attendance`
--

DROP TABLE IF EXISTS `training_day_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_day_attendance` (
  `attendance_id` bigint NOT NULL AUTO_INCREMENT,
  `attendance_date` date NOT NULL,
  `is_present` bit(1) NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uk_student_attendance_date` (`student_id`,`attendance_date`),
  CONSTRAINT `FKs7mew2wm9pr9wj5se16n3ptly` FOREIGN KEY (`student_id`) REFERENCES `batch_allocations` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_day_attendance`
--

LOCK TABLES `training_day_attendance` WRITE;
/*!40000 ALTER TABLE `training_day_attendance` DISABLE KEYS */;
INSERT INTO `training_day_attendance` VALUES (16,'2026-05-05',_binary '',4),(17,'2026-05-06',_binary '',4),(18,'2026-05-07',_binary '',4),(19,'2026-05-08',_binary '',4),(20,'2026-05-09',_binary '',4),(21,'2026-05-05',_binary '\0',5),(22,'2026-05-06',_binary '',5),(23,'2026-05-07',_binary '\0',5),(24,'2026-05-08',_binary '',5),(25,'2026-05-09',_binary '\0',5),(26,'2026-05-05',_binary '',6),(27,'2026-05-06',_binary '',6),(28,'2026-05-07',_binary '',6),(29,'2026-05-08',_binary '',6),(30,'2026-05-09',_binary '',6),(31,'2026-05-05',_binary '',10),(32,'2026-05-06',_binary '',10),(33,'2026-05-07',_binary '\0',10),(34,'2026-05-08',_binary '',10),(35,'2026-05-09',_binary '',10),(36,'2026-05-12',_binary '',10),(37,'2026-05-13',_binary '',10),(38,'2026-05-05',_binary '',11),(39,'2026-05-06',_binary '',11),(40,'2026-05-07',_binary '',11),(41,'2026-05-08',_binary '',11),(42,'2026-05-09',_binary '',11),(43,'2026-05-12',_binary '',11),(44,'2026-05-13',_binary '',11),(45,'2026-05-05',_binary '',12),(46,'2026-05-06',_binary '\0',12),(47,'2026-05-07',_binary '',12),(48,'2026-05-08',_binary '\0',12),(49,'2026-05-09',_binary '',12),(50,'2026-05-12',_binary '',12),(51,'2026-05-13',_binary '',12);
/*!40000 ALTER TABLE `training_day_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_programs`
--

DROP TABLE IF EXISTS `training_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_programs` (
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_programs`
--

LOCK TABLES `training_programs` WRITE;
/*!40000 ALTER TABLE `training_programs` DISABLE KEYS */;
INSERT INTO `training_programs` VALUES (1,30,'2026-05-08 13:40:58.067840','BANGALORE',2,'KA-ACADEMY26',2026,_binary '',3),(2,30,'2026-05-11 11:09:20.000000','COIMBATORE',2,'2026 Graduate Training Program',2026,_binary '',3);
/*!40000 ALTER TABLE `training_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `training_scores`
--

DROP TABLE IF EXISTS `training_scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `training_scores` (
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `training_scores`
--

LOCK TABLES `training_scores` WRITE;
/*!40000 ALTER TABLE `training_scores` DISABLE KEYS */;
INSERT INTO `training_scores` VALUES (13,NULL,'2026-05-16 17:00:00.000000','Strong understanding of OOP concepts and collections.',88,'EXCELLENT',21,10,10),(14,NULL,'2026-05-16 17:00:00.000000','Good grasp of fundamentals. Needs practice with streams.',76,'GOOD',21,10,11),(15,NULL,'2026-05-16 17:00:00.000000','Struggling with inheritance and polymorphism. Extra sessions recommended.',58,'BELOW_AVERAGE',21,10,12),(16,NULL,'2026-05-23 17:00:00.000000','Excellent work on REST APIs and JPA mappings.',82,'EXCELLENT',22,10,10),(17,NULL,'2026-05-23 17:00:00.000000','Solid understanding of dependency injection and annotations.',79,'GOOD',22,10,11),(18,NULL,'2026-05-23 17:00:00.000000','Can build basic CRUD but needs more practice with relationships.',65,'AVERAGE',22,10,12);
/*!40000 ALTER TABLE `training_scores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'2026-05-05 17:35:35.385720','Talent Acquisition','sudha@kanini.com',_binary '','Chennai','$2a$10$mYYvXojawTlgDZOUP1ODQOKSs45FpuHEwhy.6wTqvpvQlQD6omYAC','Sudha',1),(2,'2026-05-05 17:35:35.411929','Talent Acquisition','mozhi@kanini.com',_binary '','Bangalore','$2a$10$kkq1WXIfo6EqRKIyEElHg.JZkle3j5FjkGZaF99HYwOPZjed9vp5O','Mozhi',2),(3,'2026-05-05 17:35:35.415931','Talent Acquisition','priya@kanini.com',_binary '','Chennai','$2a$10$R3E3ntVDkSoFpTN3EJyDvOFpBbwaS8/iKaaUM0la4FONczUf/2r/S','Priya',2),(4,'2026-05-05 17:35:35.420536','Product Engineering','parthiban@kanini.com',_binary '','Bangalore','$2a$10$h1n4gcBBmE4SHJdVW6x81u/IR4vjNvGMtGvgwZwu9VdGkTCo3JGFG','Parthiban',3),(5,'2026-05-05 17:35:35.426184','Product Engineering','ramesh@kanini.com',_binary '','Coimbatore','$2a$10$gb3OHkYN.KaLOeRH5U3Qwe4CX1BjOUyFyYGyaz.R19TjS61//vjPC','Ramesh',4),(6,'2026-05-05 17:35:35.430006','Product Engineering','priya.r@kanini.com',_binary '','Coimbatore','$2a$10$aa6mqNg8ocFA8n8K8iOmf.jaXatWG.yKJokEuOXawFNbm099clpNu','Priya Rajagopalan',4),(7,'2026-05-05 17:35:35.433647','Product Engineering','mozhiarasan@kanini.com',_binary '','Coimbatore','$2a$10$xxQ9os2AT8TvxEgbzmIl0uAX31LvPuo8rKzUlN9ZMvyI0tb8v2rq2','Mozhiarasan',4),(8,'2026-05-05 17:35:35.437263','Product Engineering','praveen@kanini.com',_binary '','Coimbatore','$2a$10$NoIbT58xU26.sMOuLqCfoOmMy8vhBI.Kc2zQgJDT9gNOBA7RULHRW','Praveen Kumar',4),(9,'2026-05-05 17:35:35.441705','Data Analytics & AI','reshni@kanini.com',_binary '','Coimbatore','$2a$10$A/.PLJxXy5rR5ZKHKLXMmeiL9WT8QtjEEl93m3W5ReeSgswGVf8fO','Reshni',8),(10,'2026-05-05 17:35:35.446050','Data Analytics & AI','lavanya@kanini.com',_binary '','Coimbatore','$2a$10$2KIkQVu0TlViKj90aZKkteYppsjBYsMKcKWJm4pS6xtpNGSAKCpGq','Lavanya',6),(11,'2026-05-05 17:35:35.451031','Training','john@kanini.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','John',9),(12,'2026-05-05 17:35:35.456664','Training','joe@kanini.com',_binary '','Coimbatore','$2a$10$lhgM69P1GXnoe74suifTLuh8HwqS/VoJUqQvTQ8OPM9ibekakjE72','Joe',9),(17,'2026-05-11 11:09:20.000000','Training','kavitharajan.work@gmail.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','Kavitha Rajan',9),(18,'2026-05-11 11:09:20.000000','Training','arunprakash.kanini@gmail.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','Arun Prakash',9),(19,'2026-05-11 11:09:20.000000','Training','divyalakshmi.tech@gmail.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','Divya Lakshmi',9),(23,'2026-05-12 18:10:34.000000','Training','knowledgeiq255@gmail.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','Srinivath Mohan',9),(24,'2026-05-12 18:10:34.000000','Training','manoharbavigadda@gmail.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','Manohar Bavigadda',9),(25,'2026-05-12 18:10:34.000000','Training','pradeepkumar.dev@gmail.com',_binary '','Coimbatore','$2a$10$1ACKG2zFGWpWMHPxnNJwxefPSh9Bw/h1fMwMVE6MzvVybmwm9wZ/i','Pradeep Kumar',9),(27,'2026-05-15 15:49:23.000000','Data Analytics & AI','admin@kanini.com',_binary '','Coimbatore','$2a$10$kkq1WXIfo6EqRKIyEElHg.JZkle3j5FjkGZaF99HYwOPZjed9vp5O','Admin',8);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'Springer'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-17 22:58:22
