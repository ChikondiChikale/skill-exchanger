import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCompass,
  faGraduationCap,
  faComments,
  faGear,
  faRightFromBracket,
  faPlus,
  faBookOpen,
  faHandshake,
  faBars,
  faXmark,
  faPen,
  faChevronDown,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { usePendingExchangeRequests } from "../lib/usePendingExchangeRequests";
import NotificationBell from "../components/NotificationBell";

// ================= INITIALS HELPER =================

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function MySkills() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pendingRequestCount = usePendingExchangeRequests();

  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);

  // ================= PROFILE =================

  const [profile, setProfile] = useState(null);

  // ================= FORMS =================

  const [showTeachForm, setShowTeachForm] = useState(false);
  const [showLearnForm, setShowLearnForm] = useState(false);
  const [showSkillTypeDialog, setShowSkillTypeDialog] = useState(false);

  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingSkillName, setEditingSkillName] = useState("");

  // ================= STATUS =================

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // ================= LOAD PROFILE =================

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) return;

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select(
          "full_name, username, occupation, avatar_url"
        )
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  // ================= LOAD USER SKILLS =================

  const fetchSkills = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "You must be logged in to view your skills."
        );
        setLoading(false);
        return;
      }

      const { data, error: skillsError } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: true,
        });

      if (skillsError) {
        throw skillsError;
      }

      const teaching = data.filter(
        (skill) => skill.skill_type === "teach"
      );

      const learning = data.filter(
        (skill) => skill.skill_type === "learn"
      );

      setTeachSkills(teaching);
      setLearnSkills(learning);
    } catch (err) {
      console.error(
        "Error loading skills:",
        err
      );

      setError(
        "Failed to load your skills. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= LOAD DATA =================

  useEffect(() => {
    const loadData = window.setTimeout(() => {
      fetchSkills();
      fetchProfile();
    }, 0);

    return () => window.clearTimeout(loadData);
  }, []);

  // ================= ADD TEACHING SKILL =================

  const addTeachSkill = async () => {
    const skill = teachInput.trim();

    if (!skill || adding) return;

    setError("");
    setAdding(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      // Check duplicate

      const alreadyExists = teachSkills.some(
        (item) =>
          item.skill_name.toLowerCase() ===
          skill.toLowerCase()
      );

      if (alreadyExists) {
        setError(
          "You have already added this teaching skill."
        );
        return;
      }

      const { data, error: insertError } =
        await supabase
          .from("skills")
          .insert([
            {
              user_id: user.id,
              skill_name: skill,
              skill_type: "teach",
            },
          ])
          .select()
          .single();

      if (insertError) {
        throw insertError;
      }

      setTeachSkills((current) => [
        ...current,
        data,
      ]);

      setTeachInput("");
      setShowTeachForm(false);
    } catch (err) {
      console.error(
        "Error adding teaching skill:",
        err
      );

      setError(
        "Failed to add teaching skill. Please try again."
      );
    } finally {
      setAdding(false);
    }
  };

  // ================= ADD LEARNING SKILL =================

  const addLearnSkill = async () => {
    const skill = learnInput.trim();

    if (!skill || adding) return;

    setError("");
    setAdding(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError("You must be logged in.");
        return;
      }

      // Check duplicate

      const alreadyExists = learnSkills.some(
        (item) =>
          item.skill_name.toLowerCase() ===
          skill.toLowerCase()
      );

      if (alreadyExists) {
        setError(
          "You have already added this learning skill."
        );
        return;
      }

      const { data, error: insertError } =
        await supabase
          .from("skills")
          .insert([
            {
              user_id: user.id,
              skill_name: skill,
              skill_type: "learn",
            },
          ])
          .select()
          .single();

      if (insertError) {
        throw insertError;
      }

      setLearnSkills((current) => [
        ...current,
        data,
      ]);

      setLearnInput("");
      setShowLearnForm(false);
    } catch (err) {
      console.error(
        "Error adding learning skill:",
        err
      );

      setError(
        "Failed to add learning skill. Please try again."
      );
    } finally {
      setAdding(false);
    }
  };

  // ================= REMOVE TEACHING SKILL =================

  const removeTeachSkill = async (skillId) => {
    if (!window.confirm("Remove this teaching skill?")) return;

    setError("");

    try {
      const { error: deleteError } =
        await supabase
          .from("skills")
          .delete()
          .eq("id", skillId);

      if (deleteError) {
        throw deleteError;
      }

      setTeachSkills((current) =>
        current.filter(
          (skill) => skill.id !== skillId
        )
      );
    } catch (err) {
      console.error(
        "Error removing teaching skill:",
        err
      );

      setError(
        "Failed to remove skill. Please try again."
      );
    }
  };

  // ================= REMOVE LEARNING SKILL =================

  const removeLearnSkill = async (skillId) => {
    if (!window.confirm("Remove this learning goal?")) return;

    setError("");

    try {
      const { error: deleteError } =
        await supabase
          .from("skills")
          .delete()
          .eq("id", skillId);

      if (deleteError) {
        throw deleteError;
      }

      setLearnSkills((current) =>
        current.filter(
          (skill) => skill.id !== skillId
        )
      );
    } catch (err) {
      console.error(
        "Error removing learning skill:",
        err
      );

      setError(
        "Failed to remove skill. Please try again."
      );
    }
  };

  const startEditingSkill = (skill) => {
    setEditingSkillId(skill.id);
    setEditingSkillName(skill.skill_name);
    setError("");
  };

  const saveSkillName = async (skillId, skillType) => {
    const nextName = editingSkillName.trim();

    if (!nextName) {
      setError("Skill name cannot be empty.");
      return;
    }

    const skills = skillType === "teach" ? teachSkills : learnSkills;
    const duplicate = skills.some(
      (skill) =>
        skill.id !== skillId &&
        skill.skill_name.toLowerCase() === nextName.toLowerCase()
    );

    if (duplicate) {
      setError("You already have a skill with that name.");
      return;
    }

    const { data, error: updateError } = await supabase
      .from("skills")
      .update({ skill_name: nextName })
      .eq("id", skillId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating skill:", updateError);
      setError("Failed to update skill. Please try again.");
      return;
    }

    const updateSkills = (current) =>
      current.map((skill) => (skill.id === skillId ? data : skill));

    if (skillType === "teach") {
      setTeachSkills(updateSkills);
    } else {
      setLearnSkills(updateSkills);
    }

    setEditingSkillId(null);
    setEditingSkillName("");
  };

  // ================= LOGOUT =================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="app-shell min-h-screen bg-[#fffdf2] text-[#062f2f]">

      {/* ================= MOBILE OVERLAY ================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[260px] bg-[#062f2f] text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* ================= LOGO ================= */}

        <div className="h-[82px] px-6 flex items-center gap-3 border-b border-white/10">

          <Link
            to="/dashboard"
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setSidebarOpen(false)}
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
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white cursor-pointer"
            aria-label="Close navigation menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

        </div>

        {/* ================= NAVIGATION ================= */}

        <nav className="px-4 space-y-2 flex-1">

          <div className="space-y-1.5">

            {/* Dashboard */}

            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faHouse} />
              </span>

              <span>Dashboard</span>

            </Link>

            {/* Discover */}

            <Link
              to="/discover"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faCompass} />
              </span>

              <span>Discover</span>

            </Link>

            {/* My Skills ACTIVE */}

            <Link
              to="/skills"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f59e0b] text-[#062f2f] font-semibold transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>

              <span>My Skills</span>

            </Link>

            {/* Messages */}

            <Link
              to="/messages"
              onClick={() => setSidebarOpen(false)}
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

            <Link
              to="/exchange-requests"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center justify-between px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                  <FontAwesomeIcon icon={faHandshake} />
                </span>
                <span>Exchange Requests</span>
              </div>

              {pendingRequestCount > 0 && (
                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingRequestCount > 99 ? "99+" : pendingRequestCount}
                </span>
              )}
            </Link>

          </div>

          <div className="space-y-2">

            <Link
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faGear} />
              </span>

              <span>Settings</span>

            </Link>

          </div>

        </nav>

        {/* ================= LOGOUT ================= */}

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

      {/* ================= MAIN ================= */}

      <div className="lg:ml-[260px]">

        {/* ================= TOP BAR ================= */}

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

            <div className="hidden sm:block relative w-full max-w-md">
              <FontAwesomeIcon icon={faGraduationCap} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="search"
                placeholder="Search skills, people or topics..."
                aria-label="Search skills, people or topics"
                className="w-full rounded-xl border border-[#dce8e1] bg-[#fbfdfb] py-2.5 pl-9 pr-4 text-xs outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
              />
            </div>

          </div>

          {/* ================= REAL DATABASE PROFILE ================= */}

          <div className="flex items-center gap-3">

            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((previous) => !previous)}
                aria-label="Open profile menu"
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.full_name || "User")
                  )}
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#062f2f]">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {profile?.occupation || "Member"}
                  </p>
                </div>

                <FontAwesomeIcon icon={faChevronDown} className="text-xs text-gray-400" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-14 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-30">
                  <Link
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faUser} />
                    Profile & Settings
                  </Link>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        <main className="skills-content max-w-[1400px] mx-auto px-5 sm:px-8 xl:px-10 py-8">

          {/* ================= PAGE INTRO ================= */}

          <section className="skills-intro mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                My Skills
              </h2>
              <p className="mt-1 text-sm text-gray-500 max-w-2xl">
                Manage the skills you can teach and want to learn.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSkillTypeDialog(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087878] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#065e5e]"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add Skill
            </button>

          </section>

          {/* ================= ERROR ================= */}

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ================= LOADING ================= */}

          {loading ? (

            <div className="bg-white border border-[#d9e7df] rounded-2xl p-8 sm:p-10 text-center shadow-sm">

              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center">
                <FontAwesomeIcon icon={faGraduationCap} />
              </div>

              <h3 className="font-bold text-[#062f2f]">Your skills workspace</h3>
              <p className="text-gray-500 text-sm">
                Loading your skills...
              </p>

            </div>

          ) : (

            /* ================= SKILL CARDS ================= */

            <section className="skills-grid grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ================= TEACH ================= */}

              <div className="skill-panel bg-white border border-[#d9e7df] rounded-2xl overflow-hidden shadow-sm hover:shadow-[var(--shadow-hover)] transition">

                <div className="p-6 border-b border-[#d9e7df] flex items-center justify-between">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center">

                      <FontAwesomeIcon icon={faGraduationCap} />

                    </div>

                    <div>

                      <h3 className="text-lg font-extrabold">
                        Skills I Teach
                      </h3>

                      <p className="text-sm text-gray-500">
                        Knowledge you can share.
                      </p>

                    </div>

                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#fff7df] text-[#b45309] text-xs font-bold">
                    {teachSkills.length}
                  </span>

                </div>

                <div className="p-6">

                  {teachSkills.length > 0 && (

                    <div className="skill-list mb-5">

                      {teachSkills.map((skill) => (

                        <div
                          key={skill.id}
                          className="skill-row flex items-center gap-3 px-2 py-3 border-b border-[#edf2ee] text-sm font-semibold"
                        >

                          {editingSkillId === skill.id ? (
                            <input
                              value={editingSkillName}
                              onChange={(event) => setEditingSkillName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveSkillName(skill.id, "teach");
                                if (event.key === "Escape") setEditingSkillId(null);
                              }}
                              className="w-32 bg-transparent border-b border-[#b45309] outline-none"
                              autoFocus
                            />
                          ) : (
                            <span>{skill.skill_name}</span>
                          )}

                          {editingSkillId === skill.id ? (
                            <button
                              onClick={() => saveSkillName(skill.id, "teach")}
                              className="text-[#0f766e] cursor-pointer"
                              aria-label={`Save ${skill.skill_name}`}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditingSkill(skill)}
                              className="text-[#b45309]/60 hover:text-[#b45309] cursor-pointer"
                              aria-label={`Edit ${skill.skill_name}`}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                          )}

                          <button
                            onClick={() => removeTeachSkill(skill.id)}
                            className="hover:text-red-600 cursor-pointer"
                            aria-label={`Remove ${skill.skill_name}`}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>

                        </div>

                      ))}

                    </div>

                  )}

                  {teachSkills.length === 0 && (

                    <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-[#d9e7df] bg-[#fffdf2]">

                      <p className="text-gray-500 text-sm">
                        You haven't added any teaching skills yet.
                      </p>

                    </div>

                  )}

                  {!showTeachForm ? (

                    <button
                      onClick={() =>
                        setShowTeachForm(true)
                      }
                      hidden
                      className="w-full py-2.5 rounded-lg bg-[#eaf7f2] text-[#087878] font-bold text-xs hover:bg-[#d9eee5] transition cursor-pointer"
                    >

                      <FontAwesomeIcon
                        icon={faPlus}
                        className="mr-2"
                      />

                      Add Teaching Skill

                    </button>

                  ) : (

                    <div className="flex flex-col sm:flex-row gap-2">

                      <input
                        type="text"
                        value={teachInput}
                        onChange={(e) =>
                          setTeachInput(
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addTeachSkill();
                          }
                        }}
                        placeholder="e.g. JavaScript"
                        autoFocus
                        disabled={adding}
                        className="flex-1 px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                      />

                      <button
                        onClick={addTeachSkill}
                        disabled={adding}
                        className="min-h-12 px-5 rounded-xl bg-[#f59e0b] text-white font-bold hover:bg-[#d97706] cursor-pointer disabled:opacity-50"
                      >
                        {adding ? "..." : "Add"}
                      </button>

                      <button
                        onClick={() =>
                          setShowTeachForm(false)
                        }
                        disabled={adding}
                        className="w-full sm:w-12 min-h-12 rounded-xl border border-[#d9e7df] hover:bg-gray-50 cursor-pointer"
                      >

                        <FontAwesomeIcon
                          icon={faXmark}
                        />

                      </button>

                    </div>

                  )}

                </div>

              </div>

              {/* ================= LEARN ================= */}

              <div className="skill-panel bg-white border border-[#d9e7df] rounded-2xl overflow-hidden shadow-sm hover:shadow-[var(--shadow-hover)] transition">

                <div className="p-6 border-b border-[#d9e7df] flex items-center justify-between">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-2xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center">

                      <FontAwesomeIcon icon={faBookOpen} />

                    </div>

                    <div>

                      <h3 className="text-lg font-extrabold">
                        Skills I Want to Learn
                      </h3>

                      <p className="text-sm text-gray-500">
                        Knowledge you want to develop.
                      </p>

                    </div>

                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#f0fdfa] text-[#0f766e] text-xs font-bold">
                    {learnSkills.length}
                  </span>

                </div>

                <div className="p-6">

                  {learnSkills.length > 0 && (

                    <div className="skill-list mb-5">

                      {learnSkills.map((skill) => (

                        <div
                          key={skill.id}
                          className="skill-row flex items-center gap-3 px-2 py-3 border-b border-[#edf2ee] text-sm font-semibold"
                        >

                          {editingSkillId === skill.id ? (
                            <input
                              value={editingSkillName}
                              onChange={(event) => setEditingSkillName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveSkillName(skill.id, "learn");
                                if (event.key === "Escape") setEditingSkillId(null);
                              }}
                              className="w-32 bg-transparent border-b border-[#0f766e] outline-none"
                              autoFocus
                            />
                          ) : (
                            <span>{skill.skill_name}</span>
                          )}

                          {editingSkillId === skill.id ? (
                            <button
                              onClick={() => saveSkillName(skill.id, "learn")}
                              className="text-[#0f766e] cursor-pointer"
                              aria-label={`Save ${skill.skill_name}`}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditingSkill(skill)}
                              className="text-[#0f766e]/60 hover:text-[#0f766e] cursor-pointer"
                              aria-label={`Edit ${skill.skill_name}`}
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                          )}

                          <button
                            onClick={() => removeLearnSkill(skill.id)}
                            className="hover:text-red-600 cursor-pointer"
                            aria-label={`Remove ${skill.skill_name}`}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>

                        </div>

                      ))}

                    </div>

                  )}

                  {learnSkills.length === 0 && (

                    <div className="text-center py-8 px-4 rounded-2xl border border-dashed border-[#d9e7df] bg-[#fffdf2]">

                      <p className="text-gray-500 text-sm">
                        You haven't added any learning skills yet.
                      </p>

                    </div>

                  )}

                  {!showLearnForm ? (

                    <button
                      onClick={() =>
                        setShowLearnForm(true)
                      }
                      hidden
                      className="w-full py-2.5 rounded-lg bg-[#eaf7f2] text-[#087878] font-bold text-xs hover:bg-[#d9eee5] transition cursor-pointer"
                    >

                      <FontAwesomeIcon
                        icon={faPlus}
                        className="mr-2"
                      />

                      Add Learning Skill

                    </button>

                  ) : (

                    <div className="flex flex-col sm:flex-row gap-2">

                      <input
                        type="text"
                        value={learnInput}
                        onChange={(e) =>
                          setLearnInput(
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addLearnSkill();
                          }
                        }}
                        placeholder="e.g. Python"
                        autoFocus
                        disabled={adding}
                        className="flex-1 px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                      />

                      <button
                        onClick={addLearnSkill}
                        disabled={adding}
                        className="min-h-12 px-5 rounded-xl bg-[#f59e0b] text-white font-bold hover:bg-[#d97706] cursor-pointer disabled:opacity-50"
                      >
                        {adding ? "..." : "Add"}
                      </button>

                      <button
                        onClick={() =>
                          setShowLearnForm(false)
                        }
                        disabled={adding}
                        className="w-full sm:w-12 min-h-12 rounded-xl border border-[#d9e7df] hover:bg-gray-50 cursor-pointer"
                      >

                        <FontAwesomeIcon
                          icon={faXmark}
                        />

                      </button>

                    </div>

                  )}

                </div>

              </div>

            </section>

          )}

          {/* ================= EXCHANGE CTA ================= */}

          <section className="skills-cta mt-5 rounded-2xl p-5 sm:p-6">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div className="flex items-start gap-4">

                <div className="w-12 h-12 rounded-xl bg-white/10 text-[#fbbf24] flex items-center justify-center shrink-0">

                  <FontAwesomeIcon
                    icon={faHandshake}
                  />

                </div>

                <div>

                  <h3 className="text-xl font-extrabold text-white">
                    Ready to exchange?
                  </h3>

                  <p className="text-sm text-white/60 mt-1">
                    Find people who can teach you while you
                    share what you know.
                  </p>

                </div>

              </div>

              <Link
                to="/discover"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#f59e0b] text-white text-sm font-bold hover:bg-[#d97706] cursor-pointer transition"
              >
                Discover People
              </Link>

            </div>

          </section>

        </main>

      </div>

      {showSkillTypeDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#062f2f]/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="skill-type-title"
          onClick={() => setShowSkillTypeDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
                  Add a skill
                </p>
                <h2 id="skill-type-title" className="mt-1 text-xl font-bold text-[#073f3f]">
                  What would you like to add?
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose whether this is a skill you can teach or want to learn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSkillTypeDialog(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close add skill dialog"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setShowSkillTypeDialog(false);
                  setShowLearnForm(false);
                  setShowTeachForm(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-[#fde68a] bg-[#fff7df] p-4 text-left hover:border-[#f59e0b]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f59e0b] text-white">
                  <FontAwesomeIcon icon={faGraduationCap} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#92400e]">I can teach</span>
                  <span className="mt-0.5 block text-xs text-[#a16207]">Share your knowledge</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSkillTypeDialog(false);
                  setShowTeachForm(false);
                  setShowLearnForm(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-[#99f6e4] bg-[#f0fdfa] p-4 text-left hover:border-[#0f766e]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f766e] text-white">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#0f766e]">I want to learn</span>
                  <span className="mt-0.5 block text-xs text-[#52716b]">Set a learning goal</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MySkills;