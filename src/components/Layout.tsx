import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import Logo from "./Logo";

// Navigation links: bold ALL CAPS with a little space between the letters.
// On phones they're full-width rows inside the hamburger menu; from "md" up they sit in a row.
const navLink = ({ isActive }: { isActive: boolean }) =>
  `block w-full rounded-full px-4 py-3 text-xs font-bold tracking-[0.14em] uppercase md:w-auto md:px-3 md:py-2 ${
    isActive ? "bg-accent-100 text-accent-700" : "text-plum-900 hover:bg-cream-100"
  }`;

export default function Layout() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // Start each new page at the top, and tuck the menu away after navigating.
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the menu and puts focus back on the button.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Lets keyboard users jump past the header. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <header className="border-b border-cream-200 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 px-4 py-3 md:flex-nowrap">
          <Link
            to="/"
            aria-label="Catlas home"
            className="flex items-center gap-2.5 font-serif text-2xl font-semibold text-plum-900"
          >
            <Logo />
            Catlas
          </Link>

          {/* The hamburger button only exists on phones. */}
          <button
            ref={menuButton}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-plum-900 hover:bg-cream-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" focusable="false">
              {menuOpen ? (
                <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              ) : (
                <path d="M4 7 H20 M4 12 H20 M4 17 H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              )}
            </svg>
          </button>

          {/* On phones: hidden until the button is pressed. From "md" up: always a row. */}
          <nav
            id="main-nav"
            aria-label="Main"
            className={`${menuOpen ? "flex" : "hidden"} w-full flex-col gap-1 pt-2 pb-2 md:flex md:w-auto md:flex-row md:items-center md:pt-0 md:pb-0`}
          >
            {user && profile && (
              <NavLink to="/friends" className={navLink} onClick={closeMenu}>
                Friends
              </NavLink>
            )}
            <NavLink to="/request-a-spot" className={navLink} onClick={closeMenu}>
              Request a spot
            </NavLink>
            <NavLink to="/list-your-business" className={navLink} onClick={closeMenu}>
              List your business
            </NavLink>
            <NavLink to="/account" className={navLink} onClick={closeMenu}>
              {user ? "Account" : "Log in"}
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-cream-200 bg-cream-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-sm text-ink-700">
          <p>Catlas is a work in progress for cat owners in Boston. Map data © OpenStreetMap contributors.</p>
          <p>
            Policies change, so please check with a place before you go. Listings marked “Sample” are fictional.
          </p>
        </div>
      </footer>
    </div>
  );
}
