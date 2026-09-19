import { chromium } from "@playwright/test";
import fs from "fs";
const BASE = "http://localhost:3000";
const SHOTS = "docs/qa/screenshots";
const results = [];
function record(s, n, pass, d="") { results.push({section:s, name:n, pass: pass?"PASS":"FAIL", detail:d}); console.log(`${pass?"PASS":"FAIL"} | ${s} | ${n} ${d?`| ${d}`:""}`); }
async function capture(page, name) { try { await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true }); } catch {} }
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const consoleErr = [];
page.on("console", m => { if (m.type() === "error") consoleErr.push(m.text().slice(0,150)); });
await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
await page.fill("#login-email", "qa.student.a@chapterone.local");
await page.fill("#login-password", "Qa_Student_2026!");
await page.click('button[type="submit"]');
await page.waitForURL(u => !u.pathname.startsWith("/login"), { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(1500);
const routes = [
  ["/dashboard", "dashboard/dashboard-studentA-390"],
  ["/hidden-trail/stats", "hidden-trail/stats-390"],
  ["/hidden-trail/replay", "hidden-trail/replay-390"],
  ["/hidden-trail/achievements", "hidden-trail/achievements-390"],
  ["/hidden-trail/album", "hidden-trail/album-390"],
  ["/hidden-trail/result", "hidden-trail/result-390"],
  ["/gallery", "gallery/gallery-390"],
  ["/leaderboard/live", "live/live-1366x768", { width: 1366, height: 768 }],
];
for (const [route, name] of routes.slice(0,7)) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 30000 }).catch(()=>{});
  await page.waitForTimeout(3000);
  const body = await page.content();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  record("journey", name, body.length > 500 && !overflow, `len=${body.length} overflow=${overflow}`);
  await capture(page, name);
}
await page.close();
// Live at 1366x768 and 1920x1080 and 3840x2160 (public)
for (const [w,h] of [[1366,768],[1920,1080],[3840,2160]]) {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await c.newPage();
  await p.goto(`${BASE}/leaderboard/live`, { waitUntil: "networkidle", timeout: 30000 }).catch(()=>{});
  await p.waitForTimeout(3000);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  record("live", `live-${w}x${h}`, !ov, `overflow=${ov}`);
  await capture(p, `live/live-${w}x${h}`);
  await c.close();
}
// Admin photos page moderation view
const ad = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const ap = await ad.newPage();
await ap.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
await ap.fill("#login-email", "admin@chapterone.local");
await ap.fill("#login-password", "ChapterOne_Admin_2026!");
await ap.click('button[type="submit"]');
await ap.waitForURL(u => !u.pathname.startsWith("/login"), { timeout: 15000 }).catch(()=>{});
await ap.waitForTimeout(1500);
await ap.goto(`${BASE}/admin/hidden-trail/photos`, { waitUntil: "networkidle", timeout: 30000 }).catch(()=>{});
await ap.waitForTimeout(3000);
record("admin", "admin-photos renders with real photo", (await ap.content()).includes("Qa Student A") || (await ap.content()).includes("Marker"));
await capture(ap, "admin/admin-photos-with-data-1440");
await ad.close();
console.log("CONSOLE ERRORS:", consoleErr.filter(e => !e.includes("status of 400") && !e.includes("Download the React DevTools")).slice(0,10));
fs.writeFileSync("/tmp/opencode/qa2-results.json", JSON.stringify(results, null, 2));
console.log("SUMMARY:", results.filter(r=>r.pass==="PASS").length, "pass /", results.filter(r=>r.pass==="FAIL").length, "fail");
await browser.close();
