const $ = (selector) => document.querySelector(selector);
let notes = [], selectedPath = '', saveTimer;

function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); }
function setVaultLabel(vaultPath) { $('#vault-label').textContent = vaultPath || 'Vaultが未選択です'; }
function filteredNotes() { const query = $('#search').value.trim().toLowerCase(); return notes.filter(n => !query || `${n.title} ${n.excerpt} ${n.relativePath}`.toLowerCase().includes(query)); }
function renderNotes() {
  const list = $('#notes-list'); list.replaceChildren();
  for (const note of filteredNotes()) { const button = document.createElement('button'); button.className = `note ${note.path === selectedPath ? 'active' : ''}`; button.innerHTML = `<div class="note-title"></div><div class="note-meta"></div>`; button.querySelector('.note-title').textContent = note.title; button.querySelector('.note-meta').textContent = note.relativePath; button.onclick = () => openNote(note.path); list.append(button); }
}
async function refreshNotes() { notes = await window.obsidianApp.listNotes(); renderNotes(); }
async function openNote(filePath) { selectedPath = filePath; $('#content').value = await window.obsidianApp.readNote(filePath); $('#file-path').textContent = notes.find(n => n.path === filePath)?.relativePath || ''; $('#editor').hidden = false; $('#empty-state').hidden = true; $('#save-state').textContent = '保存済み'; renderNotes(); $('#content').focus(); }
async function chooseVault() { const { vaultPath } = await window.obsidianApp.chooseVault(); setVaultLabel(vaultPath); if (vaultPath) { await refreshNotes(); $('#empty-state').hidden = false; $('#editor').hidden = true; toast('Vaultを読み込みました'); } }
async function newNote() { const status = await window.obsidianApp.vaultStatus(); if (!status.vaultPath) return chooseVault(); const title = window.prompt('メモのタイトルを入力してください', '無題のメモ'); if (title === null) return; const note = await window.obsidianApp.createNote(title); await refreshNotes(); await openNote(note.path); }
async function save() { if (!selectedPath) return; await window.obsidianApp.saveNote(selectedPath, $('#content').value); $('#save-state').textContent = '保存済み'; await refreshNotes(); }
$('#choose-vault').onclick = chooseVault; $('#empty-choose').onclick = chooseVault; $('#new-note').onclick = newNote; $('#search').oninput = renderNotes;
$('#content').oninput = () => { $('#save-state').textContent = '保存中…'; clearTimeout(saveTimer); saveTimer = setTimeout(save, 550); };
$('#delete-note').onclick = async () => { if (!selectedPath || !window.confirm('このノートを完全に削除しますか？')) return; await window.obsidianApp.deleteNote(selectedPath); selectedPath = ''; $('#editor').hidden = true; $('#empty-state').hidden = false; await refreshNotes(); toast('ノートを削除しました'); };
(async () => { const { vaultPath } = await window.obsidianApp.vaultStatus(); setVaultLabel(vaultPath); })();

