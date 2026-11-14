#!/usr/bin/env node
/**
 * Sync case data from the original repo (jaxxchen003/muse-use-cases)
 * without touching our own branding (invite code, repo links) or the site UI.
 *
 *   node scripts/sync-upstream.js
 *   git commit -am "sync upstream" && git push
 */
const fs = require("fs");
const { execSync } = require("child_process");

const UPSTREAM = "https://github.com/jaxxchen003/muse-use-cases.git";
const OWNER_INVITE = "JHB7ZS";
const OWNER_REPO = "https://github.com/appstoy/muse-use-cases";

execSync("git remote get-url upstream", { stdio: "ignore" }) === undefined;
try { execSync("git remote get-url upstream", { stdio: "ignore" }); }
catch (e) { execSync("git remote add upstream " + UPSTREAM); }

console.log("fetching upstream...");
execSync("git fetch upstream main", { stdio: "inherit" });

const raw = execSync("git show upstream/main:docs/cases.json", { maxBuffer: 128 * 1024 * 1024 }).toString("utf8");
const up = JSON.parse(raw);
const local = JSON.parse(fs.readFileSync("docs/cases.json", "utf8"));

if (up.cases.length === local.cases.length && up.meta.updated === local.meta.updated) {
  console.log("already up to date (" + local.cases.length + " cases, " + local.meta.updated + ")");
  process.exit(0);
}

up.meta.invite = OWNER_INVITE;
up.meta.repo = OWNER_REPO;
fs.writeFileSync("docs/cases.json", JSON.stringify(up, null, 2) + "\n", "utf8");

// keep README counters in sync
for (const f of ["README.md", "README_EN.md"]) {
  let s = fs.readFileSync(f, "utf8");
  if (f === "README.md") {
    s = s.replace(/收录案例：\d+/, "收录案例：" + up.meta.count);
    s = s.replace(/最后更新：[\d-]+/, "最后更新：" + up.meta.updated);
  } else {
    s = s.replace(/\*\*\d+ cases\*\*/, "**" + up.meta.count + " cases**");
    s = s.replace(/Last updated: [\d-]+/, "Last updated: " + up.meta.updated);
  }
  fs.writeFileSync(f, s);
}

console.log("synced: " + local.cases.length + " -> " + up.cases.length + " cases (" + up.meta.updated + ")");
