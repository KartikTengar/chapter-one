import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://localhost:3000";
const SHOTS = "docs/qa/screenshots";
const results = [];
const consoleErrors = [];
const networkErrors = [];

function record(section, name, pass, detail = "") {
  results.push({ section, name, pass: pass ? "PASS" : "FAIL", detail });
  console.log(`${pass ? "PASS" : "FAIL"} | ${section} | ${name} ${detail ? "| " + detail : ""}`);
}

async function attach(page, route) {
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push({ route, text: msg.text().slice(0, 200) });
  });
  page.on("pageerror", (err) => consoleErrors.push({ route, text: "PAGEERROR: " + err.message.slice(0, 200) }));
  page.on("response", (resp) => {
    if (resp.status() >= 500) networkErrors.push({ route, status: resp.status(), url: resp.url() });
  });
}

async function open(page, url, wait = 2500) {
  try {
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(wait);
    return resp?.status() ?? null;
  } catch (e) {
    return "ERR:" + e.message.slice(0, 80);
  }
}

async function checkOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill("#login-email", email);
  await page.fill("#login-password", password);
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 });
  } catch {}
  await page.waitForTimeout(2000);
}

const browser = await chromium.launch({ headless: true });

// ============ ANONYMOUS / PUBLIC ============
console.log("===== ANONYMOUS PUBLIC =====");
const publicRoutes = [
  ["/", "landing"],
  ["/events", "events"],
  ["/games", "games"],
  ["/games/hidden-trail", "game-detail"],
  ["/gallery", "gallery"],
  ["/leaderboard", "leaderboard"],
  ["/leaderboard/live", "live"],
  ["/hidden-trail/leaderboard", "trail-leaderboard"],
  ["/login", "login"],
  ["/signup", "signup"],
  ["/forgot-password", "forgot-password"],
];
for (const [route, name] of publicRoutes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  attach(page, name);
  const status = await open(page, `${BASE}${route}`);
  const overflow = await checkOverflow(page);
  const text = (await page.content()).length;
  record("public", name, status === 200 && text > 500 && !overflow, `status=${status} len=${text} overflow=${overflow}`);
  await page.screenshot({ path: `${SHOTS}/regression/anonymous-${name}.png`, fullPage: true }).catch(() => {});
  await ctx.close();
}

// ============ STUDENT ============
console.log("===== STUDENT =====");
const studentRoutes = [
  ["/dashboard", "dashboard"],
  ["/dashboard/leaderboard", "dashboard-leaderboard"],
  ["/hidden-trail", "hidden-trail"],
  ["/hidden-trail/stats", "stats"],
  ["/hidden-trail/replay", "replay"],
  ["/hidden-trail/achievements", "achievements"],
  ["/hidden-trail/album", "album"],
  ["/hidden-trail/result", "result"],
  ["/hidden-trail/leaderboard", "trail-leaderboard"],
  ["/gallery", "gallery"],
  ["/events", "events"],
  ["/games", "games"],
  ["/profile", "profile"],
];
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  attach(page, "student");
  await login(page, "qa.student.a@chapterone.local", "Qa_Student_2026!");
  record("student", "login", !page.url().includes("/login"), `url=${page.url()}`);
  for (const [route, name] of studentRoutes) {
    const status = await open(page, `${BASE}${route}`);
    const overflow = await checkOverflow(page);
    const body = await page.content();
    const hasTrailNotFound = body.includes("Trail Not Found");
    const pass = status === 200 && body.length > 500 && !overflow;
    record("student", name, pass, `status=${status} overflow=${overflow} trailNotFound=${hasTrailNotFound} len=${body.length}`);
    await page.screenshot({ path: `${SHOTS}/regression/student-${name}.png`, fullPage: true }).catch(() => {});
  }
  await ctx.close();
}

// ============ ADMIN ============
console.log("===== ADMIN =====");
const adminRoutes = [
  ["/admin/hidden-trail", "overview"],
  ["/admin/hidden-trail/settings", "settings"],
  ["/admin/hidden-trail/levels", "levels"],
  ["/admin/hidden-trail/qr", "qr"],
  ["/admin/hidden-trail/participants", "participants"],
  ["/admin/hidden-trail/photos", "photos"],
  ["/admin/hidden-trail/live", "live"],
  ["/admin/hidden-trail/analytics", "analytics"],
  ["/admin/hidden-trail/audit", "audit"],
  ["/admin/hidden-trail/simulation", "simulation"],
];
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  attach(page, "admin");
  await login(page, "admin@chapterone.local", "ChapterOne_Admin_2026!");
  record("admin", "login", !page.url().includes("/login"), `url=${page.url()}`);
  for (const [route, name] of adminRoutes) {
    const status = await open(page, `${BASE}${route}`);
    const overflow = await checkOverflow(page);
    const body = await page.content();
    const hasShell = body.includes("CHAPTER ONE ADMIN") || body.includes("chapter-admin-sidebar");
    const pass = status === 200 && body.length > 800 && !overflow;
    record("admin", name, pass, `status=${status} overflow=${overflow} shell=${hasShell} len=${body.length}`);
    await page.screenshot({ path: `${SHOTS}/regression/admin-${name}.png`, fullPage: true }).catch(() => {});
  }
  await ctx.close();
}

// ============ AUTH BOUNDARY ============
console.log("===== AUTH BOUNDARY =====");
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await open(page, `${BASE}/dashboard`);
  record("auth", "anonymous /dashboard redirects", page.url().includes("/login"), `url=${page.url()}`);
  await ctx.close();
}
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await open(page, `${BASE}/admin/hidden-trail`);
  record("auth", "anonymous /admin redirects", page.url().includes("/login"), `url=${page.url()}`);
  await ctx.close();
}
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, "qa.student.a@chapterone.local", "Qa_Student_2026!");
  await open(page, `${BASE}/admin/hidden-trail`);
  record("auth", "student /admin blocked", !page.url().includes("/admin/hidden-trail") || page.url().includes("denied"), `url=${page.url()}`);
  await ctx.close();
}

// ============ REPORT ============
console.log("\n===== CONSOLE / NETWORK =====");
const criticalConsole = consoleErrors.filter((e) => !e.text.includes("status of 400") && !e.text.includes("favicon") && !e.text.includes("Download the React DevTools"));
record("console", "no critical console errors", criticalConsole.length === 0, `${criticalConsole.length} found`);
criticalConsole.slice(0, 10).forEach((e) => console.log("  -", e.route, "|", e.text.slice(0, 140)));
record("network", "no 5xx network errors", networkErrors.length === 0, `${networkErrors.length} found`);
networkErrors.slice(0, 10).forEach((e) => console.log("  -", e.route, e.status, e.url.slice(0, 100)));

fs.mkdirSync("docs/qa", { recursive: true });
fs.writeFileSync("/tmp/opencode/regression-baseline.json", JSON.stringify(results, null, 2));
const pass = results.filter((r) => r.pass === "PASS").length;
const fail = results.filter((r) => r.pass === "FAIL").length;
console.log(`\n===== SUMMARY =====\nPASS: ${pass}\nFAIL: ${fail}\nTOTAL: ${results.length}`);
await browser.close();