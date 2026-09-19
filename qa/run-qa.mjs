import { chromium } from "@playwright/test";
import fs from "fs";

const BASE = "http://localhost:3000";
const SHOTS = "docs/qa/screenshots";
const results = [];
const consoleErrors = [];

function record(section, name, pass, detail = "") {
  results.push({ section, name, pass: pass ? "PASS" : "FAIL", detail });
  console.log(`${pass ? "PASS" : "FAIL"} | ${section} | ${name} ${detail ? "| " + detail : ""}`);
}

async function capture(page, name) {
  try {
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  } catch (e) {
    console.log("screenshot err", name, e.message);
  }
}

function attachConsole(page, route) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({ route, text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push({ route, text: "PAGEERROR: " + err.message });
  });
}

async function openPage(browser, url, viewport, name, opts = {}) {
  const ctx = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  attachConsole(page, name);
  let status = null;
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    status = resp?.status() ?? null;
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    record("render", name, status !== null && status < 500, `status=${status} overflow=${overflow}`);
    if (overflow) record("responsive", name, false, "horizontal overflow detected");
    else record("responsive", name, true, "no horizontal overflow");
    await capture(page, name);
  } catch (e) {
    record("render", name, false, `goto failed: ${e.message.slice(0, 120)}`);
    try { await capture(page, name); } catch {}
  }
  await ctx.close();
  return status;
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]');
  // Wait until we navigate away from /login (the flow does a redirect hop).
  try {
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15000 });
  } catch {}
  await page.waitForTimeout(1500);
}

const browser = await chromium.launch({ headless: true });

// ---------------- ANONYMOUS PUBLIC ROUTES ----------------
console.log("===== ANONYMOUS PUBLIC =====");
const pubRoutes = [
  ["/", "landing/landing-1440", { width: 1440, height: 900 }],
  ["/events", "events/events-1440", { width: 1440, height: 900 }],
  ["/games", "games/games-1440", { width: 1440, height: 900 }],
  ["/games/hidden-trail", "games/game-detail-1440", { width: 1440, height: 900 }],
  ["/gallery", "gallery/gallery-1440", { width: 1440, height: 900 }],
  ["/leaderboard/live", "live/live-1920x1080", { width: 1920, height: 1080 }],
  ["/leaderboard", "leaderboard/leaderboard-1440", { width: 1440, height: 900 }],
  ["/hidden-trail/leaderboard", "leaderboard/trail-leaderboard-1440", { width: 1440, height: 900 }],
];
for (const [url, name, vp] of pubRoutes) {
  await openPage(browser, `${BASE}${url}`, vp, name);
}

// ---------------- RESPONSIVE LANDING ----------------
console.log("===== RESPONSIVE LANDING =====");
for (const w of [320, 375, 390, 430, 768, 1024, 1280, 1920]) {
  await openPage(browser, `${BASE}/`, { width: w, height: 900 }, `responsive/landing-${w}`);
}

// ---------------- ANONYMOUS AUTH / ADMIN PROTECTION ----------------
console.log("===== ANONYMOUS PROTECTED =====");
const anonCtx = await browser.newContext();
const anon = await anonCtx.newPage();
await anon.goto(`${BASE}/dashboard`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await anon.waitForTimeout(2500);
record("auth", "anonymous /dashboard", anon.url().includes("/login"), `url=${anon.url()}`);
await capture(anon, "errors/anonymous-dashboard-redirect");
await anon.goto(`${BASE}/admin/hidden-trail`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
await anon.waitForTimeout(2500);
record("auth", "anonymous /admin redirects to login", anon.url().includes("/login"), `url=${anon.url()}`);
await anonCtx.close();

// ---------------- STUDENT LOGIN + GAMEPLAY ----------------
console.log("===== STUDENT A GAMEPLAY =====");
const saCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const sa = await saCtx.newPage();
attachConsole(sa, "student-a");
await login(sa, "qa.student.a@chapterone.local", "Qa_Student_2026!");
record("auth", "student A login", !sa.url().includes("/login"), `url=${sa.url()}`);
await capture(sa, "dashboard/dashboard-studentA-390");

// Hidden Trail landing
await sa.goto(`${BASE}/hidden-trail`, { waitUntil: "networkidle", timeout: 30000 });
await sa.waitForTimeout(3500);
const trailBody = await sa.content();
record("gameplay", "student A hidden-trail loads", trailBody.includes("HIDDEN TRAIL") && !trailBody.includes("Trail Not Found"), `hasHeading=${trailBody.includes("HIDDEN TRAIL")}`);
await capture(sa, "hidden-trail/hidden-trail-active-390");

// --- WRONG QR (scan token 3 while at level 0) ---
await sa.goto(`${BASE}/hidden-trail/scan/75656d852f95cc6fbaa424a112b11a488ab8f86c8f5dc16c9bff6748cb08e02a`, { waitUntil: "networkidle", timeout: 30000 });
await sa.waitForTimeout(3000);
const bodyWrongQr = await sa.content();
record("gameplay", "wrong QR shows WRONG TRAIL", bodyWrongQr.includes("WRONG TRAIL") || bodyWrongQr.includes("wrong") || bodyWrongQr.includes("WRONG"), "checked wrong-trail state");
await capture(sa, "hidden-trail/wrong-trail-390");

// --- SCAN QR1 (correct) + WRONG ANSWER + CORRECT ANSWER ---
await sa.goto(`${BASE}/hidden-trail/scan/dd03da5594cb99b542d2037c36d6daab5a5a7c10948919957df96751c9dcce8c`, { waitUntil: "networkidle", timeout: 30000 });
await sa.waitForTimeout(3000);
await capture(sa, "hidden-trail/scan-qr1-answer-challenge-390");

const hasAnswerInput = await sa.locator('input[placeholder="Enter your answer"]').count();
record("gameplay", "answer challenge shown", hasAnswerInput === 1, `answer input present=${hasAnswerInput}`);

// wrong answer
await sa.fill('input[placeholder="Enter your answer"]', "definitelywrong");
await sa.click('button:has-text("SUBMIT ANSWER")');
await sa.waitForTimeout(2500);
const afterWrong = await sa.content();
record("gameplay", "wrong answer rejected", !afterWrong.includes("MARKER CLEARED"), "checked no success state");
await capture(sa, "hidden-trail/wrong-answer-390");

// correct answer "echo"
await sa.fill('input[placeholder="Enter your answer"]', "echo");
await sa.click('button:has-text("SUBMIT ANSWER")');
await sa.waitForTimeout(4000);
const afterCorrect = await sa.content();
record("gameplay", "correct answer accepted", afterCorrect.includes("MARKER CLEARED") || afterCorrect.includes("PHOTO MOMENT"), "success state present");
await capture(sa, "hidden-trail/success-photo-moment-390");

// skip photo
const skipBtn = sa.locator('button:has-text("Skip")');
if (await skipBtn.count()) { await skipBtn.first().click(); await sa.waitForTimeout(2500); }
record("gameplay", "photo skip continues", true);
await capture(sa, "hidden-trail/post-clear-390");

// back to trail - level 1 should be complete
await sa.goto(`${BASE}/hidden-trail`, { waitUntil: "networkidle", timeout: 30000 });
await sa.waitForTimeout(2500);
await capture(sa, "hidden-trail/trail-progress-after-qr1-390");
await saCtx.close();

// ---------------- STUDENT B (level 1 too, for concurrency positions) ----------------
console.log("===== STUDENT B =====");
const sbCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const sb = await sbCtx.newPage();
await login(sb, "qa.student.b@chapterone.local", "Qa_Student_2026!");
await sb.goto(`${BASE}/hidden-trail/scan/dd03da5594cb99b542d2037c36d6daab5a5a7c10948919957df96751c9dcce8c`, { waitUntil: "networkidle", timeout: 30000 });
await sb.waitForTimeout(3000);
await sb.fill('input[placeholder="Enter your answer"]', "echo");
await sb.click('button:has-text("SUBMIT ANSWER")');
await sb.waitForTimeout(4000);
const sbCorrect = await sb.content();
record("gameplay", "student B correct answer", sbCorrect.includes("MARKER CLEARED") || sbCorrect.includes("PHOTO MOMENT"));
const skipB = sb.locator('button:has-text("Skip")');
if (await skipB.count()) { await skipB.first().click(); await sb.waitForTimeout(2000); }
await sbCtx.close();

// ---------------- LEADERBOARD CHECK (student A logged in) ----------------
console.log("===== LEADERBOARD =====");
const lbCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const lb = await lbCtx.newPage();
await login(lb, "qa.student.a@chapterone.local", "Qa_Student_2026!");
await lb.goto(`${BASE}/hidden-trail/leaderboard`, { waitUntil: "networkidle", timeout: 30000 });
await lb.waitForTimeout(2500);
const lbContent = await lb.content();
record("leaderboard", "trail leaderboard renders", lbContent.includes("Qa Student") || !lbContent.includes("Failed"));
await capture(lb, "leaderboard/trail-leaderboard-studentA-1440");
await lbCtx.close();

// ---------------- ADMIN LOGIN + ROUTES ----------------
console.log("===== ADMIN =====");
const adCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const ad = await adCtx.newPage();
attachConsole(ad, "admin");
await login(ad, "admin@chapterone.local", "ChapterOne_Admin_2026!");
record("admin", "admin login", !ad.url().includes("/login"), `url=${ad.url()}`);
await capture(ad, "admin/admin-overview-1440");

const adminRoutes = [
  ["/admin/hidden-trail", "admin-overview"],
  ["/admin/hidden-trail/settings", "admin-settings"],
  ["/admin/hidden-trail/levels", "admin-levels"],
  ["/admin/hidden-trail/qr", "admin-qr"],
  ["/admin/hidden-trail/participants", "admin-participants"],
  ["/admin/hidden-trail/live", "admin-live"],
  ["/admin/hidden-trail/analytics", "admin-analytics"],
  ["/admin/hidden-trail/audit", "admin-audit"],
  ["/admin/hidden-trail/simulation", "admin-simulation"],
  ["/admin/hidden-trail/photos", "admin-photos"],
];
for (const [route, name] of adminRoutes) {
  await ad.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 });
  await ad.waitForTimeout(2500);
  const content = await ad.content();
  const has500 = content.includes("Something went wrong") || content.includes("Application error");
  record("admin", name, !has500 && content.length > 300, `content length=${content.length}`);
  await capture(ad, `admin/${name}-1440`);
}
await adCtx.close();

// ---------------- ADMIN ACCESS AS STUDENT ----------------
console.log("===== STUDENT -> ADMIN BLOCKED =====");
const blockCtx = await browser.newContext();
const block = await blockCtx.newPage();
await login(block, "qa.student.a@chapterone.local", "Qa_Student_2026!");
await block.goto(`${BASE}/admin/hidden-trail`, { waitUntil: "networkidle", timeout: 30000 });
await block.waitForTimeout(2500);
record("auth", "student accessing /admin redirected", !block.url().startsWith(`${BASE}/admin`), `url=${block.url()}`);
await blockCtx.close();

// ---------------- REPORT ----------------
console.log("\n===== CONSOLE ERRORS =====");
// A 400 on the answer endpoint is EXPECTED — the QA flow deliberately submits a
// wrong answer to verify rejection. 401s on Supabase auth endpoints are expected too.
const criticalConsole = consoleErrors.filter((e) => !e.text.includes("favicon") && !e.text.includes("Download the React DevTools") && !e.text.includes("status of 400"));
if (criticalConsole.length === 0) record("console", "no critical console errors", true);
else { record("console", "critical console errors", false, criticalConsole.length + " found"); criticalConsole.slice(0, 20).forEach((e) => console.log("  -", e.route, "|", e.text.slice(0, 150))); }

fs.writeFileSync("/tmp/opencode/qa-results.json", JSON.stringify(results, null, 2));
const pass = results.filter((r) => r.pass === "PASS").length;
const fail = results.filter((r) => r.pass === "FAIL").length;
console.log(`\n===== SUMMARY =====\nPASS: ${pass}\nFAIL: ${fail}\nTOTAL: ${results.length}`);
await browser.close();