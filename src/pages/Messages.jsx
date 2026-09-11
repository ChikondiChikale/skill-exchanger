import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCompass,
  faGraduationCap,
  faComments,
  faGear,
  faRightFromBracket,
  faMagnifyingGlass,
  faPaperPlane,
  faArrowLeft,
  faHandshake,
  faBars,
  faXmark,
  faCheck,
  faChevronDown,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { supabase } from "../lib/supabase";
import { usePendingExchangeRequests } from "../lib/usePendingExchangeRequests";
import NotificationBell from "../components/NotificationBell";

function formatMessageTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diff < dayMs && date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (diff < 2 * dayMs) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name = "User") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";
}

function formatMessageDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

function Messages() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pendingRequestCount = usePendingExchangeRequests();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [mobileChat, setMobileChat] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const channelRef = useRef(null);
  const selectedIdRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const filteredConversations = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.name.toLowerCase().includes(query) ||
        conversation.skill.toLowerCase().includes(query) ||
        conversation.preview.toLowerCase().includes(query)
    );
  }, [search, conversations]);

  const loadMessages = async (conversationId) => {
    if (!conversationId) return;

    setLoadingMessages(true);

    const { data, error: messagesError } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at, read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error loading messages:", messagesError);
      setError("Unable to load messages.");
      setLoadingMessages(false);
      return;
    }

    const messages = (data || []).map((item) => ({
      id: item.id,
      sender: item.sender_id === currentUser?.id ? "me" : "them",
      text: item.content,
      time: formatMessageTime(item.created_at),
      createdAt: item.created_at,
      dateLabel: formatMessageDate(item.created_at),
      readAt: item.read_at,
    }));

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages }
          : conversation
      )
    );

    setLoadingMessages(false);
  };

  useEffect(() => {
    if (!selectedConversation || loadingMessages || !shouldAutoScrollRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [selectedConversation?.id, selectedConversation?.messages.length, loadingMessages]);

  const handleMessagesScroll = () => {
    const container = messagesScrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  const loadConversations = async (user) => {
    setError("");

    const { data: memberships, error: membershipError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id, joined_at")
      .eq("user_id", user.id);

    if (membershipError) {
      console.error("Error loading conversation memberships:", membershipError);
      setError("Unable to load your conversations.");
      setConversations([]);
      return;
    }

    if (!memberships?.length) {
      setConversations([]);
      setSelectedId(null);
      return;
    }

    const conversationIds = memberships.map((item) => item.conversation_id);

    const { data: allMembers, error: membersError } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", conversationIds);

    if (membersError) {
      console.error("Error loading conversation members:", membersError);
      setError("Unable to load conversation members.");
      return;
    }

    const otherUserIds = [
      ...new Set(
        (allMembers || [])
          .filter((member) => member.user_id !== user.id)
          .map((member) => member.user_id)
      ),
    ];

    let profiles = [];

    if (otherUserIds.length) {
      const { data: profileData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, username, country, city, occupation, avatar_url, profile_completed")
        .in("id", otherUserIds);

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
      } else {
        profiles = profileData || [];
      }
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const { data: recentMessages, error: recentMessagesError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at, read_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (recentMessagesError) {
      console.error("Error loading recent messages:", recentMessagesError);
    }

    const latestByConversation = new Map();

    for (const item of recentMessages || []) {
      if (!latestByConversation.has(item.conversation_id)) {
        latestByConversation.set(item.conversation_id, item);
      }
    }

    const formatted = conversationIds
      .map((conversationId) => {
        const member = (allMembers || []).find(
          (item) =>
            item.conversation_id === conversationId &&
            item.user_id !== user.id
        );

        const profile = member ? profileMap.get(member.user_id) : null;
        const latest = latestByConversation.get(conversationId);

        return {
          id: conversationId,
          otherUserId: member?.user_id || null,
          name: profile?.full_name || profile?.username || "Skill Exchanger",
          username: profile?.username || "",
          initials: getInitials(profile?.full_name || profile?.username),
          avatar_url: profile?.avatar_url || null,
          location:
            [profile?.city, profile?.country].filter(Boolean).join(", ") ||
            "Skill Exchanger",
          online: false,
          skill: profile?.occupation || "Skill exchange",
          preview: latest?.content || "Start your skill exchange conversation.",
          time: latest ? formatMessageTime(latest.created_at) : "New",
          lastMessageAt: latest?.created_at || null,
          unread: Boolean(
            latest && latest.sender_id !== user.id && !latest.read_at
          ),
          messages: [],
        };
      })
      .sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });

    setConversations(formatted);

    if (formatted.length) {
      setSelectedId((current) =>
        current && formatted.some((item) => item.id === current)
          ? current
          : formatted[0].id
      );
    } else {
      setSelectedId(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (mounted) {
          setError("You need to be logged in to view messages.");
          setLoading(false);
        }
        return;
      }

      if (!mounted) return;

      setCurrentUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, username, occupation, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileError && mounted) {
        setCurrentProfile(profile);
      }

      await loadConversations(user);

      if (mounted) setLoading(false);
    };

    initialize();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const conversationId = location.state?.conversationId;

    if (!conversationId || !conversations.length) {
      return;
    }

    const conversationExists = conversations.some(
      (conversation) => conversation.id === conversationId
    );

    if (!conversationExists) return;

    setSelectedId(conversationId);
    setMobileChat(true);

    navigate("/messages", {
      replace: true,
      state: {},
    });
  }, [location.state, conversations, navigate]);

  useEffect(() => {
    if (!currentUser || !selectedId) return;

    loadMessages(selectedId);
  }, [selectedId, currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new;

          // Reload the conversation list so new conversations/messages
          // are reflected immediately.
          await loadConversations(currentUser);

          // If the new message belongs to the open chat, reload that chat.
          if (newMessage.conversation_id === selectedIdRef.current) {
            await loadMessages(newMessage.conversation_id);
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("Supabase Realtime channel error");
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, [currentUser?.id]);

  const selectConversation = async (id) => {
    setSelectedId(id);
    setMobileChat(true);
    shouldAutoScrollRef.current = true;

    if (currentUser?.id) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", id)
        .neq("sender_id", currentUser.id)
        .is("read_at", null);

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === id
            ? { ...conversation, unread: false }
            : conversation
        )
      );
    }
  };

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || !selectedConversation || !currentUser || sending) return;

    setSending(true);
    setError("");

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUser.id,
        content: text,
      })
      .select("id, sender_id, content, created_at, read_at")
      .single();

    if (sendError) {
      console.error("Error sending message:", sendError);
      setError("Message could not be sent. Please try again.");
      setSending(false);
      return;
    }

    const sentMessage = {
      id: data.id,
      sender: "me",
      text: data.content,
      time: formatMessageTime(data.created_at),
      createdAt: data.created_at,
      dateLabel: formatMessageDate(data.created_at),
      readAt: data.read_at,
    };

    setConversations((current) =>
      current
        .map((conversation) =>
          conversation.id === selectedConversation.id
            ? {
                ...conversation,
                preview: text,
                time: formatMessageTime(data.created_at),
                lastMessageAt: data.created_at,
                messages: conversation.messages.some(
                  (item) => item.id === sentMessage.id
                )
                  ? conversation.messages
                  : [...conversation.messages, sentMessage],
              }
            : conversation
        )
        .sort((a, b) => {
          if (!a.lastMessageAt) return 1;
          if (!b.lastMessageAt) return -1;
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        })
    );

    setMessage("");
    setSending(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="app-shell min-h-screen bg-[#fffdf2] text-[#062f2f]">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}

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

            {/* MESSAGES ACTIVE */}

            <Link
              to="/messages"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f59e0b] text-[#062f2f] font-semibold transition cursor-pointer"
            >

              <div className="flex items-center gap-3">

                <span className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <FontAwesomeIcon icon={faComments} />
                </span>

                <span>Messages</span>

              </div>

              <span className="w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                {conversations.length}
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
              className="group flex items-center gap-3 px-3.5 py-3 rounded-xl text-white/65 hover:bg-white/10 hover:text-white transition cursor-pointer"
            >

              <span className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:bg-white/10">
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

      {/* ================= MAIN ================= */}

      <div className="lg:ml-[260px]">

        {/* TOP BAR */}

        <header className="h-[78px] bg-white border-b border-[#d9e7df] px-5 sm:px-8 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
              aria-label="Open navigation menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

          </div>

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
                    {getInitials(currentProfile?.full_name || currentProfile?.username || "User")}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-[#062f2f]">
                    {currentProfile?.full_name || currentProfile?.username || "User"}
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

        {/* ================= CONTENT ================= */}

        <main className="messages-content h-[calc(100dvh-78px)] overflow-hidden p-2 sm:p-4 lg:p-5">

          {error && (
            <div className="mb-4 max-w-[1400px] mx-auto px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="h-full min-h-0 max-w-[1400px] mx-auto bg-white border border-[#d9e7df] rounded-[24px] overflow-hidden shadow-sm flex">

            {/* ================= CONVERSATIONS ================= */}

            <section
              className={`w-full min-h-0 md:w-[350px] lg:w-[380px] border-r border-[#d9e7df] flex flex-col ${
                mobileChat ? "hidden md:flex" : "flex"
              }`}
            >

              {/* Conversations Header */}

              <div className="p-5 border-b border-[#d9e7df]">

                <div className="flex items-center justify-between">

                  <div>

                    <h2 className="text-xl font-extrabold">
                      Conversations
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                      Connect with your exchange partners
                    </p>

                  </div>

                  <div className="w-9 h-9 rounded-xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center">
                    <FontAwesomeIcon icon={faComments} />
                  </div>

                </div>

                {/* Search */}

                <div className="relative mt-5">

                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#f8faf8] border border-[#e5ece7] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 text-sm"
                  />

                </div>

              </div>

              {/* Conversation List */}

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-400">Loading conversations...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center">
                      <FontAwesomeIcon icon={faComments} />
                    </div>
                    <p className="font-bold text-sm mt-4">
                      {search.trim() ? "No conversations found" : "No conversations yet"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search.trim()
                        ? "Try another search."
                        : "Start an exchange from Discover to begin chatting."}
                    </p>
                  </div>
                ) : (
                filteredConversations.map((conversation) => (

                  <button
                    key={conversation.id}
                    onClick={() => selectConversation(conversation.id)}
                    className={`conversation-row w-full text-left p-3 flex gap-3 border-b border-[#eef2ef] cursor-pointer transition ${
                      selectedId === conversation.id
                        ? "bg-[#f0fdfa]"
                        : "hover:bg-[#fafcfb]"
                    }`}
                  >

                    {/* Avatar */}

                    <div className="relative shrink-0">

                      {conversation.avatar_url ? (
                        <img
                          src={conversation.avatar_url}
                          alt={conversation.name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold ${
                            selectedId === conversation.id
                              ? "bg-[#0f766e] text-white"
                              : "bg-[#ccfbf1] text-[#0f766e]"
                          }`}
                        >
                          {conversation.initials}
                        </div>
                      )}

                      {conversation.online && (
                        <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white" />
                      )}

                    </div>

                    {/* Details */}

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center justify-between gap-2">

                        <h3 className="font-bold text-sm truncate">
                          {conversation.name}
                        </h3>

                        <div className="flex items-center gap-2 shrink-0">
                          {conversation.unread && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#f59e0b]"
                              title="Unread message"
                            />
                          )}
                          <span className="text-[10px] text-gray-400">
                            {conversation.time}
                          </span>
                        </div>

                      </div>

                      <p className="text-[10px] text-[#0f766e] font-bold mt-0.5">
                        {conversation.skill} exchange
                      </p>

                      <p className={`text-xs truncate mt-1 ${conversation.unread ? "text-[#062f2f] font-semibold" : "text-gray-500"}`}>
                        {conversation.preview}
                      </p>

                    </div>

                  </button>

                )))}



              </div>

            </section>

            {/* ================= CHAT ================= */}

            <section
              className={`flex-1 min-h-0 min-w-0 ${
                mobileChat ? "flex" : "hidden md:flex"
              } flex-col`}
            >

              {selectedConversation ? (

                <>

                  {/* Chat Header */}

                  <div className="h-[76px] shrink-0 px-4 sm:px-6 border-b border-[#d9e7df] flex items-center justify-between bg-white">

                    <div className="flex items-center gap-3 min-w-0">

                      <button
                        onClick={() => setMobileChat(false)}
                        className="md:hidden w-9 h-9 rounded-xl hover:bg-gray-100 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} />
                      </button>

                      <div className="relative">

                        {selectedConversation.avatar_url ? (
                          <img
                            src={selectedConversation.avatar_url}
                            alt={selectedConversation.name}
                            className="w-11 h-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center font-extrabold">
                            {selectedConversation.initials}
                          </div>
                        )}

                        {selectedConversation.online && (
                          <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-[#22c55e] border-2 border-white" />
                        )}

                      </div>

                      <div className="min-w-0">

                        <h2 className="font-extrabold truncate">
                          {selectedConversation.name}
                        </h2>

                        <p className="text-xs text-gray-400">
                          {selectedConversation.online
                            ? "Online now"
                            : selectedConversation.location}
                        </p>

                      </div>

                    </div>

                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fff7df] text-[#92400e] text-xs font-bold">

                      <FontAwesomeIcon icon={faHandshake} />

                      {selectedConversation.skill}

                    </div>

                  </div>

                  {/* Messages */}

                  <div
                    ref={messagesScrollRef}
                    onScroll={handleMessagesScroll}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5"
                  >

                    <div className="max-w-3xl mx-auto space-y-4">

                      {loadingMessages ? (
                        <div className="py-10 text-center text-xs text-gray-400">
                          Loading messages...
                        </div>
                      ) : (
                        selectedConversation.messages.map((item, index) => (

                          <div key={`${item.id}-group`}>
                            {(index === 0 || selectedConversation.messages[index - 1].dateLabel !== item.dateLabel) && (
                              <div className="flex items-center gap-3 my-5">
                                <div className="h-px flex-1 bg-[#e5ece7]" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                  {item.dateLabel}
                                </span>
                                <div className="h-px flex-1 bg-[#e5ece7]" />
                              </div>
                            )}

                            <div
                              className={`flex ${
                                item.sender === "me"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >

                              <div
                                className={`max-w-[80%] sm:max-w-[65%] ${
                                  item.sender === "me"
                                    ? "items-end"
                                    : "items-start"
                                } flex flex-col`}
                              >

                                <div
                                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    item.sender === "me"
                                      ? "bg-[#0f766e] text-white rounded-br-md"
                                      : "bg-[#f3f6f4] text-[#062f2f] rounded-bl-md"
                                  }`}
                                >
                                  {item.text}
                                </div>

                                <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                                  {item.time}
                                  {item.sender === "me" && (
                                    <FontAwesomeIcon
                                      icon={faCheck}
                                      className={item.readAt ? "text-[#0f766e]" : "text-gray-400"}
                                      title={item.readAt ? "Read" : "Sent"}
                                    />
                                  )}
                                </span>

                              </div>

                            </div>
                          </div>

                        ))
                      )}

                      <div ref={messagesEndRef} aria-hidden="true" />

                    </div>

                  </div>

                  {/* Message Input */}

                  <div className="shrink-0 p-4 sm:p-5 border-t border-[#d9e7df] bg-white">

                    <div className="max-w-3xl mx-auto flex items-end gap-2">

                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey
                          ) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        rows="1"
                        placeholder="Write a message..."
                        className="flex-1 resize-none px-4 py-3 rounded-xl bg-[#f8faf8] border border-[#d9e7df] outline-none focus:border-[#0f766e] focus:ring-4 focus:ring-[#0f766e]/10 text-sm"
                      />

                      <button
                        onClick={sendMessage}
                        disabled={!message.trim() || sending || !selectedConversation}
                        className="w-12 h-12 rounded-xl bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition shrink-0"
                      >

                        <FontAwesomeIcon icon={faPaperPlane} />

                      </button>

                    </div>

                    <p className="text-[10px] text-gray-400 text-center mt-2">
                      Press Enter to send · Shift + Enter for a new line
                    </p>

                  </div>

                </>

              ) : (

                <div className="flex-1 flex items-center justify-center p-8 text-center">

                  <div>

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#f0fdfa] text-[#0f766e] flex items-center justify-center text-xl">
                      <FontAwesomeIcon icon={faComments} />
                    </div>

                    <h2 className="text-xl font-extrabold mt-5">
                      Your messages
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                      Select a conversation to start chatting.
                    </p>

                    <Link
                      to="/discover"
                      className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl bg-[#0f766e] text-white text-sm font-semibold hover:bg-[#115e59]"
                    >
                      Discover people
                    </Link>

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

export default Messages;