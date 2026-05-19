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
- deploy failed。
- execution stale / hung。

## 成功条件

- Dashboard に unread notification center がある。
- Dashboard に通知設定画面がある。
- 初期状態は全イベント通知 ON。
- event type を checkbox で ON/OFF できる。
- 新しい event type が途中追加された場合、設定に存在しない未知 event は default ON として扱う。
- 通知が progress page と PR にリンクする。
- GitHub Actions deploy run を dashboard execution に同期し、run URL と progress page にリンクする。
- 外部 push channel を差し替え可能にする。
- secret や approval grant value を含めない。

## 非ゴール

- MVP での SMS delivery。
- team notification routing。
