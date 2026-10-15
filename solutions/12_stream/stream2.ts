// ストリームと Effect: Stream.mapEffect と Stream.grouped
//
// ストリームの各要素に対して Effect を実行するには `Stream.mapEffect` を使います。
// `concurrency` を指定すると、複数の要素を同時に処理できます（結果の順番は保たれます）。
//
//   stream.pipe(Stream.mapEffect((id) => fetchUser(id), { concurrency: 3 }))
//
// `Stream.grouped(n)` は要素を n 個ずつの配列にまとめます。
// API にまとめて送る（バッチ処理）ときなどに使えます。
//
// `Stream.runCount(stream)` は、ストリームを最後まで実行して流れた要素の数を返します。
//
// 課題: importUsers で、userIds の各ユーザーを fetchUser で取得し（同時に 3 件まで）、
//       2 件ずつまとめて saveBatch で保存してください。最後に保存したバッチの数を返します。

import { Effect, Stream } from "effect"
import assert from "node:assert/strict"

let running = 0
let maxRunning = 0

const fetchUser = (id: number) =>
  Effect.gen(function* () {
    running++
    maxRunning = Math.max(maxRunning, running)
    yield* Effect.sleep("10 millis")
    running--
    return `user-${id}`
  })

const saved: Array<ReadonlyArray<string>> = []
const saveBatch = (users: ReadonlyArray<string>) => Effect.sync(() => saved.push(users))

const userIds = [1, 2, 3, 4, 5, 6, 7]

export const importUsers: Effect.Effect<number> = Stream.fromIterable(userIds).pipe(
  Stream.mapEffect(fetchUser, { concurrency: 3 }),
  Stream.grouped(2),
  Stream.mapEffect(saveBatch),
  Stream.runCount
)

// --- テスト（ここから下は編集しないでください） ---

assert.equal(await Effect.runPromise(importUsers), 4)
assert.deepEqual(saved, [["user-1", "user-2"], ["user-3", "user-4"], ["user-5", "user-6"], ["user-7"]])
assert.equal(maxRunning, 3, "fetchUser は同時に 3 件まで実行してください")
console.log(`${saved.length} 回に分けて保存しました`)
