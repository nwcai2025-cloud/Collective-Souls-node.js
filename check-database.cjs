const sqlite3 = require('sqlite3').verbose();

// Open the database
const db = new sqlite3.Database('backend/database/collective_souls.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Check what columns exist in the users table
db.all("PRAGMA table_info(users);", [], (err, rows) => {
  if (err) {
    console.error('Error querying table info:', err.message);
    return;
  }
  
  console.log('\n=== Users table structure ===');
  rows.forEach(row => {
    console.log(`Column: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULLABLE'}`);
  });
});

// Check for users with bob or Bobby in username or email
db.all("SELECT * FROM users WHERE email LIKE '%network-connected%' OR username LIKE '%bob%' OR username LIKE '%Bobby%';", [], (err, rows) => {
  if (err) {
    console.error('Error querying users:', err.message);
    return;
  }
  
  console.log('\n=== Users matching search criteria ===');
  if (rows.length === 0) {
    console.log('No users found with bob/Bobby or network-connected in username/email');
  } else {
    rows.forEach(row => {
      console.log('User data:', row);
      console.log('---');
    });
  }
});

// Check all users to see what's actually in the database
db.all("SELECT * FROM users;", [], (err, rows) => {
  if (err) {
    console.error('Error querying all users:', err.message);
    return;
  }
  
  console.log('\n=== All users in database ===');
  console.log(`Total users: ${rows.length}`);
  rows.forEach(row => {
    console.log('User:', row);
  });
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('\nDatabase connection closed');
    }
  });
});