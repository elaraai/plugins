#!/usr/bin/env node
// Renders the two marketplace files from catalog.json and the npm registry:
// each plugin whose package carries the channel's dist-tag is listed as an
// npm source pinned to that version; one not yet published is left out. So
// is a prerelease under `latest`: npm gives a new name's first publish
// `latest` whatever its version, and a bootstrap at `1.0.90-alpha.0` would
// otherwise be listed as the release until CI publishes one.
//
// Usage: node scripts/render.mjs [--tag latest|beta]
//   latest (default) renders the marketplaces `elaraai` / `elaraai-codex`;
//   beta renders `elaraai-beta` / `elaraai-codex-beta`, so both channels can
//   be registered at once.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const at = args.indexOf('--tag');
const tag = at === -1 ? 'latest' : args[at + 1];
if (tag !== 'latest' && tag !== 'beta') {
  console.error('Usage: render.mjs [--tag latest|beta]');
  process.exit(2);
}
const suffix = tag === 'latest' ? '' : `-${tag}`;
const catalog = JSON.parse(readFileSync('catalog.json', 'utf8'));

/** A semver prerelease: a hyphen after the patch number. */
const PRERELEASE = /^\d+\.\d+\.\d+-/;

/**
 * The version a package carries under the dist-tag, or null when it has none
 * (or is not published) — or when the tag is `latest` and the version is a
 * prerelease, which is no release.
 */
function published(pkg) {
  const r = spawnSync('npm', ['view', pkg, 'dist-tags', '--json'], { encoding: 'utf8' });
  if (r.status !== 0) {
    if (/E404/.test(r.stderr)) return null;
    throw new Error(`npm view ${pkg} failed: ${r.stderr.trim()}`);
  }
  const tags = r.stdout.trim() === '' ? {} : JSON.parse(r.stdout);
  const version = typeof tags[tag] === 'string' ? tags[tag] : null;
  if (version !== null && tag === 'latest' && PRERELEASE.test(version)) {
    console.log(`${pkg}@${version} is a prerelease under latest (a bootstrap, before its first release): left out`);
    return null;
  }
  return version;
}

const claude = [];
const codex = [];
for (const plugin of catalog.plugins) {
  const claudeVersion = published(plugin.claude.package);
  const codexVersion = published(plugin.codex.package);
  console.log(`${plugin.name}: ${plugin.claude.package}@${claudeVersion ?? '(unpublished)'}, ${plugin.codex.package}@${codexVersion ?? '(unpublished)'}`);
  if (claudeVersion !== null) {
    // A dependency is named only when the catalog lists it.
    const dependencies = (plugin.dependencies ?? []).filter((dep) => claude.some((entry) => entry.name === dep));
    claude.push({
      name: plugin.name,
      source: { source: 'npm', package: plugin.claude.package, version: claudeVersion },
      description: plugin.description,
      version: claudeVersion,
      author: catalog.owner,
      homepage: plugin.homepage,
      repository: plugin.repository,
      license: plugin.license,
      keywords: plugin.keywords,
      ...(dependencies.length > 0 && { dependencies }),
    });
  }
  if (codexVersion !== null) {
    codex.push({
      name: plugin.codex.name,
      source: { source: 'npm', package: plugin.codex.package, version: codexVersion },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
      category: 'Productivity',
    });
  }
}

const write = (path, json) => {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`wrote ${path} (${json.plugins.length} plugins)`);
};
write('.claude-plugin/marketplace.json', {
  name: `elaraai${suffix}`,
  owner: catalog.owner,
  description: `Elara AI's agent plugins for Claude Code${tag === 'beta' ? ', pre-release channel' : ''}: East and e3 cloud, each an npm package pinned at its ${tag} release`,
  plugins: claude,
});
write('.agents/plugins/marketplace.json', {
  name: `elaraai-codex${suffix}`,
  interface: { displayName: tag === 'beta' ? 'Elara AI (beta)' : 'Elara AI' },
  plugins: codex,
});
