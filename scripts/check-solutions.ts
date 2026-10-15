// メンテナ向け: 演習と模範解答の整合性を検証する
//   - solutions/ の解答は型チェックとテストをすべて通過すること
//   - exercises/ の初期状態は（intro を除き）型チェックかテストに失敗すること
//   - exercises/ の初期状態には `// I AM NOT DONE` が含まれていること
import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, FileSystem, Layer } from "effect"
import { MARKER } from "../src/Domain.ts"
import { Exercises } from "../src/Exercises.ts"
import { Verifier } from "../src/Verifier.ts"

const program = Effect.gen(function* () {
  const exercises = yield* Exercises
  const verifier = yield* Verifier
  const fs = yield* FileSystem.FileSystem
  const problems: Array<string> = []

  for (const exercise of exercises.all) {
    const file = exercises.exercisePath(exercise)
    const solution = exercises.solutionPath(exercise)
    if (!(yield* fs.exists(file))) {
      problems.push(`${exercise.name}: 演習ファイルがありません (${file})`)
      continue
    }
    if (!(yield* fs.exists(solution))) {
      problems.push(`${exercise.name}: 模範解答がありません (${solution})`)
      continue
    }
    if (!(yield* exercises.isPending(exercise))) {
      problems.push(`${exercise.name}: 演習ファイルに ${MARKER} がありません`)
    }

    const solved = yield* verifier.verify(solution, { color: false })
    if (!solved.ok) {
      problems.push(`${exercise.name}: 模範解答が ${solved.stage} で失敗しました\n${solved.output}`)
    }

    const initial = yield* verifier.verify(file, { color: false })
    if (initial.ok && !exercise.initiallyPasses) {
      problems.push(`${exercise.name}: 初期状態のままテストまで通過してしまいます`)
    }
    if (!initial.ok && exercise.initiallyPasses) {
      problems.push(`${exercise.name}: initiallyPasses なのに初期状態で失敗します\n${initial.output}`)
    }

    const status = solved.ok ? "ok" : "NG"
    yield* Console.log(
      `${status.padEnd(3)} ${exercise.name.padEnd(12)} (初期状態: ${initial.ok ? "通過" : `${initial.stage} で失敗`})`
    )
  }

  if (problems.length > 0) {
    yield* Console.error(`\n${problems.length} 件の問題があります:\n`)
    for (const p of problems) yield* Console.error(`- ${p}\n`)
    return yield* Effect.sync(() => void (process.exitCode = 1))
  }
  yield* Console.log("\nすべての演習と模範解答が整合しています")
})

const MainLayer = Layer.mergeAll(Exercises.layer, Verifier.layer.pipe(Layer.provide(Exercises.layer))).pipe(
  Layer.provideMerge(NodeServices.layer)
)

program.pipe(Effect.provide(MainLayer), NodeRuntime.runMain)
