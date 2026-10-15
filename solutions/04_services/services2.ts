// 依存関係: Layer
//
// サービスの実装の「作り方」をまとめたものが Layer です。
// Layer<ROut, E, RIn> は「RIn を使って ROut を作る（E で失敗しうる）」ことを表します。
//
//   Layer.succeed(Service, 実装)            // 値からそのまま作る
//   Layer.effect(Service, Effect)          // Effect を実行して作る（他のサービスに依存できる）
//   Layer.provide(layer, 依存 layer)       // layer の依存を満たした新しい Layer を作る
//   Effect.provide(effect, layer)          // Effect に Layer を提供する
//
// 課題:
//   1. ConfigLive を、greeting が "Hello" の Config を提供する Layer にしてください
//   2. runnable が実行できるように、GreeterLive が必要とする Config も提供してください

import { Context, Effect, Layer } from "effect"
import assert from "node:assert/strict"

class Config extends Context.Service<Config, {
  readonly greeting: string
}>()("Config") {}

class Greeter extends Context.Service<Greeter, {
  readonly greet: (name: string) => Effect.Effect<string>
}>()("Greeter") {}

export const ConfigLive: Layer.Layer<Config> = Layer.succeed(Config, { greeting: "Hello" })

// Config に依存して Greeter を作る Layer（ここは完成しています）
export const GreeterLive: Layer.Layer<Greeter, never, Config> = Layer.effect(
  Greeter,
  Effect.gen(function* () {
    const config = yield* Config
    return {
      greet: (name: string) => Effect.succeed(`${config.greeting}, ${name}!`)
    }
  })
)

const main = Effect.gen(function* () {
  const greeter = yield* Greeter
  return yield* greeter.greet("Effect")
})

export const runnable: Effect.Effect<string> = main.pipe(
  Effect.provide(GreeterLive.pipe(Layer.provide(ConfigLive)))
)

// --- テスト（ここから下は編集しないでください） ---

assert.equal(Effect.runSync(runnable), "Hello, Effect!")
console.log(Effect.runSync(runnable))
