import { useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const navigate = useNavigate();

  /* =========================================================
     SEARCH SUBMIT
  ========================================================= */

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();

    const value = query.trim();

    if (!value) return;

    // Start a clean movie search
    navigate(`/?q=${encodeURIComponent(value)}`);

    // Close search and mobile menu
    setSearchOpen(false);
    setOpen(false);
  };


  /* =========================================================
     CLOSE MOBILE MENU
  ========================================================= */

  const closeMenu = () => {
    setOpen(false);
  };


  /* =========================================================
     TOGGLE SEARCH
  ========================================================= */

  const toggleSearch = () => {
    setSearchOpen((value) => !value);

    // Close mobile navigation when search opens
    setOpen(false);
  };


  /* =========================================================
     CLOSE SEARCH
  ========================================================= */

  const closeSearch = () => {
    setSearchOpen(false);
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <header className="nav">

      <div className="nav-inner">

        {/* =================================================
            BRAND
        ================================================= */}

        <Link
          to="/"
          className="brand"
          onClick={() => {
            closeMenu();
            closeSearch();
          }}
          aria-label="FILMIX home"
        >
          <span className="brand-main">
            FILM
          </span>

          <span className="brand-accent">
            IX
          </span>
        </Link>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className={`nav-links ${
            open ? "open" : ""
          }`}
          aria-label="Primary navigation"
        >

          {/* HOME */}

          <NavLink
            to="/"
            end
            onClick={closeMenu}
          >
            Home
          </NavLink>


          {/* DISCOVER */}

          <a
            href="/#discover"
            onClick={closeMenu}
          >
            Discover
          </a>


          {/* MY COLLECTION */}

          <NavLink
            to="/wishlist"
            onClick={closeMenu}
          >
            My Collection
          </NavLink>

        </nav>


        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="nav-actions">

          {/* =================================================
              SEARCH BUTTON
          ================================================= */}

          <button
            type="button"
            className={`icon-btn search-toggle ${
              searchOpen ? "active" : ""
            }`}
            onClick={toggleSearch}
            aria-label={
              searchOpen
                ? "Close search"
                : "Search movies"
            }
            aria-expanded={searchOpen}
            title={
              searchOpen
                ? "Close search"
                : "Search movies"
            }
          >

            <span
              aria-hidden="true"
              className="search-icon"
            />

          </button>


          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <button
            type="button"
            className={`menu-btn ${
              open ? "active" : ""
            }`}
            onClick={() => {
              setOpen((value) => !value);
              setSearchOpen(false);
            }}
            aria-label={
              open
                ? "Close navigation"
                : "Toggle navigation"
            }
            aria-expanded={open}
          >

            <span />
            <span />
            <span />

          </button>

        </div>

      </div>


      {/* =====================================================
          NAVBAR SEARCH
      ===================================================== */}

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

            {/* SEARCH ICON */}

            <span
              aria-hidden="true"
              className="search-icon"
            />


            {/* SEARCH INPUT */}

            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search movies..."
              aria-label="Search for a movie"
              autoComplete="off"
            />


            {/* =================================================
                SEARCH BUTTON

                IMPORTANT:
                The custom white × button has been removed.
                The browser's native blue × remains.
            ================================================= */}

            <button type="submit">
              Search
            </button>

          </form>

        )}

      </div>

    </header>
  );
}