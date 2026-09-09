import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompass,
  faListCheck,
  faCircleInfo,
  faRightToBracket,
  faUserPlus,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";

import logo from "../assets/images/logo.png";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-gray-900 text-gray-300">

      <div className="max-w-7xl mx-auto px-6 py-14">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>

            <Link
              to="/"
              className="inline-flex items-center gap-3 cursor-pointer"
            >
              <img
                src={logo}
                alt="Skill Exchanger Logo"
                className="h-12 w-auto object-contain"
              />

              <span className="text-xl font-bold text-white">
                Skill <span className="text-amber-400">Exchanger</span>
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-gray-400 leading-relaxed">
              Learn new skills, share what you know, and connect with
              people who want to grow together.
            </p>

          </div>

          {/* Platform */}
          <div>

            <h3 className="text-white font-semibold text-lg">
              Platform
            </h3>

            <div className="mt-5 flex flex-col gap-3">

              <a
                href="/#discover"
                className="flex items-center gap-3 hover:text-white transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faCompass} />
                Discover
              </a>

              <a
                href="/#how-it-works"
                className="flex items-center gap-3 hover:text-white transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faListCheck} />
                How It Works
              </a>

              <a
                href="/#about"
                className="flex items-center gap-3 hover:text-white transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faCircleInfo} />
                About
              </a>

            </div>

          </div>

          {/* Account */}
          <div>

            <h3 className="text-white font-semibold text-lg">
              Account
            </h3>

            <div className="mt-5 flex flex-col gap-3">

              <Link
                to="/login"
                className="flex items-center gap-3 hover:text-white transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faRightToBracket} />
                Login
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-3 hover:text-white transition cursor-pointer"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                Sign Up
              </Link>

            </div>

          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Skill Exchanger. All rights reserved.
          </p>

          <div className="flex items-center gap-5">

            <p className="text-sm text-gray-500">
              Learn • Teach • Connect
            </p>

            <button
              type="button"
              onClick={scrollToTop}
              className="w-9 h-9 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition cursor-pointer"
              aria-label="Back to top"
            >
              <FontAwesomeIcon icon={faArrowUp} />
            </button>

          </div>

        </div>

      </div>

    </footer>
  );
}

export default Footer;