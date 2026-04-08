import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'
import appCss from './App.css?raw'

// ─── Constants ───────────────────────────────────────────────────────────────

const THEMES = {
  purple: { label: 'Purple', accent: '#aa3bff', accentBg: 'rgba(170,59,255,0.1)' },
  blue:   { label: 'Blue',   accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.1)'  },
  red:    { label: 'Red',    accent: '#ef4444', accentBg: 'rgba(239,68,68,0.1)'   },
  green:  { label: 'Green',  accent: '#22c55e', accentBg: 'rgba(34,197,94,0.1)'   },
  black:  { label: 'Black',  accent: '#374151', accentBg: 'rgba(55,65,81,0.1)'    },
} as const

type ThemeKey = keyof typeof THEMES

const INLINE_PROPS = [
  'color', 'background-color',
  'border-left', 'border-right', 'border-top', 'border-bottom',
  'font-size', 'font-weight', 'font-style', 'font-family',
  'text-decoration', 'padding', 'margin',
  'direction', 'unicode-bidi',
]

const INITIAL_CONTENT = `# 📌 عنوان رئيسي (H1)

## 🔹 عنوان فرعي (H2)

نص عادي يحتوي على **خط عريض** و *خط مائل* و ***كلاهما***، مع استخدام \`inline code\` داخل الجملة.

> هذا اقتباس (blockquote)
>
> > اقتباس متداخل

---

### 📋 قائمة غير مرتبة

* عنصر أول
* عنصر ثاني

  * عنصر فرعي
  * عنصر فرعي آخر
* عنصر ثالث

### 🔢 قائمة مرتبة

1. خطوة أولى
2. خطوة ثانية

   1. خطوة فرعية
   2. خطوة فرعية أخرى
3. خطوة ثالثة

---

### 🔗 روابط وصور

[اذهب إلى Google](https://www.google.com)

![صورة تجريبية](https://placehold.co/300)

---

### 💻 كود برمجي

\`\`\`javascript
function calculateTotal(price, tax) {
  const total = price + (price * tax);
  return total.toFixed(2);
}

console.log(calculateTotal(100, 0.15));
\`\`\`

\`\`\`php
<?php
function greet($name) {
    return "Hello, " . $name;
}
echo greet("Bakri");
\`\`\`

---

### 📊 جدول

| الاسم | العمر | الوظيفة     |
| ----- | ----- | ----------- |
| بكري  | 39    | مهندس برمجيات |
| أحمد  | 28    | مطور        |
| سارة  | 32    | مصممة       |
| خالد  | 25    | محلل بيانات |


---

### ⚠️ قائمة مهام (Task List)

* [x] إنشاء المشروع
* [x] كتابة الكود
* [ ] اختبار النظام
* [ ] النشر

---

### 🧠 ملاحظات إضافية

* يمكن استخدام ~~نص مشطوب~~ عند الحاجة.
* دعم الرموز التعبيرية 😄.
* يمكن دمج أكثر من ميزة في نفس السطر: **نص عريض مع [رابط](https://example.com)**.
`

// ─── Export helpers ───────────────────────────────────────────────────────────

function inlineStyles(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement
  const origEls  = Array.from(root.querySelectorAll<HTMLElement>('*'))
  const cloneEls = Array.from(clone.querySelectorAll<HTMLElement>('*'))
  origEls.forEach((orig, i) => {
    const cs = getComputedStyle(orig)
    for (const prop of INLINE_PROPS) {
      const val = cs.getPropertyValue(prop)
      if (val) cloneEls[i].style.setProperty(prop, val)
    }
  })
  return `<!DOCTYPE html><html><body>${clone.outerHTML}</body></html>`
}

function buildPageHtml(root: HTMLElement, theme: ThemeKey, rtl: boolean, extraStyles = ''): string {
  const { accent, accentBg } = THEMES[theme]
  const dir = rtl ? 'rtl' : 'ltr'
  return `<!DOCTYPE html>
<html lang="${rtl ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <style>
    :root {
      --text: #6b6375; --text-h: #08060d; --bg: #fff; --border: #e5e4e7;
      --code-bg: #f4f3ec; --accent: ${accent}; --accent-bg: ${accentBg};
      --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
      --mono: ui-monospace, Consolas, monospace;
      font: 18px/145% var(--sans);
      letter-spacing: 0.18px;
      color: var(--text);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --text: #9ca3af; --text-h: #f3f4f6; --bg: #16171d;
        --border: #2e303a; --code-bg: #1f2028;
      }
    }
    body { margin: 0; background: var(--bg); }
    ${appCss}
    .markdown-body { flex: unset; overflow-y: unset; height: unset; max-width: 780px; margin: 40px auto; padding: 40px; }
    ${extraStyles}
  </style>
</head>
<body>
  <div class="markdown-body" dir="${dir}">${root.innerHTML}</div>
</body>
</html>`
}

function downloadHtml(root: HTMLElement, theme: ThemeKey, rtl: boolean): void {
  const html = buildPageHtml(root, theme, rtl)
  const url  = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'export.html' })
  a.click()
  URL.revokeObjectURL(url)
}

function printAsPage(root: HTMLElement, theme: ThemeKey, rtl: boolean): void {
  const pageStyle = `@media print { .markdown-body { margin: 0; padding: 0; max-width: 100%; width: 100%; } }`
  const html = buildPageHtml(root, theme, rtl, pageStyle)
  const url  = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  const win  = window.open(url, '_blank')
  if (!win) { URL.revokeObjectURL(url); return }
  win.onafterprint = () => win.close()
  win.onload = () => { win.print(); URL.revokeObjectURL(url) }
}

// ─── Components ───────────────────────────────────────────────────────────────

function CopyButton({ getText, getHtml }: { getText: () => string; getHtml?: () => string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = async () => {
    if (getHtml) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html':  new Blob([getHtml()],  { type: 'text/html'  }),
          'text/plain': new Blob([getText()], { type: 'text/plain' }),
        }),
      ])
    } else {
      await navigator.clipboard.writeText(getText())
    }
    setCopied(true)
  }

  return (
    <button className={`pane-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [content, setContent]     = useState(INITIAL_CONTENT)
  const [rtl, setRtl]             = useState(true)
  const [theme, setTheme]         = useState<ThemeKey>('blue')
  const [previewLen, setPreviewLen] = useState(0)
  const [syncScroll, setSyncScroll] = useState(true)
  const previewRef   = useRef<HTMLDivElement>(null)
  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const syncingFrom  = useRef<'editor' | 'preview' | null>(null)

  useEffect(() => {
    setPreviewLen(previewRef.current?.innerText.replace(/\n/g, '').length ?? 0)
  }, [content])

  const handleEditorScroll = () => {
    if (!syncScroll || syncingFrom.current === 'preview') return
    const editor  = textareaRef.current
    const preview = previewRef.current
    if (!editor || !preview) return
    syncingFrom.current = 'editor'
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight)
    syncingFrom.current = null
  }

  const handlePreviewScroll = () => {
    if (!syncScroll || syncingFrom.current === 'editor') return
    const editor  = textareaRef.current
    const preview = previewRef.current
    if (!editor || !preview) return
    syncingFrom.current = 'preview'
    const ratio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight)
    syncingFrom.current = null
  }

  return (
    <div className="app">
      <header className="toolbar">
        <span className="toolbar-title">Md Rtl Viewer</span>
        <label className="sync-label">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
          />
          sync scroll
        </label>
      </header>

      <main className="editor-area">
        <div className="pane pane-editor">
          <div className="pane-label">
            Markdown
            <CopyButton getText={() => content} />
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onScroll={handleEditorScroll}
            spellCheck={false}
          />
        </div>

        <div className="pane pane-preview">
          <div className="pane-label">
            Preview
            <div className="pane-actions">
              <div className="theme-swatches">
                {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                  <button
                    key={key}
                    className={`theme-swatch ${theme === key ? 'active' : ''}`}
                    style={{ '--swatch-color': THEMES[key].accent } as React.CSSProperties}
                    onClick={() => setTheme(key)}
                    title={THEMES[key].label}
                  />
                ))}
              </div>
              <CopyButton
                getText={() => previewRef.current?.innerText ?? ''}
                getHtml={() => previewRef.current ? inlineStyles(previewRef.current) : ''}
              />
              <button
                className="pane-btn"
                onClick={() => previewRef.current && downloadHtml(previewRef.current, theme, rtl)}
              >
                Export HTML
              </button>
              <button
                className="pane-btn"
                onClick={() => previewRef.current && printAsPage(previewRef.current, theme, rtl)}
              >
                Export PDF
              </button>
              <button
                className={`pane-btn ${rtl ? 'active' : ''}`}
                onClick={() => setRtl((v) => !v)}
                title="Toggle text direction"
              >
                {rtl ? 'RTL' : 'LTR'}
              </button>
            </div>
          </div>
          <div
            className="markdown-body"
            dir={rtl ? 'rtl' : 'ltr'}
            ref={previewRef}
            onScroll={handlePreviewScroll}
            style={{
              '--accent':    THEMES[theme].accent,
              '--accent-bg': THEMES[theme].accentBg,
            } as React.CSSProperties}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </main>

      <footer className="statusbar">
        <span>
          Powered by{' '}
          <a href="https://github.com/bakrialloush/" target="_blank" rel="noreferrer">
            Bakri Alloush
          </a>
        </span>
        <span>{previewLen.toLocaleString()} chars</span>
      </footer>
    </div>
  )
}
