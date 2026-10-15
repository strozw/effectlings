import { Schema } from "effect"

/** このコメントが残っている間は「未完了」として扱う */
export const MARKER = "// I AM NOT DONE"

export const Exercise = Schema.Struct({
  /** 一意な名前（例: "gen1"） */
  name: Schema.NonEmptyString,
  /** exercises/ からの相対パス（例: "02_gen/gen1.ts"） */
  path: Schema.NonEmptyString,
  /** 行き詰まったときのヒント */
  hint: Schema.String,
  /** 初期状態のままでも型チェックとテストが通る演習（intro 用） */
  initiallyPasses: Schema.optionalKey(Schema.Boolean)
})
export type Exercise = typeof Exercise.Type

/** exercises/info.json の形 */
export const ExerciseInfo = Schema.Struct({
  exercises: Schema.Array(Exercise)
})

/** 型チェック・実行の各段階の結果 */
export interface StepResult {
  readonly ok: boolean
  readonly output: string
}

/** 演習 1 つを検証した結果 */
export interface VerifyResult {
  readonly ok: boolean
  readonly stage: "typecheck" | "run" | "done"
  readonly output: string
}

export class ExerciseNotFound extends Schema.TaggedError<ExerciseNotFound>()("ExerciseNotFound", {
  query: Schema.String
}) {}

/** 検証に失敗したことを表す（メッセージは表示済みなので、終了コードだけに使う） */
export class VerificationFailed extends Schema.TaggedError<VerificationFailed>()("VerificationFailed", {}) {}
