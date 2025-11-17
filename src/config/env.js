/**
 * Environment variable validation
 * Ensures all required environment variables are present before starting the server
 */

const requiredEnvVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'SPOTIFY_REDIRECT_URI',
  'SESSION_SECRET'
];

function validateEnv() {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('\n========================================');
    console.error('ERROR: Missing required environment variables:');
    console.error('========================================');
    missingVars.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease create a .env file with the required variables.');
    console.error('See .env.example for reference.\n');
    process.exit(1);
  }

  // Validate SESSION_SECRET length
  if (process.env.SESSION_SECRET.length < 32) {
    console.error('\n========================================');
    console.error('ERROR: SESSION_SECRET must be at least 32 characters long');
    console.error('========================================\n');
    process.exit(1);
  }

  console.log('✓ Environment variables validated successfully');
}

module.exports = { validateEnv };
