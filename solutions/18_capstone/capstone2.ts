// 総まとめ 2: リンクチェッカー（並行実行, 再試行, タイムアウト, エラー回復, テスト用 Layer）
//
// ブックマークのリンクが生きているかを調べる checkAll を作ります。
// LinkChecker サービスは url の HTTP ステータスを返しますが、ネットワークは不安定です。
//
// checkAll は url ごとに次のように振る舞います。
//   - LinkChecker.check を、NetworkError なら最大 2 回まで再試行する
//   - 1 回の url の確認（再試行を含む）が 200 ミリ秒を超えたらあきらめる
//   - ステータスが 400 未満なら "ok"、400 以上なら "broken"
//   - 再試行しても NetworkError なら "unreachable"、時間切れなら "timeout"
//   - 同時に確認する url は 3 つまで
//   - 結果は入力と同じ順番で { url, result } の配列にする
//
// 課題: checkAll を上の仕様どおりに実装してください。
//       （Effect.retry, Effect.timeout, Effect.catchTags, Effect.forEach の concurrency を組み合わせます）

import { Context, Data, Effect, Layer } from "effect"
import assert from "node:assert/strict"

class NetworkError extends Data.TaggedError("NetworkError")<{ readonly url: string }> {}

class LinkChecker extends Context.Service<
  LinkChecker,
  {
    readonly check: (url: string) => Effect.Effect<number, NetworkError>
  }
>()("LinkChecker") {}

type Result = "ok" | "broken" | "unreachable" | "timeout"

export const checkAll = Effect.fn("checkAll")(function* (urls: ReadonlyArray<string>) {
  const checker = yield* LinkChecker
  return yield* Effect.forEach(
    urls,
    (url) =>
      checker.check(url).pipe(
        Effect.retry({ times: 2 }),
        Effect.timeout("200 millis"),
        Effect.map((status): Result => (status < 400 ? "ok" : "broken")),
        Effect.catchTags({
          NetworkError: () => Effect.succeed<Result>("unreachable"),
          TimeoutError: () => Effect.succeed<Result>("timeout")
        }),
        Effect.map((result) => ({ url, result }))
      ),
    { concurrency: 3 }
  )
})

// --- テスト（ここから下は編集しないでください） ---

const _type: (
  urls: ReadonlyArray<string>
) => Effect.Effect<Array<{ readonly url: string; readonly result: Result }>, never, LinkChecker> = checkAll

let running = 0
let maxRunning = 0
const attempts = new Map<string, number>()

// url ごとに決まった振る舞いをするテスト用の LinkChecker
const LinkCheckerTest = Layer.succeed(LinkChecker, {
  check: (url) =>
    Effect.gen(function* () {
      const attempt = (attempts.get(url) ?? 0) + 1
      attempts.set(url, attempt)
      running++
      maxRunning = Math.max(maxRunning, running)
      yield* Effect.sleep("10 millis")
      running--
      if (url.includes("flaky") && attempt < 3) return yield* new NetworkError({ url })
      if (url.includes("down")) return yield* new NetworkError({ url })
      if (url.includes("slow")) yield* Effect.sleep("5 seconds")
      return url.includes("gone") ? 404 : 200
    }).pipe(Effect.onInterrupt(() => Effect.sync(() => running--)))
})

const urls = [
  "https://ok.example",
  "https://flaky.example",
  "https://gone.example",
  "https://down.example",
  "https://slow.example",
  "https://ok2.example"
]

const started = Date.now()
const results = await Effect.runPromise(checkAll(urls).pipe(Effect.provide(LinkCheckerTest)))

assert.deepEqual(results, [
  { url: "https://ok.example", result: "ok" },
  { url: "https://flaky.example", result: "ok" },
  { url: "https://gone.example", result: "broken" },
  { url: "https://down.example", result: "unreachable" },
  { url: "https://slow.example", result: "timeout" },
  { url: "https://ok2.example", result: "ok" }
])
assert.equal(attempts.get("https://flaky.example"), 3, "NetworkError のときは最大 2 回まで再試行してください")
assert.equal(attempts.get("https://down.example"), 3, "NetworkError のときは最大 2 回まで再試行してください")
assert.equal(maxRunning, 3, "同時に確認する url は 3 つまでにしてください")
assert.ok(Date.now() - started < 2000, "時間がかかりすぎています（タイムアウトを確認してください）")
console.log(results.map((r) => `${r.result.padEnd(11)} ${r.url}`).join("\n"))
