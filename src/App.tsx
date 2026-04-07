import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

const INITIAL_CONTENT = `# Hello, Markdown!

Write your **markdown** here and toggle to see the _rendered_ output.

## Features

- [x] Bold, italic, strikethrough
- [x] Headings
- [x] Lists (ordered & unordered)
- [x] Links and images
- [x] Code blocks
- [x] Tables

## Code Example

\`\`\`ts
function greet(name: string) {
  return \`Hello, \${name}!\`
}
\`\`\`

## Table

| Name  | Type   | Default |
|-------|--------|---------|
| text  | string | ""      |
| count | number | 0       |

> Start editing on the left — or paste your own markdown.
`

function CopyButton({ getText, getHtml }: { getText: () => string; getHtml?: () => string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (getHtml) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([getHtml()], { type: 'text/html' }),
          'text/plain': new Blob([getText()], { type: 'text/plain' }),
        }),
      ])
    } else {
      await navigator.clipboard.writeText(getText())
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function App() {
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [rtl, setRtl] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  return (
    <div className="app">
      <header className="toolbar">
        <span className="toolbar-title">md editor</span>
      </header>

      <main className="editor-area">
        <div className="pane pane-editor">
          <div className="pane-label">
            Markdown
            <CopyButton getText={() => content} />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="pane pane-preview">
          <div className="pane-label">
            Preview
            <div className="pane-actions">
              <CopyButton
                getText={() => previewRef.current?.innerText ?? ''}
                getHtml={() => previewRef.current?.innerHTML ?? ''}
              />
              <button
                className={`dir-toggle ${rtl ? 'active' : ''}`}
                onClick={() => setRtl((v) => !v)}
                title="Toggle text direction"
              >
                {rtl ? 'RTL' : 'LTR'}
              </button>
            </div>
          </div>
          <div className="markdown-body" dir={rtl ? 'rtl' : 'ltr'} ref={previewRef}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  )
}
