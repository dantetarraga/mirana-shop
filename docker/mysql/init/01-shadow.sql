-- Base espejo para `prisma migrate dev` (SHADOW_DATABASE_URL).
CREATE DATABASE IF NOT EXISTS mirana_shadow;
GRANT ALL PRIVILEGES ON mirana_shadow.* TO 'mirana'@'%';
FLUSH PRIVILEGES;
