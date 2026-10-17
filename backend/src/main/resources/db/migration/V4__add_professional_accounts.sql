ALTER TABLE profesionales ADD COLUMN rol VARCHAR(20) DEFAULT 'PROFESSIONAL' NOT NULL;

ALTER TABLE profesionales ADD COLUMN usuario VARCHAR(30);

ALTER TABLE profesionales ADD COLUMN password_hash VARCHAR(100);

ALTER TABLE profesionales ALTER COLUMN especialidad DROP NOT NULL;

ALTER TABLE profesionales ADD CONSTRAINT uk_profesionales_usuario UNIQUE (usuario);
