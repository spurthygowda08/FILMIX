import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    navigate(`/?q=${encodeURIComponent(value)}`);

    setSearchOpen(false);
    setOpen(false);
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const toggleSearch = () => {
    setSearchOpen((value) => !value);
    setOpen(false);
  };

  return (
    <header className="nav">
      <div className="nav-inner">

        {/* BRAND */}
        <Link
          to="/"
          className="brand"
          onClick={closeMenu}
          aria-label="FILMIX home"
        >
          <span className="brand-main">FILM</span>
          <span className="brand-accent">IX</span>
        </Link>

        {/* NAVIGATION */}
        <nav
          className={`nav-links ${open ? "open" : ""}`}
          aria-label="Primary navigation"
        >
          <NavLink
            to="/"
            end
            onClick={closeMenu}
          >
            Home
          </NavLink>

          <a
            href="/#discover"
            onClick={closeMenu}
          >
            Discover
          </a>

          <NavLink
            to="/wishlist"
            onClick={closeMenu}
          >
            My Collection
          </NavLink>
        </nav>

        {/* ACTIONS */}
        <div className="nav-actions">

          {/* SEARCH BUTTON */}
          <button
            type="button"
            className={`icon-btn search-toggle ${
              searchOpen ? "active" : ""
            }`}
            onClick={toggleSearch}
            aria-label="Search movies"
            aria-expanded={searchOpen}
            title="Search movies"
          >
            <span
              aria-hidden="true"
              className="search-icon"
            />
          </button>

          {/* MOBILE MENU */}
          <button
            type="button"
            className={`menu-btn ${open ? "active" : ""}`}
            onClick={() => {
              setOpen((value) => !value);
              setSearchOpen(false);
            }}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <span />
            <span />
            <span />
          </button>

        </div>
      </div>

      {/* NAVBAR SEARCH */}
      <div
        className={`nav-search-wrapper ${
          searchOpen ? "visible" : ""
        }`}
      >
        {searchOpen && (
          <form
            className="nav-search"
            onSubmit={submitSearch}
          >
            <span
              aria-hidden="true"
              className="search-icon"
            />

            <input
              autoFocus
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search movies..."
              aria-label="Search for a movie"
            />

            <button type="submit">
              Search
            </button>
          </form>
        )}
      </div>
    </header>
  );
}