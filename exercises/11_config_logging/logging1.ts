// I AM NOT DONE
//
// ログ: Effect.log と Logger
//
// Effect には構造化されたログの仕組みが組み込まれています。
//
//   yield* Effect.log("message")          // INFO レベル
//   yield* Effect.logDebug("details")     // DEBUG レベル（標準では出力されない）
//   yield* Effect.logWarning("careful")   // WARN レベル
//   yield* Effect.logError("failed")      // ERROR レベル
//
// ログの出力先は `Logger` で差し替えられます。
//
//   const myLogger = Logger.make(({ logLevel, message }) => ...)
//   Effect.provide(effect, Logger.layer([myLogger]))
//
// どのレベル以上を出力するかは `References.MinimumLogLevel` で変更できます。
//   Effect.provideService(effect, References.MinimumLogLevel, "Debug")
//
// 課題:
//   1. processOrder で、受け付けたときに Info レベルで "processing order <id>" を、
//      数量が 10 を超えるときに Warning レベルで "large order <id>" をログに出してください
//   2. collected で、collector を使ってログを集め、Debug レベルのログも出力されるようにしてください

import { Effect, Logger, References } from "effect"
import assert from "node:assert/strict"

const logs: Array<string> = []

// ログを "<レベル>: <メッセージ>" の形で logs に集める Logger
const collector = Logger.make(({ logLevel, message }) => {
  const parts = Array.isArray(message) ? message : [message]
  logs.push(`${logLevel}: ${parts.join(" ")}`)
})

export const processOrder = (id: string, quantity: number) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(`quantity = ${quantity}`)
    console.log(`processing order ${id}`)

    return `${id} x ${quantity}`
  })

export const collected = Effect.forEach(
  [
    ["A-1", 3],
    ["B-2", 20]
  ] as const,
  ([id, quantity]) => processOrder(id, quantity)
)

// --- テスト（ここから下は編集しないでください） ---

assert.deepEqual(Effect.runSync(collected), ["A-1 x 3", "B-2 x 20"])
assert.deepEqual(logs, [
  "Debug: quantity = 3",
  "Info: processing order A-1",
  "Debug: quantity = 20",
  "Info: processing order B-2",
  "Warn: large order B-2"
])
console.log(logs.join("\n"))
