// I AM NOT DONE
//
// 結果の再利用: Cache
//
// 同じ引数で何度も呼ばれる重い処理は、`Cache` で結果を覚えておけます。
//
//   const cache = yield* Cache.make({
//     lookup: (key: string) => fetchSomething(key),  // キャッシュにないときに実行する処理
//     capacity: 100,                                 // 覚えておく件数の上限
//     timeToLive: "5 minutes"                        // 覚えておく時間（省略すると無期限）
//   })
//   yield* Cache.get(cache, "key")                   // あれば覚えた値、なければ lookup を実行
//
// 同じキーで同時に get されても、lookup は 1 回しか実行されません。
//
// 課題: getProfile は呼ばれるたびに fetchProfile を実行しています。
//       makeProfiles の中で Cache を作り、同じ id の fetchProfile が 1 回だけ実行されるようにしてください。
//       （capacity は 100 にしてください）

import { Cache, Effect } from "effect"
import assert from "node:assert/strict"

const fetched: Array<number> = []

const fetchProfile = (id: number) =>
  Effect.gen(function* () {
    fetched.push(id)
    yield* Effect.sleep("10 millis")
    return { id, name: `user-${id}` }
  })

export const makeProfiles = Effect.gen(function* () {
  return {
    getProfile: (id: number) => fetchProfile(id)
  }
})

export const program = Effect.gen(function* () {
  const profiles = yield* makeProfiles
  const first = yield* Effect.forEach([1, 2, 1, 1, 2], profiles.getProfile, { concurrency: "unbounded" })
  const second = yield* profiles.getProfile(1)
  return [...first, second].map((p) => p.name)
})

// --- テスト（ここから下は編集しないでください） ---

const names = await Effect.runPromise(program)
assert.deepEqual(names, ["user-1", "user-2", "user-1", "user-1", "user-2", "user-1"])
assert.deepEqual(
  [...fetched].sort(),
  [1, 2],
  `fetchProfile が ${fetched.length} 回実行されました（id ごとに 1 回にしてください）`
)
console.log("Cache で同じプロフィールの取得を 1 回にまとめられました")
