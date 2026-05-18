#!/usr/bin/env node
import { initializeApp, applicationDefault } from "firebase-admin/app";

const PROJECT_ID = "recipes-496701";
const PROJECT_NUMBER = "151018575958";
const APP_ID = "1:151018575958:web:5b1c87caa5b1dacdf383f7";
const API_KEY = "AIzaSyCdWDvObKrSCfqeHsbENsEjJMTVdRGh2mk";
const SITE_KEY = "6Ldzru8sAAAAAIeY_EjkmK1DS8K15OxwfPAMrMRp";

const app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
const tokenResult = await app.options.credential.getAccessToken();
const token = tokenResult.access_token;
const authHeaders = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-goog-user-project": PROJECT_ID };

// 1. Confirm config
console.log("── 1. Stored reCAPTCHA config ──");
const cfgRes = await fetch(`https://firebaseappcheck.googleapis.com/v1/projects/${PROJECT_ID}/apps/${APP_ID}/recaptchaV3Config`, { headers: authHeaders });
console.log(JSON.stringify(await cfgRes.json(), null, 2));
console.log();

// 2. Hit exchangeRecaptchaV3Token with a dummy token to read the actual error body
console.log("── 2. exchangeRecaptchaV3Token with dummy token ──");
const exchRes = await fetch(
  `https://firebaseappcheck.googleapis.com/v1/projects/${PROJECT_ID}/apps/${APP_ID}:exchangeRecaptchaV3Token?key=${API_KEY}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recaptchaToken: "dummy-token-for-diagnosis" }) }
);
console.log(`Status: ${exchRes.status}`);
console.log(JSON.stringify(await exchRes.json(), null, 2));
console.log();

console.log(`Site key in HTML: ${SITE_KEY}`);
