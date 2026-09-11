import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faHouse,
  faCompass,
  faGraduationCap,
  faComments,
  faHandshake,
  faGear,
  faRightFromBracket,
  faUser,
  faShieldHalved,
  faBell,
  faSliders,
  faCamera,
  faChevronRight,
  faCheck,
  faLock,
  faEnvelope,
  faTrash,
  faSpinner,
  faCircleExclamation,
  faBars,
  faXmark,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { supabase, logAppError, getFriendlyErrorMessage } from "../lib/supabase";
import { usePendingExchangeRequests } from "../lib/usePendingExchangeRequests";
import NotificationBell from "../components/NotificationBell";

function Settings() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pendingRequestCount = usePendingExchangeRequests();
  const [activeSection, setActiveSection] = useState("profile");
  const settingsPanelRef = useRef(null);

  // =========================================================
  // USER + PROFILE
  // =========================================================

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  // =========================================================
  // PROFILE FORM
  // =========================================================

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");

  // =========================================================
  // UI STATES
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // =========================================================
  // PROFILE PHOTO
  // =========================================================

  const fileInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  const [notifications, setNotifications] = useState({
    messages: true,
    requests: true,
    recommendations: true,
  });

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        // Get authenticated user
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

        // Get profile
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          navigate("/complete-profile");
          return;
        }

        setProfile(profileData);

        // Fill form with database values
        setName(profileData.full_name || "");
        setUsername(profileData.username || "");
        setCountry(profileData.country || "");
        setCity(profileData.city || "");
        setOccupation(profileData.occupation || "");
        setBio(profileData.bio || "");
      } catch (error) {
        logAppError("Settings profile loading", error);

        setError(
          getFriendlyErrorMessage(
            error,
            "Unable to load your profile."
          )
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoverySession(true);
        setActiveSection("security");
        setChangePasswordOpen(true);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const saveProfile = async () => {
    setError("");
    setSaved(false);

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!username.trim()) {
      setError("Please enter a username.");
      return;
    }

    if (!country.trim()) {
      setError("Please enter your country.");
      return;
    }

    try {
      setSaving(true);

      const cleanedUsername = username
        .trim()
        .toLowerCase();

      // Update profiles table
      const {
        data: updatedProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          username: cleanedUsername,
          country: country.trim(),
          city: city.trim(),
          occupation: occupation.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (profileError) {
        // Duplicate username
        if (profileError.code === "23505") {
          setError(
            "That username is already taken. Please choose another one."
          );
          return;
        }

        throw profileError;
      }

      // Also update Supabase Auth metadata
      const { error: authError } =
        await supabase.auth.updateUser({
          data: {
            full_name: name.trim(),
            username: cleanedUsername,
          },
        });

      if (authError) {
        console.error(
          "Auth metadata update error:",
          authError
        );
      }

      setProfile(updatedProfile);

      // Update local form state
      setUsername(cleanedUsername);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      logAppError("Profile save", error);

      setError(
        getFriendlyErrorMessage(
          error,
          "Unable to save your profile."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setError("");
    setSecurityMessage("");

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setUpdatingPassword(true);

      if (!isRecoverySession) {
        if (!currentPassword.trim()) {
          setError("Enter your current password to continue.");
          return;
        }

        if (!user?.email) {
          setError("Your account email could not be found.");
          return;
        }

        const { error: verificationError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (verificationError) {
          setError("Your current password is incorrect.");
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) throw updateError;

      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setChangePasswordOpen(false);
      setSecurityMessage("Your password has been updated successfully.");
    } catch (updateError) {
      logAppError("Password update", updateError);
      setError(
        getFriendlyErrorMessage(
          updateError,
          "Unable to update your password."
        )
      );
    } finally {
      setUpdatingPassword(false);
    }
  };

  // =========================================================
  // PROFILE PHOTO UPLOAD
  // =========================================================

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !user) {
      return;
    }

    setError("");
    setSaved(false);

    // Allowed image formats
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please choose a JPG, PNG, or WebP image."
      );

      event.target.value = "";
      return;
    }

    // Maximum file size: 2 MB
    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Profile photo must be smaller than 2 MB."
      );

      event.target.value = "";
      return;
    }

    let uploadedPath = null;

    try {
      setUploadingPhoto(true);

      // Get file extension
      const fileExt = file.name
        .split(".")
        .pop()
        .toLowerCase();

      // Each user has their own folder
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      uploadedPath = filePath;

      // Get public URL
      const { data: publicUrlData } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Could not generate the profile photo URL."
        );
      }

      // Save URL in profiles table
      const {
        data: updatedProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Update profile immediately
      setProfile(updatedProfile);

      // Show success message
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (error) {
      logAppError("Profile photo upload", error);

      if (uploadedPath) {
        await supabase.storage
          .from("avatars")
          .remove([uploadedPath]);
      }

      setError(
        getFriendlyErrorMessage(
          error,
          "Unable to upload your profile photo."
        )
      );
    } finally {
      setUploadingPhoto(false);

      // Allow selecting the same file again
      event.target.value = "";
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // =========================================================
  // PROFILE HELPERS
  // =========================================================

  const displayName =
    profile?.full_name ||
    name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Member";

  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // =========================================================
  // SETTINGS SECTIONS
  // =========================================================

  const sections = [
    {
      id: "profile",
      label: "Profile",
      description: "Your public information",
      icon: faUser,
    },
    {
      id: "account",
      label: "Account",
      description: "Email and account details",
      icon: faEnvelope,
    },
    {
      id: "security",
      label: "Security",
      description: "Password and authentication",
      icon: faShieldHalved,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Manage your notifications",
      icon: faBell,
    },
    {
      id: "preferences",
      label: "Preferences",
      description: "Customize your experience",
      icon: faSliders,
    },
  ];

  const selectSection = (sectionId) => {
    setActiveSection(sectionId);

    if (window.innerWidth < 1024) {
      window.setTimeout(() => {
        settingsPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }
  };

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
            />
          </div>

          <h1 className="text-lg font-bold text-[#062f2f]">
            Loading your settings...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait while we load your profile.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="app-shell min-h-screen bg-[#fffdf2] text-[#062f2f]">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className={`fixed left-0 top-0 z-50 h-screen w-[260px] bg-[#062f2f] text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* Logo */}

        <div className="h-[82px] px-6 flex items-center gap-3 border-b border-white/10">

          <Link
            to="/dashboard"
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
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Close navigation menu"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>

        </div>

        {/* Navigation */}

        <nav className="px-4 space-y-2 flex-1">

          <div className="space-y-1.5">

            <Link
              to="/dashboard"
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faHouse} />
              </span>

              <span>Dashboard</span>
            </Link>

            <Link
              to="/discover"
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faCompass} />
              </span>

              <span>Discover</span>
            </Link>

            <Link
              to="/skills"
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faGraduationCap} />
              </span>

              <span>My Skills</span>
            </Link>

            <Link
              to="/messages"
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
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#f59e0b] text-[#062f2f] font-semibold transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faGear} />
              </span>

              <span>Settings</span>

            </Link>

          </div>

        </nav>

        {/* Logout */}

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

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="lg:ml-[260px]">

        {/* HEADER */}

        <header className="min-h-[78px] bg-white border-b border-[#d9e7df] px-4 py-3 sm:px-8 flex items-center justify-between gap-3">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Open navigation menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">
                Account
              </p>

              <h1 className="text-lg font-bold">
                Settings
              </h1>

            </div>

          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">

            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((previous) => !previous)}
                aria-label="Open profile menu"
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold">
                    {initials}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#062f2f]">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {occupation || "Member"}
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

        {/* CONTENT */}

        <main className="settings-content max-w-[1200px] mx-auto px-4 sm:px-8 py-6 sm:py-8">

          {/* INTRO */}

          <section className="settings-intro mb-8">

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Settings
            </h2>

            <p className="text-gray-500 mt-2">
              Manage your profile, account and preferences.
            </p>

          </section>

          {/* ERROR */}

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">

              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5"
              />

              <p className="text-sm">
                {error}
              </p>

            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">

            {/* =================================================
                SETTINGS MENU
            ================================================== */}

            <aside className="grid grid-cols-2 lg:sticky lg:top-6 lg:block bg-white border border-[#d9e7df] rounded-2xl sm:rounded-[24px] p-2 sm:p-3 h-fit">

              {sections.map((section) => (

                <button
                  key={section.id}
                  onClick={() => selectSection(section.id)}
                  className={`w-full flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl text-left transition cursor-pointer mb-1 ${
                    activeSection === section.id
                      ? "bg-[#f0fdfa] text-[#0f766e]"
                      : "hover:bg-[#f8faf8] text-gray-600"
                  }`}
                >

                  <span
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                      activeSection === section.id
                        ? "bg-[#0f766e] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <FontAwesomeIcon icon={section.icon} />
                  </span>

                  <span className="min-w-0 flex-1">

                    <span className="block text-sm font-bold">
                      {section.label}
                    </span>

                    <span className="hidden sm:block text-[10px] text-gray-400 mt-0.5 truncate">
                      {section.description}
                    </span>

                  </span>

                  <FontAwesomeIcon
                    icon={faChevronRight}
                    className="hidden sm:block text-[10px] opacity-40"
                  />

                </button>

              ))}

            </aside>

            {/* =================================================
                SETTINGS PANEL
            ================================================== */}

            <section
              ref={settingsPanelRef}
              className="scroll-mt-6 bg-white border border-[#d9e7df] rounded-2xl sm:rounded-[24px] overflow-hidden"
            >

              {/* =================================================
                  PROFILE
              ================================================== */}

              {activeSection === "profile" && (
                <div>

                  <div className="p-5 sm:p-8 border-b border-[#e5ece7]">

                    <h3 className="text-xl font-extrabold">
                      Profile
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      This information can be visible to other Skill Exchanger members.
                    </p>

                  </div>

                  <div className="p-5 sm:p-8">

                    {/* Avatar */}

                    <div className="flex items-start sm:items-center gap-4 sm:gap-5 mb-7 sm:mb-8">

                      <div className="relative">

                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="w-20 h-20 rounded-[22px] object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-[22px] bg-[#0f766e] text-white flex items-center justify-center text-2xl font-extrabold">
                            {initials}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handlePhotoClick}
                          disabled={uploadingPhoto}
                          className="absolute -right-2 -bottom-2 w-9 h-9 rounded-xl bg-[#f59e0b] text-white border-4 border-white flex items-center justify-center cursor-pointer hover:bg-[#d97706] transition disabled:opacity-60 disabled:cursor-not-allowed"
                          title={
                            uploadingPhoto
                              ? "Uploading photo..."
                              : "Change profile photo"
                          }
                        >
                          <FontAwesomeIcon
                            icon={
                              uploadingPhoto
                                ? faSpinner
                                : faCamera
                            }
                            spin={uploadingPhoto}
                            className="text-xs"
                          />
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />

                      </div>

                      <div className="min-w-0">

                        <h4 className="font-extrabold">
                          Profile photo
                        </h4>

                        <p className="text-xs text-gray-400 mt-1">
                          Add a photo so people can recognize you.
                        </p>

                        <p className="text-[10px] text-gray-400 mt-1">
                          JPG, PNG or WebP • Max 2 MB
                        </p>

                      </div>

                    </div>

                    {/* Full name */}

                    <div className="mb-5">

                      <label className="block text-sm font-bold mb-2">
                        Display name
                      </label>

                      <input
                        value={name}
                        onChange={(e) =>
                          setName(e.target.value)
                        }
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition"
                      />

                    </div>

                    {/* Username */}

                    <div className="mb-5">

                      <label className="block text-sm font-bold mb-2">
                        Username
                      </label>

                      <div className="relative">

                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                          @
                        </span>

                        <input
                          value={username}
                          onChange={(e) =>
                            setUsername(
                              e.target.value
                                .toLowerCase()
                                .replace(/\s/g, "")
                            )
                          }
                          placeholder="yourusername"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition"
                        />

                      </div>

                    </div>

                    {/* Country */}

                    <div className="mb-5">

                      <label className="block text-sm font-bold mb-2">
                        Country
                      </label>

                      <input
                        value={country}
                        onChange={(e) =>
                          setCountry(e.target.value)
                        }
                        placeholder="e.g. Malawi"
                        className="w-full px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition"
                      />

                    </div>

                    {/* City */}

                    <div className="mb-5">

                      <label className="block text-sm font-bold mb-2">
                        City
                      </label>

                      <input
                        value={city}
                        onChange={(e) =>
                          setCity(e.target.value)
                        }
                        placeholder="e.g. Mzuzu"
                        className="w-full px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition"
                      />

                    </div>

                    {/* Occupation */}

                    <div className="mb-5">

                      <label className="block text-sm font-bold mb-2">
                        Occupation
                      </label>

                      <input
                        value={occupation}
                        onChange={(e) =>
                          setOccupation(e.target.value)
                        }
                        placeholder="e.g. Student, Developer, Designer"
                        className="w-full px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition"
                      />

                    </div>

                    {/* Bio */}

                    <div className="mb-6">

                      <label className="block text-sm font-bold mb-2">
                        About you
                      </label>

                      <textarea
                        value={bio}
                        onChange={(e) =>
                          setBio(e.target.value)
                        }
                        rows="4"
                        maxLength="250"
                        placeholder="Tell people a little about yourself..."
                        className="w-full px-4 py-3 rounded-xl border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 transition resize-none"
                      />

                      <p className="text-[10px] text-gray-400 mt-1 text-right">
                        {bio.length}/250
                      </p>

                    </div>

                    {/* Save */}

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">

                      {saved ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-[#0f766e]">

                          <span className="w-7 h-7 rounded-lg bg-[#ccfbf1] flex items-center justify-center">
                            <FontAwesomeIcon icon={faCheck} />
                          </span>

                          Changes saved

                        </div>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className={`w-full sm:w-auto justify-center px-6 py-3 rounded-xl text-white text-sm font-bold transition flex items-center gap-2 ${
                          saving
                            ? "bg-amber-300 cursor-not-allowed"
                            : "bg-[#f59e0b] hover:bg-[#d97706] cursor-pointer"
                        }`}
                      >

                        {saving ? (
                          <>
                            <FontAwesomeIcon
                              icon={faSpinner}
                              spin
                            />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}

                      </button>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  ACCOUNT
              ================================================== */}

              {activeSection === "account" && (
                <div>

                  <div className="p-6 sm:p-8 border-b border-[#e5ece7]">

                    <h3 className="text-xl font-extrabold">
                      Account
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Manage your account information.
                    </p>

                  </div>

                  <div className="p-6 sm:p-8">

                    {securityMessage && (
                      <div className="mb-5 rounded-xl border border-[#99f6e4] bg-[#f0fdfa] px-4 py-3 text-sm font-medium text-[#0f766e]">
                        {securityMessage}
                      </div>
                    )}

                    <div className="p-5 rounded-2xl bg-[#f8faf8] border border-[#e5ece7] flex items-center gap-4">

                      <div className="w-11 h-11 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center">
                        <FontAwesomeIcon icon={faEnvelope} />
                      </div>

                      <div className="flex-1">

                        <p className="text-xs text-gray-400">
                          Email address
                        </p>

                        <p className="font-bold text-sm mt-1 break-all">
                          {user?.email || "No email available"}
                        </p>

                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#15803d] text-[10px] font-bold">
                        Verified
                      </span>

                    </div>

                    <div className="mt-6">

                      <h4 className="font-extrabold">
                        Account actions
                      </h4>

                      <p className="text-sm text-gray-500 mt-1">
                        These actions affect your Skill Exchanger account.
                      </p>

                    </div>

                    <div className="mt-4 border border-[#d9e7df] rounded-2xl divide-y divide-[#e5ece7]">

                      <button
                        onClick={handleLogout}
                        className="w-full p-4 flex items-center gap-3 text-left hover:bg-[#fafcfb] cursor-pointer"
                      >

                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={faRightFromBracket}
                          />
                        </div>

                        <div className="flex-1">

                          <p className="text-sm font-bold">
                            Sign out
                          </p>

                          <p className="text-xs text-gray-400">
                            Sign out of your current session.
                          </p>

                        </div>

                        <FontAwesomeIcon
                          icon={faChevronRight}
                          className="text-xs text-gray-400"
                        />

                      </button>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  SECURITY
              ================================================== */}

              {activeSection === "security" && (
                <div>

                  <div className="p-6 sm:p-8 border-b border-[#e5ece7]">

                    <h3 className="text-xl font-extrabold">
                      Security
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Keep your Skill Exchanger account secure.
                    </p>

                  </div>

                  <div className="p-6 sm:p-8">

                    <div className="p-5 rounded-2xl bg-[#f8faf8] border border-[#e5ece7] flex items-center gap-4">

                      <div className="w-11 h-11 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center">
                        <FontAwesomeIcon icon={faLock} />
                      </div>

                      <div className="flex-1">

                        <h4 className="font-bold text-sm">
                          Password
                        </h4>

                        <p className="text-xs text-gray-400 mt-1">
                          Your password is protected by Supabase Authentication.
                        </p>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() => setChangePasswordOpen(true)}
                      className="mt-5 w-full p-4 border border-[#d9e7df] rounded-2xl flex items-center gap-3 text-left hover:bg-[#fafcfb] cursor-pointer transition"
                    >

                      <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                        <FontAwesomeIcon icon={faLock} />
                      </div>

                      <div className="flex-1">

                        <p className="text-sm font-bold">
                          Change password
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Update your account password.
                        </p>

                      </div>

                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-xs text-gray-400"
                      />

                    </button>

                    {changePasswordOpen && (
                      <form onSubmit={updatePassword} className="mt-5 rounded-2xl border border-[#99f6e4] bg-[#f0fdfa] p-5">
                        <h4 className="text-sm font-bold text-[#0f766e]">Set a new password</h4>
                        <p className="mt-1 text-xs text-[#52716b]">
                          {isRecoverySession
                            ? "Use at least 8 characters and keep it unique."
                            : "Confirm your current password before choosing a new one."}
                        </p>

                        {!isRecoverySession && (
                          <>
                            <label htmlFor="current-password" className="mt-4 block text-xs font-semibold text-gray-700">Current password</label>
                            <input
                              id="current-password"
                              type="password"
                              value={currentPassword}
                              onChange={(event) => setCurrentPassword(event.target.value)}
                              autoComplete="current-password"
                              className="mt-2 w-full rounded-xl border border-[#d9e7df] px-4 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                            />
                          </>
                        )}

                        <label htmlFor="new-password" className="mt-4 block text-xs font-semibold text-gray-700">New password</label>
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          autoComplete="new-password"
                          className="mt-2 w-full rounded-xl border border-[#d9e7df] px-4 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                        />

                        <label htmlFor="confirm-password" className="mt-4 block text-xs font-semibold text-gray-700">Confirm new password</label>
                        <input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          autoComplete="new-password"
                          className="mt-2 w-full rounded-xl border border-[#d9e7df] px-4 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                        />

                        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <button type="button" onClick={() => setChangePasswordOpen(false)} className="rounded-lg border border-[#d9e7df] px-4 py-2.5 text-xs font-semibold text-gray-600">Cancel</button>
                          <button type="submit" disabled={updatingPassword} className="rounded-lg bg-[#0f766e] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{updatingPassword ? "Updating..." : "Update password"}</button>
                        </div>
                      </form>
                    )}

                    <div className="mt-8 p-5 rounded-2xl bg-[#fff7df] border border-[#fde68a]">

                      <p className="text-sm font-bold text-[#92400e]">
                        Security tip
                      </p>

                      <p className="text-xs text-[#92400e]/70 mt-1 leading-relaxed">
                        Never share your password or verification codes with another person.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  NOTIFICATIONS
              ================================================== */}

              {activeSection === "notifications" && (
                <div>

                  <div className="p-6 sm:p-8 border-b border-[#e5ece7]">

                    <h3 className="text-xl font-extrabold">
                      Notifications
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Choose what you want to be notified about.
                    </p>

                  </div>

                  <div className="p-6 sm:p-8 space-y-4">

                    {[
                      {
                        key: "messages",
                        title: "New messages",
                        description:
                          "Get notified when someone sends you a message.",
                      },
                      {
                        key: "requests",
                        title: "Exchange requests",
                        description:
                          "Get notified when someone wants to exchange skills.",
                      },
                      {
                        key: "recommendations",
                        title: "Skill recommendations",
                        description:
                          "Receive recommendations for potential exchange partners.",
                      },
                    ].map((item) => (

                      <div
                        key={item.key}
                        className="p-5 rounded-2xl border border-[#d9e7df] flex items-center gap-4"
                      >

                        <div className="w-11 h-11 rounded-xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center">
                          <FontAwesomeIcon icon={faBell} />
                        </div>

                        <div className="flex-1">

                          <h4 className="text-sm font-bold">
                            {item.title}
                          </h4>

                          <p className="text-xs text-gray-400 mt-1">
                            {item.description}
                          </p>

                        </div>

                        <button
                          onClick={() =>
                            setNotifications(
                              (current) => ({
                                ...current,
                                [item.key]:
                                  !current[item.key],
                              })
                            )
                          }
                          className={`relative w-11 h-6 rounded-full cursor-pointer transition ${
                            notifications[item.key]
                              ? "bg-[#0f766e]"
                              : "bg-gray-300"
                          }`}
                        >

                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
                              notifications[item.key]
                                ? "left-6"
                                : "left-1"
                            }`}
                          />

                        </button>

                      </div>

                    ))}

                  </div>

                </div>
              )}

              {/* =================================================
                  PREFERENCES
              ================================================== */}

              {activeSection === "preferences" && (
                <div>

                  <div className="p-6 sm:p-8 border-b border-[#e5ece7]">

                    <h3 className="text-xl font-extrabold">
                      Preferences
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      Customize your Skill Exchanger experience.
                    </p>

                  </div>

                  <div className="p-6 sm:p-8">

                    <div className="p-5 rounded-2xl border border-[#d9e7df]">

                      <div className="flex items-center gap-4">

                        <div className="w-11 h-11 rounded-xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center">
                          <FontAwesomeIcon icon={faSliders} />
                        </div>

                        <div>

                          <h4 className="font-bold text-sm">
                            Appearance
                          </h4>

                          <p className="text-xs text-gray-400 mt-1">
                            Choose how Skill Exchanger looks.
                          </p>

                        </div>

                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-5">

                        <button className="p-4 rounded-xl border-2 border-[#0f766e] bg-[#f0fdfa] text-sm font-bold cursor-pointer">
                          Light
                        </button>

                        <button className="p-4 rounded-xl border border-[#d9e7df] text-sm font-bold text-gray-400 cursor-not-allowed">
                          Dark
                        </button>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  DANGER ZONE
              ================================================== */}

              {activeSection === "account" && (
                <div className="mx-6 sm:mx-8 mb-8 pt-6 border-t border-[#e5ece7]">

                <div className="p-5 rounded-2xl border border-red-100 bg-red-50/50 flex items-center gap-4">

                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faTrash} />
                  </div>

                  <div className="flex-1">

                    <h4 className="text-sm font-bold text-red-700">
                      Delete account
                    </h4>

                    <p className="text-xs text-red-500/70 mt-1">
                      Permanently delete your Skill Exchanger account.
                    </p>

                  </div>

                  <button
                    type="button"
                    disabled
                    title="Account deletion is not available yet"
                    className="px-4 py-2 rounded-lg border border-red-200 text-red-400 text-xs font-bold cursor-not-allowed opacity-70"
                  >
                    Unavailable
                  </button>

                </div>

                </div>
              )}

            </section>

          </div>

        </main>

      </div>

    </div>
  );
}

export default Settings;