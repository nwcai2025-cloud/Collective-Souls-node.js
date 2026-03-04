const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Open the database
const db = new sqlite3.Database('backend/database/collective_souls.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Hash the new password
const newPassword = 'bob123';
bcrypt.hash(newPassword, 12, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err.message);
    return;
  }
  
  console.log('New password hash:', hash);
  
  // Update the password for the bob user
  db.run("UPDATE users SET password = ? WHERE username = 'bob'", [hash], function(err) {
    if (err) {
      console.error('Error updating password:', err.message);
      return;
    }
    
    console.log(`Password updated for user 'bob'. Rows affected: ${this.changes}`);
    
    // Verify the update
    db.get("SELECT id, username, password FROM users WHERE username = 'bob'", [], (err, row) => {
      if (err) {
        console.error('Error verifying update:', err.message);
        return;
      }
      
      console.log('Updated user data:', row);
      
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    });
  });
});