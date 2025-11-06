import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../styles/Header.css'

export default function Header() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <header className="app-header">
      <nav className="header-nav">
        <div className="header-title">TON Wallets Deep Links</div>

        <button
          className="header-burger"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`header-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link
            to="/"
            className={`header-link ${isActive('/') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Results
          </Link>
          <Link
            to="/tests"
            className={`header-link ${isActive('/tests') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Tests
          </Link>
          <Link
            to="/standard"
            className={`header-link ${isActive('/standard') ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            Standard
          </Link>
        </div>
      </nav>
    </header>
  )
}
