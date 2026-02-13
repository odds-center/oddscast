import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'goldenrace_user',
  password: process.env.DB_PASSWORD || 'goldenrace_password',
  database: process.env.DB_DATABASE || 'goldenrace',
  entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function createAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    // 관리자 테이블 확인/생성
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
        isActive BOOLEAN DEFAULT TRUE,
        lastLoginAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ admins 테이블 준비 완료');

    // 기본 관리자 계정 생성
    const email = 'admin@goldenrace.com';
    const password = 'admin123456';
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    const result = await queryRunner.query(
      `
      INSERT INTO admins (email, username, password, role)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email = email
    `,
      [email, 'Super Admin', hashedPassword, 'super_admin']
    );

    if (result.affectedRows > 0) {
      console.log('\n✅ 관리자 계정 생성 성공!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 이메일:', email);
      console.log('🔑 비밀번호:', password);
      console.log('👤 역할: Super Admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경하세요!');
    } else {
      console.log('ℹ️  관리자 계정이 이미 존재합니다.');
    }

    await queryRunner.release();
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createAdmin();
