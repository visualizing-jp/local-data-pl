# 八王子市の財政収支

普通会計の歳入が目的別歳出へどう流れたかを、年度タイムラインつき Sankey で見る。visualizing.jp スタンドアロン（dataviz.jp サブスクツールではない）。

## 開発

```bash
cp .env.example .env   # ESTAT_APP_ID を設定（1989–2018 の取得に必要）
npm install
npm run fetch && npm run data && npm run verify
npm run dev
```

| スクリプト | 内容 |
| --- | --- |
| `npm run fetch` | 財政状況資料集 Excel（2019–2024）と e-Stat（1989–2018）を `data/raw/` へ取得 |
| `npm run data` | `public/data/hachioji.json` を構築 |
| `npm run verify` | 複数年の収支バランスと 2022 年の参照図検算 |
| `npm run dev` | Vite 開発サーバ |
| `npm run build` | 本番ビルド |
| `npm run typecheck` | TypeScript 検査 |

収録年は 1989–2024 年度。データ設計の正本は [`docs/data-sources.md`](docs/data-sources.md)。

## パーマリンク

アドレスバーがいま見ている自治体と年度です。コピーして共有できます。

```
/?city=hachioji&year=2022
```

| パラメータ | 内容 |
| --- | --- |
| `city` | 自治体のスラッグ。いまは `hachioji`。`八王子市` や団体コード `132012` でも開く |
| `year` | 西暦の決算年度。データに無い年はいちばん近い年度へ寄せる |

`city` も `year` も無いときは八王子市の最新年度を開き、URL をそれに揃える。

