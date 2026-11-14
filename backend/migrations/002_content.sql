CREATE TABLE IF NOT EXISTS blog_posts (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 translation_group CHAR(32) NOT NULL,
 locale VARCHAR(5) NOT NULL DEFAULT 'en',
 slug VARCHAR(180) NOT NULL,
 title VARCHAR(200) NOT NULL,
 excerpt TEXT NOT NULL,
 content LONGTEXT NOT NULL,
 cover_image VARCHAR(500) NOT NULL DEFAULT '',
 cover_alt VARCHAR(250) NOT NULL DEFAULT '',
 seo_title VARCHAR(200) NOT NULL DEFAULT '',
 seo_description VARCHAR(320) NOT NULL DEFAULT '',
 status VARCHAR(20) NOT NULL DEFAULT 'draft',
 noindex TINYINT NOT NULL DEFAULT 0,
 published_at DATETIME NULL,
 author_id BIGINT UNSIGNED NOT NULL,
 author_name VARCHAR(120) NOT NULL,
 version INT NOT NULL DEFAULT 1,
 created_at DATETIME NOT NULL,
 updated_at DATETIME NOT NULL,
 UNIQUE KEY blog_locale_slug(locale,slug),
 INDEX blog_public(locale,status,published_at),
 UNIQUE KEY blog_translations(translation_group,locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS content_translations (
 entity VARCHAR(20) NOT NULL,
 entity_id BIGINT UNSIGNED NOT NULL,
 locale VARCHAR(5) NOT NULL,
 fields LONGTEXT NOT NULL,
 PRIMARY KEY(entity,entity_id,locale)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
