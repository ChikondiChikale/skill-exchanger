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
} from "@fortawesome/free-solid-svg-icons";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);

  // ================= PROFILE =================

  const [profile, setProfile] = useState(null);

  // ================= FORMS =================

  const [showTeachForm, setShowTeachForm] = useState(false);
  const [showLearnForm, setShowLearnForm] = useState(false);

  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");

  // ================= STATUS =================

  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // ================= LOAD DATA =================

  useEffect(() => {
    fetchSkills();
    fetchProfile();
  }, []);

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

  // ================= LOGOUT =================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#fffdf2] text-[#062f2f]">

      {/* ================= MOBILE OVERLAY ================= */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[260px] bg-[#062f2f] flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
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

        <nav className="flex-1 px-4 py-7">

          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
            Menu
          </p>

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
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-[#f59e0b] text-white font-semibold shadow-lg cursor-pointer"
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

          </div>

          {/* ================= MORE ================= */}

          <div className="mt-10">

            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
              More
            </p>

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

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">
                Workspace
              </p>

              <h1 className="text-lg font-bold">
                My Skills
              </h1>

            </div>

          </div>

          {/* ================= REAL DATABASE PROFILE ================= */}

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold shrink-0">

              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={
                    profile.full_name ||
                    "Profile"
                  }
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(
                  profile?.full_name || "User"
                )
              )}

            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-bold">
                {profile?.full_name || "User"}
              </p>

              <p className="text-[11px] text-gray-400">
                {profile?.occupation || "Member"}
              </p>

            </div>

          </div>

        </header>

        {/* ================= CONTENT ================= */}

        <main className="max-w-[1400px] mx-auto px-5 sm:px-8 xl:px-10 py-8">

          {/* ================= PAGE INTRO ================= */}

          <section className="mb-8">

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ccfbf1] text-[#0f766e] text-xs font-bold mb-4">

              <FontAwesomeIcon icon={faGraduationCap} />

              Skill management

            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              My Skills
            </h2>

            <p className="mt-2 text-gray-500 max-w-2xl">
              Manage what you can teach and what you want
              to learn. These skills will help us find the
              right people for you.
            </p>

          </section>

          {/* ================= ERROR ================= */}

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* ================= LOADING ================= */}

          {loading ? (

            <div className="bg-white border border-[#d9e7df] rounded-[24px] p-10 text-center">

              <p className="text-gray-500 text-sm">
                Loading your skills...
              </p>

            </div>

          ) : (

            /* ================= SKILL CARDS ================= */

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">

              {/* ================= TEACH ================= */}

              <div className="bg-white border border-[#d9e7df] rounded-[24px] overflow-hidden shadow-sm">

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

                    <div className="flex flex-wrap gap-2 mb-5">

                      {teachSkills.map((skill) => (

                        <div
                          key={skill.id}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#fff7df] border border-[#fde68a] text-[#92400e] text-sm font-semibold"
                        >

                          {skill.skill_name}

                          <button
                            onClick={() =>
                              removeTeachSkill(
                                skill.id
                              )
                            }
                            className="hover:text-red-600 cursor-pointer"
                            aria-label={`Remove ${skill.skill_name}`}
                          >

                            <FontAwesomeIcon
                              icon={faXmark}
                            />

                          </button>

                        </div>

                      ))}

                    </div>

                  )}

                  {teachSkills.length === 0 && (

                    <div className="text-center py-8">

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
                      className="w-full py-3 rounded-xl bg-[#062f2f] text-white font-bold text-sm hover:bg-[#0f766e] transition cursor-pointer"
                    >

                      <FontAwesomeIcon
                        icon={faPlus}
                        className="mr-2"
                      />

                      Add Teaching Skill

                    </button>

                  ) : (

                    <div className="flex gap-2">

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
                        className="px-5 rounded-xl bg-[#f59e0b] text-white font-bold hover:bg-[#d97706] cursor-pointer disabled:opacity-50"
                      >
                        {adding ? "..." : "Add"}
                      </button>

                      <button
                        onClick={() =>
                          setShowTeachForm(false)
                        }
                        disabled={adding}
                        className="w-12 rounded-xl border border-[#d9e7df] hover:bg-gray-50 cursor-pointer"
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

              <div className="bg-white border border-[#d9e7df] rounded-[24px] overflow-hidden shadow-sm">

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

                    <div className="flex flex-wrap gap-2 mb-5">

                      {learnSkills.map((skill) => (

                        <div
                          key={skill.id}
                          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] text-sm font-semibold"
                        >

                          {skill.skill_name}

                          <button
                            onClick={() =>
                              removeLearnSkill(
                                skill.id
                              )
                            }
                            className="hover:text-red-600 cursor-pointer"
                            aria-label={`Remove ${skill.skill_name}`}
                          >

                            <FontAwesomeIcon
                              icon={faXmark}
                            />

                          </button>

                        </div>

                      ))}

                    </div>

                  )}

                  {learnSkills.length === 0 && (

                    <div className="text-center py-8">

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
                      className="w-full py-3 rounded-xl bg-[#0f766e] text-white font-bold text-sm hover:bg-[#062f2f] transition cursor-pointer"
                    >

                      <FontAwesomeIcon
                        icon={faPlus}
                        className="mr-2"
                      />

                      Add Learning Skill

                    </button>

                  ) : (

                    <div className="flex gap-2">

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
                        className="px-5 rounded-xl bg-[#f59e0b] text-white font-bold hover:bg-[#d97706] cursor-pointer disabled:opacity-50"
                      >
                        {adding ? "..." : "Add"}
                      </button>

                      <button
                        onClick={() =>
                          setShowLearnForm(false)
                        }
                        disabled={adding}
                        className="w-12 rounded-xl border border-[#d9e7df] hover:bg-gray-50 cursor-pointer"
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

          <section className="mt-6 bg-[#062f2f] rounded-[24px] p-7 sm:p-8">

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

    </div>
  );
}

export default MySkills;