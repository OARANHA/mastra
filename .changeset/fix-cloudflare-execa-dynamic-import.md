---
'@mastra/core': patch
---

Fix Cloudflare Workers build failure caused by static execa import. Changed execa to a lazy dynamic import in LocalProcessManager so it's only loaded at runtime when spawn() is called, preventing bundlers from resolving execa's Node-only transitive dependencies at build time.
