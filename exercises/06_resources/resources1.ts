// I AM NOT DONE
//
// リソース管理: Effect.acquireRelease と Effect.scoped
//
// ファイルやコネクションのように「開いたら必ず閉じる」必要があるものは、
// `Effect.acquireRelease(acquire, release)` で取得と解放をセットにして定義します。
//
//   const file = Effect.acquireRelease(
//     Effect.sync(() => open()),          // 取得
//     (handle) => Effect.sync(() => handle.close())  // 解放（成功・失敗・中断のどれでも必ず実行される）
//   )
//
// acquireRelease で作った Effect は R に `Scope` を要求します。
// `Effect.scoped(effect)` で囲むと、その範囲が終わったときに解放処理が実行され、Scope が取り除かれます。
//
// 課題:
//   1. connection を、取得時に openConnection、解放時に conn.close を呼ぶ acquireRelease にしてください
//   2. useConnection を Effect.scoped で囲み、実行できるようにしてください

import { Effect } from "effect"
import assert from "node:assert/strict"

const log: Array<string> = []

interface Connection {
  readonly query: (sql: string) => Effect.Effect<string, string>
  readonly close: () => void
}

const openConnection = (): Connection => {
  log.push("open")
  return {
    query: (sql) => {
      log.push(`query: ${sql}`)
      return sql.startsWith("SELECT") ? Effect.succeed("ok") : Effect.fail(`不正な SQL: ${sql}`)
    },
    close: () => log.push("close")
  }
}

export const connection = Effect.sync(openConnection)

export const useConnection = (sql: string): Effect.Effect<string, string> =>
  Effect.gen(function* () {
    const conn = yield* connection
    return yield* conn.query(sql)
  })

// --- テスト（ここから下は編集しないでください） ---

assert.equal(Effect.runSync(useConnection("SELECT 1")), "ok")
assert.deepEqual(log, ["open", "query: SELECT 1", "close"])

log.length = 0
assert.equal(Effect.runSync(Effect.flip(useConnection("DROP TABLE"))), "不正な SQL: DROP TABLE")
assert.deepEqual(log, ["open", "query: DROP TABLE", "close"], "失敗したときもコネクションを閉じる必要があります")
console.log("コネクションを必ず閉じられるようになりました")
