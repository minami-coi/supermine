# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 操作方法

- 左クリック／タップでマスを開きます。
- 右クリックで旗を設置・解除します（盤面上のブラウザメニューは表示されません）。
- 開封済みの数字マスをクリック／タップすると、数字と周囲の旗数が一致した場合に周囲を一括開封します。PCでは中央クリックでも一括開封できます。
- スマートフォンでは「旗モード」を有効にしてタップすると旗を操作できます。
\n演出としてスコア・コンボ、連鎖表示、Canvas粒子によるクリア／ゲームオーバー効果を追加しています。OSの動きの軽減設定に従い、画面の「動きを軽減」からも切り替えられます。スコアは安全マス1つにつき10点（コンボ倍率適用）、クリア500点、終了時に正しい旗1つにつき100点です。\n