# Issue: 人間の判断キュー

## 意図

オーナー判断待ちの work を dashboard の queue として集約する。

## 成功条件

- Queue が `merge GO`, `deploy GO`, `issue close GO`, `review needed`, `investigation needed`, `blocked` を分類できる。
- 各 item が PR、Issue、progress page、必要に応じた governed operator URL へリンクする。
- 高リスク操作は GO + real passkey の後ろに残る。
- オーナーが判断前に evidence を確認できる。

## 非ゴール

- 自動 merge。
- 自動 deploy。
- 自動 Issue close。
