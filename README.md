# CodeGrid の著者ページから、記事を取得し自分のサイト(yuto343.net)にマークダウンファイルを作成する Cron スクリプト

Cloudflare Workers にデプロイしています。[ダッシュボード](https://dash.cloudflare.com/2a11aaa921226319ecbda9ad17bd734e/workers/services/view/add-codegrid-article-worker/production?versionFilter=all)

木曜日にリリースされたのを拾うため、毎週金曜日の午前 0 時に実行される設定です。

## 開発

`npm run dev`でサーバーをたて

```bash
curl "http://localhost:8787/__scheduled"
```

で実行できます。

## 備考

現状ダッシュボードからデプロイしているので、ローカルから`wrangler deploy`すると環境変数が消えるので設定し直す必要があります。注意してください。
