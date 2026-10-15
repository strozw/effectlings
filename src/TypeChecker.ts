import { Context, Effect, Layer } from "effect"
import ts from "typescript"
import type { StepResult } from "./Domain.ts"
import { Exercises } from "./Exercises.ts"

/** TypeScript コンパイラ API で演習ファイルを型チェックするサービス */
export class TypeChecker extends Context.Service<TypeChecker, {
  readonly check: (file: string, options?: { readonly color?: boolean }) => Effect.Effect<StepResult>
}>()("effectlings/TypeChecker") {
  static readonly layer = Layer.effect(
    TypeChecker,
    Effect.gen(function*() {
      const { root } = yield* Exercises

      const parsed = yield* Effect.try({
        try: () =>
          ts.getParsedCommandLineOfConfigFile(`${root}/tsconfig.json`, {}, {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic: (d) => {
              throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"))
            }
          }),
        catch: (cause) => new Error("tsconfig.json を読み込めませんでした", { cause })
      }).pipe(Effect.orDie)
      if (!parsed) return yield* Effect.die(new Error("tsconfig.json を読み込めませんでした"))
      const options = parsed.options

      // node_modules（effect の型定義や lib.d.ts）の構文木を使い回し、2 回目以降の型チェックを速くする
      const host = ts.createCompilerHost(options)
      const cache = new Map<string, ts.SourceFile>()
      const getSourceFile = host.getSourceFile.bind(host)
      host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
        const cacheable = fileName.includes("/node_modules/")
        const cached = cacheable ? cache.get(fileName) : undefined
        if (cached) return cached
        const sourceFile = getSourceFile(fileName, languageVersion, onError, shouldCreate)
        if (sourceFile && cacheable) cache.set(fileName, sourceFile)
        return sourceFile
      }
      let previous: ts.Program | undefined

      const formatHost: ts.FormatDiagnosticsHost = {
        getCanonicalFileName: (f) => f,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n"
      }

      const check = (file: string, { color = Boolean(process.stdout.isTTY) } = {}) =>
        Effect.sync((): StepResult => {
          const program = ts.createProgram({
            rootNames: [file],
            options,
            host,
            ...(previous ? { oldProgram: previous } : {})
          })
          previous = program
          const source = program.getSourceFile(file)
          const diagnostics = [
            ...program.getSyntacticDiagnostics(source),
            ...program.getSemanticDiagnostics(source)
          ]
          if (diagnostics.length === 0) return { ok: true, output: "" }
          return {
            ok: false,
            output: color
              ? ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
              : ts.formatDiagnostics(diagnostics, formatHost)
          }
        })

      return TypeChecker.of({ check })
    })
  )
}
