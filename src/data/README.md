# 日本の自治体マスタ

`japaneseMunicipalities.json` は、日本の現行自治体と代表座標を保持する静的データです。

- 自治体コード・都道府県名・自治体名: e-Stat「市区町村を探す」現行一覧（2026-08-21取得）
  - https://www.e-stat.go.jp/municipalities/cities/areacode
- 代表緯度・経度: Geoshape「歴史的行政区域データセットβ版」GeoNLP地名語辞書（2025-07-03更新版）
  - https://geonlp.ex.nii.ac.jp/dictionary/geoshape-city/
  - Geoshapeは、現行自治体について主に国土交通省「国土数値情報（市区町村役場データ）」の役所位置を代表点として採用しています。
  - https://geoshape.ex.nii.ac.jp/city/index.html.ja
- 収録項目: `prefecture`, `municipality`, `code`, `latitude`, `longitude`
- 政令指定都市の区には、検索・表示用の `parentMunicipality` と `ward` も収録
- e-Stat の集約行「特別区部」は除外し、市・特別区・町・村・政令指定都市の区を収録

浜松市の2024年区再編後の3区は、浜松市公式の区役所案内と公開施設情報で所在地の継続を確認し、Geoshape辞書にある対応する旧区役所の座標を引き継いでいます（中央区←中区、浜名区←浜北区、天竜区はコード変更）。

座標を更新する場合は、Geoshapeの `code_gci.csv` と `geoshape-city-geolod.csv` を取得し、次を実行してください。

```powershell
node scripts/updateMunicipalityCoordinates.mjs src/data/japaneseMunicipalities.json code_gci.csv geoshape-city-geolod.csv
```

実行時に e-Stat や Geoshape API へアクセスすることはありません。国内自治体の検索結果にはこのマスタの代表座標を含め、選択後の Open-Meteo Geocoding 再問い合わせを行いません。
