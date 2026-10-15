import { Context, Duration, Effect, Layer, Option, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/process"
import type { StepResult } from "./Domain.ts"
import { Exercises } from "./Exercises.ts"

const TIMEOUT = Duration.seconds(15)

/** 演習ファイルを tsx で実行し、テスト（node:assert）が通るかを確かめるサービス */
export class Runner extends Context.Service<
  Runner,
  {
    readonly run: (file: string) => Effect.Effect<StepResult>
  }
>()("effectlings/Runner") {
  static readonly layer = Layer.effect(
    Runner,
    Effect.gen(function* () {
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
      const { root } = yield* Exercises
      const tsx = import.meta.resolve("tsx")

      const run = Effect.fnUntraced(
        function* (file: string) {
          const handle = yield* spawner.spawn(
            ChildProcess.make(process.execPath, ["--import", tsx, file], {
              cwd: root,
              env: { FORCE_COLOR: process.stdout.isTTY ? "1" : "0" },
              extendEnv: true
            })
          )
          // 出力（stdout + stderr）の収集と終了待ちを並行して行う
          const [output, exitCode] = yield* Effect.all(
            [Stream.mkString(Stream.decodeText(handle.all)), handle.exitCode],
            { concurrency: 2 }
          )
          return { ok: exitCode === ChildProcessSpawner.ExitCode(0), output } satisfies StepResult
        },
        (effect, file) =>
          effect.pipe(
            // 時間内に終わらなければ、スコープが閉じるときにプロセスも終了する
            Effect.timeoutOption(TIMEOUT),
            Effect.map(
              Option.getOrElse((): StepResult => ({
                ok: false,
                output: `${Duration.toSeconds(TIMEOUT)} 秒以内に終了しませんでした（無限ループや終わらない Effect がないか確認してください）: ${file}\n`
              }))
            ),
            Effect.scoped,
            Effect.catch((error) =>
              Effect.succeed<StepResult>({ ok: false, output: `実行に失敗しました: ${error.message}\n` })
            )
          )
      )

      return Runner.of({ run })
    })
  )
}
