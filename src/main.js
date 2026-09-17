const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

let mainWindow;
let vaultPath = '';
const ignoredDirectories = new Set(['.obsidian', '.git', 'node_modules']);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: '#191724',
    titleBarStyle: 'hiddenInset',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

async function readNotes(directory, root = directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
      results.push(...await readNotes(absolutePath, root));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const content = await fs.readFile(absolutePath, 'utf8');
      const stats = await fs.stat(absolutePath);
      results.push({
        path: absolutePath,
        relativePath: path.relative(root, absolutePath).replaceAll('\\', '/'),
        title: content.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(entry.name, '.md'),
        excerpt: content.replace(/^---[\s\S]*?---\s*/m, '').replace(/^#.*$/m, '').replace(/\s+/g, ' ').trim().slice(0, 140),
        modifiedAt: stats.mtimeMs
      });
    }
  }
  return results.sort((a, b) => b.modifiedAt - a.modifiedAt);
}

function safeFilename(title) {
  return title.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\.+$/g, '').slice(0, 80) || '無題のメモ';
}

ipcMain.handle('vault:choose', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  if (!result.canceled && result.filePaths[0]) vaultPath = result.filePaths[0];
  return { vaultPath };
});
ipcMain.handle('vault:status', () => ({ vaultPath }));
ipcMain.handle('notes:list', async () => vaultPath ? readNotes(vaultPath) : []);
ipcMain.handle('notes:read', async (_, filePath) => {
  if (!vaultPath || !path.resolve(filePath).startsWith(path.resolve(vaultPath))) throw new Error('Vault外のファイルにはアクセスできません。');
  return fs.readFile(filePath, 'utf8');
});
ipcMain.handle('notes:create', async (_, title) => {
  if (!vaultPath) throw new Error('先にVaultを選択してください。');
  const inbox = path.join(vaultPath, '00_Inbox');
  const targetDirectory = await fs.stat(inbox).then(s => s.isDirectory() ? inbox : vaultPath).catch(() => vaultPath);
  const filePath = path.join(targetDirectory, `${safeFilename(title)}.md`);
  const uniquePath = await (async () => {
    try { await fs.access(filePath); return path.join(targetDirectory, `${safeFilename(title)}-${Date.now()}.md`); } catch { return filePath; }
  })();
  const content = `# ${title.trim() || '無題のメモ'}\n\n`;
  await fs.writeFile(uniquePath, content, 'utf8');
  return { path: uniquePath, content };
});
ipcMain.handle('notes:save', async (_, filePath, content) => {
  if (!vaultPath || !path.resolve(filePath).startsWith(path.resolve(vaultPath))) throw new Error('Vault外のファイルには保存できません。');
  await fs.writeFile(filePath, content, 'utf8');
  return true;
});
ipcMain.handle('notes:delete', async (_, filePath) => {
  if (!vaultPath || !path.resolve(filePath).startsWith(path.resolve(vaultPath))) throw new Error('Vault外のファイルは削除できません。');
  await fs.unlink(filePath);
  return true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

