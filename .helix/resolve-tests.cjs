const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(process.argv[2]);
const rawInput = process.argv[3] || '';
const manifestPath = path.join(repoRoot, '.helix/test-manifest.json');

/** @type {Record<string, string>} */
let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

const inputs = rawInput
  .split(',')
  .map((entry) => entry.trim().replace(/\r/g, ''))
  .filter(Boolean);

const resolved = [];
const missing = [];

function resolveCandidate(candidate) {
  const normalized = candidate.replace(/^\.\//, '').replace(/\\/g, '/');
  const absolutePath = path.join(repoRoot, normalized);

  if (fs.existsSync(absolutePath)) {
    return `./${normalized}`;
  }

  if (!normalized.endsWith('.js')) {
    const withExtension = `${normalized}.js`;
    if (fs.existsSync(path.join(repoRoot, withExtension))) {
      return `./${withExtension}`;
    }
  }

  return null;
}

for (const input of inputs) {
  const mapped = manifest[input] || input;
  const resolvedPath = resolveCandidate(mapped);

  if (resolvedPath) {
    resolved.push(resolvedPath);
  } else {
    missing.push(input);
  }
}

if (missing.length > 0) {
  console.error('Error: test file(s) not found:');
  missing.forEach((entry) => console.error(`  - ${entry}`));
  console.error('');
  console.error('Use a repo spec path (for example: src/MCTSpec.js) or a Helix alias from .helix/test-manifest.json:');
  Object.keys(manifest)
    .sort()
    .forEach((alias) => console.error(`  - ${alias} -> ${manifest[alias]}`));
  process.exit(1);
}

if (resolved.length === 0) {
  console.error('Error: no test files provided.');
  process.exit(1);
}

process.stdout.write(JSON.stringify(resolved));
