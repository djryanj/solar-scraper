const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const packageJsonPath = path.join(rootDir, "package.json");
const packageLockPath = path.join(rootDir, "package-lock.json");
const manifestPath = path.join(rootDir, ".release-please-manifest.json");

const packageJson = readJson(packageJsonPath);
const packageLock = readJson(packageLockPath);
const releaseManifest = readJson(manifestPath);
const requestedTag = process.argv[2];
const version = packageJson.version;
const tag = requestedTag || `v${version}`;

assertEqual(version, releaseManifest["."], "package.json and .release-please-manifest.json");

if (packageLock.version !== version) {
  throw new Error("package-lock.json version does not match package.json");
}

if (packageLock.packages?.[""]?.version !== version) {
  throw new Error("package-lock.json root package version does not match package.json");
}

if (!/^v?\d+\.\d+\.\d+$/.test(tag)) {
  throw new Error(`Release tag must look like v1.2.3 or 1.2.3: ${tag}`);
}

ensureCommand("git", ["--version"]);
ensureCommand("gh", ["--version"]);
ensureCleanWorktree();
ensureBranch();
ensureNoLocalTag(tag);
ensureNoRemoteRelease(tag);

run("git", ["tag", "-a", tag, "-m", `Release ${tag}`]);
run("git", ["push", "origin", tag]);
run("gh", [
  "release",
  "create",
  tag,
  "--draft",
  "--title",
  tag,
  "--generate-notes",
  "--verify-tag",
]);

console.log(`Created and pushed tag ${tag}`);
console.log(`Created GitHub release draft for ${tag}`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function run(command, args) {
  return execFileSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "inherit",
  });
}

function read(command, args) {
  return execFileSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function ensureCommand(command, args) {
  try {
    read(command, args);
  } catch {
    throw new Error(`${command} is required but not available on PATH`);
  }
}

function ensureCleanWorktree() {
  const status = read("git", ["status", "--porcelain"]);

  if (status) {
    throw new Error("Working tree is not clean. Commit or stash changes before drafting a release.");
  }
}

function ensureBranch() {
  const branch = read("git", ["rev-parse", "--abbrev-ref", "HEAD"]);

  if (branch !== "main") {
    throw new Error(`Release drafts must be created from main. Current branch: ${branch}`);
  }
}

function ensureNoLocalTag(tagName) {
  try {
    read("git", ["rev-parse", "--verify", `refs/tags/${tagName}`]);
    throw new Error(`Git tag already exists locally: ${tagName}`);
  } catch (error) {
    if (!String(error.message).includes("Git tag already exists locally")) {
      return;
    }

    throw error;
  }
}

function ensureNoRemoteRelease(tagName) {
  try {
    read("gh", ["release", "view", tagName]);
    throw new Error(`GitHub release already exists for tag: ${tagName}`);
  } catch (error) {
    if (!String(error.message).includes("GitHub release already exists")) {
      return;
    }

    throw error;
  }
}

function assertEqual(left, right, description) {
  if (left !== right) {
    throw new Error(`Version mismatch between ${description}: ${left} !== ${right}`);
  }
}