const fs = require("fs");
const path = require("path");

const releaseType = process.argv[2];

if (!releaseType) {
  console.error("Usage: node ./scripts/bump-version.js <patch|minor|major|x.y.z>");
  process.exit(1);
}

const rootDir = path.resolve(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");
const packageLockPath = path.join(rootDir, "package-lock.json");
const manifestPath = path.join(rootDir, ".release-please-manifest.json");

const packageJson = readJson(packageJsonPath);
const packageLock = readJson(packageLockPath);
const releaseManifest = readJson(manifestPath);

const nextVersion = bumpVersion(packageJson.version, releaseType);

packageJson.version = nextVersion;
packageLock.version = nextVersion;

if (packageLock.packages && packageLock.packages[""]) {
  packageLock.packages[""].version = nextVersion;
}

releaseManifest["."] = nextVersion;

writeJson(packageJsonPath, packageJson);
writeJson(packageLockPath, packageLock);
writeJson(manifestPath, releaseManifest);

console.log(`Updated release version to ${nextVersion}`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function bumpVersion(currentVersion, target) {
  if (/^\d+\.\d+\.\d+$/.test(target)) {
    return target;
  }

  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);

  if (!match) {
    throw new Error(`Unsupported current version format: ${currentVersion}`);
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10);
  const patch = Number.parseInt(match[3], 10);

  switch (target) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unsupported release type: ${target}`);
  }
}