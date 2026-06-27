/**
 * 知識ベース一括インポートスクリプト
 * 使い方: node scripts/import-knowledge.mjs
 *
 * 指定フォルダ以下の .txt ファイルを読み込み、
 * チャンク分割 → embedding生成 → Supabase登録 を自動で行う
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'
import ws from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// .env.local から環境変数を読み込む
const envPath = path.join(ROOT, '.env.local')
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const supabase = createClient(
  env['NEXT_PUBLIC_SUPABASE_URL'],
  env['SUPABASE_SERVICE_ROLE_KEY'], // サービスロールキーでRLSをバイパス
  { realtime: { transport: ws } }
)

const openai = new OpenAI({ apiKey: env['OPENAI_API_KEY'] })

// ──────────────────────────────────────
// 設定
// ──────────────────────────────────────

const KNOWLEDGE_DIR = '/Users/minamiyamasaki/Desktop/Cursor/講座（HSM）/録画データ文字起こし'

const CHUNK_SIZE = 1200      // 1チャンクの最大文字数
const CHUNK_OVERLAP = 200    // チャンク間のオーバーラップ文字数

// カテゴリ判定（フォルダ名から自動判定）
function detectCategory(filePath) {
  if (filePath.includes('ワークショップ')) return 'workshop'
  if (filePath.includes('カウンセリング')) return 'counseling'
  if (filePath.includes('グルコン')) return 'group_consulting'
  if (filePath.includes('鉄板トーク')) return 'sales_script'
  if (filePath.includes('初回コンサル')) return 'first_consulting'
  if (filePath.includes('ホットペッパー')) return 'hotpepper'
  return 'lecture'
}

// ──────────────────────────────────────
// ユーティリティ
// ──────────────────────────────────────

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + size, text.length)
    chunks.push(text.slice(start, end))
    if (end === text.length) break
    start += size - overlap
  }
  return chunks
}

function collectTxtFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...collectTxtFiles(full))
    else if (entry.name.endsWith('.txt') || entry.name.endsWith('.md')) files.push(full)
  }
  return files.filter(f => !f.endsWith('CLAUDE.md'))
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ──────────────────────────────────────
// メイン処理
// ──────────────────────────────────────

async function main() {
  console.log('📚 知識ベース一括インポート開始\n')
  console.log(`対象フォルダ: ${KNOWLEDGE_DIR}\n`)

  // 既存の登録済みファイルを確認（重複登録を防ぐ）
  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('source_file')
  const registeredFiles = new Set((existing || []).map(r => r.source_file))
  console.log(`既存登録: ${registeredFiles.size} ファイル\n`)

  const files = collectTxtFiles(KNOWLEDGE_DIR)
  console.log(`検出ファイル数: ${files.length}\n`)

  let totalChunks = 0
  let skipped = 0

  for (const filePath of files) {
    const relPath = path.relative(ROOT, filePath)
    const fileName = path.basename(filePath, '.txt')

    if (registeredFiles.has(relPath)) {
      console.log(`⏭️  スキップ（登録済み）: ${fileName}`)
      skipped++
      continue
    }

    console.log(`\n📄 処理中: ${fileName}`)

    const text = fs.readFileSync(filePath, 'utf8').trim()
    const chunks = chunkText(text)
    console.log(`   チャンク数: ${chunks.length}`)

    const category = detectCategory(filePath)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      process.stdout.write(`   [${i + 1}/${chunks.length}] embedding生成中...`)

      // embedding生成（text-embedding-3-small は安価・高速）
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      })
      const embedding = embeddingRes.data[0].embedding

      // Supabaseに登録
      const { error } = await supabase.from('knowledge_base').insert({
        title: `${fileName}（${i + 1}/${chunks.length}）`,
        content: chunk,
        category,
        source_type: 'audio_transcript',
        source_file: relPath,
        embedding,
      })

      if (error) {
        console.log(` ❌ エラー: ${error.message}`)
      } else {
        process.stdout.write(` ✅\n`)
      }

      totalChunks++

      // レート制限対策（少し待つ）
      if (i < chunks.length - 1) await sleep(200)
    }
  }

  console.log('\n──────────────────────────────')
  console.log(`✅ 完了！`)
  console.log(`   登録チャンク数: ${totalChunks}`)
  console.log(`   スキップ数: ${skipped}`)
  console.log('──────────────────────────────\n')
}

main().catch(err => {
  console.error('❌ エラー:', err)
  process.exit(1)
})
