import { Context, Effect, Layer } from "effect"
import type { VerifyResult } from "./Domain.ts"
import { Runner } from "./Runner.ts"
import { TypeChecker } from "./TypeChecker.ts"

/** 型チェック → 実行（テスト）の順に演習を検証するサービス */
export class Verifier extends Context.Service<Verifier, {
  readonly verify: (file: string, options?: { readonly color?: boolean }) => Effect.Effect<VerifyResult>
}>()("effectlings/Verifier") {
  static readonly layer = Layer.effect(
    Verifier,
    Effect.gen(function*() {
      const typeChecker = yield* TypeChecker
      const runner = yield* Runner

      const verify = Effect.fnUntraced(function*(file: string, options?: { readonly color?: boolean }) {
        const checked = yield* typeChecker.check(file, options)
        if (!checked.ok) return { ok: false, stage: "typecheck", output: checked.output } satisfies VerifyResult
        const ran = yield* runner.run(file)
        if (!ran.ok) return { ok: false, stage: "run", output: ran.output } satisfies VerifyResult
        return { ok: true, stage: "done", output: ran.output } satisfies VerifyResult
      })

      return Verifier.of({ verify })
    })
  ).pipe(
    Layer.provide(Layer.mergeAll(TypeChecker.layer, Runner.layer))
  )
}
