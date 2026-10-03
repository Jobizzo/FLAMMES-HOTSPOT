# FLAMMES HOTSPOT AppDeploy transfer

Latest AppDeploy source snapshot transferred to GitHub on 2026-10-03 under `appdeploy/`.

The existing repository root remains the Next.js/Vercel application. This preserves the newer AppDeploy implementation without overwriting the existing Vercel code.

AppDeploy-specific SDK/runtime imports and authentication files are intentionally not treated as Vercel production dependencies. Secrets are not copied.
