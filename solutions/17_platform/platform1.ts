// ファイル操作: FileSystem と Path
//
// Effect ではファイル操作も `FileSystem` サービスを通して行います。
// 実装は実行環境ごとに用意されていて、Node.js では `@effect/platform-node` の `NodeServices.layer` で提供します。
// サービスなので、16_testing と同じようにテストではメモリ上の実装に差し替えることもできます。
//
//   const fs = yield* FileSystem.FileSystem
//   const path = yield* Path.Path
//   yield* fs.writeFileString(file, "text")                   // 書き込み（上書き）
//   yield* fs.writeFileString(file, "text", { flag: "a" })    // 追記
//   const text = yield* fs.readFileString(file)               // 読み込み
//   const exists = yield* fs.exists(file)                     // 存在するか
//   const dir = yield* fs.makeTempDirectoryScoped()           // 一時ディレクトリ（Scope が閉じると削除される）
//
// 失敗は `PlatformError` という型付きエラーで表されます。
//
// 課題: メモを 1 行ずつファイルに保存する NoteStore を作ります。
//   1. addNote で、`<note>\n` をファイルの末尾に追記してください
//   2. listNotes で、ファイルがなければ空配列を、あればその行の配列を返してください（空行は除きます）

import { NodeServices } from "@effect/platform-node"
import { Effect, FileSystem, Path } from "effect"
import assert from "node:assert/strict"

export const makeNoteStore = (dir: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const file = path.join(dir, "notes.txt")

    const addNote = (note: string) => fs.writeFileString(file, `${note}\n`, { flag: "a" })

    const listNotes = Effect.gen(function* () {
      if (!(yield* fs.exists(file))) return []
      const text = yield* fs.readFileString(file)
      return text.split("\n").filter((line) => line.length > 0)
    })

    return { addNote, listNotes }
  })

// --- テスト（ここから下は編集しないでください） ---

const notes = await Effect.runPromise(
  Effect.scoped(
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const dir = yield* fs.makeTempDirectoryScoped()
      const store = yield* makeNoteStore(dir)
      assert.deepEqual(yield* store.listNotes, [], "ファイルがないときは空配列を返してください")
      yield* store.addNote("Effect を学ぶ")
      yield* store.addNote("演習を解く")
      const reopened = yield* makeNoteStore(dir)
      return yield* reopened.listNotes
    })
  ).pipe(Effect.provide(NodeServices.layer))
)
assert.deepEqual(notes, ["Effect を学ぶ", "演習を解く"])
console.log(`保存したメモ: ${notes.join(" / ")}`)
