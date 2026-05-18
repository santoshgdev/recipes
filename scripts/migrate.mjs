#!/usr/bin/env node
// One-time migration: imports all JSON files from /data into Firestore.
// Run after `terraform apply` and `gcloud auth application-default login`.
//
//   export FIREBASE_PROJECT_ID=your-project-id
//   node scripts/migrate.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Error: FIREBASE_PROJECT_ID environment variable is required");
  console.error("  export FIREBASE_PROJECT_ID=your-project-id");
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();

const files = readdirSync(dataDir).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.log("No JSON files found in /data — nothing to migrate.");
  process.exit(0);
}

console.log(`Migrating ${files.length} recipes to Firestore project '${projectId}'...\n`);

for (const file of files) {
  const data = JSON.parse(readFileSync(join(dataDir, file), "utf8"));
  await db.collection("recipes").doc(data.id).set(data);
  console.log(`  ✓  ${data.id}`);
}

console.log(`\nDone. Open your site — recipes are now live from Firestore.`);
