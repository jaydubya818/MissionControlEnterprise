---
title: MissionControlEnterprise upstream provenance
status: active
updated: 2026-09-09
---

# Enterprise upstream provenance

```text
UPSTREAM_REPOSITORY: jaydubya818/MissionControl
UPSTREAM_BASELINE: ffd58077989a23004819a85f529ca74c955b1422
ENTERPRISE_REPOSITORY: jaydubya818/MissionControlEnterprise
```

`MissionControlEnterprise` is the curated enterprise distribution. Its initial
`main` branch points exactly to the upstream baseline above. The upstream
`MissionControl` repository remains the broader reference implementation,
experimental/Labs source, and fallback baseline.

All Phase 3 product-surface rationalization, navigation changes, release
hardening, qualification evidence, and release commits must target
`jaydubya818/MissionControlEnterprise`. They must never be pushed to the
upstream repository.

## Verification record

- Enterprise local checkout at qualification start:
  `/private/tmp/mission-control-enterprise-phase3.u0ZRV6/repo`
- Enterprise branch: `codex/phase-3-enterprise-release`
- Local source SHA: `ffd58077989a23004819a85f529ca74c955b1422`
- Remote `origin/main` SHA at import:
  `ffd58077989a23004819a85f529ca74c955b1422`
- `origin`: `https://github.com/jaydubya818/MissionControlEnterprise.git`
- `upstream`: `https://github.com/jaydubya818/MissionControl.git`
- Working tree before Phase 3 documentation: clean
