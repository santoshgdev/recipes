# Setup

One-time steps to get the MCP + Firestore pipeline running.

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) installed
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed
- A GCP billing account (find yours at console.cloud.google.com/billing)
- Node.js 20+

---

## 1. Provision infrastructure

```bash
cd terraform

cat > terraform.tfvars <<EOF
project_id      = "yourname-recipes-12345"   # must be globally unique
project_name    = "Recipes"
billing_account = "XXXXXX-XXXXXX-XXXXXX"     # from console.cloud.google.com/billing
EOF

terraform init
terraform apply
```

When it finishes, grab your Firebase config:

```bash
terraform output firebase_config
```

---

## 2. Paste Firebase config into the HTML files

Open `index.html` and `recipe.html`. Both files have this placeholder block near the bottom:

```js
const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_WITH_TERRAFORM_OUTPUT",
  authDomain:        "REPLACE_WITH_TERRAFORM_OUTPUT",
  projectId:         "REPLACE_WITH_TERRAFORM_OUTPUT",
  storageBucket:     "REPLACE_WITH_TERRAFORM_OUTPUT",
  messagingSenderId: "REPLACE_WITH_TERRAFORM_OUTPUT",
  appId:             "REPLACE_WITH_TERRAFORM_OUTPUT",
};
```

Replace each value with the corresponding output from `terraform output firebase_config`.

---

## 3. Authenticate and migrate existing recipes

```bash
gcloud auth application-default login

export FIREBASE_PROJECT_ID=yourname-recipes-12345
node scripts/migrate.mjs
```

This imports the 5 JSON recipes from `/data` into Firestore. It's idempotent — safe to run more than once.

---

## 4. Register the MCP server in Claude Code

Add the following to `.claude/settings.json`, at the top level alongside the existing `"hooks"` key:

```json
"mcpServers": {
  "recipes": {
    "command": "node",
    "args": ["/Users/sg/Documents/GitHub/recipes/mcp/dist/index.js"],
    "env": {
      "FIREBASE_PROJECT_ID": "yourname-recipes-12345"
    }
  }
},
```

---

## 5. Restart Claude Code

After restarting, the MCP server is live. You can now say things like:

- "Create a new recipe for lemon herb chicken"
- "List all my recipes"
- "Update the korean-chicken-stew — add a note about storage"

New recipes appear on the site immediately — no deploy needed.

---

## MCP tools available

| Tool | What it does |
|------|-------------|
| `list_recipes` | List all recipes with titles, categories, protein |
| `get_recipe` | Get the full JSON of a recipe by ID |
| `create_recipe` | Create a new recipe (live instantly) |
| `update_recipe` | Update specific fields of an existing recipe |
| `delete_recipe` | Delete a recipe permanently |

---

## Rebuilding the MCP server

If you edit `mcp/src/index.ts`:

```bash
cd mcp
npm run build
```

The compiled output lives in `mcp/dist/index.js`.
