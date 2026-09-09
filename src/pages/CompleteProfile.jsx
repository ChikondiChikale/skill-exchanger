import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUser,
  faAt,
  faGlobe,
  faBriefcase,
  faLocationDot,
  faArrowRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";

function CompleteProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    country: "",
    city: "",
    occupation: "",
    bio: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Basic validation
    if (
      !formData.fullName.trim() ||
      !formData.username.trim() ||
      !formData.country.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      // Get current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/login");
        return;
      }

      // Insert profile into database
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,

          full_name: formData.fullName.trim(),

          username: formData.username
            .trim()
            .toLowerCase(),

          country: formData.country.trim(),

          city: formData.city.trim(),

          occupation: formData.occupation.trim(),

          bio: formData.bio.trim(),

          profile_completed: true,

          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      // Update Supabase Auth metadata too
      await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName.trim(),
          username: formData.username.trim(),
        },
      });

      // Go to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Profile error:", err);

      if (err.code === "23505") {
        setError(
          "This username is already taken. Please choose another one."
        );
      } else {
        setError(
          err.message || "Failed to save your profile."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf2] flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-2xl">

        {/* LOGO */}

        <div className="flex justify-center mb-8">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-[#062f2f] text-[#fbbf24] flex items-center justify-center font-extrabold text-xl shadow-lg">
              S
            </div>

            <div>

              <div className="text-xl font-extrabold text-[#062f2f] leading-tight">
                Skill
              </div>

              <div className="text-xl font-extrabold text-[#f59e0b] leading-tight">
                Exchanger
              </div>

            </div>

          </div>

        </div>

        {/* CARD */}

        <div className="bg-white border border-[#d9e7df] rounded-[28px] shadow-sm overflow-hidden">

          {/* HEADER */}

          <div className="bg-[#062f2f] px-6 sm:px-10 py-8 text-white">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#fbbf24] text-xs font-bold mb-4">

              Almost there

            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold">

              Complete your profile

            </h1>

            <p className="mt-2 text-white/65">

              Tell the Skill Exchanger community a little about yourself.

            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10"
          >

            {/* ERROR */}

            {error && (

              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">

                {error}

              </div>

            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {/* FULL NAME */}

              <div className="sm:col-span-2">

                <label className="block text-sm font-bold mb-2">

                  Full Name
                  <span className="text-red-500"> *</span>

                </label>

                <div className="relative">

                  <FontAwesomeIcon
                    icon={faUser}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition"
                  />

                </div>

              </div>

              {/* USERNAME */}

              <div className="sm:col-span-2">

                <label className="block text-sm font-bold mb-2">

                  Username
                  <span className="text-red-500"> *</span>

                </label>

                <div className="relative">

                  <FontAwesomeIcon
                    icon={faAt}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a unique username"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition"
                  />

                </div>

                <p className="mt-2 text-xs text-gray-400">

                  Your username will help other members identify you.

                </p>

              </div>

              {/* COUNTRY */}

              <div>

                <label className="block text-sm font-bold mb-2">

                  Country
                  <span className="text-red-500"> *</span>

                </label>

                <div className="relative">

                  <FontAwesomeIcon
                    icon={faGlobe}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. Malawi"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition"
                  />

                </div>

              </div>

              {/* CITY */}

              <div>

                <label className="block text-sm font-bold mb-2">

                  City

                </label>

                <div className="relative">

                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Mzuzu"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition"
                  />

                </div>

              </div>

              {/* OCCUPATION */}

              <div className="sm:col-span-2">

                <label className="block text-sm font-bold mb-2">

                  Occupation

                </label>

                <div className="relative">

                  <FontAwesomeIcon
                    icon={faBriefcase}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="e.g. Student, Developer, Designer"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition"
                  />

                </div>

              </div>

              {/* BIO */}

              <div className="sm:col-span-2">

                <label className="block text-sm font-bold mb-2">

                  About You

                </label>

                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell people a little about yourself, your interests, and what you enjoy learning or teaching..."
                  className="w-full px-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none resize-none focus:ring-2 focus:ring-[#0f766e]/20 focus:border-[#0f766e] transition"
                />

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 py-4 rounded-xl bg-[#062f2f] hover:bg-[#0f766e] text-white font-bold transition flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (

                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                  />

                  Saving Profile...

                </>

              ) : (

                <>
                  Complete Profile

                  <FontAwesomeIcon
                    icon={faArrowRight}
                  />

                </>

              )}

            </button>

          </form>

        </div>

        {/* FOOTER */}

        <p className="text-center text-xs text-gray-400 mt-6">

          You can update this information anytime from Settings.

        </p>

      </div>

    </div>
  );
}

export default CompleteProfile;