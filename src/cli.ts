import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, Layer, Option } from "effect"
import { Argument, Command } from "effect/cli"
import { ChildProcess, ChildProcessSpawner } from "effect/process"
import { VerificationFailed } from "./Domain.ts"
import { Exercises } from "./Exercises.ts"
import { bold, green, printList, printProgress, printResult, red } from "./Ui.ts"
import { Verifier } from "./Verifier.ts"
import { watch } from "./Watch.ts"

const name = Argument.String("name").pipe(Argument.withDescription("演習の名前（例: gen1）"))

const watchCommand = Command.make("watch", {}, () => watch).pipe(
  Command.withDescription("ファイルの変更を監視しながら演習を順番に進める")
)

const listCommand = Command.make("list", {}, () => printList).pipe(
  Command.withDescription("演習の一覧と進捗を表示する")
)

const verifyCommand = Command.make("verify", {}, () =>
  Effect.gen(function*() {
    const exercises = yield* Exercises
    const verifier = yield* Verifier
    for (const exercise of exercises.all) {
      const result = yield* verifier.verify(exercises.exercisePath(exercise))
      if (!result.ok || (yield* exercises.isPending(exercise))) {
        yield* printResult(exercise, result)
        yield* Console.log()
        yield* printProgress
        return yield* new VerificationFailed()
      }
      yield* Console.log(green(`✓ ${exercises.displayPath(exercise)}`))
    }
    yield* Console.log()
    yield* Console.log(green(bold("🎉 すべての演習が完了しました！")))
  })).pipe(Command.withDescription("すべての演習を順番に検証し、最初に失敗したところで止まる"))

const runCommand = Command.make("run", { name }, ({ name }) =>
  Effect.gen(function*() {
    const exercises = yield* Exercises
    const exercise = yield* exercises.find(name)
    const result = yield* (yield* Verifier).verify(exercises.exercisePath(exercise))
    yield* printResult(exercise, result)
    if (!result.ok) return yield* new VerificationFailed()
  })).pipe(Command.withDescription("指定した演習を 1 つだけ検証する"))

const hintCommand = Command.make("hint", { name: Argument.optional(name) }, ({ name }) =>
  Effect.gen(function*() {
    const exercises = yield* Exercises
    const exercise = Option.isSome(name)
      ? Option.some(yield* exercises.find(name.value))
      : yield* exercises.firstPending
    if (Option.isNone(exercise)) return yield* Console.log(green("未完了の演習はありません"))
    yield* Console.log(`${bold(`ヒント (${exercise.value.name})`)}\n${exercise.value.hint}`)
  })).pipe(Command.withDescription("ヒントを表示する（省略すると現在の演習）"))

const resetCommand = Command.make("reset", { name }, ({ name }) =>
  Effect.gen(function*() {
    const exercises = yield* Exercises
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const exercise = yield* exercises.find(name)
    const file = exercises.displayPath(exercise)
    const exitCode = yield* spawner.exitCode(
      ChildProcess.make("git", ["checkout", "--", file], { cwd: exercises.root })
    ).pipe(Effect.orElseSucceed(() => ChildProcessSpawner.ExitCode(1)))
    if (exitCode !== ChildProcessSpawner.ExitCode(0)) {
      yield* Console.error(red("git checkout に失敗しました。git リポジトリとして clone しているか確認してください"))
      return yield* new VerificationFailed()
    }
    yield* Console.log(green(`${file} を初期状態に戻しました`))
  })).pipe(Command.withDescription("演習ファイルを初期状態に戻す（git が必要）"))

// サブコマンドなしで起動したときは watch モードにする
const effectlings = Command.make("effectlings", {}, () => watch).pipe(
  Command.withDescription("小さな演習で Effect-TS v4 を学ぶ"),
  Command.withSubcommands([watchCommand, listCommand, verifyCommand, runCommand, hintCommand, resetCommand])
)

const MainLayer = Layer.mergeAll(Exercises.layer, Verifier.layer.pipe(Layer.provide(Exercises.layer))).pipe(
  Layer.provideMerge(NodeServices.layer)
)

effectlings.pipe(
  Command.run({ version: "0.1.0" }),
  Effect.catchTags({
    // 表示はすでに済んでいるので、終了コードだけを設定する
    VerificationFailed: () => Effect.sync(() => void (process.exitCode = 1)),
    ExerciseNotFound: (e) =>
      Console.error(red(`演習 "${e.name}" が見つかりません（npm run list で一覧を確認できます）`)).pipe(
        Effect.andThen(Effect.sync(() => void (process.exitCode = 1)))
      )
  }),
  Effect.provide(MainLayer),
  NodeRuntime.runMain
)
