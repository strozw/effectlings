// 設定値: Config, ConfigProvider, Redacted
//
// 環境変数などの設定値は `Config` で読み込みます。Config は Effect.gen の中で `yield*` できます。
//
//   const host = yield* Config.String("HOST")                                // 文字列
//   const port = yield* Config.Port("PORT").pipe(Config.withDefault(8080))   // ポート番号（なければ 8080）
//   const key = yield* Config.Redacted("API_KEY")                            // 秘密の値
//
// 値が見つからなかったり形式が正しくなかったりすると `ConfigError` で失敗します。
//
// `Redacted` で包んだ値は、console.log や文字列化しても `<redacted>` と表示され、
// ログに秘密が漏れるのを防げます。中身が必要なときだけ `Redacted.value(key)` で取り出します。
//
// 設定値の読み込み元は `ConfigProvider` で差し替えられます（標準では環境変数）。
//   Effect.provide(effect, ConfigProvider.layer(ConfigProvider.fromUnknown({ HOST: "localhost" })))
//
// 課題:
//   1. loadConfig で HOST（文字列）、PORT（ポート番号、なければ 8080）、API_KEY（Redacted）を読み込んでください
//   2. authHeader で、apiKey の中身を取り出して "Bearer <API_KEY>" を作ってください

import { Config, ConfigProvider, Effect, Redacted } from "effect"
import assert from "node:assert/strict"

export const loadConfig = Effect.gen(function* () {
  const host = yield* Config.String("HOST")
  const port = yield* Config.Port("PORT").pipe(Config.withDefault(8080))
  const apiKey = yield* Config.Redacted("API_KEY")
  return { host, port, apiKey }
})

export const authHeader = (apiKey: Redacted.Redacted<string>): string => `Bearer ${Redacted.value(apiKey)}`

// --- テスト（ここから下は編集しないでください） ---

const withEnv = (env: Record<string, string>) =>
  loadConfig.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))))

const config = Effect.runSync(withEnv({ HOST: "example.com", PORT: "3000", API_KEY: "s3cr3t" }))
assert.equal(config.host, "example.com")
assert.equal(config.port, 3000)
assert.equal(String(config.apiKey), "<redacted>", "API_KEY は Redacted で読み込んでください")
assert.equal(authHeader(config.apiKey), "Bearer s3cr3t")

assert.equal(Effect.runSync(withEnv({ HOST: "localhost", API_KEY: "x" })).port, 8080)

const error = Effect.runSync(Effect.flip(withEnv({ HOST: "localhost" })))
assert.equal(error._tag, "ConfigError")
console.log(`設定を読み込みました: ${JSON.stringify({ ...config, apiKey: String(config.apiKey) })}`)
