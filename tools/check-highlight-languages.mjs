#!/usr/bin/env node

import hljs from "highlight.js";

const sqlSample = `SELECT id, name
FROM users
WHERE active = TRUE
  AND score >= 80
  AND role = 'admin'; -- active administrators`;

const requiredSqlTokens = [
  "hljs-keyword",
  "hljs-literal",
  "hljs-number",
  "hljs-string",
  "hljs-comment",
];

if (!hljs.getLanguage("sql")) {
  throw new Error("highlight.js SQL language is not registered");
}

const highlightedSql = hljs.highlight(sqlSample, { language: "sql" }).value;
const missingSqlTokens = requiredSqlTokens.filter(
  (token) => !highlightedSql.includes(`class="${token}"`),
);

if (missingSqlTokens.length > 0) {
  throw new Error(
    `highlight.js SQL output is missing: ${missingSqlTokens.join(", ")}`,
  );
}

process.stdout.write("highlight.js SQL syntax highlighting is available.\n");
