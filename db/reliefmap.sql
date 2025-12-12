SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- 1. USERS（利用者）
-- -----------------------------------------------------
CREATE TABLE USERS (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '利用者ID',
    user_name VARCHAR(100) NOT NULL COMMENT 'ユーザー名',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'メールアドレス',
    password_hash VARCHAR(255) NULL COMMENT 'パスワードハッシュ',
    preferred_language VARCHAR(10) NOT NULL COMMENT '優先言語',
    trust_score INT NOT NULL DEFAULT 5 COMMENT '信頼度スコア',
    contribution_count INT NOT NULL DEFAULT 0 COMMENT '投稿数',
    verified_contributions INT NOT NULL DEFAULT 0 COMMENT '承認済投稿数',
    user_role ENUM('general', 'admin') NOT NULL COMMENT 'ユーザーロール',
    ads_disabled_until DATETIME NULL COMMENT '広告非表示期限',
    auth_provider VARCHAR(50) NOT NULL COMMENT '認証プロバイダー',
    provider_id VARCHAR(255) NULL COMMENT 'プロバイダーID',
    created_at DATETIME NOT NULL COMMENT '作成日時',
    PRIMARY KEY (user_id)
) COMMENT='利用者テーブル';

-- -----------------------------------------------------
-- 2. LOCATIONS_BASE（API / GEOJSON）
-- -----------------------------------------------------
CREATE TABLE LOCATIONS_BASE (
    base_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'API由来ID',
    name VARCHAR(255) NOT NULL COMMENT '施設名',
    address VARCHAR(255) NULL COMMENT '住所',
    latitude DECIMAL(10, 7) NOT NULL COMMENT '緯度',
    longitude DECIMAL(10, 7) NOT NULL COMMENT '経度',
    source_name VARCHAR(100) NOT NULL COMMENT 'データソース',
    source_id VARCHAR(100) NULL COMMENT 'ソースID',
    is_official BOOLEAN NOT NULL COMMENT '公式データ',
    last_updated DATETIME NOT NULL COMMENT '更新日時',
    PRIMARY KEY (base_id),
    INDEX idx_lat_lon (latitude, longitude)
) COMMENT='公式位置情報テーブル';

-- -----------------------------------------------------
-- 3. LOCATIONS_UGC（ユーザー投稿）
-- -----------------------------------------------------
CREATE TABLE LOCATIONS_UGC (
    ugc_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'UGC ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '投稿者ID',
    name VARCHAR(255) NOT NULL COMMENT '施設名',
    address_input VARCHAR(255) NOT NULL COMMENT '住所入力',
    latitude DECIMAL(10, 7) NOT NULL COMMENT '緯度',
    longitude DECIMAL(10, 7) NOT NULL COMMENT '経度',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '論理削除フラグ',
    created_at DATETIME NOT NULL COMMENT '作成日時',
    PRIMARY KEY (ugc_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) COMMENT='ユーザー投稿位置情報テーブル';

-- -----------------------------------------------------
-- 4. LOCATIONS_MERGED（MAP表示用）
-- -----------------------------------------------------
CREATE TABLE LOCATIONS_MERGED (
    location_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'WC ID',
    base_id BIGINT UNSIGNED NULL COMMENT 'API元ID',
    ugc_id BIGINT UNSIGNED NULL COMMENT 'UGC元ID',
    display_name VARCHAR(255) NOT NULL COMMENT '表示名',
    address VARCHAR(255) NULL COMMENT '住所',
    latitude DECIMAL(10, 7) NOT NULL COMMENT '緯度',
    longitude DECIMAL(10, 7) NOT NULL COMMENT '経度',
    source_type ENUM('api', 'admin', 'user') NOT NULL COMMENT 'データ種別',
    verification_status ENUM('red', 'yellow', 'green') NOT NULL COMMENT '検証状態',
    verification_score FLOAT NOT NULL COMMENT '検証スコア',
    auto_verified BOOLEAN NOT NULL COMMENT '自動検証',
    admin_verified BOOLEAN NOT NULL COMMENT '管理者検証',
    creator_user_id BIGINT UNSIGNED NULL COMMENT '作成者ID',
    creator_trust_score INT NULL COMMENT '作成者信頼度',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '論理削除フラグ',
    created_at DATETIME NOT NULL COMMENT '作成日時',
    PRIMARY KEY (location_id),
    FOREIGN KEY (base_id) REFERENCES LOCATIONS_BASE(base_id) ON DELETE SET NULL,
    FOREIGN KEY (ugc_id) REFERENCES LOCATIONS_UGC(ugc_id) ON DELETE SET NULL,
    INDEX idx_lat_lon (latitude, longitude)
) COMMENT='統合位置情報テーブル';

-- -----------------------------------------------------
-- 5. REVIEWS（レビュー）
-- -----------------------------------------------------
CREATE TABLE REVIEWS (
    review_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'レビューID',
    location_id BIGINT UNSIGNED NOT NULL COMMENT 'WC ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '投稿者ID',
    review_text TEXT NOT NULL COMMENT '本文',
    cleanliness_score INT NOT NULL COMMENT '清潔度',
    wait_time_score INT NOT NULL COMMENT '混雑度',
    user_trust_score INT NOT NULL COMMENT '投稿時信頼度',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '論理削除フラグ',
    created_at DATETIME NOT NULL COMMENT '作成日時',
    PRIMARY KEY (review_id),
    FOREIGN KEY (location_id) REFERENCES LOCATIONS_MERGED(location_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) COMMENT='レビューテーブル';

-- -----------------------------------------------------
-- 6. REVIEW_IMAGES
-- -----------------------------------------------------
CREATE TABLE REVIEW_IMAGES (
    image_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '画像ID',
    review_id BIGINT UNSIGNED NOT NULL COMMENT 'レビューID',
    image_url VARCHAR(255) NOT NULL COMMENT '画像URL',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT '論理削除フラグ',
    uploaded_at DATETIME NOT NULL COMMENT '投稿日時',
    PRIMARY KEY (image_id),
    FOREIGN KEY (review_id) REFERENCES REVIEWS(review_id) ON DELETE CASCADE
) COMMENT='レビュー画像テーブル';

-- -----------------------------------------------------
-- 7. WC_VERIFICATIONS（検証）
-- -----------------------------------------------------
CREATE TABLE WC_VERIFICATIONS (
    verification_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '検証ID',
    location_id BIGINT UNSIGNED NOT NULL COMMENT 'WC ID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '検証者ID',
    trust_score INT NOT NULL COMMENT '信頼度',
    is_correct BOOLEAN NOT NULL COMMENT '正誤',
    verification_weight FLOAT NOT NULL COMMENT '重み',
    created_at DATETIME NOT NULL COMMENT '作成日時',
    PRIMARY KEY (verification_id),
    FOREIGN KEY (location_id) REFERENCES LOCATIONS_MERGED(location_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) COMMENT='検証テーブル';

-- -----------------------------------------------------
-- 8. AMENITIES（設備）
-- -----------------------------------------------------
CREATE TABLE AMENITIES (
    location_id BIGINT UNSIGNED NOT NULL COMMENT 'WC ID',
    western_style BOOLEAN NOT NULL COMMENT '洋式',
    japanese_style BOOLEAN NOT NULL COMMENT '和式',
    `accessible` BOOLEAN NOT NULL COMMENT '車椅子', -- Đã sửa lỗi cú pháp MySQL
    baby_changing BOOLEAN NOT NULL COMMENT 'おむつ台',
    warm_seat BOOLEAN NOT NULL COMMENT '温水',
    gender_type VARCHAR(20) NOT NULL COMMENT '性別',
    PRIMARY KEY (location_id),
    FOREIGN KEY (location_id) REFERENCES LOCATIONS_MERGED(location_id) ON DELETE CASCADE
) COMMENT='設備テーブル';

-- -----------------------------------------------------
-- 9. CONTRIBUTIONS_LOG
-- -----------------------------------------------------
CREATE TABLE CONTRIBUTIONS_LOG (
    log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ログID',
    user_id BIGINT UNSIGNED NOT NULL COMMENT '利用者ID',
    location_id BIGINT UNSIGNED NULL COMMENT 'WC ID',
    action_type VARCHAR(50) NOT NULL COMMENT '操作',
    created_at DATETIME NOT NULL COMMENT '実行日時',
    PRIMARY KEY (log_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) COMMENT='投稿履歴テーブル';

-- -----------------------------------------------------
-- 10. LOCATIONS_TAGS
-- -----------------------------------------------------
CREATE TABLE LOCATIONS_TAGS (
    tag_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'タグID',
    location_id BIGINT UNSIGNED NOT NULL COMMENT 'WC ID',
    tag_name VARCHAR(50) NOT NULL COMMENT 'タグ名',
    PRIMARY KEY (tag_id),
    FOREIGN KEY (location_id) REFERENCES LOCATIONS_MERGED(location_id) ON DELETE CASCADE,
    UNIQUE KEY uk_location_tag (location_id, tag_name)
) COMMENT='タグテーブル';

-- -----------------------------------------------------
-- 11. ADS（広告）
-- -----------------------------------------------------
CREATE TABLE ADS (
    ad_id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '広告ID',
    ad_source VARCHAR(255) NOT NULL COMMENT '広告ソース',
    title VARCHAR(255) NOT NULL COMMENT 'タイトル',
    description VARCHAR(255) NULL COMMENT '説明',
    image_url VARCHAR(255) NULL COMMENT '画像URL',
    target_url VARCHAR(255) NULL COMMENT 'リンクURL',
    start_date DATETIME NOT NULL COMMENT '開始日',
    end_date DATETIME NOT NULL COMMENT '終了日',
    status VARCHAR(50) NOT NULL COMMENT 'ステータス',
    budget DECIMAL(10, 2) NULL COMMENT '予算',
    max_impressions INT NULL COMMENT '最大表示回数',
    max_clicks INT NULL COMMENT '最大クリック数',
    created_by BIGINT UNSIGNED NOT NULL COMMENT '作成者ID',
    created_at DATETIME NOT NULL COMMENT '作成日時',
    PRIMARY KEY (ad_id),
    FOREIGN KEY (created_by) REFERENCES USERS(user_id) ON DELETE RESTRICT
) COMMENT='広告テーブル';

-- -----------------------------------------------------
-- 12. ADS_LOG
-- -----------------------------------------------------
CREATE TABLE ADS_LOG (
    log_id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ログID',
    ad_id INT UNSIGNED NOT NULL COMMENT '広告ID',
    user_id BIGINT UNSIGNED NULL COMMENT '利用者ID',
    shown_at DATETIME NOT NULL COMMENT '表示日時',
    clicked BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'クリックされたか',
    PRIMARY KEY (log_id),
    FOREIGN KEY (ad_id) REFERENCES ADS(ad_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE SET NULL
) COMMENT='広告履歴テーブル';

-- -----------------------------------------------------
-- 13. ADS_TARGETING
-- -----------------------------------------------------
CREATE TABLE ADS_TARGETING (
    target_id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ターゲットID',
    ad_id INT UNSIGNED NOT NULL COMMENT '広告ID',
    language VARCHAR(50) NULL COMMENT '言語',
    location_type VARCHAR(50) NULL COMMENT '施設タイプ',
    user_role VARCHAR(50) NULL COMMENT 'ユーザー種別',
    extra_criteria JSON NULL COMMENT '追加条件(JSON)',
    PRIMARY KEY (target_id),
    FOREIGN KEY (ad_id) REFERENCES ADS(ad_id) ON DELETE CASCADE
) COMMENT='広告ターゲティングテーブル';