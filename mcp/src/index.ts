import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";
import express from "express";

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error("FIREBASE_PROJECT_ID env var is required");

if (!getApps().length) {
  initializeApp({ projectId });
}
const db = getFirestore();
const COLLECTION = "recipes";

// ── Schema ──────────────────────────────────────────────────────────────────

const IngredientSchema = z.object({
  amount: z.string().describe("Display string, e.g. '2.5' or '½'"),
  unit: z.string().describe("e.g. 'cup', 'tbsp', 'lb', or '' for unitless (e.g. '2 eggs')"),
  name: z.string(),
  base: z.number().describe("Numeric base amount used for scaling, e.g. 2.5"),
  note: z.string().optional().describe("e.g. 'for finishing', 'cook night before'"),
});

const IngredientGroupSchema = z.object({
  label: z.string().describe("e.g. 'Protein', 'Vegetables', 'Sauce & Spice'"),
  ingredients: z.array(IngredientSchema).min(1),
});

const StepSchema = z.object({
  title: z.string().describe("Short imperative title, e.g. 'Sauté aromatics'"),
  text: z.string().describe("Main instruction paragraph — must be a complete sentence or more"),
  bullets: z.array(z.string()).default([]).describe("Optional sub-steps as bullet points"),
  note: z.string().default("").describe("Optional tip or callout shown below the step"),
  timer: z.number().int().optional().describe("Optional countdown timer in seconds, e.g. 300 for 5 min"),
});

const NoteSchema = z.object({
  title: z.string(),
  body: z.string(),
});

const MacrosSchema = z.object({
  calories: z.number().int().describe("Total calories per serving"),
  protein: z.number().int().describe("Protein in grams per serving"),
  carbs: z.number().int().describe("Carbohydrates in grams per serving"),
  fat: z.number().int().describe("Fat in grams per serving"),
  fiber: z.number().int().describe("Fiber in grams per serving"),
});

const RecipeSchema = z.object({
  id: z.string().describe("URL-friendly slug — lowercase letters and hyphens only, e.g. 'garlic-lemon-salmon'"),
  title: z.string(),
  subtitle: z.string().describe("Short flavor note shown in italics, e.g. 'with Kimchi & Lime'"),
  description: z.string().describe("2–3 sentence description shown on the recipe card"),
  category: z.enum(["Dinner", "Smoothies", "Breakfast", "Lunch", "Snack"]),
  tags: z.array(z.string()).describe("e.g. ['Instant Pot', 'Meal Prep', 'High Protein'] — use [] if none"),
  servings: z.number().int().positive().describe("Number of servings this recipe makes"),
  macros: MacrosSchema,
  ingredientGroups: z.array(IngredientGroupSchema).min(1).describe("At least one group required — use a single group labeled 'Ingredients' if no natural grouping"),
  steps: z.array(StepSchema).min(1).describe("Full cooking instructions — every step must have a title and text"),
  notes: z.array(NoteSchema).default([]).describe("End-of-recipe tips shown on the Notes tab — use [] if none"),
  imageUrl: z.string().url().optional().describe("Direct URL to a photo of the finished dish — shown as a thumbnail on the recipe list and full image on the recipe page. Use a high-quality image (landscape, at least 800px wide). Search Unsplash or similar for a fitting food photo."),
});

// ── Tool registration ────────────────────────────────────────────────────────

function registerTools(server: McpServer) {
  server.tool(
    "list_recipes",
    "List all recipes with their IDs, titles, categories, and protein content",
    {},
    async () => {
      const snapshot = await db.collection(COLLECTION).orderBy("category").get();
      const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
        const d = doc.data();
        return { id: doc.id, title: d.title, category: d.category, subtitle: d.subtitle, protein: d.macros?.protein };
      });
      return { content: [{ type: "text", text: JSON.stringify(list, null, 2) }] };
    },
  );

  server.tool(
    "get_recipe",
    "Get the full JSON of a recipe by its ID",
    { id: z.string().describe("Recipe ID, e.g. 'korean-chicken-stew'") },
    async ({ id }) => {
      const doc = await db.collection(COLLECTION).doc(id).get();
      if (!doc.exists) {
        return { content: [{ type: "text", text: `Recipe '${id}' not found` }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(doc.data(), null, 2) }] };
    },
  );

  server.tool(
    "create_recipe",
    "Create a new recipe. The site updates immediately — no deploy needed. The 'id' must be a unique URL slug. Each ingredient needs both 'amount' (display string like '2.5' or '½') and 'base' (the raw number for the serving scaler).",
    { recipe: RecipeSchema },
    async ({ recipe }) => {
      const ref = db.collection(COLLECTION).doc(recipe.id);
      const existing = await ref.get();
      if (existing.exists) {
        return {
          content: [{ type: "text", text: `Recipe '${recipe.id}' already exists. Use update_recipe to modify it.` }],
          isError: true,
        };
      }
      await ref.set(recipe);
      return { content: [{ type: "text", text: `Created '${recipe.id}' — visible on the site immediately.` }] };
    },
  );

  server.tool(
    "update_recipe",
    "Update specific fields of an existing recipe. Only include fields you want to change — unspecified fields are preserved.",
    {
      id: z.string().describe("Recipe ID to update"),
      updates: RecipeSchema.partial().omit({ id: true }),
    },
    async ({ id, updates }) => {
      const ref = db.collection(COLLECTION).doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        return { content: [{ type: "text", text: `Recipe '${id}' not found` }], isError: true };
      }
      await ref.set(updates, { merge: true });
      return { content: [{ type: "text", text: `Updated '${id}'` }] };
    },
  );

  server.tool(
    "delete_recipe",
    "Permanently delete a recipe by ID",
    { id: z.string().describe("Recipe ID to delete") },
    async ({ id }) => {
      await db.collection(COLLECTION).doc(id).delete();
      return { content: [{ type: "text", text: `Deleted '${id}'` }] };
    },
  );
}

// ── Transport ────────────────────────────────────────────────────────────────

const port = process.env.PORT ? parseInt(process.env.PORT) : null;

if (port) {
  // HTTP mode for claude.ai / Cloud Run
  const apiKey = process.env.MCP_API_KEY;

  const app = express();
  app.use(express.json());

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") { res.sendStatus(204); return; }
    next();
  });

  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (apiKey && req.query.api_key !== apiKey) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  };

  app.all("/sse", authMiddleware, async (req, res) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const s = new McpServer({ name: "recipes", version: "1.0.0" });
    registerTools(s);
    await s.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.listen(port, () => {
    console.log(`MCP server listening on port ${port}`);
  });
} else {
  // Stdio mode for Claude Code
  const server = new McpServer({ name: "recipes", version: "1.0.0" });
  registerTools(server);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
