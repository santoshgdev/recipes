import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, type QueryDocumentSnapshot } from "firebase-admin/firestore";
import { z } from "zod";
import express from "express";
import { randomUUID } from "node:crypto";

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
  unit: z.string().default("").describe("e.g. 'cup', 'tbsp', 'lb', or empty string"),
  name: z.string(),
  base: z.number().describe("Numeric base amount used for scaling"),
  note: z.string().optional().describe("e.g. 'for finishing', 'cook night before'"),
});

const IngredientGroupSchema = z.object({
  label: z.string().describe("e.g. 'Protein', 'Vegetables', 'Sauce & Spice'"),
  ingredients: z.array(IngredientSchema),
});

const StepSchema = z.object({
  title: z.string().describe("Short imperative title, e.g. 'Sauté aromatics'"),
  text: z.string().default("").describe("Main instruction paragraph"),
  bullets: z.array(z.string()).default([]).describe("List items within the step"),
  note: z.string().default("").describe("Tip or callout shown below the step"),
  timer: z.number().int().optional().describe("Optional countdown timer in seconds"),
});

const NoteSchema = z.object({
  title: z.string(),
  body: z.string(),
});

const MacrosSchema = z.object({
  calories: z.number().int(),
  protein: z.number().int().describe("grams"),
  carbs: z.number().int().describe("grams"),
  fat: z.number().int().describe("grams"),
  fiber: z.number().int().describe("grams"),
});

const RecipeSchema = z.object({
  id: z.string().describe("URL-friendly slug — lowercase letters and hyphens only, e.g. 'garlic-lemon-salmon'"),
  title: z.string(),
  subtitle: z.string().default("").describe("Short flavor note shown in italics, e.g. 'with Kimchi & Lime'"),
  description: z.string().default("").describe("2–3 sentence description shown on the recipe card"),
  category: z.enum(["Dinner", "Smoothies", "Breakfast", "Lunch", "Snack"]).default("Dinner"),
  tags: z.array(z.string()).default([]).describe("e.g. ['Instant Pot', 'Meal Prep', 'High Protein']"),
  servings: z.number().int().positive().default(1),
  macros: MacrosSchema,
  ingredientGroups: z.array(IngredientGroupSchema).default([]),
  steps: z.array(StepSchema).default([]),
  notes: z.array(NoteSchema).default([]).describe("End-of-recipe tips shown on the Notes tab"),
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
  const app = express();
  app.use(express.json());

  const sessions = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && sessions.has(sessionId)) {
      await sessions.get(sessionId)!.handleRequest(req, res, req.body);
      return;
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    const s = new McpServer({ name: "recipes", version: "1.0.0" });
    registerTools(s);
    await s.connect(transport);
    transport.onclose = () => sessions.delete(transport.sessionId!);
    sessions.set(transport.sessionId!, transport);
    await transport.handleRequest(req, res, req.body);
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: "Missing or invalid session ID" });
      return;
    }
    await sessions.get(sessionId)!.handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (sessionId && sessions.has(sessionId)) {
      await sessions.get(sessionId)!.handleRequest(req, res);
      sessions.delete(sessionId);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
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
