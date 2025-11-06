import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import '../styles/StandardPage.css'

export default function StandardPage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'TON Wallets Deep Links Tester – Standard'

    fetch('/ton-wallet-deeplinks/standart.md')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load: ${res.statusText}`)
        return res.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="standard-page-content">
      {loading && <p>Loading standard...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {content && (
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
