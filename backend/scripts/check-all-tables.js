import pool from '../src/config/database.js';

async function checkAllTables() {
  try {
    console.log('\n=== Checking All Academic Evaluation Tables ===\n');

    const tables = ['projects', 'evaluations', 'notifications', 'project_files', 'instructor_student_assignments'];
    
    for (const tableName of tables) {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`\n${tableName.toUpperCase()} table:`);
      if (result.rows.length === 0) {
        console.log('  ✗ Table does not exist');
      } else {
        result.rows.forEach(row => {
          console.log(`  ✓ ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
      }
    }
    
    // Check views
    console.log('\n\nCHECKING VIEWS:');
    const views = ['v_student_project_status', 'v_instructor_pending_projects', 'v_evaluation_summary'];
    
    for (const viewName of views) {
      const result = await pool.query(`
        SELECT 1 FROM information_schema.views
        WHERE table_name = $1
      `, [viewName]);
      
      if (result.rows.length > 0) {
        console.log(`  ✓ ${viewName} exists`);
      } else {
        console.log(`  ✗ ${viewName} does not exist`);
      }
    }
    
    // Check indexes
    console.log('\n\nCHECKING INDEXES:');
    const result = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('projects', 'evaluations', 'notifications', 'project_files')
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`  Found ${result.rows.length} indexes:`);
    result.rows.forEach(row => {
      console.log(`    - ${row.indexname}`);
    });
    
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

checkAllTables();
