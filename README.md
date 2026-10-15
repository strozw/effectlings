# Effectlings

> [!NOTE]
> 個人的に Effect を学習するために、[Claude Code](https://claude.com/claude-code) に作らせたツールです。
> 演習の内容や説明に誤りが含まれている可能性があります。

[Rustlings](https://rustlings.rust-lang.org/) のように、小さな演習を 1 つずつ解きながら
[Effect-TS v4](https://effect.website/docs/v4/getting-started) の使い方を学ぶためのツールです。

各演習は「少しだけ壊れた TypeScript ファイル」です。型エラーや失敗するテストを直し、
ファイル先頭の `// I AM NOT DONE` を削除すると次の演習へ進みます。

## はじめかた

Node.js 24 以上と npm 11.19 以上が必要です（Node.js 24 に同梱の npm で動きます）。TypeScript ファイルは Node.js で直接実行します。

```sh
git clone https://github.com/strozw/effectlings.git
cd effectlings
npm install
npm start
```

`npm start` で watch モードが起動します。表示された演習ファイルをエディタで開いて編集し、
保存するたびに自動で型チェックとテストが実行されます。

| キー | 動作                  |
| ---- | --------------------- |
| `h`  | ヒントの表示 / 非表示 |
| `l`  | 演習の一覧と進捗      |
| `r`  | 再実行                |
| `q`  | 終了                  |

## npm の安全設定

サプライチェーン攻撃を避けるため、`.npmrc` と `package.json` で次のように設定しています。

- `min-release-age=7`: 公開から 7 日経っていないバージョンは新たにインストールしない
- `strict-allow-scripts=true`: 依存パッケージの install スクリプトは `package.json` の `allowScripts` で許可したものだけを実行し、未確認のものがあればインストールを失敗させる（現在の依存には install スクリプトを持つものはありません）
- `save-exact=true`: 依存を追加するときはバージョンを固定する
- `devEngines`: Node.js 24 以上・npm 11.19 以上でなければ `npm install` や `npm run` をエラーにする

### GitHub Actions の lockfile

ワークフローが使う Action は [GitHub Actions のワークフロー lockfile](https://docs.github.com/actions/concepts/security/workflow-dependency-lockfiles)（`.github/workflows/actions.lock`）でコミットを固定しています。
ワークフローの `uses` を追加・変更したときは、[gh-actions-lock](https://github.com/github/gh-actions-lock) で lockfile を更新してください。CI（`ci.yml` の `actions-lock` ジョブ）でも `gh actions-lock --verify` で検証しています。

```sh
gh extension install github/gh-actions-lock
gh actions-lock
```

## コマンド

```sh
npm start                          # watch モード
npm run list                       # 演習の一覧と進捗
npm run verify                     # すべての演習を順番に検証
npm run effectlings -- run gen1    # 1 つの演習だけ検証
npm run effectlings -- hint gen1   # ヒントを表示
npm run effectlings -- reset gen1  # 演習を初期状態に戻す（git checkout）
```

## エディタの設定（VSCode）

リポジトリを VSCode で開くと、次の拡張機能のインストールを勧められます（`.vscode/extensions.json`）。

| 拡張機能                                                                                                         | 役割                                                  |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [TypeScript (Native Preview)](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview) | TypeScript 7 の言語サーバーで補完・型エラー表示       |
| [Oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)                                        | oxlint によるリントと、oxfmt による保存時フォーマット |

`npm install` のときに [@effect/tsgo](https://github.com/Effect-TS/tsgo) が `node_modules/typescript` を
Effect Language Service 入りの TypeScript 7 に差し替えます（`prepare` スクリプト）。
`.vscode/settings.json` でこのワークスペースの TypeScript を使うように設定してあるので、エディタ上でも
「Effect に必要なサービスが足りない」「エラー型が合わない」といった Effect 固有の診断や補完、クイックフィックスが使えます。

TypeScript 7 の言語サーバーが有効になっていない場合は、コマンドパレットから
「TypeScript: Enable TypeScript 7」を実行してください。

コマンドラインでは次のように使えます。

```sh
npm run lint       # oxlint でリント
npm run fmt        # oxfmt でフォーマット
npm run fmt:check  # フォーマット済みかを確認
```

## 演習の判定

1. TypeScript 7 の型チェック（`tsconfig.json` の設定、`strict: true`、Effect Language Service の診断を含む）に通ること
2. ファイルを実行して、末尾のテスト（`node:assert`）が例外なく終わること
3. `// I AM NOT DONE` の行が削除されていること

1 と 2 を満たすと「成功」と表示されます。内容を確認してから 3 を行うと次へ進みます。
進捗はファイルにマーカーが残っているかどうかで判断するので、状態ファイルはありません。

## 演習一覧

| ディレクトリ          | 内容                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `00_intro`            | 使い方                                                                                      |
| `01_basics`           | `Effect.succeed` / `sync` / `fail`、`runSync`、`pipe` / `map` / `flatMap`                   |
| `02_gen`              | `Effect.gen` と `yield*`、gen の中での失敗                                                  |
| `03_errors`           | `Data.TaggedError`、`catchTag` / `catchTags`、`Effect.try` / `tryPromise`、`Effect.result`  |
| `04_services`         | `Context.Service`、`provideService`、`Layer`                                                |
| `05_data`             | `Option`、`Match`、`Equal` と `HashSet`                                                     |
| `06_resources`        | `Effect.acquireRelease` と `Effect.scoped`、リソースを持つ `Layer.effect`                   |
| `07_concurrency`      | `concurrency` オプション、`forkChild` / `Fiber.join` / `Fiber.interrupt`、`race`、`timeout` |
| `08_schedule`         | `Effect.retry` / `repeat`、`Schedule.exponential` / `spaced`、`TestClock`                   |
| `09_state`            | `Ref`、`Deferred`、`Queue`                                                                  |
| `10_schema`           | `Schema.Struct`、`FiniteFromString` と `check`、`decodeUnknownEffect`、`Schema.Class`       |
| `11_config_logging`   | `Config` / `ConfigProvider` / `Redacted`、`Effect.log` と `Logger`                          |
| `12_stream`           | `Stream` の基本、`runCollect` / `runFold`、`mapEffect` と `grouped`                         |
| `13_cause_exit`       | 型付きエラーと欠陥（`die` / `orDie` / `catchDefect`）、`Exit` と `Cause`                    |
| `14_effect_fn`        | `Effect.fn`、`annotateLogs` と `withLogSpan`                                                |
| `15_more_concurrency` | `Semaphore`、`PubSub`、`Cache`                                                              |
| `16_testing`          | テスト用の `Layer`、`Console` と `TestConsole`、`TestClock`                                 |

`solutions/` に模範解答があります。解き終わってから答え合わせに使ってください。

## ツールの実装

CLI 本体も Effect-TS v4 で書かれています。演習を解き終えたら、実際のアプリケーションでの使い方の例として読んでみてください。

| ファイル             | 内容                                                                                |
| -------------------- | ----------------------------------------------------------------------------------- |
| `src/cli.ts`         | `effect/cli` の `Command` によるサブコマンド定義と `NodeRuntime.runMain`            |
| `src/Exercises.ts`   | 演習一覧（`info.json` を `Schema` で検証）と進捗を扱うサービス                      |
| `src/TypeChecker.ts` | TypeScript 7 の `tsc`（Effect Language Service 入り）を実行する型チェックのサービス |
| `src/Runner.ts`      | `ChildProcessSpawner` で演習を実行し、タイムアウトを付けるサービス                  |
| `src/Verifier.ts`    | 型チェックと実行を組み合わせるサービス（`Layer` の合成）                            |
| `src/Watch.ts`       | `FileSystem.watch` とキー入力の `Stream` をまとめた watch モード                    |

## 演習を追加するには

1. `exercises/<章>/<名前>.ts` に演習を、`solutions/<章>/<名前>.ts` に模範解答を置く
2. `exercises/info.json` に名前・パス・ヒントを追加する（配列の順番が出題順）
3. `npm run check:solutions` で、模範解答が通ることと、演習の初期状態が失敗することを確認する

演習ファイルは先頭に `// I AM NOT DONE`、末尾に `// --- テスト（ここから下は編集しないでください） ---` 以降のテストを置く形にそろえています。
