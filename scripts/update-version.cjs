const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // Read package.json
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  // Generate versionCode based on semantic version (e.g., 1.0.3 -> 10003)
  const parts = version.split('.').map(Number);
  if (parts.some(isNaN) || parts.length < 3) {
    throw new Error(`Invalid semantic version format in package.json: "${version}"`);
  }
  const versionCode = parts[0] * 10000 + parts[1] * 100 + parts[2];

  // Dynamically check platforms
  const hasAndroid = fs.existsSync(path.resolve(__dirname, '../android'));
  const hasIos = fs.existsSync(path.resolve(__dirname, '../ios'));

  console.log(`[Version Sync] Updating native platforms to Version: ${version}, Build: ${versionCode}...`);

  if (hasAndroid && hasIos) {
    // Both platforms exist
    execSync(`npx capacitor-set-version -v ${version} -b ${versionCode}`, { stdio: 'inherit' });
  } else if (hasAndroid) {
    // Android only
    execSync(`npx capacitor-set-version set:android -v ${version} -b ${versionCode}`, { stdio: 'inherit' });
  } else if (hasIos) {
    // iOS only
    execSync(`npx capacitor-set-version set:ios -v ${version} -b ${versionCode}`, { stdio: 'inherit' });
  } else {
    console.log('[Version Sync] No native platforms (android/ios) found. Skipping version sync.');
    process.exit(0);
  }
  
  console.log('[Version Sync] Success! Native versions have been synchronized.');
} catch (error) {
  console.error('[Version Sync] Error occurred:', error.message);
  process.exit(1);
}
