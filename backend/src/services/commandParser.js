// Parses voice commands like "删除", "换行", "全选" into structured edit actions
// the frontend can apply to the editor without further interpretation.

const COMMAND_MAP = [
  { patterns: ['删除', '退格', 'delete', 'backspace'], action: 'BACKSPACE' },
  { patterns: ['换行', '回车', 'newline', 'new line', 'enter'], action: 'NEWLINE' },
  { patterns: ['空格', 'space'], action: 'SPACE' },
  { patterns: ['清空', '全部删除', 'clear', 'clear all'], action: 'CLEAR' },
  { patterns: ['全选', 'select all'], action: 'SELECT_ALL' },
  { patterns: ['撤销', 'undo'], action: 'UNDO' },
  { patterns: ['重做', 'redo'], action: 'REDO' },
  { patterns: ['复制', 'copy'], action: 'COPY' },
  { patterns: ['停止', '停止录音', 'stop'], action: 'STOP' },
];

function parse(text) {
  if (typeof text !== 'string') return null;
  const normalized = text.trim().toLowerCase().replace(/[。！？，,.!?]/g, '');
  if (!normalized) return null;
  for (const cmd of COMMAND_MAP) {
    if (cmd.patterns.some((p) => normalized === p.toLowerCase())) {
      return { action: cmd.action, matched: normalized };
    }
  }
  return null;
}

module.exports = { parse, COMMAND_MAP };
