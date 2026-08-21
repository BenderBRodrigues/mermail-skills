#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const manifestPaths = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".plugin/plugin.json",
];

function semver(value) {
  return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value);
}

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(root, relative), "utf8"));
}

const packageJson = await readJson("package.json");
const version = packageJson.version;
const errors = [];

if (!semver(version)) errors.push(`package.json has invalid semver: ${version}`);
const packageLock = await readJson("package-lock.json");
const lockVersion = packageLock.packages?.[""]?.version;
if (packageLock.version !== version || lockVersion !== version) {
  errors.push(`package-lock.json versions must match package.json ${version}`);
}

const manifests = {};
for (const relative of manifestPaths) {
  const manifest = await readJson(relative);
  manifests[relative] = manifest.version;
  if (manifest.version !== version) {
    errors.push(`${relative} version ${manifest.version} does not match package.json ${version}`);
  }
}

const tagIndex = process.argv.indexOf("--tag");
const tag = tagIndex >= 0 ? process.argv[tagIndex + 1] : undefined;
if (tagIndex >= 0 && !tag) errors.push("--tag requires a value");
if (tag && tag !== `v${version}`) {
  errors.push(`release tag ${tag} must equal v${version}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  component: "mermail-skills",
  version,
  tag: tag ?? null,
  lockVersion,
  manifests,
}, null, 2));
