import { execSync } from 'child_process';

/**
 * Self-update command
 */
export async function runUpdate(): Promise<void> {
  console.log('Checking for updates...');

  try {
    // Get current version
    const pkg = await import('../../../package.json', { assert: { type: 'json' } });
    const currentVersion = pkg.default.version;
    console.log(`Current version: ${currentVersion}`);

    // Check npm for latest version
    const latestVersion = execSync('npm view clawd-code version', {
      encoding: 'utf-8',
    }).trim();

    if (latestVersion === currentVersion) {
      console.log('You are already on the latest version.');
      return;
    }

    console.log(`New version available: ${latestVersion}`);
    console.log('Updating...');

    // Perform update
    execSync('npm install -g clawd-code@latest', { stdio: 'inherit' });

    console.log(`Successfully updated to version ${latestVersion}`);
  } catch (error) {
    console.error('Update failed:', (error as Error).message);
    console.error('You can manually update with: npm install -g clawd-code@latest');
    process.exit(1);
  }
}
