# Smooth Tab

**Double-click any link to open it in a new tab.**

リンクをダブルクリックして新しいタブで開くことができるシンプルなChrome拡張機能です。

この拡張機能は、em_te 氏によって作成され、2021年を最後に更新が停止しているオリジナルの「Tap to Tab」（Mozilla Public License 2.0）を、現代のManifest V3に対応させるために再実装したものです。

This extension is a modernized, Manifest V3 compatible re-implementation of the original "Tap to Tab" by em_te, which was last updated in 2021 and is licensed under the Mozilla Public License 2.0.

---

## 日本語 (Japanese)

### 概要

Smooth Tabは、ウェブページ上のリンクをダブルクリックするだけで新しいタブで開くことができるシンプルな拡張機能です。ノートPCのタッチパッドをお使いの方や、マウスのみでスムーズに操作したい方に最適です。

### 機能

-   **ダブルクリック**: リンクをダブルクリックするだけで新しいタブで開きます。
-   **オプション**: 設定ページから動作を調整できます。
    -   新しいタブをフォアグラウンドで開くかバックグラウンドで開くかを選択。
    -   新しいタブを現在のタブの隣で開くか、タブの最後で開くかを選択。
    -   ダブルクリックとして認識されるクリックの間隔の調整。
-   **ブラックリスト**: 任意のウェブサイトでSmooth Tabの機能を無効にできます。

### インストール方法

Chromeウェブストアよりインストールしてください。
> **[Chromeウェブストアのあなたの拡張機能ページのURLをここに貼り付けます]**

Smooth Tabは、Google ChromeやMicrosoft EdgeなどのChromiumベースのブラウザに対応しています。

### 使い方

1.  拡張機能をChromeウェブストアよりインストールします。
2.  任意のウェブページで開きたいリンクをダブルクリックします。
3.  新しいタブでリンクが開きます。
4.  ツールバーにある**Smooth Tabのアイコンをクリック**すると、設定ページが開きます。

### バグ報告・機能のご要望

バグの報告や機能に関するご要望は、このリポジトリの**Issues**タブからお気軽にご投稿ください。

<a href="https://github.com/ryyr-ry/Quick-Tab/issues" target="_blank"><strong>&gt;&gt; Issuesページはこちら &lt;&lt;</strong></a>

報告の際は、以下の情報を含めていただくと問題の解決がスムーズになります。
-   お使いのブラウザとそのバージョン (例: Chrome 125.0.0.0)
-   問題が発生したウェブページのURL
-   問題が発生するまでの具体的な操作
-   本来行われるべき動作と、実際に起きた動作

### プライバシーポリシー

Smooth Tabはユーザーのプライバシーを尊重しています。Smooth Tabは、あなたの閲覧履歴やサイトの内容などの個人情報を一切収集、保存、送信しません。

詳細については、以下のプライバシーポリシーのページをご確認ください。
> <a href="https://sites.google.com/view/smooth-tab/privacy" target="_blank">https://sites.google.com/view/smooth-tab/privacy</a>

### 権限について

Smooth Tabは、すべてのウェブサイト上でダブルクリック機能を有効にするため、また、拡張機能の更新時にシームレスにアップデートを適用するために、「ウェブサイト上のすべてのデータの読み取りと変更」の権限を要求します。閲覧履歴などの一切のデータが外部に送信されることは一切ありません。

---

## English

### Overview

Smooth Tab is a simple browser extension that allows you to open any link on a webpage in a new tab with just a double-click. It eliminates the need for right-clicking or using keyboard shortcuts, making your browsing experience faster and more intuitive. It's especially perfect for laptop touchpad users or anyone who wants a smoother, mouse-only navigation experience.

### Features

-   **Intuitive Operation**: Simply double-click any link to open it in a new tab instantly.
-   **Detailed Customization**: Access the settings page to fine-tune the extension's behavior to your liking.
    -   **Tab Focus**: Choose whether new tabs open in the foreground (active) or the background.
    -   **Tab Position**: Decide if new tabs appear next to the current tab or at the very end of the tab strip.
    -   **Click Timing**: Adjust the delay (in milliseconds) for double-click recognition.
-   **Blacklist Functionality**: Take full control by disabling Smooth Tab on specific websites where you don't need it.
-   **Visual Feedback**: A clear and unobtrusive animation provides confirmation of a successful double-click.

### Installation

Install from the Chrome Web Store:
> **[Paste Your Chrome Web Store Link Here]**

Smooth Tab is compatible with Google Chrome, Microsoft Edge, and other Chromium-based browsers.

### How to Use

1.  Install the extension from the Chrome Web Store.
2.  On any webpage, double-click a link you want to open.
3.  The link will open in a new tab.
4.  To access the settings, simply **click the Smooth Tab icon** in your browser's toolbar.

### Bug Reports & Feature Requests

Your feedback is valuable. Please feel free to submit bug reports or feature requests via the **"Issues"** tab in this repository.

<a href="https://github.com/ryyr-ry/Quick-Tab/issues" target="_blank"><strong>&gt;&gt; Go to the Issues Page &lt;&lt;</strong></a>

To help us resolve issues quickly, please include the following details in your report:
-   Your browser and its version (e.g., Chrome 125.0.0.0)
-   The URL of the webpage where the issue occurred
-   Specific steps to reproduce the problem
-   The expected behavior vs. the actual behavior

### Our Commitment to Privacy

We take your privacy seriously. Smooth Tab **does not** collect, store, or transmit any personal information, such as your browsing history or the content of the sites you visit. All settings are stored locally on your device and never leave your browser.

For full details, please review our official Privacy Policy page:
> <a href="https://sites.google.com/view/smooth-tab/privacy" target="_blank">https://sites.google.com/view/smooth-tab/privacy</a>

### A Note on Permissions

When you install Smooth Tab, your browser will inform you that it requires permission to **"Read and change all your data on all websites."** This sounds alarming, but it is necessary for the extension to function as intended. Here is a transparent breakdown of why this permission is required:

-   **"Read your data"**: This allows Smooth Tab to **see the links on a webpage**. Without this, the extension cannot detect where the links are to listen for your double-clicks. It does not mean we are reading your emails or personal information.

-   **"Change your data"**: This allows Smooth Tab to **add its click-detection script** to the page and to **apply seamless updates**. When the extension is updated with bug fixes or improvements, this permission lets us apply those changes to your already-open tabs without forcing you to reload them. It does not mean we are altering the content of the pages you visit.

**Our Promise:** Your browsing data is never logged, analyzed, or sent to any external server. Ever. This permission is used exclusively to provide the core functionality of the extension in a secure and user-friendly way.

---

---

### License

This project is licensed under the Mozilla Public License 2.0. This is a requirement as it is a derivative work of the original "Tap to Tab" by em_te, which is also licensed under the MPL 2.0.

本プロジェクトは、派生元であるオリジナルの「Tap to Tab」のライセンスに基づき、Mozilla Public License 2.0の下で公開されています。
