# Salary Ticker

A static React/Vite app that tracks salary costs. People, currency and ticker
state stay in the browser's localStorage under `salary-ticker`. There is no
server database or runtime API. Keeping the same HTTPS origin preserves this
browser data when changing hosts.

## Development

Run `bun install --frozen-lockfile` and `bun run dev`. `bun run build` checks
TypeScript and produces `dist/`. The existing `bun run start` serves a local
build through `server.ts`; the production image uses Nginx.

## Container and deployment

The multi-stage Dockerfile uses pinned base digests and copies only compiled
assets into a non-root Nginx runtime on port 8080. Run with a read-only root,
uid/gid 1000, all capabilities dropped, and writable `/tmp` (16 MiB is enough).
HTML revalidates; hashed assets use immutable caching; missing assets are 404.

```sh
docker build --platform linux/amd64 -t salary-ticker:local .
python3 scripts/check-container.py salary-ticker:local
```

GitHub Actions builds and tests the image on AMD64, then publishes the tested
image to GHCR with its source revision. Images remain private even though this
source repository is public. The cluster authenticates with a separate
read-only pull credential; no registry credentials enter this source repository
or image. Future deployment updates pin the workflow's immutable image digest
in `bjornarhagen/ai-devops` and require infrastructure deployment approval.

Kubernetes declarations, DNS, SOPS-encrypted pull credentials, TLS and rollback
procedures belong to the infrastructure repository. No application or storage
schema changes are required for the hosting migration.
