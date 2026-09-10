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
  faChevronDown,
  faUser,
  faArrowRight,
  faPeopleGroup,
  faBookOpen,
  faHandshake,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";
import { usePendingExchangeRequests } from "../lib/usePendingExchangeRequests";
import NotificationBell from "../components/NotificationBell";

function Dashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [selectedStat, setSelectedStat] = useState(null);
  const [statRows, setStatRows] = useState([]);
  const [statDetailsLoading, setStatDetailsLoading] = useState(false);
  const [statDetailsError, setStatDetailsError] = useState("");

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [teachCount, setTeachCount] = useState(0);
  const [learnCount, setLearnCount] = useState(0);
  const [acceptedRequestCount, setAcceptedRequestCount] = useState(0);
  const [pendingRequestTotal, setPendingRequestTotal] = useState(0);
  const [recommendations, setRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);
  const pendingRequestCount = usePendingExchangeRequests();

  const statDetails = {
    teaching: {
      title: "Skills I Teach",
      description: "These are the skills you can share with other members.",
      count: teachCount,
      action: "Manage My Skills",
      href: "/skills",
      icon: faGraduationCap,
      iconClass: "bg-amber-100 text-amber-600",
    },
    learning: {
      title: "Skills I Want to Learn",
      description: "Your learning goals help us find the right exchange partners.",
      count: learnCount,
      action: "Update Learning Goals",
      href: "/skills",
      icon: faBookOpen,
      iconClass: "bg-teal-100 text-teal-700",
    },
    pending: {
      title: "Pending Requests",
      description: "Review exchange requests that are waiting for your response.",
      count: pendingRequestTotal,
      action: "View Requests",
      href: "/exchange-requests",
      icon: faPeopleGroup,
      iconClass: "bg-amber-50 text-amber-700",
    },
    accepted: {
      title: "Accepted Exchanges",
      description: "These are your active skill exchange connections.",
      count: acceptedRequestCount,
      action: "Open Exchanges",
      href: "/exchange-requests",
      icon: faHandshake,
      iconClass: "bg-orange-50 text-orange-600",
    },
  };

  const handleStatClick = async (statKey) => {
    setSelectedStat(statKey);
    setStatRows([]);
    setStatDetailsError("");
    setStatDetailsLoading(true);

    try {
      if (!user?.id) {
        throw new Error("Your account details are not available yet.");
      }

      if (statKey === "teaching" || statKey === "learning") {
        const { data, error: skillsError } = await supabase
          .from("skills")
          .select("id, skill_name, description, skill_type")
          .eq("user_id", user.id)
          .eq("skill_type", statKey === "teaching" ? "teach" : "learn")
          .order("created_at", { ascending: true });

        if (skillsError) throw skillsError;

        setStatRows(
          (data || []).map((skill) => ({
            id: skill.id,
            title: skill.skill_name,
            subtitle: skill.description || "No description added yet.",
            badge: statKey === "teaching" ? "Teaching" : "Learning",
          }))
        );
        return;
      }

      const requestQuery = supabase
        .from("exchange_requests")
        .select("id, sender_id, receiver_id, skill_id, status, created_at")
        .eq("status", statKey === "pending" ? "pending" : "accepted");

      const { data: requests, error: requestsError } = statKey === "pending"
        ? await requestQuery.eq("receiver_id", user.id).order("created_at", { ascending: false })
        : await requestQuery
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      const requestRows = requests || [];
      const profileIds = [...new Set(requestRows.flatMap((request) => [request.sender_id, request.receiver_id]))];
      const skillIds = [...new Set(requestRows.map((request) => request.skill_id).filter(Boolean))];

      const [{ data: profiles, error: profilesError }, { data: skills, error: skillsError }] = await Promise.all([
        profileIds.length
          ? supabase.from("profiles").select("id, full_name, username, occupation").in("id", profileIds)
          : Promise.resolve({ data: [], error: null }),
        skillIds.length
          ? supabase.from("skills").select("id, skill_name").in("id", skillIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (profilesError) throw profilesError;
      if (skillsError) throw skillsError;

      const profilesById = Object.fromEntries((profiles || []).map((item) => [item.id, item]));
      const skillsById = Object.fromEntries((skills || []).map((item) => [item.id, item]));

      setStatRows(
        requestRows.map((request) => {
          const otherUserId = request.sender_id === user.id ? request.receiver_id : request.sender_id;
          const person = profilesById[otherUserId];

          return {
            id: request.id,
            title: person?.full_name || person?.username || "Skill member",
            subtitle: `${skillsById[request.skill_id]?.skill_name || "Skill exchange"}${person?.occupation ? ` · ${person.occupation}` : ""}`,
            badge: request.status,
            date: new Date(request.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          };
        })
      );
    } catch (error) {
      console.error("Dashboard statistic details error:", error);
      setStatDetailsError(error.message || "Unable to load these details.");
    } finally {
      setStatDetailsLoading(false);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

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

        const [
          { data: recommendedProfiles, error: recommendationsError },
          { data: recommendedSkills, error: recommendedSkillsError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, username, occupation, avatar_url, city, country")
            .neq("id", currentUser.id)
            .eq("profile_completed", true)
            .limit(3),
          supabase
            .from("skills")
            .select("user_id, skill_name, skill_type")
            .neq("user_id", currentUser.id),
        ]);

        if (recommendationsError) throw recommendationsError;
        if (recommendedSkillsError) throw recommendedSkillsError;

        const skillsByUser = (recommendedSkills || []).reduce((groups, skill) => {
          groups[skill.user_id] = groups[skill.user_id] || [];
          groups[skill.user_id].push(skill);
          return groups;
        }, {});

        setRecommendations(
          (recommendedProfiles || []).map((person) => ({
            ...person,
            teaches: (skillsByUser[person.id] || [])
              .filter((skill) => skill.skill_type === "teach")
              .slice(0, 1),
            learns: (skillsByUser[person.id] || [])
              .filter((skill) => skill.skill_type === "learn")
              .slice(0, 1),
          }))
        );

        // -----------------------------------------------------
        // Get teaching and learning skill counts
        // -----------------------------------------------------

        const [
          { count: teachingCount, error: teachingError },
          { count: learningCount, error: learningError },
          { count: acceptedCount, error: acceptedError },
          { count: pendingCount, error: pendingError },
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

          supabase
            .from("exchange_requests")
            .select("id", { count: "exact", head: true })
            .or(
              `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
            )
            .eq("status", "accepted"),

          supabase
            .from("exchange_requests")
            .select("id", { count: "exact", head: true })
            .eq("receiver_id", currentUser.id)
            .eq("status", "pending"),
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

        if (acceptedError) {
          console.error("Accepted requests error:", acceptedError);
        }

        if (pendingError) {
          console.error("Pending requests error:", pendingError);
        }

        setTeachCount(teachingCount || 0);
        setLearnCount(learningCount || 0);
        setAcceptedRequestCount(acceptedCount || 0);
        setPendingRequestTotal(pendingCount || 0);
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
    <div className="app-shell min-h-screen bg-[#fffdf2] text-gray-900">

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
          fixed top-0 left-0 z-50 h-screen w-[260px]
          bg-[#062f2f] text-white
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

        <div className="px-6 py-7 flex items-center justify-between">

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
            className="lg:hidden w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

        </div>

        {/* Navigation */}

        <nav className="px-4 space-y-2 flex-1">

          <div className="space-y-1">

            {/* Dashboard */}

            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500 text-[#062f2f] font-semibold transition cursor-pointer"
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

            <Link
              to="/exchange-requests"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faHandshake} className="w-5" />
                Exchange Requests
              </div>

              {pendingRequestCount > 0 && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                </span>
              )}
            </Link>



          </div>

          <div className="space-y-2">

            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white transition cursor-pointer"
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

      <div className="lg:ml-[260px]">

        {/* ===================================================
            TOPBAR
        ==================================================== */}

        <header className="min-h-20 bg-white border-b border-[#d9e7df] flex items-center justify-between gap-3 px-4 py-3 sm:px-8">

          {/* Mobile menu */}

          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open dashboard navigation"
            className="lg:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md ml-3 lg:ml-0">
            <div className="relative w-full">
              <FontAwesomeIcon
                icon={faCompass}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
              />
              <input
                type="search"
                value={dashboardSearch}
                onChange={(event) => setDashboardSearch(event.target.value)}
                placeholder="Search skills, people or topics..."
                aria-label="Search skills, people or topics"
                className="w-full rounded-xl border border-[#dce8e1] bg-[#fbfdfb] py-2.5 pl-9 pr-4 text-xs text-[#163b3b] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </div>
          </div>

          {/* Right side */}

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">

            <NotificationBell />

            {/* Profile */}

            <div className="relative">

              <button
                onClick={() =>
                  setProfileMenuOpen(
                    (previous) => !previous
                  )
                }
                aria-label="Open profile menu"
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
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

        <main className="dashboard-content p-4 sm:p-8 max-w-7xl mx-auto">

          <section className="dashboard-intro mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
              Your learning space
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold">
              Good morning, {displayName.split(" ")[0]}! <span aria-hidden="true">👋</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep learning, keep growing.
            </p>
          </section>

          <section className="dashboard-profile-row grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-4 mb-5">
            <div className="dashboard-profile-card bg-[#eaf7f2] border border-[#d4ebe1] rounded-2xl p-5 flex items-center gap-4">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#0f766e] text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-[#073f3f] truncate">{displayName}</h3>
                <p className="text-xs text-[#52716b] mt-1 truncate">{occupation}</p>
                <p className="text-xs text-[#52716b] mt-0.5">{profile?.city || "Add your location"}{profile?.country ? `, ${profile.country}` : ""}</p>
                <Link to="/settings" className="inline-flex mt-3 rounded-lg bg-[#087878] px-4 py-2 text-xs font-semibold text-white hover:bg-[#065e5e]">View Profile</Link>
              </div>
            </div>

            <div className="dashboard-journey-card rounded-2xl p-5 text-white flex items-center justify-between gap-4 overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-semibold text-amber-200">Your Learning Journey</p>
                <h3 className="mt-2 text-lg font-bold leading-tight">Make skills, meet opportunities.</h3>
                <Link to="/discover" className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-white hover:text-amber-200">Explore people <FontAwesomeIcon icon={faArrowRight} /></Link>
              </div>
              <div className="dashboard-journey-mark" aria-hidden="true"><FontAwesomeIcon icon={faGraduationCap} /></div>
            </div>
          </section>

          {/* =================================================
              STATISTICS
          ================================================== */}

          <section className="dashboard-stats grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

            {/* Teaching */}

            <button type="button" onClick={() => handleStatClick("teaching")} className="stat-card bg-white border border-[#d9e7df] rounded-2xl p-5 shadow-sm hover:shadow-[var(--shadow-hover)] transition text-left cursor-pointer">

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

            </button>

            {/* Learning */}

            <button type="button" onClick={() => handleStatClick("learning")} className="stat-card bg-white border border-[#d9e7df] rounded-2xl p-5 shadow-sm hover:shadow-[var(--shadow-hover)] transition text-left cursor-pointer">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Skills I Want to Learn
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

            </button>

            {/* Matches */}

            <button type="button" onClick={() => handleStatClick("pending")} className="stat-card bg-white border border-[#d9e7df] rounded-2xl p-5 shadow-sm hover:shadow-[var(--shadow-hover)] transition text-left cursor-pointer">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Pending Requests
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {pendingRequestTotal}
                  </h3>

                </div>

                <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">

                  <FontAwesomeIcon
                    icon={faPeopleGroup}
                  />

                </div>

              </div>

            </button>

            {/* Connections */}

            <button type="button" onClick={() => handleStatClick("accepted")} className="stat-card bg-white border border-[#d9e7df] rounded-2xl p-5 shadow-sm hover:shadow-[var(--shadow-hover)] transition text-left cursor-pointer">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    Accepted Exchanges
                  </p>

                  <h3 className="text-3xl font-bold mt-2">
                    {acceptedRequestCount}
                  </h3>

                </div>

                <div className="w-11 h-11 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">

                  <FontAwesomeIcon
                    icon={faHandshake}
                  />

                </div>

              </div>

            </button>

          </section>

          {/* =================================================
              RECOMMENDED MATCHES
          ================================================== */}

          <section>

              <div className="flex items-start justify-between gap-4 mb-5">

              <div>

                <h2 className="text-lg sm:text-xl font-bold">
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

            <div className="dashboard-recommendations grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendations.length > 0 ? recommendations.map((person) => (
                <article key={person.id} className="recommendation-card bg-white border border-[#d9e7df] rounded-2xl p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt={person.full_name || person.username || "Member"} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ccfbf1] text-xs font-bold text-[#0f766e]">
                        {(person.full_name || person.username || "U").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[#073f3f]">{person.full_name || person.username || "Skill member"}</h3>
                      <p className="truncate text-[10px] text-gray-500">{person.occupation || "Skill member"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[...person.teaches, ...person.learns].map((skill) => (
                      <span key={`${person.id}-${skill.skill_name}`} className="rounded-full bg-[#eaf7f2] px-2 py-1 text-[10px] font-semibold text-[#0f766e]">
                        {skill.skill_name}
                      </span>
                    ))}
                  </div>
                  <Link to="/discover" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#087878] px-3 py-2 text-[10px] font-bold text-white">Request Exchange <FontAwesomeIcon icon={faArrowRight} /></Link>
                </article>
              )) : (
                ["Discover a new skill", "Share what you know", "Complete your profile"].map((title, index) => (
                  <div key={title} className="recommendation-card bg-white border border-[#d9e7df] rounded-2xl p-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${index === 1 ? "bg-amber-100 text-amber-600" : "bg-[#eaf7f2] text-[#0f766e]"}`}>
                      <FontAwesomeIcon icon={index === 0 ? faCompass : index === 1 ? faHandshake : faUser} />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-[#073f3f]">{title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">Add skills to get better matches.</p>
                    <Link to={index === 2 ? "/skills" : "/discover"} className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#0f766e]">Open <FontAwesomeIcon icon={faArrowRight} /></Link>
                  </div>
                ))
              )}
            </div>

          </section>

        </main>

      </div>

      {selectedStat && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#062f2f]/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-stat-title"
          onClick={() => setSelectedStat(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {(() => {
              const detail = statDetails[selectedStat];

              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${detail.iconClass}`}>
                        <FontAwesomeIcon icon={detail.icon} />
                      </span>
                      <div>
                        <h2 id="dashboard-stat-title" className="text-lg font-bold text-[#073f3f]">
                          {detail.title}
                        </h2>
                        <p className="text-xs text-gray-500">Dashboard summary</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStat(null)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Close statistic details"
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>

                  <div className="mt-6 rounded-xl bg-[#f7f4eb] p-4">
                    <p className="text-4xl font-bold text-[#073f3f]">{detail.count}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{detail.description}</p>
                  </div>

                  <div className="mt-4 max-h-52 overflow-y-auto">
                    {statDetailsLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-[#0f766e]" />
                        Loading details...
                      </div>
                    ) : statDetailsError ? (
                      <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {statDetailsError}
                      </p>
                    ) : statRows.length > 0 ? (
                      <div className="divide-y divide-[#edf2ee] rounded-xl border border-[#e5ece7]">
                        {statRows.map((row) => (
                          <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#073f3f]">{row.title}</p>
                              <p className="truncate text-xs text-gray-500">{row.subtitle}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="rounded-full bg-[#eaf7f2] px-2 py-1 text-[10px] font-semibold capitalize text-[#0f766e]">
                                {row.badge}
                              </span>
                              {row.date && <p className="mt-1 text-[10px] text-gray-400">{row.date}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-[#dce8e1] px-4 py-5 text-center text-sm text-gray-500">
                        No records found yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStat(null)}
                      className="rounded-lg border border-[#dce8e1] px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <Link
                      to={detail.href}
                      onClick={() => setSelectedStat(null)}
                      className="rounded-lg bg-[#087878] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#065e5e]"
                    >
                      {detail.action}
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard;