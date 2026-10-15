import { pathToFileURL } from "node:url"
import { Context, Effect, FileSystem, Layer, Path, Schema, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/process"
import type { StepResult } from "./Domain.ts"
import { Exercises } from "./Exercises.ts"

export class TypeCheckerError extends Schema.TaggedError<TypeCheckerError>()("TypeCheckerError", {
  message: Schema.String,
  cause: Schema.Defect()
}) {}

/**
 * TypeScript 7 の `tsc` で演習ファイルを型チェックするサービス
 *
 * `npm install` 時に `effect-tsgo patch` が `tsc` を Effect Language Service 入りのものに差し替えるので、
 * 通常の型エラーに加えて Effect 固有の診断（足りないサービスやエラー型の指摘など）も表示される。
 */
export class TypeChecker extends Context.Service<
  TypeChecker,
  {
    readonly check: (file: string, options?: { readonly color?: boolean }) => Effect.Effect<StepResult>
  }
>()("effectlings/TypeChecker") {
  static readonly layer = Layer.effect(
    TypeChecker,
    Effect.gen(function* () {
      const { root } = yield* Exercises
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path
      const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

      // TypeScript 7 はネイティブバイナリなので、node を経由せずに直接起動する
      const typescriptDir = path.dirname(
        yield* path.fromFileUrl(new URL(import.meta.resolve("typescript/package.json"))).pipe(Effect.orDie)
      )
      const tsc = yield* Effect.tryPromise({
        try: async () => {
          const { default: getExePath } = await import(
            new URL("lib/getExePath.js", pathToFileURL(`${typescriptDir}/`)).href
          )
          return getExePath() as string
        },
        catch: (cause) =>
          new TypeCheckerError({ message: "TypeScript (tsc) が見つかりません。npm install を実行してください", cause })
      }).pipe(Effect.orDie)

      // 1 ファイルだけを対象にする tsconfig を .effectlings/ に生成し、プロジェクトの設定を継承させる
      const workDir = path.join(root, ".effectlings")
      yield* fs.makeDirectory(workDir, { recursive: true }).pipe(Effect.orDie)

      const check = Effect.fnUntraced(
        function* (file: string, options?: { readonly color?: boolean }) {
          const color = options?.color ?? Boolean(process.stdout.isTTY)
          const name = path.basename(file, ".ts")
          const config = path.join(workDir, `tsconfig.${name}.json`)
          yield* fs.writeFileString(
            config,
            JSON.stringify({ extends: "../tsconfig.json", files: [file], include: [] }, null, 2)
          )
          const handle = yield* spawner.spawn(
            ChildProcess.make(tsc, ["--noEmit", "--pretty", String(color), "-p", config], { cwd: root })
          )
          const [output, exitCode] = yield* Effect.all(
            [Stream.mkString(Stream.decodeText(handle.all)), handle.exitCode],
            { concurrency: 2 }
          )
          return { ok: exitCode === ChildProcessSpawner.ExitCode(0), output } satisfies StepResult
        },
        (effect) =>
          effect.pipe(
            Effect.scoped,
            Effect.catch((error) =>
              Effect.succeed<StepResult>({ ok: false, output: `型チェックを実行できませんでした: ${error.message}\n` })
            )
          )
      )

      return TypeChecker.of({ check })
    })
  )
}
