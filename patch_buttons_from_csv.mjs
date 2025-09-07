// patch_buttons_from_csv.mjs
// Usage:
//  node patch_buttons_from_csv.mjs --csv button_patch_suggestions.csv [--write]
// Options:
//  --csv   : path to CSV file
//  --write : actually modify files (default: dry-run)
//
// What it does:
//  - Reads CSV columns: file, line, norm_label, suggestion
//  - Opens file, finds a <button>..LABEL..</button> OR <Button>..LABEL..</Button>
//    nearest to given line, and replaces whole tag with suggestion
//  - Adds `import { Button } from "@/components/ui/Button"` if missing (TS/TSX/JS/JSX)
//  - Creates <filename>.bak backup when --write is used

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const args = process.argv.slice(2);
const csvPath = getArg("--csv", "button_patch_suggestions.csv");
const doWrite = args.includes("--write");

function getArg(flag, def) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
}

function readCsv(p) {
  const txt = fs.readFileSync(p, "utf8");
  const rows = parse(txt, { columns: true, skip_empty_lines: true });
  return rows;
}

function ensureImport(code) {
  const importLine = `import { Button } from "@/components/ui/Button";`;
  // Already imported?
  if (code.includes(importLine)) return code;
  // If there is another import from same path, merge?
  const reExisting = /import\s+{([^}]+)}\s+from\s+["']@\/components\/ui\/Button["'];?/;
  const m = code.match(reExisting);
  if (m) {
    // If Button not listed, append it
    const names = m[1].split(",").map(s => s.trim());
    if (!names.includes("Button")) {
      const replaced = m[0].replace(m[1], [...names, "Button"].join(", "));
      return code.replace(reExisting, replaced);
    }
    return code;
  }
  // Insert after first import line or at top
  const lines = code.split("\n");
  let insAt = 0;
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    if (lines[i].startsWith("import ")) insAt = i + 1;
  }
  lines.splice(insAt, 0, importLine);
  return lines.join("\n");
}

function indexToLineCol(code, idx) {
  const pre = code.slice(0, idx);
  const line = pre.split("\n").length;
  return line;
}

function findCandidates(code, label) {
  // Match both <button ...> ...label... </button> and <Button ...> ...label... </Button>
  // We search generously and then filter by text content containing label
  const candidates = [];
  const regexes = [
    /<button\b[\s\S]*?<\/button>/gi,
    /<Button\b[\s\S]*?<\/Button>/g
  ];
  for (const re of regexes) {
    let m;
    while ((m = re.exec(code)) !== null) {
      const block = m[0];
      const start = m.index;
      const end = m.index + m[0].length;
      const textOnly = block
        .replace(/<[^>]+>/g, " ")
        .replace(/\{[^}]*\}/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (textOnly.includes(label)) {
        const line = indexToLineCol(code, start);
        candidates.push({ start, end, block, line, textOnly });
      }
    }
  }
  return candidates;
}

function applySuggestionToNearest(code, label, targetLine, suggestion) {
  const cand = findCandidates(code, label);
  if (cand.length === 0) {
    return { code, changed: false, reason: "no-candidate" };
  }
  // Choose nearest by absolute line distance
  let best = cand[0];
  let bestDist = Math.abs((targetLine || best.line) - best.line);
  for (const c of cand) {
    const dist = Math.abs((targetLine || c.line) - c.line);
    if (dist < bestDist) {
      best = c;
      bestDist = dist;
    }
  }
  const before = code.slice(0, best.start);
  const after = code.slice(best.end);
  const newCode = before + suggestion + after;
  return { code: newCode, changed: true, reason: "replaced" };
}

function isCodeFile(file) {
  return [".tsx", ".jsx", ".ts", ".js"].includes(path.extname(file));
}

function main() {
  const rows = readCsv(csvPath);

  const report = [];
  for (const r of rows) {
    const file = r.file?.trim();
    const label = (r.norm_label || r.label || "").toString().trim();
    const suggestion = (r.suggestion || "").toString();
    const line = parseInt(r.line || "0", 10) || undefined;

    if (!file || !label || !suggestion) {
      report.push({ file, label, status: "skip", msg: "missing data" });
      continue;
    }
    if (!fs.existsSync(file)) {
      report.push({ file, label, status: "skip", msg: "file not found" });
      continue;
    }
    if (!isCodeFile(file)) {
      report.push({ file, label, status: "skip", msg: "not a code file" });
      continue;
    }

    let code = fs.readFileSync(file, "utf8");
    const original = code;

    // Replace nearest match
    const res = applySuggestionToNearest(code, label, line, suggestion);
    code = res.code;

    if (!res.changed) {
      report.push({ file, label, status: "no-change", msg: res.reason });
      continue;
    }

    // Ensure import
    code = ensureImport(code);

    if (doWrite) {
      // backup
      try {
        fs.writeFileSync(file + ".bak", original, "utf8");
      } catch {}
      fs.writeFileSync(file, code, "utf8");
      report.push({ file, label, status: "patched", msg: "ok" });
    } else {
      report.push({ file, label, status: "dry-run", msg: "would patch" });
    }
  }

  // Print summary
  const ok = report.filter(r => r.status === "patched").length;
  const dry = report.filter(r => r.status === "dry-run").length;
  const skipped = report.length - ok - dry;
  console.table(report.slice(0, 50));
  console.log(`\nSummary: patched=${ok}, dry=${dry}, skipped=${skipped}, total=${report.length}`);
}

main();
