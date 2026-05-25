import { api } from './api.js';
import { Recognizer } from './recognizer.js';

const $ = (sel) => document.querySelector(sel);

const editor = $('#editor');
const interim = $('#interim');
const recordBtn = $('#record-btn');
const recordLabel = $('#record-label');
const enhanceBtn = $('#enhance-btn');
const copyBtn = $('#copy-btn');
const clearBtn = $('#clear-btn');
const saveBtn = $('#save-btn');
const statusPill = $('#status-pill');
const langSelect = $('#lang-select');
const themeToggle = $('#theme-toggle');
const charCount = $('#char-count');
const latencyInfo = $('#latency-info');
const toast = $('#toast');
const hwForm = $('#hotword-form');
const hwTerm = $('#hw-term');
const hwAliases = $('#hw-aliases');
const hwList = $('#hotword-list');
const historyList = $('#history-list');
const historyClear = $('#history-clear');

const recognizer = new Recognizer();
let isRecording = false;
let hotwordsCache = [];

// ───────── Toast ─────────
let toastTimer;
function showToast(msg, kind = '') {
  toast.textContent = msg;
  toast.className = `toast ${kind}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

// ───────── Status ─────────
function setStatus(text, kind) {
  statusPill.textContent = text;
  statusPill.className = `status-pill status-${kind}`;
}

function updateCharCount() {
  charCount.textContent = `${editor.value.length} 字符`;
}

editor.addEventListener('input', updateCharCount);

// ───────── Theme ─────────
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.documentElement.dataset.theme = 'dark';
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
});

// ───────── Tabs ─────────
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.remove('active');
      p.hidden = true;
    });
    const panel = document.getElementById(`tab-${tab.dataset.tab}`);
    panel.classList.add('active');
    panel.hidden = false;
    if (tab.dataset.tab === 'history') refreshHistory();
  });
});

// ───────── Recognizer wiring ─────────
recognizer.setLang(langSelect.value);
langSelect.addEventListener('change', () => {
  recognizer.setLang(langSelect.value);
  if (isRecording) {
    recognizer.stop();
    recognizer.start();
  }
});

if (!recognizer.supported) {
  recordBtn.disabled = true;
  setStatus('浏览器不支持', 'error');
  showToast('当前浏览器不支持语音识别，请使用 Chrome 或 Edge。', 'error');
}

recordBtn.addEventListener('click', toggleRecording);

function toggleRecording() {
  if (isRecording) {
    recognizer.stop();
  } else {
    recognizer.start();
  }
}

recognizer.addEventListener('start', () => {
  isRecording = true;
  recordBtn.classList.add('recording');
  recordBtn.setAttribute('aria-pressed', 'true');
  recordLabel.textContent = '停止录音';
  setStatus('正在聆听…', 'listen');
});

recognizer.addEventListener('end', () => {
  isRecording = false;
  recordBtn.classList.remove('recording');
  recordBtn.setAttribute('aria-pressed', 'false');
  recordLabel.textContent = '开始录音';
  interim.textContent = '';
  setStatus('空闲', 'idle');
});

recognizer.addEventListener('error', (e) => {
  setStatus(`错误：${e.detail.message}`, 'error');
  showToast(`识别错误：${e.detail.message}`, 'error');
});

recognizer.addEventListener('latency', (e) => {
  latencyInfo.textContent = `首字延迟：${e.detail.ms} ms`;
});

recognizer.addEventListener('interim', (e) => {
  interim.textContent = e.detail.text;
});

recognizer.addEventListener('final', async (e) => {
  const text = e.detail.text.trim();
  if (!text) return;

  // Try parsing as a voice command first; fall back to inserting as text.
  try {
    const { command } = await api.parseCommand(text);
    if (command) {
      applyCommand(command.action);
      interim.textContent = '';
      return;
    }
  } catch { /* command service offline — degrade gracefully */ }

  insertAtCursor(editor, text);
  interim.textContent = '';
  updateCharCount();
});

// ───────── Editor commands ─────────
function applyCommand(action) {
  switch (action) {
    case 'BACKSPACE':
      editor.value = editor.value.slice(0, -1);
      break;
    case 'NEWLINE':
      insertAtCursor(editor, '\n');
      break;
    case 'SPACE':
      insertAtCursor(editor, ' ');
      break;
    case 'CLEAR':
      editor.value = '';
      break;
    case 'SELECT_ALL':
      editor.focus();
      editor.select();
      break;
    case 'COPY':
      copyEditor();
      break;
    case 'STOP':
      recognizer.stop();
      break;
    default:
      return;
  }
  updateCharCount();
}

function insertAtCursor(el, text) {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  el.value = el.value.slice(0, start) + text + el.value.slice(end);
  const cursor = start + text.length;
  el.setSelectionRange(cursor, cursor);
  el.focus();
}

async function copyEditor() {
  if (!editor.value) return;
  try {
    await navigator.clipboard.writeText(editor.value);
    showToast('已复制到剪贴板', 'success');
  } catch {
    showToast('复制失败，请手动选择复制', 'error');
  }
}

copyBtn.addEventListener('click', copyEditor);
clearBtn.addEventListener('click', () => {
  editor.value = '';
  updateCharCount();
});

saveBtn.addEventListener('click', async () => {
  if (!editor.value.trim()) return;
  try {
    await api.saveHistory(editor.value);
    showToast('已保存到历史', 'success');
    refreshHistory();
  } catch (err) {
    showToast(`保存失败：${err.message}`, 'error');
  }
});

enhanceBtn.addEventListener('click', enhanceCurrent);

async function enhanceCurrent() {
  const text = editor.value;
  if (!text.trim()) return;
  try {
    setStatus('后处理中…', 'listen');
    const { enhanced } = await api.enhance(text, hotwordsCache);
    editor.value = enhanced;
    updateCharCount();
    setStatus('完成', 'success');
    showToast('已优化文本', 'success');
  } catch (err) {
    setStatus('错误', 'error');
    showToast(`后处理失败：${err.message}`, 'error');
  }
}

// ───────── Hotwords ─────────
async function refreshHotwords() {
  try {
    hotwordsCache = await api.listHotwords();
    renderHotwords();
  } catch (err) {
    showToast(`加载热词失败：${err.message}`, 'error');
  }
}

function renderHotwords() {
  hwList.innerHTML = '';
  if (!hotwordsCache.length) {
    hwList.innerHTML = '<li class="muted" style="justify-content:center;">尚无热词</li>';
    return;
  }
  for (const hw of hotwordsCache) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-text">
        <strong>${escapeHtml(hw.term)}</strong>
        ${hw.aliases?.length ? `<div class="item-aliases">别名：${hw.aliases.map(escapeHtml).join('、')}</div>` : ''}
      </div>
      <div class="item-actions">
        <button class="ghost-btn small" data-id="${hw.id}" data-action="delete">删除</button>
      </div>`;
    hwList.appendChild(li);
  }
}

hwList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action="delete"]');
  if (!btn) return;
  try {
    await api.deleteHotword(btn.dataset.id);
    refreshHotwords();
  } catch (err) {
    showToast(`删除失败：${err.message}`, 'error');
  }
});

hwForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const term = hwTerm.value.trim();
  if (!term) return;
  const aliases = hwAliases.value
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  try {
    await api.addHotword(term, aliases);
    hwTerm.value = '';
    hwAliases.value = '';
    refreshHotwords();
    showToast('热词已添加', 'success');
  } catch (err) {
    showToast(`添加失败：${err.message}`, 'error');
  }
});

// ───────── History ─────────
async function refreshHistory() {
  try {
    const items = await api.listHistory();
    renderHistory(items);
  } catch (err) {
    showToast(`加载历史失败：${err.message}`, 'error');
  }
}

function renderHistory(items) {
  historyList.innerHTML = '';
  if (!items.length) {
    historyList.innerHTML = '<li class="muted" style="justify-content:center;">尚无历史记录</li>';
    return;
  }
  for (const it of items) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="item-text">
        <div>${escapeHtml(it.text)}</div>
        <div class="item-time">${formatTime(it.createdAt)}</div>
      </div>
      <div class="item-actions">
        <button class="ghost-btn small" data-text="${escapeAttr(it.text)}" data-action="copy">复制</button>
        <button class="ghost-btn small" data-text="${escapeAttr(it.text)}" data-action="insert">插入</button>
        <button class="ghost-btn small" data-id="${it.id}" data-action="delete">删除</button>
      </div>`;
    historyList.appendChild(li);
  }
}

historyList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'copy') {
    await navigator.clipboard.writeText(btn.dataset.text || '');
    showToast('已复制', 'success');
  } else if (action === 'insert') {
    insertAtCursor(editor, btn.dataset.text || '');
    updateCharCount();
  } else if (action === 'delete') {
    try {
      await api.deleteHistory(btn.dataset.id);
      refreshHistory();
    } catch (err) {
      showToast(`删除失败：${err.message}`, 'error');
    }
  }
});

historyClear.addEventListener('click', async () => {
  if (!confirm('确认清空全部历史记录？')) return;
  try {
    await api.clearHistory();
    refreshHistory();
  } catch (err) {
    showToast(`清空失败：${err.message}`, 'error');
  }
});

// ───────── Keyboard shortcuts ─────────
document.addEventListener('keydown', (e) => {
  const meta = e.ctrlKey || e.metaKey;
  if (meta && e.code === 'Space') {
    e.preventDefault();
    toggleRecording();
  } else if (meta && e.key === 'Enter') {
    e.preventDefault();
    enhanceCurrent();
  }
});

// ───────── Helpers ─────────
function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('\n', '&#10;');
}
function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return iso; }
}

// ───────── Boot ─────────
(async function init() {
  updateCharCount();
  try {
    await api.health();
  } catch {
    showToast('后端服务未连接，部分功能将受限', 'error');
  }
  refreshHotwords();
})();
