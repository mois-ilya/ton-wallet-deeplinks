import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import 'github-markdown-css/github-markdown-light.css'
import '../styles/StandardPage.css'

export default function StandardPage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'TON Wallets Deep Links Tester – Standard'

    fetch(import.meta.env.BASE_URL + 'standart.md')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load: ${res.statusText}`)
        return res.text()
      })
      .then(text => {
        // Remove HTML comments
        const cleanedText = text.replace(/<!--[\s\S]*?-->/g, '')
        setContent(cleanedText)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 standard-page-wrapper">
      {loading && <p>Loading standard...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {content && (
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
