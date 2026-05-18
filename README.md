# Recipes

A personal recipe app backed by Firestore and managed via Claude (AI). Recipes live in Firestore and are readable by a static website. All writes go through an MCP server, meaning you can create and edit recipes by just asking Claude in natural language.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Firestore                        │
│                   (recipes collection)                  │
└────────────┬───────────────────────┬────────────────────┘
             │ public read           │ admin read/write
             ▼                       ▼
┌────────────────────┐    ┌─────────────────────────────┐
│  Vercel (static)   │    │       MCP Server             │
│  index.html        │    │                             │
│  recipe.html       │    │  stdio  ──► Claude Code     │
│  Firebase JS SDK   │    │  SSE    ──► claude.ai       │
└────────────────────┘    └─────────────────────────────┘
                                        ▲
                               GitHub Actions
                               (deploy on push)
```

**Website** — Two static HTML files hosted on Vercel. The Firebase JS SDK fetches recipes directly from Firestore in the browser using public read rules.

**MCP server** — A Node.js server (`mcp/`) that exposes five tools to Claude: `list_recipes`, `get_recipe`, `create_recipe`, `update_recipe`, `delete_recipe`. It uses the Firebase Admin SDK (full read/write access, bypasses security rules). Runs in two modes:
- **stdio** — spawned locally by Claude Code, no network or auth needed
- **SSE/HTTP** — deployed to Cloud Run, used by claude.ai over HTTPS with an API key

**Infrastructure** — Provisioned via Terraform (`terraform/`): Firebase project, Firestore database, and security rules.

## Repo structure

```
├── index.html          # Recipe list page
├── recipe.html         # Single recipe page
├── data/               # Source JSON files (migrated to Firestore)
├── scripts/
│   └── migrate.mjs     # One-time script to seed Firestore from data/
├── mcp/
│   ├── src/index.ts    # MCP server (stdio + SSE modes)
│   ├── Dockerfile      # For Cloud Run deployment
│   └── dist/           # Compiled output (not committed)
├── terraform/          # GCP/Firebase infrastructure
└── .github/
    └── workflows/
        └── deploy.yml  # CI/CD: build + deploy MCP server to Cloud Run
```

## Using Claude to manage recipes

### Claude Code (local)

The `.mcp.json` at the repo root registers the MCP server automatically. After building, just ask Claude Code:

```
list my recipes
create a new recipe for chicken tikka masala
update the korean-chicken-stew recipe to add a note about...
```

To build the MCP server locally:

```bash
cd mcp
npm install
npm run build
```

Requires `gcloud auth application-default login` for Firestore access.

### claude.ai (remote)

Add a custom connector in Settings → Integrations:

```
https://recipes-mcp-151018575958.us-central1.run.app/sse?api_key=<MCP_API_KEY>
```

The server is hosted on Cloud Run and scales to zero when idle.

## Deployment

The MCP server deploys automatically to Cloud Run when you push changes to `mcp/**` on `main`. Auth uses Workload Identity Federation — no long-lived service account keys in the repo.

To deploy manually:

```bash
cd mcp
npm run build
gcloud builds submit . --tag us-central1-docker.pkg.dev/recipes-496701/recipes-mcp/server:latest
gcloud run deploy recipes-mcp --image ... --region us-central1 --project recipes-496701
```

## Infrastructure

Managed with Terraform. To apply changes:

```bash
cd terraform
terraform init
terraform apply
```

GCP project: `recipes-496701` (us-central1)
