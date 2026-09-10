
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  faHouse,
  faCompass,
  faGraduationCap,
  faComments,
  faGear,
  faRightFromBracket,
  faHandshake,
  faBars,
  faXmark,
  faCheck,
  faBan,
  faPaperPlane,
  faLocationDot,
  faClock,
  faSpinner,
  faMagnifyingGlass,
  faChevronDown,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { supabase } from "../lib/supabase";
import NotificationBell from "../components/NotificationBell";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "declined":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const getStatusClasses = (status) => {
  switch (status) {
    case "accepted":
      return "bg-green-100 text-green-700";
    case "declined":
      return "bg-red-100 text-red-700";
    case "cancelled":
      return "bg-gray-100 text-gray-600";
    case "pending":
    default:
      return "bg-amber-100 text-amber-700";
  }
};

export default function ExchangeRequests() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const loadRequests = async (currentUser = user) => {
    if (!currentUser) return;

    try {
      setError("");

      const { data: requestData, error: requestError } = await supabase
        .from("exchange_requests")
        .select(
          `
            id,
            sender_id,
            receiver_id,
            skill_id,
            message,
            status,
            created_at,
            responded_at
          `
        )
        .or(
          `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
        )
        .order("created_at", { ascending: false });

      if (requestError) {
        throw requestError;
      }

      const safeRequests = requestData || [];

      const profileIds = [
        ...new Set(
          safeRequests.flatMap((request) => [
            request.sender_id,
            request.receiver_id,
          ])
        ),
      ];

      const skillIds = [
        ...new Set(
          safeRequests
            .map((request) => request.skill_id)
            .filter(Boolean)
        ),
      ];

      let profilesMap = {};
      let skillsMap = {};

      if (profileIds.length) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              username,
              bio,
              country,
              city,
              occupation,
              avatar_url
            `
          )
          .in("id", profileIds);

        if (profileError) {
          throw profileError;
        }

        profilesMap = Object.fromEntries(
          (profileData || []).map((item) => [item.id, item])
        );
      }

      if (skillIds.length) {
        const { data: skillData, error: skillError } = await supabase
          .from("skills")
          .select(
            `
              id,
              user_id,
              skill_name,
              skill_type,
              description
            `
          )
          .in("id", skillIds);

        if (skillError) {
          throw skillError;
        }

        skillsMap = Object.fromEntries(
          (skillData || []).map((item) => [item.id, item])
        );
      }

      const enrichedRequests = safeRequests.map((request) => ({
        ...request,
        sender: profilesMap[request.sender_id] || null,
        receiver: profilesMap[request.receiver_id] || null,
        skill: request.skill_id
          ? skillsMap[request.skill_id] || null
          : null,
      }));

      setRequests(enrichedRequests);
    } catch (err) {
      console.error("Error loading exchange requests:", err);
      setError(
        err?.message ||
          "Unable to load exchange requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialise = async () => {
      try {
        setLoading(true);

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          navigate("/login");
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
              id,
              full_name,
              username,
              occupation,
              avatar_url,
              profile_completed
            `
          )
          .eq("id", currentUser.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (!mounted) return;

        setProfile(profileData || null);

        await loadRequests(currentUser);
      } catch (err) {
        console.error("Error initialising exchange requests:", err);

        if (mounted) {
          setError(
            err?.message ||
              "Something went wrong while loading exchange requests."
          );
          setLoading(false);
        }
      }
    };

    initialise();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return undefined;

    const channel = supabase
      .channel(`exchange-requests-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exchange_requests",
        },
        () => {
          loadRequests(user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const incomingRequests = useMemo(
    () =>
      requests.filter(
        (request) => request.receiver_id === user?.id
      ),
    [requests, user]
  );

  const outgoingRequests = useMemo(
    () =>
      requests.filter(
        (request) => request.sender_id === user?.id
      ),
    [requests, user]
  );

  const pendingIncomingCount = useMemo(
    () =>
      incomingRequests.filter(
        (request) => request.status === "pending"
      ).length,
    [incomingRequests]
  );

  const filteredRequests = useMemo(() => {
    switch (activeTab) {
      case "incoming":
        return incomingRequests;

      case "sent":
        return outgoingRequests;

      case "all":
      default:
        return requests;
    }
  }, [
    activeTab,
    requests,
    incomingRequests,
    outgoingRequests,
  ]);

  const notifyRequestSender = async (request, status) => {
    const isAccepted = status === "accepted";
    const responderName = profile?.full_name || profile?.username || "Someone";

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: request.sender_id,
        sender_id: user.id,
        type: isAccepted ? "request_accepted" : "request_declined",
        title: isAccepted
          ? "Exchange Request Accepted"
          : "Exchange Request Declined",
        message: isAccepted
          ? `${responderName} accepted your skill exchange request.`
          : `${responderName} declined your skill exchange request.`,
        related_request_id: request.id,
        is_read: false,
      });

    if (notificationError) {
      console.error("Request status notification error:", notificationError);
    }
  };

  const handleAccept = async (request) => {
    try {
      setActionLoading(request.id);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("exchange_requests")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (updateError) {
        throw updateError;
      }

      await notifyRequestSender(request, "accepted");

      const { data: conversationId, error: conversationError } =
        await supabase.rpc("create_direct_conversation", {
          other_user: request.sender_id,
        });

      if (conversationError) {
        throw conversationError;
      }

      await loadRequests(user);

      navigate("/messages", {
        state: {
          conversationId,
        },
      });
    } catch (err) {
      console.error("Error accepting request:", err);

      setError(
        err?.message ||
          "Unable to accept this request. Please try again."
      );

      await loadRequests(user);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (request) => {
    try {
      setActionLoading(request.id);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("exchange_requests")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      if (updateError) {
        throw updateError;
      }

      await notifyRequestSender(request, "declined");

      await loadRequests(user);
      setSuccess("The exchange request was declined and the sender was notified.");
    } catch (err) {
      console.error("Error declining request:", err);

      setError(
        err?.message ||
          "Unable to decline this request. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (request) => {
    try {
      setActionLoading(request.id);
      setError("");
      setSuccess("");

      const { error: updateError } = await supabase
        .from("exchange_requests")
        .update({
          status: "cancelled",
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id)
        .eq("sender_id", user.id)
        .eq("status", "pending");

      if (updateError) {
        throw updateError;
      }

      await loadRequests(user);
      setSuccess("The exchange request was cancelled.");
    } catch (err) {
      console.error("Error cancelling request:", err);

      setError(
        err?.message ||
          "Unable to cancel this request. Please try again."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const renderAvatar = (person, size = "normal") => {
    const dimensions =
      size === "large"
        ? "w-16 h-16"
        : "w-12 h-12";

    if (person?.avatar_url) {
      return (
        <img
          src={person.avatar_url}
          alt={person.full_name || "User"}
          className={`${dimensions} rounded-full object-cover border-2 border-white shadow-sm`}
        />
      );
    }

    return (
      <div
        className={`${dimensions} rounded-full bg-[#0f766e] text-white flex items-center justify-center font-bold shadow-sm`}
      >
        {getInitials(person?.full_name)}
      </div>
    );
  };

  return (
    <div className="app-shell min-h-screen bg-[#fffdf2] text-[#163b3b]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50
          h-screen w-[260px]
          bg-[#062f2f]
          text-white
          transform transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-6 py-7 flex items-center justify-between">
            <Link
              to="/dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-xl bg-[#f59e0b] flex items-center justify-center text-[#062f2f] font-black text-xl">
                S
              </div>

              <div>
                <div className="text-lg font-bold leading-none">
                  Skill
                </div>
                <div className="text-lg font-bold leading-none text-[#f59e0b]">
                  Exchanger
                </div>
              </div>
            </Link>

            <button
              onClick={closeSidebar}
              className="lg:hidden w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
              aria-label="Close menu"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="px-4 space-y-2 flex-1">
            <Link
              to="/dashboard"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <FontAwesomeIcon icon={faHouse} className="w-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/discover"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <FontAwesomeIcon icon={faCompass} className="w-5" />
              <span>Discover</span>
            </Link>

            <Link
              to="/skills"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <FontAwesomeIcon icon={faGraduationCap} className="w-5" />
              <span>My Skills</span>
            </Link>

            <Link
              to="/messages"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <FontAwesomeIcon icon={faComments} className="w-5" />
              <span>Messages</span>
            </Link>

            <Link
              to="/exchange-requests"
              onClick={closeSidebar}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f59e0b] text-[#062f2f] font-semibold transition"
            >
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faHandshake} className="w-5" />
                <span>Exchange Requests</span>
              </div>

              {pendingIncomingCount > 0 && (
                <span className="min-w-[24px] h-6 px-1.5 rounded-full bg-[#062f2f] text-white text-xs flex items-center justify-center font-bold">
                  {pendingIncomingCount > 99
                    ? "99+"
                    : pendingIncomingCount}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              onClick={closeSidebar}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-white/10 hover:text-white transition"
            >
              <FontAwesomeIcon icon={faGear} className="w-5" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* Logout */}
          <div className="px-4 pb-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/75 hover:bg-red-500/15 hover:text-red-300 transition"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-[260px] min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#fffdf2]/95 backdrop-blur border-b border-[#d9e7df]">
          <div className="px-4 sm:px-6 lg:px-8 h-[76px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-xl bg-white border border-[#d9e7df] flex items-center justify-center text-[#062f2f] hover:bg-[#f0fdfa]"
                aria-label="Open menu"
              >
                <FontAwesomeIcon icon={faBars} />
              </button>

              <div className="hidden sm:block relative w-full max-w-md">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="search"
                  placeholder="Search skills, people or topics..."
                  aria-label="Search skills, people or topics"
                  className="w-full rounded-xl border border-[#dce8e1] bg-[#fbfdfb] py-2.5 pl-9 pr-4 text-xs outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((previous) => !previous)}
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                >
                  {renderAvatar(profile)}

                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-[#062f2f]">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile?.occupation || "Skill Exchanger"}
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
          </div>
        </header>

        <main className="requests-content p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Intro */}
          <section className="requests-intro mb-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#073f3f]">
              Exchange Requests
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your incoming and sent requests.
            </p>
          </section>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 flex items-start justify-between gap-4">
              <p className="text-sm">{error}</p>

              <button
                onClick={() => loadRequests(user)}
                className="text-sm font-semibold underline whitespace-nowrap"
              >
                Retry
              </button>
            </div>
          )}

          {success && (
            <div className="mb-5 bg-[#f0fdfa] border border-[#99f6e4] text-[#0f766e] rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{success}</p>
              <button
                onClick={() => setSuccess("")}
                className="text-[#0f766e] hover:text-[#062f2f] cursor-pointer"
                aria-label="Close success message"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="requests-tabs bg-white border border-[#d9e7df] rounded-2xl p-2 mb-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`
                  px-3 py-3 rounded-xl text-sm font-semibold transition
                  ${
                    activeTab === "all"
                      ? "bg-[#0f766e] text-white"
                      : "text-gray-600 hover:bg-[#f0fdfa]"
                  }
                `}
              >
                All
                <span className="ml-2 opacity-80">
                  {requests.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("incoming")}
                className={`
                  px-3 py-3 rounded-xl text-sm font-semibold transition
                  ${
                    activeTab === "incoming"
                      ? "bg-[#0f766e] text-white"
                      : "text-gray-600 hover:bg-[#f0fdfa]"
                  }
                `}
              >
                Incoming
                <span className="ml-2 opacity-80">
                  {incomingRequests.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("sent")}
                className={`
                  px-3 py-3 rounded-xl text-sm font-semibold transition
                  ${
                    activeTab === "sent"
                      ? "bg-[#0f766e] text-white"
                      : "text-gray-600 hover:bg-[#f0fdfa]"
                  }
                `}
              >
                Sent
                <span className="ml-2 opacity-80">
                  {outgoingRequests.length}
                </span>
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="bg-white border border-[#d9e7df] rounded-[24px] min-h-[320px] flex flex-col items-center justify-center">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-[#0f766e] text-2xl mb-3"
              />

              <p className="text-sm text-gray-500">
                Loading exchange requests...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            /* Empty state */
            <div className="bg-white border border-[#d9e7df] rounded-[24px] min-h-[360px] flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center text-2xl mb-5">
                <FontAwesomeIcon icon={faHandshake} />
              </div>

              <h3 className="text-xl font-bold text-[#062f2f] mb-2">
                No exchange requests yet
              </h3>

              <p className="max-w-md text-sm text-gray-500 mb-6">
                Discover people with skills you want to learn and
                send them an exchange request.
              </p>

              <Link
                to="/discover"
                className="inline-flex items-center gap-2 bg-[#0f766e] hover:bg-[#115e59] text-white px-5 py-3 rounded-xl font-semibold transition"
              >
                <FontAwesomeIcon icon={faCompass} />
                Discover Skills
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const isIncoming =
                  request.receiver_id === user?.id;

                const otherPerson = isIncoming
                  ? request.sender
                  : request.receiver;

                const isPending =
                  request.status === "pending";

                const isActionLoading =
                  actionLoading === request.id;

                return (
                  <article
                    key={request.id}
                    className="request-row bg-white border border-[#d9e7df] rounded-[18px] p-4 sm:p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="flex gap-4 min-w-0">
                        <div className="shrink-0">
                          {renderAvatar(otherPerson, "large")}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-[#062f2f] text-lg">
                              {otherPerson?.full_name ||
                                "Unknown User"}
                            </h3>

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                                request.status
                              )}`}
                            >
                              {getStatusLabel(request.status)}
                            </span>
                          </div>

                          <p className="text-sm text-gray-500 mb-3">
                            @{otherPerson?.username || "user"}
                            {otherPerson?.occupation
                              ? ` • ${otherPerson.occupation}`
                              : ""}
                          </p>

                          {otherPerson?.city ||
                          otherPerson?.country ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                              <FontAwesomeIcon
                                icon={faLocationDot}
                                className="text-[#0f766e]"
                              />

                              <span>
                                {[
                                  otherPerson?.city,
                                  otherPerson?.country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          ) : null}

                          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f0fdfa] text-[#0f766e] text-sm font-semibold">
                            <FontAwesomeIcon
                              icon={faGraduationCap}
                            />

                            <span>
                              {request.skill?.skill_name ||
                                "Skill exchange"}
                            </span>
                          </div>

                          {request.message && (
                            <div className="mt-4 bg-[#fffdf2] border border-[#e5ece7] rounded-xl p-4">
                              <p className="text-xs font-semibold text-gray-500 mb-1">
                                Message
                              </p>

                              <p className="text-sm text-gray-700 leading-relaxed">
                                {request.message}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                            <FontAwesomeIcon icon={faClock} />

                            <span>
                              {isIncoming
                                ? "Received"
                                : "Sent"}{" "}
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:w-[190px] shrink-0">
                        {isIncoming && isPending ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() =>
                                handleAccept(request)
                              }
                              disabled={isActionLoading}
                              className="w-full inline-flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#115e59] disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold text-sm transition"
                            >
                              <FontAwesomeIcon icon={faCheck} />

                              {isActionLoading
                                ? "Processing..."
                                : "Accept Exchange"}
                            </button>

                            <button
                              onClick={() =>
                                handleDecline(request)
                              }
                              disabled={isActionLoading}
                              className="w-full inline-flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-semibold text-sm transition"
                            >
                              <FontAwesomeIcon icon={faBan} />
                              Decline
                            </button>
                          </div>
                        ) : request.status === "accepted" ? (
                          <button
                            onClick={async () => {
                              try {
                                setActionLoading(request.id);

                                const { data: conversationId, error: conversationError } =
                                  await supabase.rpc(
                                    "create_direct_conversation",
                                    {
                                      other_user:
                                        otherPerson?.id,
                                    }
                                  );

                                if (conversationError) {
                                  throw conversationError;
                                }

                                navigate("/messages", {
                                  state: {
                                    conversationId,
                                  },
                                });
                              } catch (err) {
                                console.error(
                                  "Error opening conversation:",
                                  err
                                );

                                setError(
                                  err?.message ||
                                    "Unable to open the conversation."
                                );
                              } finally {
                                setActionLoading(null);
                              }
                            }}
                            disabled={isActionLoading}
                            className="w-full inline-flex items-center justify-center gap-2 bg-[#0f766e] hover:bg-[#115e59] disabled:opacity-60 text-white px-4 py-3 rounded-xl font-semibold text-sm transition"
                          >
                            <FontAwesomeIcon icon={faComments} />

                            {isActionLoading
                              ? "Opening..."
                              : "Open Messages"}
                          </button>
                        ) : !isIncoming && isPending ? (
                          <button
                            onClick={() =>
                              handleCancel(request)
                            }
                            disabled={isActionLoading}
                            className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-semibold text-sm transition"
                          >
                            <FontAwesomeIcon icon={faBan} />

                            {isActionLoading
                              ? "Cancelling..."
                              : "Cancel Request"}
                          </button>
                        ) : (
                          <div className="text-sm text-gray-400 text-center lg:text-right">
                            {request.status === "declined"
                              ? "This request was declined."
                              : request.status === "cancelled"
                              ? "This request was cancelled."
                              : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Bottom CTA */}
          {!loading && (
            <div className="mt-6 bg-[#062f2f] rounded-[24px] p-6 sm:p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-1">
                    Looking for a new skill?
                  </h3>

                  <p className="text-white/70 text-sm">
                    Discover people and find the perfect skill
                    exchange partner.
                  </p>
                </div>

                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-[#062f2f] px-5 py-3 rounded-xl font-bold transition shrink-0"
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                  Find Someone
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
