# CodeGrid の著者ページから、記事を取得し自分のサイト(yuto343.net)にマークダウンファイルを作成する Cron スクリプト

Cloudflare Workers にデプロイしています。[ダッシュボード](https://dash.cloudflare.com/2a11aaa921226319ecbda9ad17bd734e/workers/services/view/add-codegrid-article-worker/production?versionFilter=all)

木曜日にリリースされたのを拾うため、毎週金曜日の午前 0 時に実行される設定です。

## 開発

`npm run dev`でサーバーをたて

```bash
curl "http://localhost:8787/__scheduled"
```

で実行できます。

### デプロイ

デプロイ時には、`npm run deploy`または`wrangler deploy`を実行してください。

## 備考

環境変数で`GITHUB_PAT`が必要です。これは`wrangler secret put`コマンドで設定してあり、ダッシュボードから存在は確認できます。

ローカル開発時は`wrangler dev --remote`オプションにより、リモートの環境変数を参照しているので、ローカルに環境変数設定ファイルは存在しません。
