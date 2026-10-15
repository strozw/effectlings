#!/usr/bin/env node
// tsx 経由で TypeScript の CLI 本体を起動する
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url))
const tsx = import.meta.resolve("tsx")
const result = spawnSync(process.execPath, ["--import", tsx, cli, ...process.argv.slice(2)], {
  stdio: "inherit"
})
process.exit(result.status ?? 1)
