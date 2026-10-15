// Effectlings へようこそ！
//
// Effectlings は Rustlings のように、小さな演習を 1 つずつ解きながら
// Effect-TS v4 の使い方を学ぶためのツールです。
//
// 進め方:
//   1. `npm start` で watch モードを起動します（今この画面です）
//   2. 表示された演習ファイルをエディタで開き、型エラーやテストの失敗を直します
//   3. 型チェックとテストが通ったら、ファイル先頭の `// I AM NOT DONE` の行を削除します
//   4. 保存すると自動的に次の演習へ進みます
//
// 行き詰まったら watch モードで `h` を押すとヒントが表示されます。
//
// この演習はすでに正しく動きます。下のコードを眺めたら、
// 1 行目の `// I AM NOT DONE` を削除して保存してください。

import { Effect } from "effect"

// Effect<A, E, R> は「実行すると A を返すか E で失敗し、R を必要とする処理」の“説明書き”です。
// 作っただけでは何も起こらず、Effect.runSync などで実行して初めて動きます。
const hello = Effect.succeed("Hello, Effect!")

console.log(Effect.runSync(hello))
