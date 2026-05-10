# Biostimulant-sim Handoff

最終更新: 2026-05-11 JST

## 概要

- プロジェクト名: Biostimulant-sim
- 種別: Vite + React + Three.js のブラウザ向けシミュレーションアプリ
- 旧仮タイトル: BioFarm / BioFarm Agri Survive
- 現在のブラウザタイトル: `Biostimulant-sim`
- ローカル作業場所: `C:\Users\tmo12\Desktop\BioFarm`
- GitHub: https://github.com/TOMOKIKAWADA-ai/AGRI_simu.git
- 公開URL: https://agri-simu.vercel.app/
- ブランチ: `main`

## 現在の状態

- GitHubへの初回pushは完了済み。
- Vercelへのデプロイも完了済み。
- `BioFarm` という仮タイトルは、`Biostimulant-sim` に変更済み。
- 直近の確認時点では `main...origin/main` で同期済み。
- 直近コミット:
  - `6f3796b Rename app to Biostimulant-sim`
  - `2df7122 Initial commit`

## 主要コマンド

```powershell
npm install
npm run dev
npm run build
npm run preview
npm run self-check
```

- 開発サーバー: `npm run dev`
- 本番ビルド: `npm run build`
- ビルド結果の確認: `npm run preview`
- ロジック自己チェック: `npm run self-check`

## Vercel設定

VercelではGitHubリポジトリを接続している。設定は以下。

```txt
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

`main` ブランチへpushすると、Vercelが自動で再デプロイする。

## 主要ファイル

- `index.html`
  - ブラウザタブのタイトルを管理。
  - 現在の `<title>` は `Biostimulant-sim`。
- `package.json`
  - npm scripts と依存関係。
  - package name は `biostimulant-sim`。
- `src/App.jsx`
  - Reactアプリ本体。
  - 画面構成、ステージ選択、処理適用、結果表示などのUIを持つ。
- `src/gameLogic.js`
  - シミュレーションの中核ロジック。
  - ステージ、プロット、処理アイテム、ターン進行、自己チェックを持つ。
- `src/AgriThreeView.jsx`
  - Three.js による3D表示。
- `src/uiAssets.js`
  - PNG/GLBなどのアセット紐付け。
- `src/styles.css`
  - 全体のスタイル。
- `scripts/self-check.mjs`
  - `src/gameLogic.js` の自己チェックをCLIから実行するスクリプト。
- `src/assets/`
  - 3Dモデル、背景画像、アイテム画像。

## 注意点

- `npm run build` 時に `Some chunks are larger than 500 kB` の警告が出ることがある。
  - Three.js、GLB、PNGアセットを含むためで、現状はデプロイ失敗ではない。
- PowerShell実行時に `profile.ps1` の Execution Policy 警告が表示されることがある。
  - コマンド自体は実行できているため、現状の作業ブロッカーではない。
- `dist/`、`node_modules/`、Viteのログファイルは `.gitignore` 済み。

## 次に作業する人向け

1. まず `git status --short --branch` で差分を確認する。
2. ロジック変更をした場合は `npm run self-check` を実行する。
3. UIやアセット変更をした場合は `npm run build` を実行する。
4. 公開反映が必要なら、変更をcommitして `main` へpushする。
5. Vercelのデプロイ完了後、https://agri-simu.vercel.app/ を確認する。

## 引き継ぎ時の短い説明文

このリポジトリは `Biostimulant-sim` というVite + React + Three.js製の農業/バイオスティミュラント系シミュレーションアプリです。GitHubは `TOMOKIKAWADA-ai/AGRI_simu`、Vercel公開URLは `https://agri-simu.vercel.app/` です。旧仮タイトル `BioFarm` は `Biostimulant-sim` に変更済みで、Vercelは `main` ブランチへのpushで自動デプロイされます。開発時は `npm run dev`、検証は `npm run self-check` と `npm run build` を使います。
