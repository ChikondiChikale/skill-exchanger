import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faHouse,
  faCompass,
  faGraduationCap,
  faComments,
  faGear,
  faRightFromBracket,
  faBars,
  faXmark,
  faBell,
  faChevronDown,
  faUser,
  faArrowRight,
  faPeopleGroup,
  faBookOpen,
  faHandshake,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";

function Dashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [teachCount, setTeachCount] = useState(0);
  const [learnCount, setLearnCount] = useState(0);

  const [loading, setLoading] = useState(true);

  // =========================================================
  // LOAD USER + PROFILE + SKILLS
  // =========================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        // Get currently logged-in user
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!currentUser) {
          navigate("/login");
          return;
        }

        setUser(currentUser);

        // -----------------------------------------------------
        // Get profile from profiles table
        // -----------------------------------------------------

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, bio, country, city, occupation, avatar_url, profile_completed"
          )
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        // If profile doesn't exist or isn't complete,
        // send user back to Complete Profile.
        if (
          !profileData ||
          profileData.profile_completed !== true
        ) {
          navigate("/complete-profile");
          return;
        }

        setProfile(profileData);

        // -----------------------------------------------------
        // Get teaching and learning skill counts
        // -----------------------------------------------------

        const [
          { count: teachingCount, error: teachingError },
          { count: learningCount, error: learningError },
        ] = await Promise.all([
          supabase
            .from("skills")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", currentUser.id)
            .eq("skill_type", "teach"),

          supabase
            .from("skills")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("user_id", currentUser.id)
            .eq("skill_type", "learn"),
        ]);

        if (teachingError) {
          console.error(
            "Teaching skills error:",
            teachingError
          );
        }

        if (learningError) {
          console.error(
            "Learning skills error:",
            learningError
          );
        }

        setTeachCount(teachingCount || 0);
        setLearnCount(learningCount || 0);
      } catch (error) {
        console.error(
          "Dashboard loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // =========================================================
  // PROFILE DISPLAY HELPERS
  // =========================================================

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Member";

  const occupation =
    profile?.occupation || "Member";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[#062f2f] text-[#fbbf24] flex items-center justify-center mb-5">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-lg"
            />
          </div>

          <h1 className="text-lg font-bold text-[#062f2f]">
            Loading your dashboard...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait while we load your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffdf2] text-gray-900">

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          bg-[#062f2f] border-r border-white/10
          flex flex-col
          transform transition-transform duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Logo */}

        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">

          <Link
            to="/dashboard"
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
              S
            </div>

            <span className="text-lg font-bold text-white">
              Skill{" "}
              <span className="text-amber-400">
                Exchanger
              </span>
            </span>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

        </div>

        {/* Navigation */}

        <nav className="flex-1 px-4 py-6">

          <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </p>

          <div className="space-y-1">

            {/* Dashboard */}

            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg bg-amber-500 text-white font-medium cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faHouse}
                className="w-5"
              />

              Dashboard
            </Link>

            {/* Discover */}

            <Link
              to="/discover"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faCompass}
                className="w-5"
              />

              Discover
            </Link>

            {/* My Skills */}

            <Link
              to="/skills"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faGraduationCap}
                className="w-5"
              />

              My Skills
            </Link>

            {/* Messages */}

            <Link
              to="/messages"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <div className="flex items-center gap-3">

                <FontAwesomeIcon
                  icon={faComments}
                  className="w-5"
                />

                Messages

              </div>

              <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                0
              </span>

            </Link>

          </div>

          {/* More */}

          <div className="mt-10">

            <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              More
            </p>

            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faGear}
                className="w-5"
              />

              Settings
            </Link>

          </div>

        </nav>

        {/* Logout */}

        <div className="p-4 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-gray-200 hover:bg-red-500/20 hover:text-red-300 transition cursor-pointer"
          >
            <FontAwesomeIcon
              icon={faRightFromBracket}
              className="w-5"
            />

            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="lg:ml-64">

        {/* ===================================================
            TOPBAR
        ==================================================== */}

        <header className="h-20 bg-white border-b border-[#d9e7df] flex items-center justify-between px-5 sm:px-8">

          {/* Mobile menu */}

          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          {/* Desktop title */}

          <div className="hidden lg:block">

            <p className="text-sm text-gray-500">
              Skill Exchanger
            </p>

            <h1 className="text-lg font-semibold">
              Dashboard
            </h1>

          </div>

          {/* Right side */}

          <div className="flex items-center gap-4 ml-auto">

            {/* Notifications */}

            <button
              className="relative w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              title="Notifications"
            >
              <FontAwesomeIcon
                icon={faBell}
                className="text-gray-600"
              />

              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* Profile */}

            <div className="relative">

              <button
                onClick={() =>
                  setProfileMenuOpen(
                    (previous) => !previous
                  )
                }
                className="flex items-center gap-3 cursor-pointer"
              >

                {/* Avatar */}

                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-[#d9e7df]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    {initials}
                  </div>
                )}

                <div className="hidden sm:block text-left">

                  <p className="text-sm font-semibold">
                    {displayName}
                  </p>

                  <p className="text-xs text-gray-500">
                    {occupation}
                  </p>

                </div>

                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="text-xs text-gray-400"
                />

              </button>

              {/* Profile dropdown */}

              {profileMenuOpen && (
                <div className="absolute right-0 top-14 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-30">

                  <Link
                    to="/settings"
                    onClick={() =>
                      setProfileMenuOpen(false)
                    }
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={faUser}
                    />

                    Profile & Settings
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={faRightFromBracket}
                    />

                    Logout
                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* ===================================================
            CONTENT
        ==================================================== */}

        <main className="p-5 sm:p-8 max-w-7xl mx-auto">

          {/* Welcome */}

          <section className="mb-8">

            <h2 className="text-2xl sm:text-3xl font-bold">

              Welcome back,{" "}
              {displayName.split(" ")[0]}

            </h2>

            <p className="mt-2 text-gray-500">
              Discover people, exchange skills, and
              grow together.
            </p>

          </section>

          {/* =================================================
              QUICK ACTION
          ================================================== */}

          <section className="mb-8">

            <div className="bg-[#0f766e] rounded-lg p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>

                <div className="flex items-center gap-3 mb-3">

                  <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">

                    <FontAwesomeIcon
                      icon={faHandshake}
                    />

                  </div>

                  <span className="font-medium">
                    Start exchanging
                  </span>

                </div>

                <h3 className="text-xl sm:text-2xl font-bold">
                  Find someone who can teach you.
                </h3>

                <p className="mt-2 text-blue-100 max-w-xl">
                  Add your skills and discover people
                  interested in exchanging knowledge
                  with you.
                </p>

              </div>

              <Link
                to="/discover"
                className="inline-flex items-center justify-center gap-2 bg-amber-500 text-white px-5 py-3 rounded-lg font-semibold hover:bg-amber-600 transition cursor-pointer whitespace-nowrap"
              >
                Discover Skills

                <FontAwesomeIcon
                  icon={faArrowRight}
                />
              </Link>

            </div>

          </section>

          {/* =================================================
              STATISTICS
          ================================================== */}

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

            {/* Teaching */}

            <div className="bg-white border border-gray-200 rounded-xl p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Skills I Teach
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {teachCount}
                  </h3>

                </div>

                <div className="w-11 h-11 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">

                  <FontAwesomeIcon
                    icon={faGraduationCap}
                  />

                </div>

              </div>

            </div>

            {/* Learning */}

            <div className="bg-white border border-gray-200 rounded-xl p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Skills I Want
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {learnCount}
                  </h3>

                </div>

                <div className="w-11 h-11 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">

                  <FontAwesomeIcon
                    icon={faBookOpen}
                  />

                </div>

              </div>

            </div>

            {/* Matches */}

            <div className="bg-white border border-gray-200 rounded-xl p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Matches
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    0
                  </h3>

                </div>

                <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">

                  <FontAwesomeIcon
                    icon={faPeopleGroup}
                  />

                </div>

              </div>

            </div>

            {/* Connections */}

            <div className="bg-white border border-gray-200 rounded-xl p-5">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Connections
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    0
                  </h3>

                </div>

                <div className="w-11 h-11 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">

                  <FontAwesomeIcon
                    icon={faHandshake}
                  />

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              RECOMMENDED MATCHES
          ================================================== */}

          <section>

            <div className="flex items-center justify-between mb-5">

              <div>

                <h2 className="text-xl font-bold">
                  Recommended for You
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  People you might want to exchange
                  skills with.
                </p>

              </div>

              <Link
                to="/discover"
                className="hidden sm:flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 cursor-pointer"
              >
                View all

                <FontAwesomeIcon
                  icon={faArrowRight}
                />
              </Link>

            </div>

            {/* Empty state */}

            <div className="bg-white border border-[#d9e7df] rounded-lg p-10 text-center">

              <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">

                <FontAwesomeIcon
                  icon={faPeopleGroup}
                  className="text-xl"
                />

              </div>

              <h3 className="font-semibold text-lg">
                Your recommendations are coming
              </h3>

              <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                Add the skills you can teach and the
                skills you want to learn. We'll use them
                to find the best people for you.
              </p>

              <Link
                to="/skills"
                className="inline-flex items-center gap-2 mt-5 px-5 py-3 bg-[#062f2f] text-white rounded-lg font-medium hover:bg-[#0f766e] transition cursor-pointer"
              >
                Add Your Skills

                <FontAwesomeIcon
                  icon={faArrowRight}
                />
              </Link>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default Dashboard;