-- Database Initialization Script for ReliefMap
-- ------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `reliefmap`;
USE `reliefmap`;

-- Disable foreign key checks for bulk creation
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------
-- Table: users
-- ------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'User ID',
  `user_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Username',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Password Hash',
  `preferred_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Language Code',
  `trust_score` int NOT NULL DEFAULT '5' COMMENT 'Trust Score',
  `contribution_count` int NOT NULL DEFAULT '0' COMMENT 'Total Contributions',
  `verified_contributions` int NOT NULL DEFAULT '0' COMMENT 'Verified Contributions',
  `user_role` enum('general','admin') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User Role',
  `ads_disabled_until` datetime DEFAULT NULL COMMENT 'Ads Disabled Until',
  `auth_provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auth Provider',
  `provider_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Provider User ID',
  `created_at` datetime NOT NULL COMMENT 'Creation Timestamp',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Users Table';

-- ------------------------------------------------------
-- Table: locations_base
-- ------------------------------------------------------
DROP TABLE IF EXISTS `locations_base`;
CREATE TABLE `locations_base` (
  `base_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'API Source ID',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Facility Name',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address',
  `latitude` decimal(10,7) NOT NULL COMMENT 'Latitude',
  `longitude` decimal(10,7) NOT NULL COMMENT 'Longitude',
  `source_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Source Name',
  `source_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Source External ID',
  `is_official` tinyint(1) NOT NULL COMMENT 'Is Official Data',
  `place_types` json DEFAULT NULL COMMENT 'Place Types (JSON)',
  `opening_hours` json DEFAULT NULL COMMENT 'Opening Hours (JSON)',
  `photo_reference` text COLLATE utf8mb4_unicode_ci,
  `google_rating` decimal(3,2) DEFAULT NULL COMMENT 'Google Rating',
  `google_ratings_total` int DEFAULT NULL COMMENT 'Total Ratings',
  `last_updated` datetime NOT NULL COMMENT 'Last Updated',
  PRIMARY KEY (`base_id`),
  KEY `idx_lat_lon` (`latitude`,`longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Base Location Data';

-- ------------------------------------------------------
-- Table: locations_ugc
-- ------------------------------------------------------
DROP TABLE IF EXISTS `locations_ugc`;
CREATE TABLE `locations_ugc` (
  `ugc_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'UGC ID',
  `user_id` bigint unsigned NOT NULL COMMENT 'Submitter ID',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Facility Name',
  `address_input` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Address Input',
  `latitude` decimal(10,7) NOT NULL COMMENT 'Latitude',
  `longitude` decimal(10,7) NOT NULL COMMENT 'Longitude',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft Delete',
  `created_at` datetime NOT NULL COMMENT 'Creation Time',
  `opening_hours` text COLLATE utf8mb4_unicode_ci,
  `closed_days` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `floors` json DEFAULT NULL COMMENT 'Floor info (JSON array)',
  PRIMARY KEY (`ugc_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `locations_ugc_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Generated Locations';

-- ------------------------------------------------------
-- Table: locations_merged
-- ------------------------------------------------------
DROP TABLE IF EXISTS `locations_merged`;
CREATE TABLE `locations_merged` (
  `location_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Location ID',
  `base_id` bigint unsigned DEFAULT NULL COMMENT 'Ref to Base',
  `ugc_id` bigint unsigned DEFAULT NULL COMMENT 'Ref to UGC',
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display Name',
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address',
  `latitude` decimal(10,7) NOT NULL COMMENT 'Latitude',
  `longitude` decimal(10,7) NOT NULL COMMENT 'Longitude',
  `geolocation` point NOT NULL COMMENT 'Spatial Point',
  `source_type` enum('api','admin','user') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Source Type',
  `verification_status` enum('red','yellow','green','verified','pending','unverified') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Verification Status',
  `verification_score` float NOT NULL COMMENT 'Verification Score',
  `auto_verified` tinyint(1) NOT NULL COMMENT 'Auto Verified',
  `admin_verified` tinyint(1) NOT NULL COMMENT 'Admin Verified',
  `creator_user_id` bigint unsigned DEFAULT NULL COMMENT 'Creator User ID',
  `creator_trust_score` int DEFAULT NULL COMMENT 'Creator Trust Score',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft Delete',
  `created_at` datetime NOT NULL COMMENT 'Creation Time',
  `opening_hours` text COLLATE utf8mb4_unicode_ci,
  `closed_days` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `images` json DEFAULT NULL,
  `floors` json DEFAULT NULL COMMENT 'Floor info (JSON array)',
  PRIMARY KEY (`location_id`),
  KEY `base_id` (`base_id`),
  KEY `ugc_id` (`ugc_id`),
  KEY `idx_lat_lon` (`latitude`,`longitude`),
  SPATIAL KEY `geolocation` (`geolocation`),
  CONSTRAINT `locations_merged_ibfk_1` FOREIGN KEY (`base_id`) REFERENCES `locations_base` (`base_id`) ON DELETE SET NULL,
  CONSTRAINT `locations_merged_ibfk_2` FOREIGN KEY (`ugc_id`) REFERENCES `locations_ugc` (`ugc_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Merged Locations Table';

-- ------------------------------------------------------
-- Table: amenities
-- ------------------------------------------------------
DROP TABLE IF EXISTS `amenities`;
CREATE TABLE `amenities` (
  `location_id` bigint unsigned NOT NULL COMMENT 'Location ID',
  `western_style` tinyint(1) NOT NULL COMMENT 'Western Style',
  `japanese_style` tinyint(1) NOT NULL COMMENT 'Japanese Style',
  `accessible` tinyint(1) NOT NULL COMMENT 'Wheelchair Accessible',
  `child_seat` tinyint(1) DEFAULT '0',
  `warm_seat` tinyint(1) NOT NULL COMMENT 'Warm Seat',
  `gender_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Gender Type',
  `public_toilet` tinyint(1) DEFAULT '0',
  `gender_separated` tinyint(1) DEFAULT '0',
  `powder_room` tinyint(1) DEFAULT '0',
  `diaper_changing` tinyint(1) DEFAULT '0',
  `barrier_free` tinyint(1) DEFAULT '0',
  `ostomate` tinyint(1) DEFAULT '0',
  `large_bed` tinyint(1) DEFAULT '0',
  `parking` tinyint(1) DEFAULT '0',
  `store_usage` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`location_id`),
  CONSTRAINT `amenities_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations_merged` (`location_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Amenities Table';

-- ------------------------------------------------------
-- Table: reviews
-- ------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `review_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Review ID',
  `location_id` bigint unsigned NOT NULL COMMENT 'Location ID',
  `user_id` bigint unsigned NOT NULL COMMENT 'User ID',
  `review_text` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Review Text',
  `cleanliness_score` int NOT NULL COMMENT 'Cleanliness Score',
  `wait_time_score` int NOT NULL COMMENT 'Wait Time Score',
  `user_trust_score` int NOT NULL COMMENT 'User Trust Score',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft Delete',
  `created_at` datetime NOT NULL COMMENT 'Creation Time',
  `is_location_accurate` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`review_id`),
  KEY `location_id` (`location_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations_merged` (`location_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reviews Table';

-- ------------------------------------------------------
-- Table: review_images
-- ------------------------------------------------------
DROP TABLE IF EXISTS `review_images`;
CREATE TABLE `review_images` (
  `image_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Image ID',
  `review_id` bigint unsigned NOT NULL COMMENT 'Review ID',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Image URL',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Soft Delete',
  `uploaded_at` datetime NOT NULL COMMENT 'Upload Time',
  PRIMARY KEY (`image_id`),
  KEY `review_id` (`review_id`),
  CONSTRAINT `review_images_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`review_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Review Images Table';

-- ------------------------------------------------------
-- Table: locations_tags
-- ------------------------------------------------------
DROP TABLE IF EXISTS `locations_tags`;
CREATE TABLE `locations_tags` (
  `tag_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Tag ID',
  `location_id` bigint unsigned NOT NULL COMMENT 'Location ID',
  `tag_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tag Name',
  PRIMARY KEY (`tag_id`),
  UNIQUE KEY `uk_location_tag` (`location_id`,`tag_name`),
  CONSTRAINT `locations_tags_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations_merged` (`location_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Location Tags';

-- ------------------------------------------------------
-- Table: ads
-- ------------------------------------------------------
DROP TABLE IF EXISTS `ads`;
CREATE TABLE `ads` (
  `ad_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Ad ID',
  `ad_source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ad Source',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Title',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Description',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Image URL',
  `target_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Target URL',
  `start_date` datetime NOT NULL COMMENT 'Start Date',
  `end_date` datetime NOT NULL COMMENT 'End Date',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status',
  `budget` decimal(10,2) DEFAULT NULL COMMENT 'Budget',
  `max_impressions` int DEFAULT NULL COMMENT 'Max Impressions',
  `max_clicks` int DEFAULT NULL COMMENT 'Max Clicks',
  `created_by` bigint unsigned NOT NULL COMMENT 'Creator ID',
  `created_at` datetime NOT NULL COMMENT 'Created At',
  PRIMARY KEY (`ad_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `ads_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ads Table';

-- ------------------------------------------------------
-- Table: ads_log
-- ------------------------------------------------------
DROP TABLE IF EXISTS `ads_log`;
CREATE TABLE `ads_log` (
  `log_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Log ID',
  `ad_id` int unsigned NOT NULL COMMENT 'Ad ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT 'User ID',
  `shown_at` datetime NOT NULL COMMENT 'Shown At',
  `clicked` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Clicked',
  PRIMARY KEY (`log_id`),
  KEY `ad_id` (`ad_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ads_log_ibfk_1` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`ad_id`) ON DELETE CASCADE,
  CONSTRAINT `ads_log_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ads Log';

-- ------------------------------------------------------
-- Table: ads_targeting
-- ------------------------------------------------------
DROP TABLE IF EXISTS `ads_targeting`;
CREATE TABLE `ads_targeting` (
  `target_id` int unsigned NOT NULL AUTO_INCREMENT COMMENT 'Target ID',
  `ad_id` int unsigned NOT NULL COMMENT 'Ad ID',
  `language` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Language',
  `location_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Location Type',
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User Role',
  `extra_criteria` json DEFAULT NULL COMMENT 'Extra Criteria',
  PRIMARY KEY (`target_id`),
  KEY `ad_id` (`ad_id`),
  CONSTRAINT `ads_targeting_ibfk_1` FOREIGN KEY (`ad_id`) REFERENCES `ads` (`ad_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ads Targeting';

-- ------------------------------------------------------
-- Table: contributions_log
-- ------------------------------------------------------
DROP TABLE IF EXISTS `contributions_log`;
CREATE TABLE `contributions_log` (
  `log_id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Log ID',
  `user_id` bigint unsigned NOT NULL COMMENT 'User ID',
  `location_id` bigint unsigned DEFAULT NULL COMMENT 'Location ID',
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Action Type',
  `created_at` datetime NOT NULL COMMENT 'Created At',
  PRIMARY KEY (`log_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `contributions_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Contributions Log';

-- ------------------------------------------------------
-- Table: wc_verifications
-- ------------------------------------------------------
DROP TABLE IF EXISTS `wc_verifications`;
CREATE TABLE `wc_verifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `location_data` json DEFAULT NULL,
  `status` enum('unverified','pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'unverified',
  `verification_score` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wc_verifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- End of script
