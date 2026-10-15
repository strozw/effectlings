import { Console, Effect } from "effect"
import { type Exercise, MARKER, type VerifyResult } from "./Domain.ts"
import { Exercises } from "./Exercises.ts"

const enabled = Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"]
const wrap = (code: number, reset: number) => (s: string) => (enabled ? `\x1b[${code}m${s}\x1b[${reset}m` : s)

export const bold = wrap(1, 22)
export const dim = wrap(2, 22)
export const red = wrap(31, 39)
export const green = wrap(32, 39)
export const yellow = wrap(33, 39)
export const cyan = wrap(36, 39)

export const clearScreen = Effect.sync(() => {
  if (process.stdout.isTTY) process.stdout.write("\x1b[2J\x1b[3J\x1b[H")
})

export const progressBar = (done: number, total: number, width = 40): string => {
  const filled = total === 0 ? width : Math.round((done / total) * width)
  return `[${green("#".repeat(filled))}${dim("-".repeat(width - filled))}] ${done}/${total}`
}

export const printProgress = Effect.gen(function*() {
  const exercises = yield* Exercises
  yield* Console.log(progressBar(yield* exercises.countDone, exercises.all.length))
})

/** 検証結果を表示する */
export const printResult = Effect.fnUntraced(function*(exercise: Exercise, result: VerifyResult) {
  const exercises = yield* Exercises
  const file = exercises.displayPath(exercise)
  if (result.output.trim().length > 0) {
    yield* Console.log(result.output.trimEnd())
    yield* Console.log()
  }
  if (!result.ok) {
    const what = result.stage === "typecheck" ? "型チェックに失敗しました" : "テストに失敗しました"
    return yield* Console.log(red(`✗ ${file}: ${what}`))
  }
  yield* Console.log(green(`✓ ${file}: 型チェックとテストに成功しました！`))
  if (yield* exercises.isPending(exercise)) {
    yield* Console.log()
    yield* Console.log(`内容を確認できたら、ファイルから ${yellow(MARKER)} の行を削除して次へ進みましょう。`)
  }
})

/** 演習の一覧と進捗を表示する */
export const printList = Effect.gen(function*() {
  const exercises = yield* Exercises
  const current = yield* exercises.firstPending
  yield* Console.log(bold("  状態    名前          パス"))
  for (const e of exercises.all) {
    const pending = yield* exercises.isPending(e)
    const isCurrent = current._tag === "Some" && current.value === e
    const status = !pending ? green("完了  ") : isCurrent ? yellow("▶ 次  ") : dim("未完了")
    yield* Console.log(`  ${status}  ${e.name.padEnd(12)}  ${dim(exercises.displayPath(e))}`)
  }
  yield* Console.log()
  yield* printProgress
})
