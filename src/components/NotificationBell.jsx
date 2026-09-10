import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBell,
  faCheck,
  faCheckDouble,
  faClock,
  faComments,
  faHandshake,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../lib/supabase";

function formatTime(dateString) {
  const date = new Date(dateString);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function getNotificationIcon(type) {
  if (type === "new_message") return faComments;
  if (type === "exchange_request") return faHandshake;
  if (type === "request_accepted") return faCheck;
  if (type === "request_declined") return faXmark;
  return faBell;
}

function NotificationBell() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const bellRef = useRef(null);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") return notifications.filter((item) => !item.is_read);
    if (activeFilter === "requests") {
      return notifications.filter((item) => ["exchange_request", "request_accepted", "request_declined"].includes(item.type));
    }
    if (activeFilter === "messages") return notifications.filter((item) => item.type === "new_message");
    return notifications;
  }, [activeFilter, notifications]);

  useEffect(() => {
    let mounted = true;
    let channel;

    const loadNotifications = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || !mounted) return;
      setUser(currentUser);

      const { data, error } = await supabase
        .from("notifications")
        .select("id, sender_id, type, title, message, related_conversation_id, is_read, created_at")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Notification loading error:", error);
        return;
      }

      const senderIds = [...new Set((data || []).map((item) => item.sender_id).filter(Boolean))];
      let profiles = [];

      if (senderIds.length) {
        const { data: senderProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .in("id", senderIds);
        profiles = senderProfiles || [];
      }

      const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));

      if (mounted) {
        setNotifications((data || []).map((item) => ({
          ...item,
          sender: profileMap[item.sender_id] || null,
        })));
      }
    };

    loadNotifications().then(async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || !mounted) return;

      channel = supabase
        .channel(`notifications-bell-${currentUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${currentUser.id}`,
          },
          loadNotifications
        )
        .subscribe();
    });

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!bellRef.current?.contains(event.target)) setNotificationsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  const markAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (!error) setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notification.id);
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
    }

    setNotificationsOpen(false);

    if (notification.type === "new_message") {
      navigate("/messages", {
        state: notification.related_conversation_id ? { conversationId: notification.related_conversation_id } : {},
      });
    } else {
      navigate("/exchange-requests");
    }
  };

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setNotificationsOpen((open) => !open)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 hover:bg-[#f0fdfa] hover:text-[#0f766e]"
        title={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-label="Open notifications"
        aria-expanded={notificationsOpen}
        aria-haspopup="dialog"
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {notificationsOpen && (
        <div className="notification-popup absolute right-0 top-12 z-[100] max-h-[calc(100dvh-5rem)] w-[min(94vw,400px)] overflow-hidden rounded-2xl border border-[#d9e7df] bg-white shadow-xl" role="dialog" aria-label="Notifications">
          <div className="flex items-start justify-between gap-2 border-b border-[#e5ece7] px-3 py-2.5 sm:px-4 sm:py-3">
            <div>
              <h3 className="text-sm font-bold text-[#062f2f] sm:text-base">Notifications</h3>
              <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">Your latest activity</p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#0f766e] sm:text-[11px]">
                <FontAwesomeIcon icon={faCheckDouble} /> Mark all read
              </button>
            )}
          </div>

          <div className="flex gap-1 overflow-x-auto border-b border-[#edf2ee] px-2 py-1.5 sm:px-3 sm:py-2">
            {[{ id: "all", label: "All" }, { id: "unread", label: "Unread", count: unreadCount }, { id: "requests", label: "Requests" }, { id: "messages", label: "Messages" }].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[10px] font-bold ${activeFilter === filter.id ? "bg-[#0f766e] text-white" : "text-gray-500 hover:bg-[#f0fdfa]"}`}
              >
                {filter.label}{filter.count ? ` (${filter.count})` : ""}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto sm:max-h-80">
            {filteredNotifications.length ? filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => openNotification(notification)}
                className={`flex w-full gap-2.5 border-b border-[#edf2ee] px-3 py-2.5 text-left hover:bg-[#f0fdfa] sm:gap-3 sm:px-4 sm:py-3 ${!notification.is_read ? "bg-[#f5fbf8]" : ""}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eaf7f2] text-xs text-[#0f766e] sm:h-9 sm:w-9 sm:rounded-xl">
                  <FontAwesomeIcon icon={getNotificationIcon(notification.type)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-[11px] font-bold text-[#062f2f] sm:text-xs">{notification.title}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[9px] text-gray-400 sm:text-[10px]"><FontAwesomeIcon icon={faClock} />{formatTime(notification.created_at)}</span>
                  </span>
                  {notification.sender && <span className="mt-0.5 block text-[10px] font-semibold text-[#0f766e]">{notification.sender.full_name || notification.sender.username}</span>}
                  {notification.message && <span className="mt-1 block text-[10px] leading-snug text-gray-500 sm:text-[11px]">{notification.message}</span>}
                </span>
                {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
              </button>
            )) : <div className="px-5 py-8 text-center text-xs text-gray-500">No notifications in this view.</div>}
          </div>

          <button onClick={() => { setNotificationsOpen(false); navigate("/notifications"); }} className="flex w-full items-center justify-center gap-2 border-t border-[#e5ece7] px-3 py-2.5 text-[11px] font-bold text-[#0f766e] hover:bg-[#f0fdfa] sm:px-4 sm:py-3 sm:text-xs">
            View all notifications <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
