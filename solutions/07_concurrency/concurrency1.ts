// 並行実行: Effect.all と Effect.forEach の concurrency
//
// `Effect.all([a, b, c])` や `Effect.forEach(items, f)` は、何も指定しないと 1 つずつ順番に実行します。
// `concurrency` オプションを渡すと、同時に実行する数を指定できます。
//
//   Effect.all([a, b, c], { concurrency: "unbounded" })    // すべて同時に実行
//   Effect.forEach(items, f, { concurrency: 2 })           // 同時に 2 つまで
//
// 結果の順番は、実行の順番に関係なく入力の順番のままです。
//
// 課題:
//   1. loadDashboard で 3 つの取得処理をすべて同時に実行してください
//   2. downloadAll で、同時に実行するダウンロードを 2 つまでに制限してください

import { Effect } from "effect"
import assert from "node:assert/strict"

let running = 0
let maxRunning = 0

// 同時にいくつ実行されているかを数えながら、少し待って値を返す処理
const task = <A>(value: A): Effect.Effect<A> =>
  Effect.gen(function* () {
    running++
    maxRunning = Math.max(maxRunning, running)
    yield* Effect.sleep("20 millis")
    running--
    return value
  })

export const loadDashboard = Effect.all([task("user"), task("posts"), task("notifications")], {
  concurrency: "unbounded"
})

export const downloadAll = (files: ReadonlyArray<string>) =>
  Effect.forEach(files, (file) => task(`${file}: done`), { concurrency: 2 })

// --- テスト（ここから下は編集しないでください） ---

const dashboard = await Effect.runPromise(loadDashboard)
assert.deepEqual(dashboard, ["user", "posts", "notifications"])
assert.equal(maxRunning, 3, "3 つの処理が同時に実行されていません")

maxRunning = 0
const downloads = await Effect.runPromise(downloadAll(["a", "b", "c", "d", "e"]))
assert.deepEqual(downloads, ["a: done", "b: done", "c: done", "d: done", "e: done"])
assert.equal(maxRunning, 2, "同時に実行するダウンロードは 2 つまでにしてください")
console.log("並行実行を制御できました")
