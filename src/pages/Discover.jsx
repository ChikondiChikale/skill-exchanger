import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCompass,
  faGraduationCap,
  faComments,
  faGear,
  faRightFromBracket,
  faMagnifyingGlass,
  faSliders,
  faLocationDot,
  faHandshake,
  faBars,
  faXmark,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || "U";
}

function normalizeSkillType(type = "") {
  const value = type.toLowerCase().trim();

  if (
    [
      "teach",
      "teaches",
      "teaching",
      "can teach",
      "offer",
      "offers",
    ].includes(value)
  ) {
    return "teach";
  }

  if (
    [
      "learn",
      "learns",
      "learning",
      "wants to learn",
      "want to learn",
      "looking to learn",
    ].includes(value)
  ) {
    return "learn";
  }

  return null;
}

function Discover() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);

  const [users, setUsers] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");

  /*
   * ============================================================
   * LOAD CURRENT USER + DISCOVER USERS + SKILLS
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const loadDiscoverUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        /*
         * --------------------------------------------------------
         * Load current user's profile
         * --------------------------------------------------------
         */

        const {
          data: myProfile,
          error: myProfileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, bio, country, city, occupation, avatar_url, profile_completed"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (myProfileError) {
          throw myProfileError;
        }

        /*
         * --------------------------------------------------------
         * Load all profiles
         * --------------------------------------------------------
         */

        const {
          data: profiles,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, bio, country, city, occupation, avatar_url, profile_completed"
          )
          .neq("id", user.id)
          .order("full_name", { ascending: true });

        if (profilesError) {
          throw profilesError;
        }

        /*
         * --------------------------------------------------------
         * Load skills
         * --------------------------------------------------------
         */

        const {
          data: skills,
          error: skillsError,
        } = await supabase
          .from("skills")
          .select(
            "id, user_id, skill_name, skill_type, description"
          );

        if (skillsError) {
          throw skillsError;
        }

        /*
         * --------------------------------------------------------
         * Combine profiles + skills
         * --------------------------------------------------------
         */

        const formattedUsers = (profiles || []).map((profile) => {
          const userSkills = (skills || []).filter(
            (skill) => skill.user_id === profile.id
          );

          const teaches = userSkills
            .filter(
              (skill) => normalizeSkillType(skill.skill_type) === "teach"
            )
            .map((skill) => skill.skill_name)
            .filter(Boolean);

          const learns = userSkills
            .filter(
              (skill) => normalizeSkillType(skill.skill_type) === "learn"
            )
            .map((skill) => skill.skill_name)
            .filter(Boolean);

          const locationParts = [
            profile.city,
            profile.country,
          ].filter(Boolean);

          return {
            id: profile.id,
            name: profile.full_name || profile.username || "Skill Member",
            username: profile.username || "",
            initials: getInitials(
              profile.full_name || profile.username || "User"
            ),
            location:
              locationParts.length > 0
                ? locationParts.join(", ")
                : "Location not specified",
            city: profile.city || "",
            country: profile.country || "",
            occupation: profile.occupation || "Skill Member",
            bio:
              profile.bio ||
              "This member has not added a bio yet.",
            avatarUrl: profile.avatar_url || "",
            teaches,
            learns,
          };
        });

        if (!mounted) return;

        setCurrentProfile(myProfile || null);
        setUsers(formattedUsers);
      } catch (err) {
        console.error("Discover loading error:", err);

        if (!mounted) return;

        setError(
          err?.message ||
            "Unable to load the Discover community. Please try again."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDiscoverUsers();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /*
   * ============================================================
   * FILTER USERS
   * ============================================================
   */

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      const searchableText = [
        user.name,
        user.username,
        user.location,
        user.city,
        user.country,
        user.occupation,
        user.bio,
        ...user.teaches,
        ...user.learns,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      if (filter === "teach") {
        return matchesSearch && user.teaches.length > 0;
      }

      if (filter === "learn") {
        return matchesSearch && user.learns.length > 0;
      }

      return matchesSearch;
    });
  }, [users, search, filter]);

  /*
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  /*
   * ============================================================
   * START CONVERSATION
   * ============================================================
   */

  const handleStartConversation = async (user) => {
    if (!user?.id || actionLoading) return;

    setActionLoading(true);
    setError("");

    try {
      const {
        data: conversationId,
        error: conversationError,
      } = await supabase.rpc("create_direct_conversation", {
        other_user: user.id,
      });

      if (conversationError) {
        throw conversationError;
      }

      if (!conversationId) {
        throw new Error(
          "A conversation could not be created."
        );
      }

      setSelectedUser(null);

      navigate("/messages", {
        state: {
          conversationId,
        },
      });
    } catch (err) {
      console.error("Conversation creation error:", err);

      setError(
        err?.message ||
          `Unable to start a conversation with ${user.name}.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * ============================================================
   * CLOSE MOBILE SIDEBAR WHEN NAVIGATING
   * ============================================================
   */

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#fffdf2] text-[#062f2f]">

      {/* ========================================================
          MOBILE OVERLAY
      ======================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[260px] bg-[#062f2f] flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* LOGO */}

        <div className="h-[82px] px-6 flex items-center justify-between border-b border-white/10">

          <Link
            to="/dashboard"
            onClick={closeSidebar}
            className="flex items-center gap-3 cursor-pointer"
          >

            <div className="w-10 h-10 rounded-xl bg-[#f59e0b] text-white flex items-center justify-center font-extrabold text-lg">
              S
            </div>

            <div className="leading-tight">

              <div className="text-[17px] font-bold text-white">
                Skill
              </div>

              <div className="text-[17px] font-bold text-[#fbbf24]">
                Exchanger
              </div>

            </div>

          </Link>

          <button
            onClick={closeSidebar}
            className="lg:hidden w-9 h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close navigation menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-7 overflow-y-auto">

          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Menu
          </p>

          <div className="space-y-1.5">

            {/* DASHBOARD */}

            <Link
              to="/dashboard"
              onClick={closeSidebar}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faHouse} />
              </span>

              <span>Dashboard</span>

            </Link>

            {/* DISCOVER */}

            <Link
              to="/discover"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#f59e0b] text-white font-semibold shadow-lg cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faCompass} />
              </span>

              <span>Discover</span>

            </Link>

            {/* MY SKILLS */}

            <Link
              to="/skills"
              onClick={closeSidebar}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>

              <span>My Skills</span>

            </Link>

            {/* MESSAGES */}

            <Link
              to="/messages"
              onClick={closeSidebar}
              className="group flex items-center justify-between px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <div className="flex items-center gap-3">

                <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                  <FontAwesomeIcon icon={faComments} />
                </span>

                <span>Messages</span>

              </div>

              <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold flex items-center justify-center">
                0
              </span>

            </Link>

          </div>

          {/* MORE */}

          <div className="mt-10">

            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              More
            </p>

            <Link
              to="/settings"
              onClick={closeSidebar}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faGear} />
              </span>

              <span>Settings</span>

            </Link>

          </div>

        </nav>

        {/* LOGOUT */}

        <div className="p-4 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
          >

            <span className="w-8 h-8 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faRightFromBracket} />
            </span>

            <span>Logout</span>

          </button>

        </div>

      </aside>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <div className="lg:ml-[260px]">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <header className="h-[78px] bg-white border-b border-[#d9e7df] px-5 sm:px-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            {/* MOBILE MENU BUTTON */}

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">
                Community
              </p>

              <h1 className="text-lg font-bold">
                Discover
              </h1>

            </div>

          </div>

          {/* CURRENT USER */}

          <div className="flex items-center gap-3">

            {currentProfile?.avatar_url ? (
              <img
                src={currentProfile.avatar_url}
                alt={currentProfile.full_name || "Profile"}
                className="w-10 h-10 rounded-full object-cover border border-[#d9e7df]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold">
                {getInitials(
                  currentProfile?.full_name || "Chikondi"
                )}
              </div>
            )}

            <div className="hidden sm:block">

              <p className="text-sm font-bold">
                {currentProfile?.full_name || "Chikondi"}
              </p>

              <p className="text-[11px] text-gray-400">
                {currentProfile?.occupation || "Member"}
              </p>

            </div>

          </div>

        </header>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <main className="max-w-[1400px] mx-auto px-5 sm:px-8 xl:px-10 py-8">

          {/* INTRO */}

          <section className="mb-8">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ccfbf1] text-[#0f766e] text-xs font-bold mb-4">

              <FontAwesomeIcon icon={faCompass} />

              Skill community

            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Discover People
            </h2>

            <p className="mt-2 text-gray-500 max-w-2xl">
              Find people who can teach you something new
              and discover opportunities to share what you know.
            </p>

          </section>

          {/* ====================================================
              ERROR
          ==================================================== */}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 flex items-start gap-3">

              <div className="flex-1">

                <p className="font-bold text-sm">
                  Something went wrong
                </p>

                <p className="text-sm mt-1">
                  {error}
                </p>

              </div>

              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 cursor-pointer"
                aria-label="Close error"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>

            </div>
          )}

          {/* ====================================================
              SEARCH
          ==================================================== */}

          <section className="bg-white border border-[#d9e7df] rounded-[24px] p-5 sm:p-6 mb-7 shadow-sm">

            <div className="flex flex-col lg:flex-row gap-4">

              <div className="relative flex-1">

                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, skill or location..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition"
                />

              </div>

              <div className="flex gap-2 overflow-x-auto">

                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition whitespace-nowrap ${
                    filter === "all"
                      ? "bg-[#062f2f] text-white"
                      : "bg-[#f5f7f5] text-gray-600 hover:bg-[#e9f2ed]"
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilter("teach")}
                  className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition whitespace-nowrap ${
                    filter === "teach"
                      ? "bg-[#f59e0b] text-white"
                      : "bg-[#f5f7f5] text-gray-600 hover:bg-[#e9f2ed]"
                  }`}
                >
                  Can Teach
                </button>

                <button
                  onClick={() => setFilter("learn")}
                  className={`px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition whitespace-nowrap ${
                    filter === "learn"
                      ? "bg-[#0f766e] text-white"
                      : "bg-[#f5f7f5] text-gray-600 hover:bg-[#e9f2ed]"
                  }`}
                >
                  Wants to Learn
                </button>

              </div>

            </div>

          </section>

          {/* ====================================================
              RESULTS HEADER
          ==================================================== */}

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="font-extrabold text-lg">
                People you may like
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {loading
                  ? "Finding people..."
                  : `${filteredUsers.length} ${
                      filteredUsers.length === 1
                        ? "person"
                        : "people"
                    } found`}
              </p>

            </div>

            <button
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d9e7df] text-sm font-bold text-[#062f2f] hover:border-[#0f766e] hover:text-[#0f766e] cursor-pointer transition"
            >

              <FontAwesomeIcon icon={faSliders} />

              Filters

            </button>

          </div>

          {/* ====================================================
              LOADING
          ==================================================== */}

          {loading ? (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {[1, 2, 3, 4, 5, 6].map((item) => (

                <div
                  key={item}
                  className="bg-white border border-[#d9e7df] rounded-[24px] p-6 animate-pulse"
                >

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-2xl bg-gray-200" />

                    <div className="flex-1">

                      <div className="h-4 bg-gray-200 rounded w-32" />

                      <div className="h-3 bg-gray-100 rounded w-24 mt-2" />

                    </div>

                  </div>

                  <div className="h-3 bg-gray-100 rounded mt-6" />

                  <div className="h-3 bg-gray-100 rounded mt-2 w-4/5" />

                  <div className="flex gap-2 mt-6">

                    <div className="h-8 bg-gray-100 rounded-lg w-20" />
                    <div className="h-8 bg-gray-100 rounded-lg w-16" />

                  </div>

                </div>

              ))}

            </div>

          ) : filteredUsers.length > 0 ? (

            /* ==================================================
               USER GRID
            ================================================== */

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {filteredUsers.map((user) => (

                <article
                  key={user.id}
                  className="bg-white border border-[#d9e7df] rounded-[24px] p-6 hover:-translate-y-1 hover:shadow-lg transition duration-200"
                >

                  {/* USER */}

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-3 min-w-0">

                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#d9e7df] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center font-extrabold flex-shrink-0">
                          {user.initials}
                        </div>
                      )}

                      <div className="min-w-0">

                        <h4 className="font-extrabold truncate">
                          {user.name}
                        </h4>

                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1 truncate">

                          <FontAwesomeIcon
                            icon={faLocationDot}
                          />

                          <span className="truncate">
                            {user.location}
                          </span>

                        </p>

                      </div>

                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#f0fdfa] text-[#0f766e] text-[10px] font-bold flex-shrink-0">
                      Member
                    </span>

                  </div>

                  {/* OCCUPATION */}

                  <p className="text-xs font-semibold text-[#0f766e] mt-4">
                    {user.occupation}
                  </p>

                  {/* BIO */}

                  <p className="text-sm text-gray-500 leading-relaxed mt-2 min-h-[62px]">
                    {user.bio}
                  </p>

                  {/* TEACH */}

                  <div className="mt-5">

                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                      Can teach
                    </p>

                    {user.teaches.length > 0 ? (

                      <div className="flex flex-wrap gap-1.5">

                        {user.teaches
                          .slice(0, 3)
                          .map((skill) => (

                            <span
                              key={skill}
                              className="px-2.5 py-1.5 rounded-lg bg-[#fff7df] border border-[#fde68a] text-[#92400e] text-xs font-semibold"
                            >
                              {skill}
                            </span>

                          ))}

                        {user.teaches.length > 3 && (

                          <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-semibold">
                            +{user.teaches.length - 3}
                          </span>

                        )}

                      </div>

                    ) : (

                      <p className="text-xs text-gray-400">
                        No teaching skills added yet.
                      </p>

                    )}

                  </div>

                  {/* LEARN */}

                  <div className="mt-4">

                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                      Wants to learn
                    </p>

                    {user.learns.length > 0 ? (

                      <div className="flex flex-wrap gap-1.5">

                        {user.learns
                          .slice(0, 2)
                          .map((skill) => (

                            <span
                              key={skill}
                              className="px-2.5 py-1.5 rounded-lg bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-xs font-semibold"
                            >
                              {skill}
                            </span>

                          ))}

                        {user.learns.length > 2 && (

                          <span className="px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-500 text-xs font-semibold">
                            +{user.learns.length - 2}
                          </span>

                        )}

                      </div>

                    ) : (

                      <p className="text-xs text-gray-400">
                        No learning skills added yet.
                      </p>

                    )}

                  </div>

                  {/* ACTIONS */}

                  <div className="flex gap-2 mt-6">

                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex-1 py-2.5 rounded-xl border border-[#d9e7df] text-[#062f2f] text-sm font-bold hover:border-[#0f766e] hover:text-[#0f766e] cursor-pointer transition"
                    >
                      View Profile
                    </button>

                    <button
                      onClick={() => handleStartConversation(user)}
                      disabled={actionLoading}
                      className="w-11 rounded-xl bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition"
                      title="Start conversation"
                    >

                      <FontAwesomeIcon icon={faHandshake} />

                    </button>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            /* ==================================================
               EMPTY STATE
            ================================================== */

            <div className="bg-white border border-[#d9e7df] rounded-[24px] p-12 text-center">

              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center text-xl">

                <FontAwesomeIcon icon={faMagnifyingGlass} />

              </div>

              <h3 className="font-extrabold text-lg mt-5">
                No people found
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Try searching for another skill, name or location.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#062f2f] text-white text-sm font-bold hover:bg-[#0f766e] cursor-pointer transition"
              >
                Clear search
              </button>

            </div>

          )}

        </main>

      </div>

      {/* ========================================================
          PROFILE MODAL
      ======================================================== */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-[100] bg-[#062f2f]/60 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >

          <div className="w-full max-w-lg bg-white rounded-[26px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="p-6 bg-[#062f2f] text-white">

              <div className="flex items-start justify-between">

                <div className="flex items-center gap-4 min-w-0">

                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-white/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#f59e0b] flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                      {selectedUser.initials}
                    </div>
                  )}

                  <div className="min-w-0">

                    <h2 className="text-xl font-extrabold truncate">
                      {selectedUser.name}
                    </h2>

                    <p className="text-sm text-white/60 flex items-center gap-1 mt-1">

                      <FontAwesomeIcon icon={faLocationDot} />

                      <span>
                        {selectedUser.location}
                      </span>

                    </p>

                    <p className="text-xs text-[#fbbf24] font-semibold mt-1">
                      {selectedUser.occupation}
                    </p>

                  </div>

                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-9 h-9 rounded-lg hover:bg-white/10 cursor-pointer flex-shrink-0"
                  aria-label="Close profile"
                >

                  <FontAwesomeIcon icon={faXmark} />

                </button>

              </div>

            </div>

            {/* MODAL BODY */}

            <div className="p-6">

              {/* BIO */}

              <p className="text-sm text-gray-600 leading-relaxed">
                {selectedUser.bio}
              </p>

              {/* TEACH */}

              <div className="mt-6">

                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">
                  Skills they teach
                </p>

                {selectedUser.teaches.length > 0 ? (

                  <div className="flex flex-wrap gap-2">

                    {selectedUser.teaches.map((skill) => (

                      <span
                        key={skill}
                        className="px-3 py-2 rounded-xl bg-[#fff7df] border border-[#fde68a] text-[#92400e] text-sm font-semibold"
                      >
                        {skill}
                      </span>

                    ))}

                  </div>

                ) : (

                  <p className="text-sm text-gray-400">
                    No teaching skills added yet.
                  </p>

                )}

              </div>

              {/* LEARN */}

              <div className="mt-5">

                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">
                  Skills they want to learn
                </p>

                {selectedUser.learns.length > 0 ? (

                  <div className="flex flex-wrap gap-2">

                    {selectedUser.learns.map((skill) => (

                      <span
                        key={skill}
                        className="px-3 py-2 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-sm font-semibold"
                      >
                        {skill}
                      </span>

                    ))}

                  </div>

                ) : (

                  <p className="text-sm text-gray-400">
                    No learning skills added yet.
                  </p>

                )}

              </div>

              {/* ACTION */}

              <button
                onClick={() =>
                  handleStartConversation(selectedUser)
                }
                disabled={actionLoading}
                className="w-full mt-7 py-3.5 rounded-xl bg-[#f59e0b] text-white font-bold hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition flex items-center justify-center"
              >

                <FontAwesomeIcon
                  icon={faHandshake}
                  className="mr-2"
                />

                {actionLoading
                  ? "Opening conversation..."
                  : "Request Skill Exchange"}

              </button>

              {/* VIEW MESSAGES */}

              <button
                onClick={() => {
                  setSelectedUser(null);
                  navigate("/messages");
                }}
                className="w-full mt-3 py-3 rounded-xl border border-[#d9e7df] text-[#062f2f] font-bold hover:border-[#0f766e] hover:text-[#0f766e] cursor-pointer transition"
              >

                <FontAwesomeIcon
                  icon={faComments}
                  className="mr-2"
                />

                Open Messages

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Discover;