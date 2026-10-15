// I AM NOT DONE
//
// 1 対多の配信: PubSub
//
// `Queue` は 1 つのメッセージを 1 人の受け手が取り出しますが、
// `PubSub` は 1 つのメッセージを購読しているすべての受け手に届けます。
//
//   const pubsub = yield* PubSub.unbounded<string>()
//   const subscription = yield* PubSub.subscribe(pubsub)   // 購読する（Scope が必要）
//   yield* PubSub.publish(pubsub, "hello")                 // 全購読者に配信
//   const message = yield* PubSub.take(subscription)       // 購読したメッセージを 1 つ受け取る
//
// 購読を始める前に配信されたメッセージは受け取れません。
// subscribe は Scope を必要とし、Scope が閉じると購読が終了します（Effect.scoped で囲みます）。
//
// 課題: program で、mailer と auditor の 2 人が events を購読してから 3 つのイベントを配信し、
//       それぞれが 3 つずつ受け取れるようにしてください。

import { Effect, PubSub } from "effect"
import assert from "node:assert/strict"

const events = ["signed-up", "logged-in", "logged-out"]

const listener = (name: string, subscription: PubSub.Subscription<string>) =>
  Effect.forEach(events, () => PubSub.take(subscription).pipe(Effect.map((event) => `${name}: ${event}`)))

export const program = Effect.scoped(
  Effect.gen(function* () {
    const pubsub = yield* PubSub.unbounded<string>()
    yield* PubSub.publishAll(pubsub, events)
    const mailerSubscription = yield* PubSub.subscribe(pubsub)
    const auditorSubscription = mailerSubscription
    return yield* Effect.all([listener("mailer", mailerSubscription), listener("auditor", auditorSubscription)], {
      concurrency: "unbounded"
    })
  })
)

// --- テスト（ここから下は編集しないでください） ---

const [mailer, auditor] = await Effect.runPromise(program.pipe(Effect.timeout("1 second")))
assert.deepEqual(mailer, ["mailer: signed-up", "mailer: logged-in", "mailer: logged-out"])
assert.deepEqual(auditor, ["auditor: signed-up", "auditor: logged-in", "auditor: logged-out"])
console.log("PubSub で全員にイベントを届けられました")
