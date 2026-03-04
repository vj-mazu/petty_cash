const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.query('DELETE FROM "SequelizeMeta" WHERE name = \'011-add-new-feature-indexes.sql\'');
    console.log('✅ Migration 011 reset successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting migration:', error.message);
    process.exit(1);
  }
})();
