# Solitude Interface

![thumbnail](../assets/thumbnail.png)

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-≥9-F69220?logo=pnpm&logoColor=white)
![Astro](https://img.shields.io/badge/Astro-5.x-BC52EE?logo=astro&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

Astro で構築し、Ghost CMS の Content API で駆動するモダンな個人ブログ UI です。

**[ライブデモ](https://www.solitudera.com)** · [ドキュメント](../DEVELOPMENT.md) · [バグ報告](https://github.com/SolitudeRA/Solitude-Interface/issues)

Read this in: [English](../../README.md) | [简体中文](README.zh.md) | 日本語

---

## 目次

- [特徴](#特徴)
- [スクリーンショット](#スクリーンショット)
- [ドキュメント](#ドキュメント)
- [クイックスタート](#クイックスタート)
- [よく使うコマンド](#よく使うコマンド)
- [コンテンツ公開ガイド](#コンテンツ公開ガイド)
- [多言語コンテンツ](#多言語コンテンツ)
- [開発者向け](#開発者向け)
- [サポート](#サポート)
- [謝辞](#謝辞)
- [ライセンス](#ライセンス)

---

## 特徴

- Astro による高性能な静的サイト
- Ghost CMS 連携（Headless）
- **多言語対応（zh/ja/en）**＋自動フォールバック
- レスポンシブデザイン／ダーク・ライト切り替え
- 複数の投稿タイプ表示（記事、ギャラリー、動画、音楽）
- SEO 最適化（hreflang、canonical、html lang）

---

## スクリーンショット

<details>
<summary>クリックして展開</summary>

### Home

![Home](../assets/home.png)

### Post

![Post](../assets/post.png)

### About Me

![About-Me](../assets/about-me.png)

### Post Detail

![Post-Detail](../assets/post-detail.png)

</details>

---

## ドキュメント

| ドキュメント                            | 説明                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------ |
| **README.md**（英語）                   | 利用ガイド - セットアップと投稿運用： [../../README.md](../../README.md) |
| [**DEVELOPMENT.md**](../DEVELOPMENT.md) | 開発者向け - アーキテクチャ、テスト、ワークフロー、コントリビュート      |

---

## クイックスタート

### 1. 依存関係のインストール

このプロジェクトは **pnpm** を使用します。

```bash
#（推奨）Corepack 経由で pnpm を有効化
corepack enable pnpm

pnpm install
```

> もし `corepack` が利用できない場合は、`npm i -g pnpm` で pnpm をグローバルにインストールできます。

### 2. 環境変数の設定

テンプレートから `.env` を作成します：

```bash
cp .env.example .env
```

`.env` を編集し、Ghost の情報を入力します：

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
GHOST_TIMEOUT=5000
SITE_URL=https://your-site.example.com
IMAGE_HOST_URL=
GOOGLE_ANALYTICS_TAG_ID=
```

#### 環境変数

| 変数                      | 必須 | 説明                                                                                                      |
| ------------------------- | ---- | --------------------------------------------------------------------------------------------------------- |
| `GHOST_URL`               | 必須 | Ghost インスタンスのベース URL                                                                            |
| `GHOST_CONTENT_KEY`       | 必須 | Ghost Content API キー                                                                                    |
| `GHOST_VERSION`           | 任意 | Ghost Content API バージョン（デフォルト：`v5.0`）                                                        |
| `GHOST_TIMEOUT`           | 任意 | Ghost リクエストのタイムアウト（ms、デフォルト：`5000`）                                                  |
| `SITE_URL`                | 必須 | 公開サイト URL（canonical / hreflang 用）                                                                 |
| `IMAGE_HOST_URL`          | 任意 | 画像ホスト/CDN（リモート画像ドメイン許可リスト用）。単一またはカンマ区切りで複数 URL 可（デフォルト：空） |
| `GOOGLE_ANALYTICS_TAG_ID` | 任意 | Google tag / GA4 Measurement ID（例：`G-XXXX`）。空なら解析無効                                           |
| `CF_ACCESS_CLIENT_ID`     | 任意 | Cloudflare Access Service Token Client ID（Ghost が Cloudflare Access で保護されている場合のみ必要）      |
| `CF_ACCESS_CLIENT_SECRET` | 任意 | Cloudflare Access Service Token Client Secret                                                             |

### Cloudflare Access 設定（任意）

Ghost インスタンスが [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) で保護されている場合、API へアクセスするには Service Token の設定が必要です：

1. **Service Token を作成**（Cloudflare Zero Trust ダッシュボード）：
    - **Access** → **Service Auth** → **Service Tokens**
    - **Create Service Token** をクリック
    - **Client ID** と **Client Secret** をコピー

2. **`.env` に設定**：

    ```env
    CF_ACCESS_CLIENT_ID=your-client-id.access
    CF_ACCESS_CLIENT_SECRET=your-client-secret
    ```

3. **対象の Access Application に許可ポリシーを追加**：
    - **Access** → **Applications** → あなたの Ghost App
    - **Action: Service Auth** のポリシーを追加し、その token を選択

> **補足**：本プロジェクトが実装しているのは **Service Token 認証のみ**です。2 つの変数を**両方**設定したときに限り、API クライアントが `CF-Access-Client-Id` / `CF-Access-Client-Secret` ヘッダーを自動付与します（片方だけの場合は送信されず、警告が出ます）。

#### 任意：ダッシュボード側の許可ルール

以下は **Cloudflare ダッシュボード側のポリシーで、本プロジェクトのコードは実装も参照もしません** —— Content API リクエストを通すためのもので、追加の保護を入れている場合のみ設定します：

- **Bot Fight Mode**：Cloudflare → Security → WAF → Custom rules で、URI Path が `/ghost/api/content/` で始まるルールを作成し、Action = Skip → All Super Bot Fight Mode rules。
- **Zero Trust Access Bypass**：Zero Trust → Access → Applications で `your-ghost-domain.com/ghost/api/content/*` 用のアプリを追加し、ポリシーを **Bypass** に設定。

### 3. Ghost Content API Key を取得する

1. Ghost Admin にログイン
2. **Settings** → **Integrations** を開く
3. **Add custom integration** をクリック
4. **Content API Key** を `.env` に設定

> **Tip**：テスト用に Ghost Demo API も利用できます：
>
> ```env
> GHOST_URL=https://demo.ghost.io
> GHOST_CONTENT_KEY=22444f78447824223cefc48062
> ```

### 4. 開発サーバーを起動する

```bash
pnpm dev
```

`http://localhost:4321` にアクセスして確認できます。

> **デプロイ**：これは純粋な静的サイト（Astro SSG）です。`pnpm build` は `dist/` を出力し、任意の静的ホスト（例：Cloudflare Pages）に配置できます。デプロイ先のビルド環境にもローカルの `.env` と同じ環境変数を設定してください：静的生成は**ビルド時**に行われ、Ghost のコンテンツはビルド時に取得・事前レンダリングされるため、認証情報が `dist/` に含まれることはありません。

---

## よく使うコマンド

| コマンド          | 説明                                                     |
| ----------------- | -------------------------------------------------------- |
| `pnpm dev`        | 開発サーバーを起動                                       |
| `pnpm build`      | 本番ビルドを生成                                         |
| `pnpm preview`    | 本番ビルドをプレビュー                                   |
| `pnpm astro sync` | 型定義を生成（env/schema 変更後に有用）                  |
| `pnpm check`      | Lint + フォーマット検査 + 型チェック（コミット前に実行） |
| `pnpm test:run`   | テストを 1 回実行（`pnpm test` は watch モード）         |
| `pnpm format`     | コード整形                                               |

---

## コンテンツ公開ガイド

### 分類タグ（Tags）

投稿の分類には **通常タグ（regular tags）** を使います。システムは以下の接頭辞を認識します：

| タグ接頭辞     | 目的       | 例                                                         |
| -------------- | ---------- | ---------------------------------------------------------- |
| `type-`        | 表示タイプ | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-`    | カテゴリ   | `category-tech`, `category-life`, `category-design`        |
| `series-`      | シリーズ   | `series-astro-tutorial`, `series-web-dev-basics`           |
| _(接頭辞なし)_ | 一般タグ   | `JavaScript`, `React`, `Photography`                       |

#### 対応する投稿タイプ

| Type タグ      | 表示スタイル             |
| -------------- | ------------------------ |
| `type-article` | 標準記事レイアウト       |
| `type-gallery` | カルーセル付きギャラリー |
| `type-video`   | 動画プレイヤー埋め込み   |
| `type-music`   | 音声プレイヤー埋め込み   |
| _(default)_    | デフォルトカード         |

---

## 多言語コンテンツ

### URL 構造

| ルート         | 説明                                 |
| -------------- | ------------------------------------ |
| `/`            | ユーザーの優先言語へ自動リダイレクト |
| `/zh/`         | 中国語の投稿一覧                     |
| `/ja/`         | 日本語の投稿一覧                     |
| `/en/`         | 英語の投稿一覧                       |
| `/zh/p/{key}/` | 中国語記事                           |
| `/ja/p/{key}/` | 日本語記事                           |
| `/en/p/{key}/` | 英語記事                             |

### 多言語に必要なタグ

Ghost では **内部タグ（`#` で始まる internal tags）** を使います：

| 内部タグ         | 目的               | 例                                 |
| ---------------- | ------------------ | ---------------------------------- |
| `#lang-{locale}` | 投稿言語の指定     | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}`    | 翻訳グループ識別子 | `#i18n-intro-to-solitude`          |

> **注意**：Ghost Content API では内部タグ `#xxx` は slug 形式 `hash-xxx` に変換されます。

### 投稿 slug の命名規約（予約プレフィックス）

内部タグに加えて、**Ghost の投稿 slug** から直接記事のアイデンティティを導出する仕組みもあり、規約は `{locale}-{key}` です：

| 投稿 slug         | 解析結果                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `ja-homeserver-8` | locale = `ja`、翻訳グループ key = `homeserver-8` → `/ja/p/homeserver-8` |
| `en-blog-project` | locale = `en`、翻訳グループ key = `blog-project` → `/en/p/blog-project` |

> **重要：`zh-` / `ja-` / `en-` は予約された slug プレフィックスです。** 有効な言語コード＋ハイフンで始まる slug は、`#lang-*` / `#i18n-*` タグが無くても、その言語の多言語投稿として解析されます。
>
> そのため、**通常（非多言語）の投稿に `zh-…` / `ja-…` / `en-…` のような slug を付けないでください**。誤って翻訳グループにまとめられ、誤った `/{locale}/p/{key}` ルートや hreflang が生成されます。通常の投稿には言語コードで始まらない slug を使ってください。
>
> 投稿に `#lang-*` タグがある場合：**言語**はタグを優先し slug プレフィックスはフォールバック、**翻訳グループ key** は slug を優先し `#i18n-*` タグをフォールバックとします。

<details>
<summary><strong>手順：多言語投稿の作成</strong></summary>

**重要**：各言語版は Ghost 上で**別々の投稿（別 Post）**として作成します。同じ `#i18n-{key}` タグで関連付けます。

#### Step 1：翻訳グループ key を決める

例：`astro-guide`。この key は以下で使います：

- `#i18n-astro-guide` タグ（全言語版を紐付け）
- URL：`/zh/p/astro-guide`、`/ja/p/astro-guide`、`/en/p/astro-guide`

#### Step 2：中国語版を作る

Ghost Admin で新規投稿を作成：

1. 中国語で本文を書く
2. **Post settings**（歯車）を開く
3. **Tags** までスクロール
4. 以下のタグを追加：
    - `#lang-zh`（言語タグ。`#` を忘れない）
    - `#i18n-astro-guide`（翻訳グループタグ）
    - `type-article`（任意：タイプ）
    - `category-tech`（任意：カテゴリ）
5. 公開する

#### Step 3：日本語版を作る

Ghost で **別の新規投稿**として作成：

1. 日本語で本文を書く
2. 以下のタグを追加：
    - `#lang-ja` ← 言語が異なる
    - `#i18n-astro-guide` ← **同じ** i18n key
    - `type-article`, `category-tech`（他言語版と揃える）
3. 公開する

#### Step 4：英語版を作る

さらに **別の新規投稿**として作成：

1. 英語で本文を書く
2. 以下のタグを追加：
    - `#lang-en` ← 言語が異なる
    - `#i18n-astro-guide` ← **同じ** i18n key
    - `type-article`, `category-tech`（他言語版と揃える）
3. 公開する

#### 結果

Ghost 上に 3 つの独立投稿ができ、`#i18n-astro-guide` で関連付けられます：

- 中国語：`/zh/p/astro-guide`
- 日本語：`/ja/p/astro-guide`
- 英語：`/en/p/astro-guide`

記事ページの言語スイッチャーから相互に切り替え可能です。

### 完全な例

| タイトル                               | Tags                                                             |
| -------------------------------------- | ---------------------------------------------------------------- |
| 「Astro 入门指南」（中国語）           | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| 「Astro入門ガイド」（日本語）          | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| 「Getting Started with Astro」（英語） | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

</details>

### フォールバック（Fallback）動作

- 対応言語の投稿が存在しない場合、デフォルト言語（中国語）を表示
- デフォルト言語も無い場合は、`LOCALES` の順序（`zh`、`ja`、`en`）で利用可能な版を表示します —— この順序は load-bearing です（例：中国語が無いときは英語より日本語が優先）
- フォールバック中である旨のバナーを表示
- 言語スイッチャーで利用可／不可が分かる

---

## 開発者向け

[**docs/DEVELOPMENT.md**](../DEVELOPMENT.md) に以下をまとめています：

- 技術スタック＆プロジェクト構成
- 利用可能なコマンド一覧
- テストガイド（Unit / Integration）
- アーキテクチャ＆コード参照

### コントリビュート

コントリビュート歓迎です！Pull Request をお気軽にどうぞ。大きな変更は、まず issue を立てて内容を相談してください。

---

## サポート

質問・アイデア・バグは [GitHub Issues](https://github.com/SolitudeRA/Solitude-Interface/issues) までお寄せください。

---

## 謝辞

- [Astro](https://astro.build/) - コンテンツ駆動型サイトのための Web フレームワーク
- [Ghost](https://ghost.org/) - プロ向けの publishing プラットフォーム
- [TailwindCSS](https://tailwindcss.com/) - ユーティリティファーストの CSS フレームワーク
- [React](https://react.dev/) - ユーザーインターフェース構築のためのライブラリ

---

## ライセンス

本プロジェクトはオープンソースで、[MIT License](../../LICENSE) で提供されます。
