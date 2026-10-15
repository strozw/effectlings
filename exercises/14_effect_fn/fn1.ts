// I AM NOT DONE
//
// Effect を返す関数を定義する: Effect.fn
//
// 引数を受け取って Effect を返す関数は、`Effect.fn` で定義するのが定番です。
//
//   const getUser = Effect.fn("getUser")(function* (id: number) {
//     const db = yield* Database
//     return yield* db.find(id)
//   })
//   // getUser: (id: number) => Effect<User, ..., Database>
//
// `(id) => Effect.gen(...)` と書くのとほぼ同じですが、次の利点があります。
//   - 名前付きのスパン（トレース）が自動で作られ、エラーのスタックトレースにも関数名が出る
//   - 2 番目以降の引数に、本体の Effect に適用する変換（pipe と同じ）を並べられる
//
//   const safeGetUser = Effect.fn("safeGetUser")(
//     function* (id: number) { ... },
//     Effect.catchTag("NotFoundError", () => Effect.succeed(guest))
//   )
//
// なお、Data.TaggedError のインスタンスは `yield* new MyError(...)` と書くだけで、その場で失敗させられます
// （`yield* Effect.fail(new MyError(...))` と同じ意味です）。
//
// 課題:
//   1. transfer を Effect.fn("transfer") で定義し直してください（中身はそのままで構いません）
//   2. safeTransfer を Effect.fn で定義し、transfer を呼んだあと、
//      2 番目の引数で InsufficientFunds を "skipped" に回復させてください

import { Data, Effect } from "effect"
import assert from "node:assert/strict"

class InsufficientFunds extends Data.TaggedError("InsufficientFunds")<{ readonly balance: number }> {}

let balance = 100

export const transfer = function* (amount: number) {
  if (amount > balance) {
    return yield* new InsufficientFunds({ balance })
  }
  balance -= amount
  return `transferred ${amount}`
}

export const safeTransfer = (amount: number) =>
  Effect.gen(function* () {
    return yield* transfer(amount)
  })

// --- テスト（ここから下は編集しないでください） ---

const _transferType: (amount: number) => Effect.Effect<string, InsufficientFunds> = transfer
const _safeType: (amount: number) => Effect.Effect<string> = safeTransfer

assert.equal(Effect.runSync(transfer(30)), "transferred 30")
assert.equal(Effect.runSync(Effect.flip(transfer(1000))).balance, 70)
assert.equal(Effect.runSync(safeTransfer(50)), "transferred 50")
assert.equal(Effect.runSync(safeTransfer(50)), "skipped")
assert.equal(balance, 20)
console.log(`残高は ${balance} です`)
