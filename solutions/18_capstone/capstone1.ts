// 総まとめ 1: ブックマーク管理（Service, Layer, Ref, Schema, 型付きエラー, Effect.fn）
//
// ここまでに学んだ道具を組み合わせて、小さなブックマーク管理の中心部分を作ります。
//
//   - Bookmark: Schema.Class で定義したデータ（url は https:// で始まる、title は空でない）
//   - BookmarkRepo: ブックマークを保存するサービス。Ref に Map を持つインメモリ実装を Layer で提供する
//   - addBookmark: 外部から来た値を検証して保存する（Effect.fn）
//   - byTag: 指定したタグを持つブックマークの url を返す
//
// 課題:
//   1. BookmarkRepo.layer の save を、同じ url がすでにあれば DuplicateBookmark({ url }) で失敗させ、
//      なければ Ref.update で Map に追加するようにしてください
//   2. addBookmark で、Schema の SchemaError を InvalidBookmark({ message }) に変換してください
//      （Effect.mapError を使います。message には SchemaError の message を入れます）
//   3. byTag を、tags に tag を含むブックマークの url だけを返すようにしてください

import { Context, Data, Effect, Layer, Ref, Schema } from "effect"
import assert from "node:assert/strict"

export class Bookmark extends Schema.Class<Bookmark>("Bookmark")({
  url: Schema.String.check(Schema.isStartingWith("https://")),
  title: Schema.String.check(Schema.isMinLength(1)),
  tags: Schema.Array(Schema.String)
}) {}

export class DuplicateBookmark extends Data.TaggedError("DuplicateBookmark")<{ readonly url: string }> {}
export class InvalidBookmark extends Data.TaggedError("InvalidBookmark")<{ readonly message: string }> {}

export class BookmarkRepo extends Context.Service<
  BookmarkRepo,
  {
    readonly save: (bookmark: Bookmark) => Effect.Effect<void, DuplicateBookmark>
    readonly all: Effect.Effect<ReadonlyArray<Bookmark>>
  }
>()("BookmarkRepo") {
  static readonly layer = Layer.effect(
    BookmarkRepo,
    Effect.gen(function* () {
      const store = yield* Ref.make(new Map<string, Bookmark>())
      return {
        save: (bookmark: Bookmark) =>
          Effect.gen(function* () {
            const current = yield* Ref.get(store)
            if (current.has(bookmark.url)) {
              return yield* new DuplicateBookmark({ url: bookmark.url })
            }
            yield* Ref.update(store, (map) => new Map(map).set(bookmark.url, bookmark))
          }),
        all: Ref.get(store).pipe(Effect.map((map) => [...map.values()]))
      }
    })
  )
}

export const addBookmark = Effect.fn("addBookmark")(function* (input: unknown) {
  const bookmark = yield* Schema.decodeUnknownEffect(Bookmark)(input).pipe(
    Effect.mapError((error) => new InvalidBookmark({ message: error.message }))
  )
  const repo = yield* BookmarkRepo
  yield* repo.save(bookmark)
  return bookmark
})

export const byTag = Effect.fn("byTag")(function* (tag: string) {
  const repo = yield* BookmarkRepo
  const all = yield* repo.all
  return all.filter((bookmark) => bookmark.tags.includes(tag)).map((bookmark) => bookmark.url)
})

// --- テスト（ここから下は編集しないでください） ---

const _addType: (input: unknown) => Effect.Effect<Bookmark, InvalidBookmark | DuplicateBookmark, BookmarkRepo> =
  addBookmark

const result = Effect.runSync(
  Effect.gen(function* () {
    yield* addBookmark({ url: "https://effect.website", title: "Effect", tags: ["ts", "effect"] })
    yield* addBookmark({ url: "https://www.typescriptlang.org", title: "TypeScript", tags: ["ts"] })
    yield* addBookmark({ url: "https://nodejs.org", title: "Node.js", tags: ["runtime"] })

    const duplicate = yield* Effect.flip(addBookmark({ url: "https://nodejs.org", title: "Node", tags: [] }))
    const invalid = yield* Effect.flip(addBookmark({ url: "http://insecure.example", title: "x", tags: [] }))

    return {
      ts: yield* byTag("ts"),
      runtime: yield* byTag("runtime"),
      none: yield* byTag("rust"),
      duplicate,
      invalid
    }
  }).pipe(Effect.provide(BookmarkRepo.layer))
)

assert.deepEqual(result.ts, ["https://effect.website", "https://www.typescriptlang.org"])
assert.deepEqual(result.runtime, ["https://nodejs.org"])
assert.deepEqual(result.none, [])
assert.equal(result.duplicate._tag, "DuplicateBookmark")
assert.equal(result.invalid._tag, "InvalidBookmark")
if (result.invalid._tag === "InvalidBookmark") {
  assert.match(result.invalid.message, /https:\/\//)
}
console.log(`ts タグのブックマーク: ${result.ts.join(", ")}`)
