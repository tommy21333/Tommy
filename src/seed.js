const bcrypt = require('bcryptjs');
const db = require('./db');

// Анхны админ хэрэглэгч болон жишээ өгөгдлийг нэг л удаа үүсгэнэ
module.exports = function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin12345';
  const adminName = process.env.ADMIN_NAME || 'Админ';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existing) {
    const hash = bcrypt.hashSync(String(adminPass), 10);
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role, is_vip)
       VALUES (?, ?, ?, 'admin', 1)`
    ).run(adminName, adminEmail, hash);
    console.log(`👑 Админ үүсгэв: ${adminEmail} / ${adminPass}`);
  }

  // Жишээ кино (зөвхөн анх удаа, өгөгдөл хоосон бол)
  const count = db.prepare('SELECT COUNT(*) AS c FROM movies').get().c;
  if (count === 0) {
    const insertMovie = db.prepare(
      `INSERT INTO movies (title, description, poster_url, year, genre, country, is_series, featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertEp = db.prepare(
      `INSERT INTO episodes (movie_id, number, title, video_url, video_type, duration)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    const sample = insertMovie.run(
      'Жишээ Кино',
      'Энэ бол админ панелаар кино нэмэх жишээ. Постер, товч агуулга, ангийн жагсаалттай.',
      '',
      2024,
      'Адал явдалт',
      'Монгол',
      1,
      1
    );
    // Нээлттэй туршилтын видео (Big Buck Bunny — эрхийн асуудалгүй)
    insertEp.run(
      sample.lastInsertRowid,
      1,
      '1-р анги',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'file',
      '9:56'
    );
    insertEp.run(
      sample.lastInsertRowid,
      2,
      '2-р анги',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'file',
      '10:53'
    );
    console.log('🎬 Жишээ кино нэмэв.');
  }
};
