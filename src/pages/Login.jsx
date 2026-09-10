
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faCircleExclamation,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";
import { redirectAfterAuth } from "../lib/authHelpers";

// Google icon
function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
      />

      <path
        fill="#34A853"
        d="M12 21.6c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.6z"
      />

      <path
        fill="#FBBC05"
        d="M6.53 13.69A5.85 5.85 0 0 1 6.23 12c0-.59.1-1.17.3-1.69V7.78H3.29A9.73 9.73 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.22l3.24-2.53z"
      />

      <path
        fill="#EA4335"
        d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.37 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.71 5.38l3.24 2.53C7.3 8 9.46 6.28 12 6.28z"
      />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  // ================= EMAIL LOGIN =================

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      // Check profile after successful login
      await redirectAfterAuth(navigate, location.state?.from || "/dashboard");

    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message ||
          "Invalid email or password. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE LOGIN =================

  const handleGoogleLogin = async () => {
    setError("");

    try {
      setGoogleLoading(true);

      const { error: googleError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo:
              window.location.origin + "/auth/callback",
            queryParams: {
              prompt: "select_account",
            },
          },
        });

      if (googleError) {
        throw googleError;
      }

      // Browser will redirect to Google.
      // Do not set loading false here because
      // the page is about to change.

    } catch (error) {
      console.error("Google login error:", error);

      setError(
        error.message ||
          "Google authentication failed."
      );

      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setError("");

    const email = resetEmail.trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });

      if (resetError) throw resetError;
      setResetSent(true);
    } catch (resetError) {
      setError(resetError.message || "Unable to send the password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf2] flex items-center justify-center px-6 py-12">

      <div className="w-full max-w-md">

        {/* Brand */}

        <div className="text-center mb-8">

          <Link
            to="/"
            className="inline-block cursor-pointer"
          >

            <h1 className="text-3xl font-bold text-[#062f2f]">

              Skill{" "}

              <span className="text-amber-500">
                Exchanger
              </span>

            </h1>

          </Link>

          <p className="mt-2 text-gray-600">
            Welcome back. Sign in to continue.
          </p>

        </div>

        {/* Login card */}

        <div className="bg-white rounded-lg shadow-sm border border-[#d9e7df] p-8">

          <h2 className="text-2xl font-bold text-[#062f2f]">
            {forgotMode ? "Reset your password" : "Welcome Back"}
          </h2>

          <p className="mt-2 text-gray-500">
            {forgotMode ? "Enter your email and we will send you a secure reset link." : "Login to your Skill Exchanger account."}
          </p>

          {/* Error */}

          {error && (

            <div className="mt-6 flex gap-3 items-start p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">

              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5"
              />

              <p className="text-sm">
                {error}
              </p>

            </div>

          )}

          {/* Form */}

          {forgotMode ? (
            <form onSubmit={handlePasswordReset} className="mt-8 space-y-5">
              {resetSent ? (
                <div className="rounded-lg border border-[#99f6e4] bg-[#f0fdfa] p-4 text-sm text-[#0f766e]">
                  Check your email for a password reset link.
                </div>
              ) : (
                <div>
                  <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]"
                  />
                </div>
              )}
              {!resetSent && <button type="submit" disabled={loading} className="w-full rounded-lg bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50">{loading ? "Sending..." : "Send reset link"}</button>}
              <button type="button" onClick={() => { setForgotMode(false); setResetSent(false); setError(""); }} className="w-full text-sm font-semibold text-[#0f766e]">Back to login</button>
            </form>
          ) : (
          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
          >

            {/* Email */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>

              <div className="relative">

                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading || googleLoading}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition disabled:bg-gray-100"
                />

              </div>

            </div>

            {/* Password */}

            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm text-amber-600 hover:text-amber-700 cursor-pointer"
                  onClick={() => { setForgotMode(true); setResetEmail(formData.email); setError(""); }}
                >
                  Forgot password?
                </button>

              </div>

              <div className="relative">

                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading || googleLoading}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#0f766e] focus:border-[#0f766e] transition disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0f766e] cursor-pointer"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  <FontAwesomeIcon
                    icon={
                      showPassword
                        ? faEyeSlash
                        : faEye
                    }
                  />

                </button>

              </div>

            </div>

            {/* Login Button */}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition ${
                loading || googleLoading
                  ? "bg-amber-300 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 cursor-pointer"
              }`}
            >

              {loading ? (

                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                  />

                  Signing In...

                </>

              ) : (

                "Login"

              )}

            </button>

          </form>
          )}

          {/* Divider */}

          <div className="flex items-center gap-4 my-6">

            <div className="flex-1 h-px bg-gray-200" />

            <span className="text-sm text-gray-400">
              OR
            </span>

            <div className="flex-1 h-px bg-gray-200" />

          </div>

          {/* Google Login */}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className={`w-full py-3 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-3 text-gray-700 font-medium transition ${
              loading || googleLoading
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 cursor-pointer"
            }`}
          >

            {googleLoading ? (

              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                />

                Connecting...

              </>

            ) : (

              <>
                <GoogleIcon />

                Continue with Google
              </>

            )}

          </button>

          {/* Register */}

          <p className="mt-6 text-center text-sm text-gray-600">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-amber-600 font-semibold hover:text-amber-700 cursor-pointer"
            >
              Sign Up
            </Link>

          </p>

        </div>

        {/* Back home */}

        <div className="text-center mt-6">

          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-amber-600 cursor-pointer"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;
