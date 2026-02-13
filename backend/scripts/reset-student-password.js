import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function resetStudentPassword() {
  try {
    const username = 'salim';
    const newPassword = 'password123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1, must_change_password = false
      WHERE username = $2
      RETURNING id, username, full_name, email
    `, [hashedPassword, username]);
    
    if (result.rows.length > 0) {
      console.log('Password reset successfully for:');
      console.log(result.rows[0]);
      console.log('\nNew credentials:');
      console.log('Username:', username);
      console.log('Email:', result.rows[0].email);
      console.log('Password:', newPassword);
    } else {
      console.log('User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

resetStudentPassword();