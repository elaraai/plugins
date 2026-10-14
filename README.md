# Elara AI plugins

The plugin marketplace for [Claude Code](https://claude.com/claude-code) and Codex: [East](https://github.com/elaraai/east-workspace)'s plugins and [e3 cloud](https://github.com/elaraai/e3-cloud)'s, each an npm package under `@elaraai`, listed here at its released version.

## Install

Claude Code, inside a session or from a terminal:

```text
/plugin marketplace add elaraai/plugins
/plugin install east@elaraai
/plugin install e3-cloud@elaraai
```

```bash
claude plugin marketplace add elaraai/plugins
claude plugin install east@elaraai
```

Codex:

```bash
codex plugin marketplace add elaraai/plugins
codex plugin add east-codex-plugin@elaraai-codex
codex plugin add e3-cloud-codex-plugin@elaraai-codex
```

Each plugin is fetched from npm with your npm client, as the version this catalog pins; nothing is cloned and no script runs. Node.js 22+ on `PATH` is what the plugins need at runtime.

**Updates.** A release of a plugin publishes its package and this catalog moves its pin within the hour (or at once, when the release asks it to). `/plugin marketplace update elaraai` or `claude plugin update east@elaraai` fetches the new version; turn on auto-update for the marketplace under **Marketplaces** in `/plugin` to receive it without asking. Codex: `codex plugin marketplace upgrade elaraai-codex`, then remove and add the plugin.

**Pre-releases.** The `beta` branch lists each package's `beta` dist-tag under the names `elaraai-beta` and `elaraai-codex-beta`, so both channels can be registered at once:

```bash
claude plugin marketplace add elaraai/plugins#beta
codex plugin marketplace add elaraai/plugins --ref beta
```

**Moving from the monorepo marketplace.** If you added `elaraai/east-workspace` (or the old `elaraai/east-plugin`) as a marketplace, it is also named `elaraai`, and one name registers once: remove it first.

```bash
claude plugin marketplace remove elaraai
claude plugin marketplace add elaraai/plugins
claude plugin install east@elaraai
```

## Plugins

| Plugin | Claude Code | Codex | Source |
|---|---|---|---|
| `east` | `@elaraai/east-claude-plugin` | `east-codex-plugin` · `@elaraai/east-codex-plugin` | [east-workspace](https://github.com/elaraai/east-workspace/tree/main/libs/east-plugin) |
| `e3-cloud` | `@elaraai/e3-cloud-claude-plugin` (depends on `east`) | `e3-cloud-codex-plugin` · `@elaraai/e3-cloud-codex-plugin` | [e3-cloud](https://github.com/elaraai/e3-cloud) |

## How it works

- `catalog.json` names each plugin, its two packages, and what it depends on.
- `scripts/render.mjs` reads the registry's dist-tags and writes `.claude-plugin/marketplace.json` (Claude Code) and `.agents/plugins/marketplace.json` (Codex), each entry an `npm` source pinned to the version found; a package not yet published is left out until it is.
- The `Render` workflow runs it hourly, on `workflow_dispatch`, and on a `repository_dispatch` of type `release` from a publishing repository, committing what changed; it regenerates the `beta` branch from `main` each time.

To list a new plugin, publish its two packages (assembled with `@elaraai/east-plugin`'s `assemblePlugin`, so each is a plugin directory a host installs as it is: manifest, bundles, skills as real files, index, no dependency) and add it to `catalog.json`.

## License

[MIT](LICENSE). The plugins carry their own licenses.
