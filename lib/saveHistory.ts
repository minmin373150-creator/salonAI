export async function saveHistory(toolName: string, inputSummary: string, output: string) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_name: toolName, input_summary: inputSummary, output }),
    })
  } catch {
    // 履歴保存失敗は無視
  }
}
