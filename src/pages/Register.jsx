
import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faUser,
  faEnvelope,
  faLock,
  faCircleExclamation,
  faCircleCheck,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";

// Google logo
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
        d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.37 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.71 5.38l3.24 2.53 3.24 2.53C7.3 8 9.46 6.28 12 6.28z"
      />
    </svg>
  );
}

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Register user
  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const {
      name,
      email,
      password,
      confirmPassword,
    } = formData;

    // Required fields
    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    // Password length
    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    data: {
      full_name: name.trim(),
    },
    emailRedirectTo: `${window.location.origin}/dashboard`,
  },
});

      if (error) {
        throw error;
      }

      if (data.user) {
        setSuccess(
          "Account created successfully! Please check your email and click the confirmation link to verify your account."
        );

        // Clear form after successful registration
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      setError(
        error.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");

    try {
      setGoogleLoading(true);

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              `${window.location.origin}/dashboard`,
          },
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      setError(
        error.message ||
          "Google authentication failed."
      );

      setGoogleLoading(false);
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
            Create your account and start exchanging
            skills.
          </p>

        </div>

        {/* Register Card */}
        <div className="bg-white rounded-lg shadow-sm border border-[#d9e7df] p-8">

          <h2 className="text-2xl font-bold text-[#062f2f]">
            Create Account
          </h2>

          <p className="mt-2 text-gray-500">
            Join the Skill Exchanger community.
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

          {/* Success */}
          {success && (
            <div className="mt-6 flex gap-3 items-start p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">

              <FontAwesomeIcon
                icon={faCircleCheck}
                className="mt-0.5"
              />

              <p className="text-sm">
                {success}
              </p>

            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleRegister}
            className="mt-8 space-y-5"
          >

            {/* Full Name */}
            <div>

              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>

              <div className="relative">

                <FontAwesomeIcon
                  icon={faUser}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  disabled={loading || googleLoading}
                  autoComplete="name"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                />

              </div>

            </div>

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
                  disabled={loading || googleLoading}
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                />

              </div>

            </div>

            {/* Password */}
            <div>

              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

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
                  placeholder="Create a password"
                  disabled={loading || googleLoading}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer"
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

            {/* Confirm Password */}
            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>

              <div className="relative">

                <FontAwesomeIcon
                  icon={faLock}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={loading || googleLoading}
                  autoComplete="new-password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 cursor-pointer"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <FontAwesomeIcon
                    icon={
                      showConfirmPassword
                        ? faEyeSlash
                        : faEye
                    }
                  />
                </button>

              </div>

            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`w-full py-3 text-white rounded-lg font-semibold transition duration-200 flex items-center justify-center gap-2 ${
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

                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}

            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">

            <div className="flex-1 h-px bg-gray-200" />

            <span className="text-sm text-gray-400">
              OR
            </span>

            <div className="flex-1 h-px bg-gray-200" />

          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className={`w-full py-3 bg-white border border-gray-300 rounded-lg flex items-center justify-center gap-3 text-gray-700 font-medium transition duration-200 ${
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

          {/* Login */}
          <p className="mt-6 text-center text-sm text-gray-600">

            Already have an account?{" "}

            <Link
              to="/login"
              className="text-amber-600 font-semibold hover:text-amber-700 transition cursor-pointer"
            >
              Login
            </Link>

          </p>

        </div>

        {/* Back Home */}
        <div className="text-center mt-6">

          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-amber-600 transition cursor-pointer"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;
