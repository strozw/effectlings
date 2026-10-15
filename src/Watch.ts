import { Console, Effect, FileSystem, Ref, Schema, Stream, Terminal } from "effect"
import type { PlatformError } from "effect/PlatformError"
import { Exercises } from "./Exercises.ts"
import { bold, clearScreen, cyan, dim, green, printList, printProgress, printResult } from "./Ui.ts"
import { Verifier } from "./Verifier.ts"

type WatchEvent =
  | { readonly _tag: "FileChanged" }
  | { readonly _tag: "Key"; readonly name: string }

class Quit extends Schema.TaggedError<Quit>()("Quit", {}) {}

/**
 * watch モード
 *
 * 演習ファイルの変更とキー入力を 1 本の Stream にまとめ、イベントごとに画面を描き直す。
 * 現在の演習は毎回「最初の未完了の演習」として計算するので、マーカーを消すと自動的に次へ進む。
 */
export const watch = Effect.gen(function*() {
  const exercises = yield* Exercises
  const verifier = yield* Verifier
  const fs = yield* FileSystem.FileSystem
  const showHint = yield* Ref.make(false)

  const render = Effect.gen(function*() {
    yield* clearScreen
    const current = yield* exercises.firstPending
    if (current._tag === "None") {
      yield* Console.log(green(bold("🎉 おめでとうございます！すべての演習が完了しました！")))
      yield* Console.log()
      yield* printProgress
      return yield* Console.log(dim("\nq で終了"))
    }
    const exercise = current.value
    yield* Console.log(dim(`検証中: ${exercises.displayPath(exercise)} ...`))
    const result = yield* verifier.verify(exercises.exercisePath(exercise))
    yield* clearScreen
    yield* printResult(exercise, result)
    if (yield* Ref.get(showHint)) {
      yield* Console.log(`\n${bold(cyan("ヒント:"))} ${exercise.hint}`)
    }
    yield* Console.log()
    yield* printProgress
    yield* Console.log(`現在の演習: ${bold(exercises.displayPath(exercise))}`)
    yield* Console.log(dim("\nh: ヒント  l: 一覧  r: 再実行  q: 終了"))
  })

  // 保存時は複数のイベントが連続して届くので、まとめてから 1 回だけ処理する
  const fileChanges: Stream.Stream<WatchEvent, PlatformError> = fs.watch(exercises.exercisesDir, { recursive: true }).pipe(
    Stream.filter((event) => event.path.endsWith(".ts")),
    Stream.debounce("150 millis"),
    Stream.map((): WatchEvent => ({ _tag: "FileChanged" }))
  )

  const keys: Stream.Stream<WatchEvent, never, Terminal.Terminal> = process.stdin.isTTY
    ? Stream.unwrap(
      Effect.gen(function*() {
        const terminal = yield* Terminal.Terminal
        const input = yield* terminal.readInput
        return Stream.fromQueue(input).pipe(
          Stream.map((input): WatchEvent => ({
            _tag: "Key",
            name: input.key.ctrl && input.key.name === "c" ? "q" : input.key.name
          }))
        )
      })
    )
    : Stream.empty

  const handle = (event: WatchEvent): Effect.Effect<void, Quit | PlatformError, Exercises> => {
    if (event._tag === "FileChanged") return Ref.set(showHint, false).pipe(Effect.andThen(render))
    switch (event.name) {
      case "q":
        return Effect.fail(new Quit())
      case "h":
        return Ref.update(showHint, (b) => !b).pipe(Effect.andThen(render))
      case "r":
        return render
      case "l":
        return clearScreen.pipe(
          Effect.andThen(printList),
          Effect.andThen(Console.log(dim("\nr: 演習に戻る  q: 終了")))
        )
      default:
        return Effect.void
    }
  }

  yield* render
  yield* Stream.merge(fileChanges, keys).pipe(
    Stream.runForEach(handle),
    Effect.catchTag("Quit", () => clearScreen.pipe(Effect.andThen(printList)))
  )
})
