#!/usr/bin/env node
// Patches imageUrl on specific Firestore docs without overwriting other fields.
//   export FIREBASE_PROJECT_ID=your-project-id
//   node scripts/patch-images.mjs

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Error: FIREBASE_PROJECT_ID is required");
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();

const patches = [
  {
    id: "blueberry-almond-smoothie",
    imageUrl: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?w=1200&auto=format&fit=crop",
  },
  {
    id: "peach-ginger-smoothie",
    imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=1200&auto=format&fit=crop",
  },
  {
    id: "tropical-coconut-smoothie",
    imageUrl: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop",
  },
];

for (const { id, imageUrl } of patches) {
  await db.collection("recipes").doc(id).update({ imageUrl });
  console.log(`  ✓  ${id}`);
}

console.log("\nDone.");
