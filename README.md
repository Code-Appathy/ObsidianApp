# ObsidianApp

Obsidianの保管庫（Vault）に直接メモを作成・編集する、Windows向けの軽量デスクトップメモ帳です。

## できること

- Obsidian Vaultフォルダを選択してMarkdownノートを一覧表示
- `00_Inbox` があればそこへ新しいメモを作成（なければVault直下）
- 検索、作成、編集、自動保存、削除
- Obsidian形式の内部リンク `[[ノート名]]` をそのまま保持

## 起動

```powershell
pnpm install
pnpm start
```

初回起動時にVaultフォルダを選んでください。アプリは選択したVault内のMarkdownファイルを直接変更します。

