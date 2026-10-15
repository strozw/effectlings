// パターンマッチ: Match
//
// `Match` を使うと、ユニオン型の値をケースごとに処理できます。
// `Match.exhaustive` で締めくくると、処理し忘れたケースがあるときに型エラーになります。
//
//   const describe = Match.type<Animal>().pipe(
//     Match.tag("Dog", (dog) => `${dog.name} はワンと鳴く`),
//     Match.tag("Cat", (cat) => `${cat.name} はニャーと鳴く`),
//     Match.exhaustive
//   )
//
// `Match.tag` は `_tag` フィールドで分岐します。
// `Match.when({ フィールド: 値 }, ...)` のように、値の形で分岐することもできます。
//
// 課題:
//   1. Shape に Triangle が追加されました。area が Triangle も扱えるようにしてください
//      （三角形の面積は base * height / 2）
//   2. label を、radius が 0 の Circle なら "点"、それ以外は `_tag` をそのまま返すようにしてください

import { Match } from "effect"
import assert from "node:assert/strict"

type Shape =
  | { readonly _tag: "Circle"; readonly radius: number }
  | { readonly _tag: "Square"; readonly size: number }
  | { readonly _tag: "Triangle"; readonly base: number; readonly height: number }

export const area = Match.type<Shape>().pipe(
  Match.tag("Circle", (c) => Math.PI * c.radius ** 2),
  Match.tag("Square", (s) => s.size ** 2),
  Match.tag("Triangle", (t) => (t.base * t.height) / 2),
  Match.exhaustive
)

export const label = Match.type<Shape>().pipe(
  Match.when({ _tag: "Circle", radius: 0 }, () => "点"),
  Match.orElse((shape) => shape._tag)
)

// --- テスト（ここから下は編集しないでください） ---

const _areaType: (shape: Shape) => number = area

assert.equal(area({ _tag: "Square", size: 3 }), 9)
assert.equal(area({ _tag: "Triangle", base: 4, height: 5 }), 10)
assert.equal(Math.round(area({ _tag: "Circle", radius: 1 }) * 100), 314)
assert.equal(label({ _tag: "Circle", radius: 0 }), "点")
assert.equal(label({ _tag: "Circle", radius: 2 }), "Circle")
assert.equal(label({ _tag: "Triangle", base: 1, height: 1 }), "Triangle")
console.log("Match ですべてのケースを処理できました")
