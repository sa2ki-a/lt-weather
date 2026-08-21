# LT Weather

フィールドへ出かける前に、地点ごとの「今夜の気象条件と月の状態」を確認するモバイルファーストの PWA です。

## 作成した機能

- お気に入り地点のカード一覧（代表天気・気温・湿度・風・月相）
- Geolocation API による現在地取得、または緯度・経度の直接入力
- 地点の追加・削除と `localStorage` への永続保存
- 24時間の横スクロールタイムライン
- 天気、気温、湿度、降水量、降水確率、風速、雲量の1時間ごとの表示
- 日没、市民・航海・天文薄明終了、月の出・月の入りのタイムラインマーカー
- 月相、月照率、各時刻の月高度と地平線上下の表示
- 前夜・翌夜の切り替え（取得済み予報の範囲内）
- 読み込み、APIエラー、再読み込み表示
- ダークテーマ、スマートフォン優先のレスポンシブUI
- Web App Manifest、Service Worker、APIキャッシュを含むPWA対応

## ファイル構成

```text
src/
  components/   カード、天気アイコン、タイムライン、状態表示
  hooks/        気象データ取得用 React Hook
  pages/        一覧、地点追加、地点詳細
  services/     Open-Meteo、SunCalc、localStorage
  types/        TypeScript 型定義
  utils/        タイムゾーン対応の日付処理
  App.tsx       画面状態と地点データの統合
  styles.css    モバイルファーストの共通スタイル
```

## 使用しているAPI・ライブラリ

- [Open-Meteo Forecast API](https://open-meteo.com/en/docs): 1時間ごとの予報。`timezone=auto`、`timeformat=unixtime` を使用し、地点固有のタイムゾーンと絶対時刻を安全に扱います。APIキーは不要です。
- [SunCalc](https://github.com/mourner/suncalc): 太陽、薄明、月相、照度、月の出入り、月高度をブラウザ内で計算します。
- `localStorage`: 登録地点を端末内に保存します。サーバーやデータベースはありません。

## 起動方法

Windows PowerShell の実行ポリシーを避けるため、必ず `npm.cmd` を使用します。

```powershell
npm.cmd install
npm.cmd run dev
```

表示されたローカルURLをブラウザで開いてください。本番用ビルドは次の通りです。

```powershell
npm.cmd run build
npm.cmd run preview
```

位置情報はブラウザ仕様により HTTPS または localhost でのみ利用できます。PWAの Service Worker は本番ビルドで有効になります。

## 将来追加しやすい機能

地点登録、気象取得、天文計算、保存、UIを分離しています。地点検索・地図登録は地点作成UIを追加し、潮汐や適性スコアは独立した service とタイムライン行を加える形で拡張できます。アカウントやクラウド同期を導入する場合も、現在の storage service を同期対応実装へ差し替えられます。
