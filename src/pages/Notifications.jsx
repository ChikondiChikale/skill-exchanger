
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
  faHandshake,
  faBell,
  faCheck,
  faCheckDouble,
  faXmark,
  faBars,
  faLocationDot,
  faInbox,
  faClock,
  faArrowRight,
  faChevronDown,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";
import NotificationBell from "../components/NotificationBell";

function getInitials(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase() || "U";
}

function formatNotificationTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();

  const difference = now.getTime() - date.getTime();

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear()
      ? "numeric"
      : undefined,
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case "exchange_request":
      return faHandshake;

    case "request_accepted":
      return faCheck;

    case "request_declined":
      return faXmark;

    case "new_message":
      return faComments;

    default:
      return faBell;
  }
}

function getNotificationColors(type) {
  switch (type) {
    case "exchange_request":
      return {
        background: "bg-[#fff7df]",
        icon: "bg-[#f59e0b]",
        text: "text-[#92400e]",
      };

    case "request_accepted":
      return {
        background: "bg-green-50",
        icon: "bg-green-600",
        text: "text-green-700",
      };

    case "request_declined":
      return {
        background: "bg-red-50",
        icon: "bg-red-500",
        text: "text-red-700",
      };

    case "new_message":
      return {
        background: "bg-[#f0fdfa]",
        icon: "bg-[#0f766e]",
        text: "text-[#0f766e]",
      };

    default:
      return {
        background: "bg-gray-50",
        icon: "bg-[#062f2f]",
        text: "text-[#062f2f]",
      };
  }
}

function Notifications() {
  const navigate = useNavigate();

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");

  const [markingAll, setMarkingAll] = useState(false);

  /*
   * ============================================================
   * LOAD NOTIFICATIONS
   * ============================================================
   */

  const loadNotifications = async (userId) => {
    if (!userId) return;

    const {
      data,
      error: notificationsError,
    } = await supabase
      .from("notifications")
      .select(`
        id,
        user_id,
        sender_id,
        type,
        title,
        message,
        related_request_id,
        related_conversation_id,
        is_read,
        created_at
      `)
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (notificationsError) {
      console.error(
        "Notifications loading error:",
        notificationsError
      );

      setError(
        notificationsError.message ||
          "Unable to load your notifications."
      );

      return;
    }

    /*
     * ----------------------------------------------------------
     * Load sender profiles
     * ----------------------------------------------------------
     */

    const senderIds = [
      ...new Set(
        (data || [])
          .map((notification) => notification.sender_id)
          .filter(Boolean)
      ),
    ];

    let senderProfiles = [];

    if (senderIds.length > 0) {
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username, avatar_url, occupation, city, country"
        )
        .in("id", senderIds);

      if (profilesError) {
        console.error(
          "Sender profiles loading error:",
          profilesError
        );
      } else {
        senderProfiles = profiles || [];
      }
    }

    const profileMap = new Map(
      senderProfiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const enrichedNotifications = (data || []).map(
      (notification) => {
        const sender = notification.sender_id
          ? profileMap.get(notification.sender_id)
          : null;

        return {
          ...notification,
          sender,
        };
      }
    );

    setNotifications(enrichedNotifications);
  };

  /*
   * ============================================================
   * INITIALIZE
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
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
          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (!mounted) return;

        setCurrentUser(user);

        /*
         * ------------------------------------------------------
         * Current profile
         * ------------------------------------------------------
         */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, occupation, avatar_url, city, country"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile loading error:",
            profileError
          );
        }

        if (mounted) {
          setCurrentProfile(profile || null);
        }

        /*
         * ------------------------------------------------------
         * Notifications
         * ------------------------------------------------------
         */

        await loadNotifications(user.id);
      } catch (err) {
        console.error(
          "Notifications initialization error:",
          err
        );

        if (mounted) {
          setError(
            err?.message ||
              "Unable to load notifications."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  /*
   * ============================================================
   * REALTIME NOTIFICATIONS
   * ============================================================
   */

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const channel = supabase
      .channel(
        `notifications-${currentUser.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const newNotification =
            payload.new;

          /*
           * Load sender profile if available.
           */

          let sender = null;

          if (newNotification.sender_id) {
            const {
              data: senderProfile,
            } = await supabase
              .from("profiles")
              .select(
                "id, full_name, username, avatar_url, occupation, city, country"
              )
              .eq(
                "id",
                newNotification.sender_id
              )
              .maybeSingle();

            sender = senderProfile || null;
          }

          setNotifications((current) => {
            const exists = current.some(
              (item) =>
                item.id === newNotification.id
            );

            if (exists) {
              return current;
            }

            return [
              {
                ...newNotification,
                sender,
              },
              ...current,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  /*
   * ============================================================
   * FILTERED NOTIFICATIONS
   * ============================================================
   */

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter(
        (notification) => !notification.is_read
      );
    }

    if (activeFilter === "requests") {
      return notifications.filter(
        (notification) =>
          notification.type ===
            "exchange_request" ||
          notification.type ===
            "request_accepted" ||
          notification.type ===
            "request_declined"
      );
    }

    if (activeFilter === "messages") {
      return notifications.filter(
        (notification) =>
          notification.type === "new_message"
      );
    }

    return notifications;
  }, [notifications, activeFilter]);

  /*
   * ============================================================
   * UNREAD COUNT
   * ============================================================
   */

  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.is_read
    ).length;
  }, [notifications]);

  /*
   * ============================================================
   * MARK ONE AS READ
   * ============================================================
   */

  const markAsRead = async (notification) => {
    if (!notification || notification.is_read) {
      return;
    }

    const {
      error: updateError,
    } = await supabase
      .from("notifications")
      .update({
        is_read: true,
      })
      .eq("id", notification.id)
      .eq("user_id", currentUser.id);

    if (updateError) {
      console.error(
        "Mark notification read error:",
        updateError
      );

      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              is_read: true,
            }
          : item
      )
    );
  };

  /*
   * ============================================================
   * MARK ALL AS READ
   * ============================================================
   */

  const markAllAsRead = async () => {
    if (
      !currentUser?.id ||
      unreadCount === 0 ||
      markingAll
    ) {
      return;
    }

    setMarkingAll(true);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } catch (err) {
      console.error(
        "Mark all notifications error:",
        err
      );

      setError(
        err?.message ||
          "Unable to mark notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  /*
   * ============================================================
   * HANDLE NOTIFICATION CLICK
   * ============================================================
   */

  const handleNotificationClick = async (
    notification
  ) => {
    if (!notification) return;

    /*
     * Mark as read first.
     */

    await markAsRead(notification);

    /*
     * Exchange request
     */

    if (
      notification.type ===
        "exchange_request" ||
      notification.type ===
        "request_accepted" ||
      notification.type ===
        "request_declined"
    ) {
      navigate("/exchange-requests");

      return;
    }

    /*
     * Message
     */

    if (
      notification.type === "new_message"
    ) {
      navigate("/messages", {
        state: {
          conversationId:
            notification.related_conversation_id ||
            null,
        },
      });

      return;
    }
  };

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
   * CLOSE SIDEBAR
   * ============================================================
   */

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffdf2] flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 mx-auto rounded-xl bg-[#062f2f] text-[#fbbf24] flex items-center justify-center mb-5">

            <FontAwesomeIcon
              icon={faBell}
              className="text-lg"
            />

          </div>

          <h1 className="text-lg font-bold text-[#062f2f]">
            Loading notifications...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please wait while we load your notifications.
          </p>

        </div>

      </div>
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="app-shell min-h-screen bg-[#fffdf2] text-[#062f2f]">

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
        className={`fixed left-0 top-0 z-50 h-screen w-[260px] bg-[#062f2f] text-white flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${
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

        <nav className="px-4 space-y-2 flex-1 overflow-hidden">

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
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
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
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faComments} />
              </span>

              <span>Messages</span>

            </Link>

          </div>

          <div className="space-y-2">

            {/* EXCHANGE REQUESTS */}

            <Link
              to="/exchange-requests"
              onClick={closeSidebar}
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
                <FontAwesomeIcon icon={faHandshake} />
              </span>

              <span>Exchange Requests</span>

            </Link>

            {/* NOTIFICATIONS */}

            <Link
              to="/notifications"
              onClick={closeSidebar}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f59e0b] text-[#062f2f] font-semibold transition cursor-pointer"
            >

              <div className="flex items-center gap-3">

                <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBell} />
                </span>

                <span>Notifications</span>

              </div>

              {unreadCount > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#f59e0b] text-[10px] font-extrabold flex items-center justify-center">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
                </span>
              )}

            </Link>

            {/* SETTINGS */}

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

        {/* HEADER */}

        <header className="h-[78px] bg-white border-b border-[#d9e7df] px-5 sm:px-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            {/* MOBILE MENU */}

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            <div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0f766e]">
                Updates
              </p>

              <h1 className="text-lg font-bold">
                Notifications
              </h1>

            </div>

          </div>

          {/* USER */}

          <div className="flex items-center gap-3">

            <NotificationBell />

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen((previous) => !previous)}
                aria-label="Open profile menu"
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              >
                {currentProfile?.avatar_url ? (
                  <img
                    src={currentProfile.avatar_url}
                    alt={currentProfile.full_name || "Profile"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center justify-center font-bold">
                    {getInitials(
                      currentProfile?.full_name ||
                        currentUser?.email ||
                        "User"
                    )}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#062f2f]">
                    {currentProfile?.full_name || currentProfile?.username || "Skill Exchanger"}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {currentProfile?.occupation || "Member"}
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

        {/* ======================================================
            CONTENT
        ======================================================= */}

        <main className="notifications-content max-w-[1100px] mx-auto px-5 sm:px-8 py-8">

          {/* PAGE INTRO */}

          <section className="notifications-intro mb-8">

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

              <div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ccfbf1] text-[#0f766e] text-xs font-bold mb-4">

                  <FontAwesomeIcon icon={faBell} />

                  Stay updated

                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Your Notifications
                </h2>

                <p className="mt-2 text-gray-500 max-w-2xl">
                  Keep track of exchange requests,
                  messages and other activity.
                </p>

              </div>

              {unreadCount > 0 && (

                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#062f2f] text-white text-sm font-bold hover:bg-[#0f766e] disabled:opacity-50 cursor-pointer transition flex items-center gap-2"
                >

                  <FontAwesomeIcon
                    icon={faCheckDouble}
                  />

                  {markingAll
                    ? "Marking..."
                    : "Mark all as read"}

                </button>

              )}

            </div>

          </section>

          {/* ERROR */}

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
              >
                <FontAwesomeIcon
                  icon={faXmark}
                />
              </button>

            </div>

          )}

          {/* FILTERS */}

          <div className="notifications-tabs bg-white border border-[#d9e7df] rounded-[24px] p-2 mb-6 flex flex-wrap gap-2">

            {[
              {
                id: "all",
                label: "All",
              },
              {
                id: "unread",
                label: "Unread",
                count: unreadCount,
              },
              {
                id: "requests",
                label: "Exchange Requests",
              },
              {
                id: "messages",
                label: "Messages",
              },
            ].map((filter) => (

              <button
                key={filter.id}
                onClick={() =>
                  setActiveFilter(filter.id)
                }
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                  activeFilter === filter.id
                    ? "bg-[#0f766e] text-white"
                    : "text-gray-500 hover:bg-[#f0fdfa] hover:text-[#0f766e]"
                }`}
              >

                {filter.label}

                {filter.count > 0 && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                      activeFilter === filter.id
                        ? "bg-white text-[#0f766e]"
                        : "bg-[#fef3c7] text-[#92400e]"
                    }`}
                  >
                    {filter.count}
                  </span>
                )}

              </button>

            ))}

          </div>

          {/* NOTIFICATIONS */}

          {filteredNotifications.length > 0 ? (

            <div className="space-y-3">

              {filteredNotifications.map(
                (notification) => {

                  const colors =
                    getNotificationColors(
                      notification.type
                    );

                  const icon =
                    getNotificationIcon(
                      notification.type
                    );

                  const sender =
                    notification.sender;

                  return (

                    <button
                      key={notification.id}
                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }
                      className={`notification-row w-full text-left bg-white border rounded-[18px] p-4 sm:p-5 transition cursor-pointer ${
                        notification.is_read
                          ? "border-[#d9e7df] hover:border-[#99f6e4] hover:shadow-sm"
                          : "border-[#fbbf24]/50 shadow-sm"
                      }`}
                    >

                      <div className="flex items-start gap-4">

                        {/* ICON */}

                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${colors.icon}`}
                        >

                          <FontAwesomeIcon
                            icon={icon}
                          />

                        </div>

                        {/* CONTENT */}

                        <div className="flex-1 min-w-0">

                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">

                            <div>

                              <div className="flex items-center gap-2">

                                  <h3
                                    className={`text-sm font-extrabold ${
                                    notification.is_read
                                      ? "text-[#062f2f]"
                                      : colors.text
                                  }`}
                                >
                                  {notification.title}
                                </h3>

                                {!notification.is_read && (

                                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] flex-shrink-0" />

                                )}

                              </div>

                              {sender && (

                                <div className="flex items-center gap-2 mt-2">

                                  {sender.avatar_url ? (

                                    <img
                                      src={
                                        sender.avatar_url
                                      }
                                      alt={
                                        sender.full_name ||
                                        "User"
                                      }
                                      className="w-6 h-6 rounded-full object-cover"
                                    />

                                  ) : (

                                    <div className="w-6 h-6 rounded-full bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center text-[9px] font-extrabold">
                                      {getInitials(
                                        sender.full_name ||
                                          sender.username ||
                                          "User"
                                      )}
                                    </div>

                                  )}

                                  <span className="text-xs font-semibold text-gray-500">

                                    {sender.full_name ||
                                      sender.username ||
                                      "Skill Exchanger"}

                                  </span>

                                </div>

                              )}

                            </div>

                            <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">

                              <FontAwesomeIcon
                                icon={faClock}
                              />

                              {formatNotificationTime(
                                notification.created_at
                              )}

                            </span>

                          </div>

                          {notification.message && (

                            <p className="text-xs text-gray-500 leading-relaxed mt-2">
                              {notification.message}
                            </p>

                          )}

                          <div className="flex items-center justify-between mt-4">

                            <div className="flex items-center gap-2">

                              {sender?.city ||
                              sender?.country ? (

                                <span className="text-xs text-gray-400 flex items-center gap-1">

                                  <FontAwesomeIcon
                                    icon={
                                      faLocationDot
                                    }
                                  />

                                  {[
                                    sender.city,
                                    sender.country,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}

                                </span>

                              ) : null}

                            </div>

                            <span className="text-xs font-bold text-[#0f766e] flex items-center gap-1">

                              View

                              <FontAwesomeIcon
                                icon={faArrowRight}
                              />

                            </span>

                          </div>

                        </div>

                      </div>

                    </button>

                  );
                }
              )}

            </div>

          ) : (

            /* EMPTY */

            <div className="bg-white border border-[#d9e7df] rounded-[24px] p-12 sm:p-16 text-center">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center text-2xl">

                <FontAwesomeIcon
                  icon={
                    activeFilter === "messages"
                      ? faComments
                      : activeFilter ===
                        "requests"
                      ? faHandshake
                      : faInbox
                  }
                />

              </div>

              <h3 className="text-xl font-extrabold mt-5">
                {activeFilter === "unread"
                  ? "You're all caught up"
                  : activeFilter === "requests"
                  ? "No exchange requests"
                  : activeFilter === "messages"
                  ? "No message notifications"
                  : "No notifications yet"}
              </h3>

              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                {activeFilter === "unread"
                  ? "You don't have any unread notifications right now."
                  : "When there is new activity on your account, you'll see it here."}
              </p>

              {activeFilter === "all" && (

                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 mt-6 px-5 py-3 rounded-xl bg-[#f59e0b] text-white font-bold text-sm hover:bg-[#d97706] cursor-pointer transition"
                >

                  <FontAwesomeIcon
                    icon={faCompass}
                  />

                  Discover People

                </Link>

              )}

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

export default Notifications;
