import { Context, Effect, FileSystem, Layer, Option, Path, Schema } from "effect"
import type { PlatformError } from "effect/PlatformError"
import { type Exercise, ExerciseInfo, ExerciseNotFound, MARKER } from "./Domain.ts"

/** 演習の一覧と、ファイルの場所・進捗を扱うサービス */
export class Exercises extends Context.Service<
  Exercises,
  {
    readonly root: string
    readonly exercisesDir: string
    readonly all: ReadonlyArray<Exercise>
    readonly exercisePath: (exercise: Exercise) => string
    readonly solutionPath: (exercise: Exercise) => string
    /** リポジトリのルートからの相対パス（表示用） */
    readonly displayPath: (exercise: Exercise) => string
    readonly find: (name: string) => Effect.Effect<Exercise, ExerciseNotFound>
    /** ファイルに `// I AM NOT DONE` が残っているか */
    readonly isPending: (exercise: Exercise) => Effect.Effect<boolean, PlatformError>
    /** 最初の未完了の演習 */
    readonly firstPending: Effect.Effect<Option.Option<Exercise>, PlatformError>
    readonly countDone: Effect.Effect<number, PlatformError>
  }
>()("effectlings/Exercises") {
  static readonly layer = Layer.effect(
    Exercises,
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      const root = path.resolve(yield* path.fromFileUrl(new URL("..", import.meta.url)))
      const exercisesDir = path.join(root, "exercises")
      const solutionsDir = path.join(root, "solutions")

      // info.json は Schema で検証してから使う
      const info = yield* fs
        .readFileString(path.join(exercisesDir, "info.json"))
        .pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(ExerciseInfo))), Effect.orDie)
      const all = info.exercises

      const exercisePath = (exercise: Exercise) => path.join(exercisesDir, exercise.path)

      const find = (name: string) => {
        const found = all.find((e) => e.name === name || e.path === name || e.path.replace(/\.ts$/, "") === name)
        return found ? Effect.succeed(found) : Effect.fail(new ExerciseNotFound({ query: name }))
      }

      const isPending = Effect.fnUntraced(function* (exercise: Exercise) {
        const file = exercisePath(exercise)
        if (!(yield* fs.exists(file))) return true
        const content = yield* fs.readFileString(file)
        return content.split(/\r?\n/).some((line) => line.trim() === MARKER)
      })

      const firstPending = Effect.findFirst(all, isPending)

      const countDone = Effect.filter(all, (e) => Effect.map(isPending(e), (p) => !p)).pipe(
        Effect.map((done) => done.length)
      )

      return Exercises.of({
        root,
        exercisesDir,
        all,
        exercisePath,
        solutionPath: (exercise) => path.join(solutionsDir, exercise.path),
        displayPath: (exercise) => path.relative(root, exercisePath(exercise)),
        find,
        isPending,
        firstPending,
        countDone
      })
    })
  )
}
