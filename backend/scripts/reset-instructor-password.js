import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function resetPassword() {
  try {
    const username = 'hayu';
    const newPassword = 'password123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1
      WHERE username = $2
      RETURNING id, username, full_name
    `, [hashedPassword, username]);
    
    if (result.rows.length > 0) {
      console.log('Password reset successfully for:');
      console.log(result.rows[0]);
      console.log('\nNew credentials:');
      console.log('Username:', username);
      console.log('Password:', newPassword);
    } else {
      console.log('User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();
