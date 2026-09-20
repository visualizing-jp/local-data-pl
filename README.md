# 自治体の財政収支

普通会計の歳入が目的別歳出へどう流れたかを、年度タイムラインつき Sankey で見る。visualizing.jp スタンドアロン（dataviz.jp サブスクツールではない）。

想定URL: https://local-data-pl.visualizing.jp

収録は北海道内の全市町村（179）、青森県内の全市町村（40）、岩手県内の全市町村（33）、宮城県内の全市町村（35）、秋田県内の全市町村（25）、山形県内の全市町村（35）、福島県内の全市町村（59）、茨城県内の全市町村（44）、栃木県内の全市町（25）、群馬県内の全市町村（35）、埼玉県内の全市町村（63）、千葉県内の全市町村（54）、東京都内の全区市町村（62）、神奈川県内の全市町村（33）、新潟県内の全市町村（30）、富山県内の全市町村（15）、沖縄県内の全市町村（41）。見出しの団体名から切り替えられる。ヘッダー右の切り口で、1年の歳入→歳出、歳入の streamgraph、歳出の streamgraph を切り替える。

## 開発

```bash
cp .env.example .env   # ESTAT_APP_ID を設定（1989–2018 の取得に必要）
npm install
npm run fetch && npm run data && npm run verify
npm run dev
```

県を足すときは、既存の `data/raw/` を取り直さない。

```bash
npm run fetch -- --pref=富山県
npm run data -- --pref=富山県
npm run verify
```

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | 財政状況資料集 Excel（2019–2024）と e-Stat（現行団体コードで取れる年度）を `data/raw/` へ取得。`--pref=県名` でその県だけ。キャッシュ済みの Excel は再取得しない。`ESTAT_APP_ID` が無いときは e-Stat をスキップする |
| `npm run data` | `public/data/` に団体ごとの JSON を構築。`--pref=県名` でその県だけ上書き |
| `npm run verify` | 収支バランスと、八王子市 2022 年の参照図検算 |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## パーマリンク

アドレスバーがいま見ている自治体・年度・切り口です。コピーして共有できます。

```
/?id=132012&year=2022
/?id=472018&year=2024&view=revenue
/?id=032018&year=2024
/?id=041009&year=2024
/?id=052019&year=2024
/?id=062014&year=2024
/?id=072010&year=2024
/?id=082015&year=2024
/?id=092011&year=2024
/?id=102016&year=2024
/?id=111007&year=2024
/?id=121002&year=2024
/?id=151009&year=2024
/?id=162019&year=2024
/?id=132012&year=2024&view=expenditure
/?id=131016&year=2024&view=revenue&scale=relative
```

| パラメータ | 内容 |
| --- | --- |
| `id` | [全国地方公共団体コード](https://www.soumu.go.jp/denshijiti/code.html)（6桁）。札幌市は `011002`、青森市は `022012`、盛岡市は `032018`、仙台市は `041009`、秋田市は `052019`、山形市は `062014`、福島市は `072010`、水戸市は `082015`、宇都宮市は `092011`、前橋市は `102016`、さいたま市は `111007`、千葉市は `121002`、千代田区は `131016`、横浜市は `141003`、新潟市は `151009`、富山市は `162019`、那覇市は `472018` |
| `year` | 西暦の決算年度。データに無い年はいちばん近い年度へ寄せる。時系列ビューでも残し、年度ビューに戻ったときに使う |
| `view` | `year`（既定・1年の歳入→歳出）、`revenue`（歳入の streamgraph）、`expenditure`（歳出の streamgraph）。`revenue-stream` / `expenditure-stream` も同じ。既定のときは URL から省く |
| `scale` | streamgraph の縦。`absolute`（既定・金額）、`relative`（高さを固定した年ごとの構成比）。既定のときは URL から省く |

`id` も `year` も無いときは千代田区の最新年度を開き、URL をそれに揃える。

## GitHub Pages / DNS

- `.github/workflows/pages.yml` で Pages にデプロイする。
- カスタムドメイン `local-data-pl.visualizing.jp` は、Pages 設定と visualizing.jp 側 DNS（既存シリーズと同じ運用）で登録する。

