// 構造的な等価性: Equal と HashSet
//
// JavaScript の `===` や `Set` は「同じオブジェクトかどうか」（参照）で比べます。
// そのため、中身が同じでも別々に作ったオブジェクトは違うものとして扱われます。
//
// Effect の `Equal.equals` は「中身が同じかどうか」（構造）で比べます。
// Effect の `HashSet` や `HashMap` も Equal.equals を使うので、中身が同じ値は 1 つにまとまります。
//
//   Equal.equals({ x: 1 }, { x: 1 })                  // true
//   HashSet.make({ x: 1 }, { x: 1 })                  // 要素は 1 つ
//   HashSet.fromIterable(array)                       // 配列から作る
//   HashSet.size(set) / HashSet.has(set, value)
//
// `Data.Class` を継承すると、`new Point({ x, y })` のように作れる読み取り専用のクラスを手軽に定義できます。
//
// 課題:
//   1. isSamePoint を、2 つの Point の中身が同じなら true を返すようにしてください
//   2. uniquePoints を、重複した座標を取り除いた HashSet にしてください

import { Data, Equal, HashSet } from "effect"
import assert from "node:assert/strict"

class Point extends Data.Class<{ readonly x: number; readonly y: number }> {}

export const isSamePoint = (a: Point, b: Point): boolean => Equal.equals(a, b)

const visited = [new Point({ x: 1, y: 2 }), new Point({ x: 3, y: 4 }), new Point({ x: 1, y: 2 })]

export const uniquePoints = HashSet.fromIterable(visited)

// --- テスト（ここから下は編集しないでください） ---

const a = new Point({ x: 1, y: 2 })
const b = new Point({ x: 1, y: 2 })
assert.equal(a === b, false, "別々に作ったオブジェクトなので === では異なります")
assert.equal(isSamePoint(a, b), true)
assert.equal(isSamePoint(a, new Point({ x: 3, y: 4 })), false)

assert.equal(HashSet.size(uniquePoints), 2)
assert.equal(HashSet.has(uniquePoints, new Point({ x: 3, y: 4 })), true)
console.log(`訪れた座標は ${HashSet.size(uniquePoints)} か所です`)
