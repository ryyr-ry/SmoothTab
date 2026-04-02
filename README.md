# Smooth Tab

**Double-click any link to open it in a new tab.**

リンクをダブルクリックして新しいタブで開くことができるクロスブラウザ対応の拡張機能です。

この拡張機能は、em_te 氏によって作成されたオリジナルの「Tap to Tab」（Mozilla Public License 2.0）を、モダンな技術スタックで再実装したものです。

---

## 日本語 (Japanese)

### 概要

Smooth Tabは、ウェブページ上のリンクをダブルクリックするだけで新しいタブで開くことができるシンプルな拡張機能です。ノートPCのタッチパッドをお使いの方や、マウスのみでスムーズに操作したい方に最適です。

Chrome と Firefox の両方に対応しています。

### 機能

- **ダブルクリックで新タブ**: リンクをダブルクリックするだけで新しいタブで開きます。
- **視覚フィードバック**: ダブルクリック成功時にアニメーションで確認できます。
- **カスタマイズ可能**: 設定ページから動作を調整できます。
  - 新しいタブをフォアグラウンド/バックグラウンドで開く
  - 新しいタブを現在のタブの隣/タブの最後に配置
  - ダブルクリック認識の間隔を調整
- **ブラックリスト**: 特定のウェブサイトで機能を無効にできます。
- **YouTube対応**: YouTube固有のイベント処理に対応済み。
- **16言語対応**: 日本語、英語を含む16言語のUIをサポート。

### 技術スタック

| 技術 | 用途 |
|---|---|
| [WXT](https://wxt.dev/) | クロスブラウザ拡張機能フレームワーク |
| TypeScript | 型安全な実装 |
| Vite | ビルドツール（WXT内蔵） |

### プロジェクト構成

```
src/
├── entrypoints/           # WXT エントリポイント
│   ├── background.ts      # バックグラウンドサービスワーカー
│   ├── content.ts         # コンテンツスクリプト
│   ├── content/style.css  # アニメーション CSS
│   ├── options/           # 設定ページ
│   └── welcome/           # ウェルカムページ
├── modules/               # 機能モジュール
│   ├── blacklist/         # ドメインブラックリスト
│   ├── content/           # クリック検出・アニメーション
│   ├── keep-alive/        # サービスワーカー維持
│   ├── messaging/         # 型付きメッセージ通信
│   ├── options/           # オプション型定義・ストレージ
│   ├── site-adapters/     # サイト固有アダプタ（YouTube等）
│   └── tab/               # タブ操作
├── styles/                # 共有テーマ CSS
└── utils/                 # ネイティブ関数キャッシュ
```

### 設計方針

- **Site Adapter パターン**: YouTube等のサイト固有ロジックをコア機能から分離。新しいサイト対応はアダプタ追加のみで可能。
- **単一責務**: 各モジュールが1つの責務のみを担当。
- **型安全メッセージング**: 判別共用体によるメッセージプロトコル。
- **クロスブラウザ互換**: Chrome (MV3) と Firefox (MV2) の差異を吸収。

### 開発方法

```bash
# 依存関係のインストール
bun install

# Chrome 開発サーバー（ホットリロード付き）
bun run dev

# Firefox 開発サーバー
bun run dev:firefox

# Chrome 向けビルド
bun run build

# Firefox 向けビルド
bun run build:firefox

# 型チェック
bun run compile

# Chrome 配布用 zip
bun run zip

# Firefox 配布用 zip
bun run zip:firefox
```

### インストール方法

Chromeウェブストアよりインストールしてください。
> **[Chromeウェブストアのリンクをここに追加予定]**

Chrome、Firefox、Microsoft Edge などのブラウザに対応しています。

### 使い方

1. 拡張機能をインストールします。
2. 任意のウェブページで開きたいリンクをダブルクリックします。
3. 新しいタブでリンクが開きます。
4. ツールバーの **Smooth Tab アイコン** をクリックすると設定ページが開きます。

### バグ報告・機能リクエスト

バグの報告や機能に関するご要望は、このリポジトリの **Issues** タブからお気軽にご投稿ください。

[**>> Issues ページはこちら <<**](https://github.com/ryyr-ry/SmoothTab/issues)

報告の際は、以下の情報を含めてください。
- お使いのブラウザとバージョン（例: Chrome 131, Firefox 133）
- 問題が発生したウェブページのURL
- 問題を再現する手順
- 期待される動作と実際の動作

### プライバシーポリシー

Smooth Tabは閲覧履歴やサイト内容などの個人情報を一切収集・保存・送信しません。すべての設定はローカルに保存されます。

詳細: [プライバシーポリシー](https://sites.google.com/view/smooth-tab/privacy)

### 権限について

「ウェブサイト上のすべてのデータの読み取りと変更」権限は、以下の目的でのみ使用されます。

- **読み取り**: ページ上のリンクを検出し、ダブルクリックを監視するため
- **変更**: クリック検出スクリプトをページに注入するため

閲覧データが外部サーバーに送信されることは一切ありません。

---

## English

### Overview

Smooth Tab is a cross-browser extension that lets you open any link in a new tab with just a double-click. No right-clicking or keyboard shortcuts needed — perfect for laptop touchpad users or anyone who wants smoother, mouse-only navigation.

Works on both **Chrome** and **Firefox**.

### Features

- **Double-click to New Tab**: Simply double-click any link to open it in a new tab.
- **Visual Feedback**: A clear animation confirms your successful double-click.
- **Customizable**: Fine-tune the extension's behavior from the settings page.
  - Choose foreground or background tab opening
  - Set tab position (next to current or at end)
  - Adjust double-click timing threshold
- **Blacklist**: Disable Smooth Tab on specific websites.
- **YouTube Compatible**: Handles YouTube's custom event system properly.
- **16 Languages**: UI support for 16 languages including English and Japanese.

### Tech Stack

| Technology | Purpose |
|---|---|
| [WXT](https://wxt.dev/) | Cross-browser extension framework |
| TypeScript | Type-safe implementation |
| Vite | Build tool (built into WXT) |

### Development

```bash
# Install dependencies
bun install

# Chrome dev server (with hot reload)
bun run dev

# Firefox dev server
bun run dev:firefox

# Build for Chrome
bun run build

# Build for Firefox
bun run build:firefox

# Type check
bun run compile

# Package for Chrome distribution
bun run zip

# Package for Firefox distribution
bun run zip:firefox
```

### Installation

Install from the Chrome Web Store:
> **[Chrome Web Store link coming soon]**

Compatible with Chrome, Firefox, Microsoft Edge, and other Chromium-based browsers.

### How to Use

1. Install the extension.
2. Double-click any link on a webpage.
3. The link opens in a new tab.
4. Click the **Smooth Tab icon** in your toolbar to access settings.

### Bug Reports & Feature Requests

Please submit bug reports or feature requests via the **Issues** tab.

[**>> Go to Issues Page <<**](https://github.com/ryyr-ry/SmoothTab/issues)

Please include:
- Browser and version (e.g., Chrome 131, Firefox 133)
- URL where the issue occurred
- Steps to reproduce
- Expected vs. actual behavior

### Privacy

Smooth Tab does **not** collect, store, or transmit any personal information. All settings are stored locally on your device.

Details: [Privacy Policy](https://sites.google.com/view/smooth-tab/privacy)

### Permissions

The "Read and change all your data on all websites" permission is used exclusively to:

- **Read**: Detect links on pages and listen for double-clicks
- **Change**: Inject the click-detection script into pages

Your browsing data is never sent to any external server.

---

### License

This project is licensed under the **Mozilla Public License 2.0**, as it is a derivative work of the original "Tap to Tab" by em_te (also licensed under MPL 2.0).

本プロジェクトは、派生元の「Tap to Tab」のライセンスに基づき、Mozilla Public License 2.0 の下で公開されています。
