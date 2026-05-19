# Issue: オーナー通知

## 意図

ChatGPT thread を polling しなくても、work の状態変化をオーナーへ通知する。

## 候補イベント

- PR created。
- test failed。
- test passed。
- reviewer objected。
- human decision ready。
- deploy required。
- deploy completed。
- execution stale / hung。

## 成功条件

- Dashboard に unread notification center がある。
- 通知が progress page と PR にリンクする。
- 外部 push channel を差し替え可能にする。
- secret や approval grant value を含めない。

## 非ゴール

- MVP での SMS delivery。
- team notification routing。
