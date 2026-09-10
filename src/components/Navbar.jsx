import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="w-full bg-[#062f2f] border-b border-white/10 relative z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Brand */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
          aria-label="Skill Exchanger Home"
        >
          <img
            src={logo}
            alt="Skill Exchanger Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
          />

          <span className="text-2xl sm:text-3xl font-bold text-white whitespace-nowrap">
            Skill <span className="text-amber-400">Exchanger</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">

          <a
            href="/#discover"
            className="text-gray-200 hover:text-amber-400 transition duration-200"
          >
            Discover
          </a>

          <a
            href="/#how-it-works"
            className="text-gray-200 hover:text-amber-400 transition duration-200"
          >
            How It Works
          </a>

          <a
            href="/#about"
            className="text-gray-200 hover:text-amber-400 transition duration-200"
          >
            About
          </a>

        </div>

        {/* Desktop Authentication */}
        <div className="hidden md:flex items-center gap-3">

          <Link
            to="/login"
            className="px-4 py-2 text-gray-200 hover:text-amber-400 transition duration-200"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition duration-200"
          >
            Sign Up
          </Link>

        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-white/10 transition duration-200"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <span className="text-2xl leading-none">✕</span>
          ) : (
            <span className="text-2xl leading-none">☰</span>
          )}
        </button>

      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#062f2f] shadow-lg">

          <div className="px-6 py-5 flex flex-col gap-2">

            <a
              href="/#discover"
              onClick={closeMenu}
              className="px-4 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-amber-400 transition"
            >
              Discover
            </a>

            <a
              href="/#how-it-works"
              onClick={closeMenu}
              className="px-4 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-amber-400 transition"
            >
              How It Works
            </a>

            <a
              href="/#about"
              onClick={closeMenu}
              className="px-4 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-amber-400 transition"
            >
              About
            </a>

            <div className="border-t border-white/10 my-2"></div>

            <Link
              to="/login"
              onClick={closeMenu}
              className="px-4 py-3 rounded-lg text-gray-200 hover:bg-white/10 transition"
            >
              Login
            </Link>

            <Link
              to="/register"
              onClick={closeMenu}
              className="mt-2 px-5 py-3 bg-amber-500 text-white text-center rounded-lg hover:bg-amber-600 transition"
            >
              Sign Up
            </Link>

          </div>

        </div>
      )}

    </nav>
  );
}

export default Navbar;