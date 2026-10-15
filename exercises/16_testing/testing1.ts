// I AM NOT DONE
//
// テスト用の実装に差し替える: Layer によるテスト
//
// サービスを Context.Service と Layer で定義しておくと、テストでは本物の実装（外部 API やデータベース）の代わりに
// テスト用の実装を提供できます。プログラム本体は何も変える必要がありません。
//
//   const WeatherTest = Layer.succeed(Weather, { forecast: (city) => Effect.succeed(...) })
//   program.pipe(Effect.provide(WeatherTest))
//
// 呼び出しを記録したり、失敗を返したりするテスト用の実装も自由に作れます。
//
// 課題: WeatherLive は実際の API を呼ぶので、テストでは使えません。
//   1. WeatherTest を、temperatures に入っている都市はその気温を返し、
//      入っていない都市は CityNotFound({ city }) で失敗する Layer にしてください
//   2. テストで planTrip を WeatherTest を使って実行できるようにしてください（runTest を直します）

import { Context, Data, Effect, Layer } from "effect"
import assert from "node:assert/strict"

class CityNotFound extends Data.TaggedError("CityNotFound")<{ readonly city: string }> {}

class Weather extends Context.Service<
  Weather,
  {
    readonly temperature: (city: string) => Effect.Effect<number, CityNotFound>
  }
>()("Weather") {}

// 本物の実装（このファイルでは使いません）
export const WeatherLive = Layer.succeed(Weather, {
  temperature: () => Effect.die(new Error("ネットワークに接続できません"))
})

// テストしたいプログラム
export const planTrip = (cities: ReadonlyArray<string>) =>
  Effect.gen(function* () {
    const weather = yield* Weather
    const results = yield* Effect.forEach(cities, (city) =>
      weather.temperature(city).pipe(Effect.map((t) => ({ city, t })))
    )
    const warmest = results.reduce((a, b) => (b.t > a.t ? b : a))
    return `${warmest.city} (${warmest.t}℃)`
  })

const temperatures: Record<string, number> = { Tokyo: 18, Naha: 26, Sapporo: 9 }

export const WeatherTest: Layer.Layer<Weather> = Layer.empty

const runTest = <A, E>(effect: Effect.Effect<A, E, Weather>) => Effect.runSync(effect.pipe(Effect.provide(WeatherLive)))

// --- テスト（ここから下は編集しないでください） ---

assert.equal(runTest(planTrip(["Tokyo", "Naha", "Sapporo"])), "Naha (26℃)")
assert.equal(runTest(planTrip(["Sapporo", "Tokyo"])), "Tokyo (18℃)")
const error = runTest(Effect.flip(planTrip(["Tokyo", "Atlantis"])))
assert.equal(error.city, "Atlantis")
console.log("テスト用の Layer でプログラムを検証できました")
