# Solitude Interface

![thumbnail](/docs/assets/thumbnail.png)

Astro で構築し、Ghost CMS API で動作するモダンな個人ブログ UI。

言語: [English](../../README.md) | [简体中文](README.zh.md) | 日本語

## 特徴

- Astro ベースの高性能静的サイト
- Ghost CMS（ヘッドレス）連携
- **多言語対応（zh/ja/en）** と自動フォールバック
- レスポンシブデザイン、ダーク/ライト切り替え
- 複数の投稿タイプ表示（記事、ギャラリー、動画、音楽）
- SEO 最適化（hreflang、canonical、html lang）

## スクリーンショット
### Home
![Home](/docs/assets/home.png)
### Post
![Post](/docs/assets/post.png)
### About Me
![About-Me](/docs/assets/about-me.png)
### Post Detail
![Post-Detail](/docs/assets/post-detail.png)

## ドキュメント

| ドキュメント | 説明 |
|----------|-------------|
| **README.ja.md**（このファイル） | 利用ガイド - セットアップと投稿 |
| [**DEVELOPMENT.md**](../DEVELOPMENT.md) | 開発ガイド - アーキテクチャ、テスト、コマンド |

---

## クイックスタート

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境設定

テンプレートから `.env` を作成します:

```bash
cp .env.example .env
```

Ghost の情報を `.env` に設定します:

```env
GHOST_URL=https://your-ghost-instance.com
GHOST_CONTENT_KEY=your-content-api-key-here
GHOST_VERSION=v5.0
SITE_URL=https://your-site.example.com
```

#### 環境変数

| 変数 | 必須 | 説明 |
|----------|----------|-------------|
| `GHOST_URL` | はい | Ghost インスタンスのベース URL |
| `GHOST_CONTENT_KEY` | はい | Ghost Content API Key |
| `GHOST_VERSION` | はい | Ghost Content API バージョン（例: `v5.0`） |
| `SITE_URL` | はい | canonical と hreflang 用の公開 URL |

### 3. Ghost Content API Key を取得

1. Ghost 管理画面にログイン
2. **Settings** -> **Integrations** を開く
3. **Add custom integration** をクリック
4. **Content API Key** を `.env` にコピー

> **ヒント**: テストには Ghost Demo API を利用できます:
> ```env
> GHOST_URL=https://demo.ghost.io
> GHOST_CONTENT_KEY=22444f78447824223cefc48062
> ```

### 4. 開発サーバー起動

```bash
npm run dev
```

`http://localhost:4321` にアクセスして確認します。

## よく使うコマンド

| コマンド | 説明 |
|---------|-------------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run preview` | 本番ビルドのプレビュー |
| `npm run test` | テストを実行 |
| `npm run format` | コードを整形 |

---

## コンテンツ公開ガイド

### 分類タグ

**通常のタグ** で投稿を分類します。以下のプレフィックスを認識します:

| タグのプレフィックス | 用途 | 例 |
|------------|---------|---------|
| `type-` | 表示タイプ | `type-article`, `type-gallery`, `type-video`, `type-music` |
| `category-` | カテゴリ | `category-tech`, `category-life`, `category-design` |
| `series-` | シリーズ | `series-astro-tutorial`, `series-web-dev-basics` |
| *(プレフィックスなし)* | 一般タグ | `JavaScript`, `React`, `Photography` |

#### 対応投稿タイプ

| タイプタグ | 表示スタイル |
|----------|---------------|
| `type-article` | 標準記事レイアウト |
| `type-gallery` | カルーセル付きギャラリー |
| `type-video` | 動画プレイヤー埋め込み |
| `type-music` | 音声プレイヤー埋め込み |
| *(デフォルト)* | デフォルトカード |

---

## 多言語コンテンツ

### URL 構成

| ルート | 説明 |
| -------------- | ------------------------------------------- |
| `/` | ユーザーの言語に自動リダイレクト |
| `/zh/` | 中国語一覧 |
| `/ja/` | 日本語一覧 |
| `/en/` | 英語一覧 |
| `/zh/p/{key}/` | 中国語の投稿 |
| `/ja/p/{key}/` | 日本語の投稿 |
| `/en/p/{key}/` | 英語の投稿 |

### 多言語に必要なタグ

Ghost の **内部タグ**（`#` で始まる）を使用します:

| 内部タグ | 用途 | 例 |
|--------------|---------|---------|
| `#lang-{locale}` | 言語指定 | `#lang-zh`, `#lang-ja`, `#lang-en` |
| `#i18n-{key}` | 翻訳グループ ID | `#i18n-intro-to-solitude` |

> **注意**: Ghost Content API では内部タグ `#xxx` が `hash-xxx` の slug 形式に変換されます。

### 手順: 多言語投稿の作成

**重要**: 各言語は Ghost 上の **別投稿** として作成し、同じ `#i18n-{key}` で関連付けます。

#### 手順 1: 翻訳グループ key を決める

`astro-guide` のような一意の key を選びます。使用箇所:
- `#i18n-astro-guide` タグ
- URL: `/zh/p/astro-guide`, `/ja/p/astro-guide`, `/en/p/astro-guide`

#### 手順 2: 中国語版を作成

Ghost で新規投稿を作成:
1. 中国語で本文を書く
2. 投稿設定（歯車アイコン）を開く
3. **Tags** セクションへ移動
4. 以下のタグを追加:
   - `#lang-zh`（言語タグ）
   - `#i18n-astro-guide`（翻訳グループ）
   - `type-article`（任意: 表示タイプ）
   - `category-tech`（任意: カテゴリ）
5. 公開

#### 手順 3: 日本語版を作成

**別の新規投稿** を作成:
1. 日本語で本文を書く
2. 以下のタグを追加:
   - `#lang-ja`（異なる言語）
   - `#i18n-astro-guide`（同じ key）
   - `type-article`, `category-tech`（中国語版と同じ）
3. 公開

#### 手順 4: 英語版を作成

さらに **別の新規投稿** を作成:
1. 英語で本文を書く
2. 以下のタグを追加:
   - `#lang-en`（異なる言語）
   - `#i18n-astro-guide`（同じ key）
   - `type-article`, `category-tech`（他の言語と同じ）
3. 公開

#### 結果

`#i18n-astro-guide` で 3 件の投稿がリンクされます:
- 中国語投稿 -> `/zh/p/astro-guide`
- 日本語投稿 -> `/ja/p/astro-guide`
- 英語投稿 -> `/en/p/astro-guide`

記事ページの言語切替で各言語を表示できます。

### 完全な例

| 投稿タイトル | タグ |
|------------|------|
| "Astro 入门指南"（中国語） | `#lang-zh`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Astro入門ガイド"（日本語） | `#lang-ja`, `#i18n-astro-guide`, `type-article`, `category-tech` |
| "Getting Started with Astro"（英語） | `#lang-en`, `#i18n-astro-guide`, `type-article`, `category-tech` |

### フォールバック動作

- 対応言語が無い場合、デフォルト言語（中国語）を表示
- フォールバック通知バナーを表示
- 言語切替で利用可否が分かる

---

## 開発者向け

詳細は [**DEVELOPMENT.md**](../DEVELOPMENT.md) を参照してください:

- 技術スタックと構成
- 利用可能なコマンド
- テストガイド（ユニット/統合）
- アーキテクチャとコードリファレンス

---

## ライセンス

本プロジェクトは [MIT License](LICENSE) で公開されています。
