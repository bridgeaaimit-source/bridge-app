"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import AppShell from "@/components/AppShell";
import { Clock, CheckCircle2, AlertCircle, Send, MessageSquare, ShieldAlert, Key, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

const TEAM_MEMBERS = [
  { uid: "siddhesh", name: "Siddhesh" },
  { uid: "teammate2", name: "Harshal" },
  { uid: "teammate3", name: "Mansi" }
];

const QUICK_REPLIES = [
  "Hi [name], thanks for reaching out! We're looking into this.",
  "This has been fixed. Please refresh and try again.",
  "Could you share more details about the issue?"
];

export default function AdminSupportPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Tickets data
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Filters & Search
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "open" | "inprogress" | "mine" | "resolved"
  const [searchQuery, setSearchQuery] = useState("");

  // Secret Key configuration state
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [showSecretPrompt, setShowSecretPrompt] = useState(false);
  const [secretInput, setSecretInput] = useState("");

  const chatEndRef = useRef(null);

  // 1. Authenticate and check admin role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Check role in database
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            if (userDoc.data().role === "admin") {
              setIsAdmin(true);
              toast.success("Admin access granted");
            } else {
              toast.error(`Access Denied: Role is '${userDoc.data().role}', not 'admin'`);
              setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
            }
          } else {
            toast.error(`Access Denied: Document for UID ${user.uid} not found`);
            setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
          }
        } catch (error) {
          console.error("Error verifying admin role:", error);
          toast.error(`Firebase Error: ${error.message}`);
          // removed auto-redirect so we can read the error
        }
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Request notification permission & check localStorage for Secret Key
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      const savedKey = localStorage.getItem("adminSecretKey");
      if (savedKey) {
        setAdminSecretKey(savedKey);
      } else {
        setShowSecretPrompt(true);
      }
    }
  }, []);

  // 3. Set up real-time tickets listener
  useEffect(() => {
    if (!isAdmin) return;

    let isInitial = true;
    const q = query(collection(db, "tickets"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsList = [];
      snapshot.forEach((docSnap) => {
        ticketsList.push(docSnap.data());
      });

      // Sort by createdAt descending
      ticketsList.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      // Detect newly added tickets to trigger toast and browser notification
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && !isInitial) {
          const newTicket = change.doc.data();
          // Trigger toast
          toast(`New support ticket from ${newTicket.userName}`, {
            icon: "🆕",
            style: { border: "1px solid #0D9488" }
          });
          // Trigger browser notification
          if (Notification.permission === "granted") {
            new Notification("New BRIDGE Support Ticket", {
              body: `From: ${newTicket.userName} - ${newTicket.category}`,
              icon: "/images/logo_favicon_512.png"
            });
          }
        }
      });

      isInitial = false;
      setTickets(ticketsList);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Scroll chat to bottom when ticket is expanded or replies added
  useEffect(() => {
    if (selectedTicketId) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicketId, tickets]);

  // Save Secret Key to localStorage
  const handleSaveSecretKey = (e) => {
    e.preventDefault();
    if (!secretInput.trim()) {
      toast.error("Secret Key cannot be empty");
      return;
    }
    localStorage.setItem("adminSecretKey", secretInput.trim());
    setAdminSecretKey(secretInput.trim());
    setShowSecretPrompt(false);
    toast.success("Admin Secret Key configured!");
  };

  // Mark ticket as read by the admin locally
  const selectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    localStorage.setItem(`bridge_admin_seen_${ticketId}`, new Date().toISOString());
  };

  // Send Reply API handler
  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const currentTicket = tickets.find(t => t.ticketId === selectedTicketId);
    if (!currentTicket) return;

    setSendingReply(true);
    try {
      const key = localStorage.getItem("adminSecretKey") || adminSecretKey;
      const adminName = currentUser?.displayName || "Siddhesh"; // fallback to Siddhesh if no displayName

      const res = await fetch("/api/support/reply-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "admin-secret-key": key
        },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          replyText: replyText.trim(),
          adminName,
          newStatus: currentTicket.status === "open" ? "inprogress" : null // auto promote to inprogress if open
        })
      });

      const data = await res.json();
      if (data.success) {
        setReplyText("");
        // Keep read timestamp updated
        localStorage.setItem(`bridge_admin_seen_${selectedTicketId}`, new Date().toISOString());
      } else {
        toast.error(data.error || "Failed to submit reply");
        if (data.error?.includes("secret key")) {
          setShowSecretPrompt(true);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to server. Check your connection.");
    } finally {
      setSendingReply(false);
    }
  };

  // Firestore update helper for status and assignment
  const handleStatusChange = async (ticketId, nextStatus) => {
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      const updateData = {
        status: nextStatus,
        updatedAt: new Date()
      };
      if (nextStatus === "resolved") {
        updateData.resolvedAt = new Date();
      }
      await updateDoc(ticketRef, updateData);
      toast.success(`Ticket marked as ${nextStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleAssignChange = async (ticketId, memberUid) => {
    try {
      const member = TEAM_MEMBERS.find(m => m.uid === memberUid);
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        assignedTo: member ? member.uid : null,
        assignedName: member ? member.name : null,
        updatedAt: new Date()
      });
      toast.success(member ? `Assigned to ${member.name}` : "Ticket unassigned");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update assignment");
    }
  };

  // Metric Computations
  const getMetrics = () => {
    let openCount = 0;
    let inProgressCount = 0;
    let resolvedTodayCount = 0;
    let responseTimesSum = 0;
    let responseCount = 0;

    const todayStr = new Date().toDateString();

    tickets.forEach((t) => {
      if (t.status === "open") openCount++;
      if (t.status === "inprogress") inProgressCount++;

      // Check if resolved today
      if (t.status === "resolved" && t.resolvedAt) {
        const resDate = t.resolvedAt?.toDate ? t.resolvedAt.toDate() : new Date(t.resolvedAt);
        if (resDate.toDateString() === todayStr) {
          resolvedTodayCount++;
        }
      }

      // Calc response time
      const supportMessages = t.messages?.filter(m => m.sender === "support");
      if (supportMessages && supportMessages.length > 0) {
        // Sort replies by timestamp to get the first one
        supportMessages.sort((a, b) => {
          const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
          const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
          return aTime - bTime;
        });

        const createdDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt || 0);
        const firstReplyDate = supportMessages[0].timestamp?.toDate ? supportMessages[0].timestamp.toDate() : new Date(supportMessages[0].timestamp || 0);
        const timeDiffMs = firstReplyDate.getTime() - createdDate.getTime();
        if (timeDiffMs > 0) {
          responseTimesSum += timeDiffMs;
          responseCount++;
        }
      }
    });

    const avgResponseTimeMs = responseCount > 0 ? responseTimesSum / responseCount : 0;
    const avgResponseMins = Math.round(avgResponseTimeMs / 60000);

    let avgResponseFormatted = "--";
    if (avgResponseMins > 0) {
      if (avgResponseMins < 60) {
        avgResponseFormatted = `${avgResponseMins} mins`;
      } else {
        const hours = (avgResponseMins / 60).toFixed(1);
        avgResponseFormatted = `${hours} hrs`;
      }
    }

    return {
      openCount,
      inProgressCount,
      resolvedTodayCount,
      avgResponseFormatted
    };
  };

  const metrics = getMetrics();

  // Filtered tickets
  const getFilteredTickets = () => {
    return tickets.filter((t) => {
      // 1. Text Search filter
      const matchesSearch =
        t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Tab filter
      if (activeFilter === "open") return t.status === "open";
      if (activeFilter === "inprogress") return t.status === "inprogress";
      if (activeFilter === "resolved") return t.status === "resolved";
      if (activeFilter === "mine") return t.assignedTo === currentUser?.uid;

      return true;
    });
  };

  const filteredTickets = getFilteredTickets();
  const selectedTicket = tickets.find(t => t.ticketId === selectedTicketId);

  // Timeago helper
  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} years ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} months ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} days ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} mins ago`; // standard naming format
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} mins ago`;
    return "just now";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5FAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-600 font-semibold">Verifying credentials...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F5FAFA] flex flex-col items-center justify-center px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2 text-center max-w-sm">
          You must be signed in with an administrator role to access the support portal.
        </p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-[#F5FAFA]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">BRIDGE Student Support</h1>
            <p className="text-gray-600 mt-1">Real-time ticket logging & resolution hub</p>
          </div>
          <button
            onClick={() => setShowSecretPrompt(true)}
            className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold cursor-pointer"
          >
            <Key className="w-4 h-4 text-[#0D9488]" />
            Configure Secret Key
          </button>
        </div>

        {/* Stats Metrics Grid */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Open */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Open Tickets</span>
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{metrics.openCount}</div>
              <div className="text-xs text-red-600 font-semibold mt-1">Awaiting initial reply</div>
            </div>

            {/* In Progress */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">In Progress</span>
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{metrics.inProgressCount}</div>
              <div className="text-xs text-amber-600 font-semibold mt-1">Currently being handled</div>
            </div>

            {/* Resolved Today */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Resolved Today</span>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{metrics.resolvedTodayCount}</div>
              <div className="text-xs text-green-600 font-semibold mt-1">Tickets closed today</div>
            </div>

            {/* Avg Response Time */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avg Response Time</span>
                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-[#0D9488]">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{metrics.avgResponseFormatted}</div>
              <div className="text-xs text-teal-600 font-semibold mt-1">From creation to support reply</div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 bg-white p-4 border border-gray-200 rounded-2xl shadow-sm">
            {/* Filter Tabs */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {["all", "open", "inprogress", "mine", "resolved"].map((filter) => {
                const label = filter === "inprogress" ? "In Progress" : filter.charAt(0).toUpperCase() + filter.slice(1);
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      activeFilter === filter
                        ? "bg-[#0D9488] text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0D9488] focus:bg-white text-gray-800"
              />
            </div>
          </div>

          {/* Main Dashboard Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[65vh]">
            {/* LEFT PANEL: Scrollable Ticket List */}
            <div className="bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden h-full shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-base">Tickets ({filteredTickets.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {filteredTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center h-full py-16 px-4">
                    <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-semibold text-sm">No tickets found</p>
                    <p className="text-gray-400 text-xs mt-1">Try switching filters or adjusting your search term.</p>
                  </div>
                ) : (
                  filteredTickets.map((t) => {
                    const isSelected = t.ticketId === selectedTicketId;

                    // Unread calculations
                    const lastSeenStr = localStorage.getItem(`bridge_admin_seen_${t.ticketId}`);
                    let hasUnread = false;

                    const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
                    const lastMsgSender = lastMsg ? lastMsg.sender : "student";
                    const lastMsgTime = lastMsg
                      ? (lastMsg.timestamp?.toDate ? lastMsg.timestamp.toDate().getTime() : new Date(lastMsg.timestamp).getTime())
                      : (t.createdAt?.toDate ? t.createdAt.toDate().getTime() : new Date(t.createdAt || 0).getTime());

                    if (lastMsgSender === "student") {
                      if (!lastSeenStr) {
                        hasUnread = true;
                      } else {
                        const lastSeenTime = new Date(lastSeenStr).getTime();
                        hasUnread = lastMsgTime > lastSeenTime;
                      }
                    }

                    // Avatar Initials
                    const assigneeInitials = t.assignedName
                      ? t.assignedName.split(" ").map(w => w[0]).join("").toUpperCase()
                      : null;

                    return (
                      <div
                        key={t.ticketId}
                        onClick={() => selectTicket(t.ticketId)}
                        className={`p-4 hover:bg-gray-50/50 cursor-pointer transition-colors relative flex justify-between items-start gap-2 ${
                          isSelected ? "bg-[#0D9488]/5 border-l-4 border-[#0D9488]" : ""
                        }`}
                      >
                        {/* Blue Dot Unread indicator */}
                        {hasUnread && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-500 rounded-full shadow-sm animate-pulse"></span>
                        )}

                        <div className="flex-1 min-w-0 pl-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-sm text-gray-900">#{t.ticketId}</span>
                            <span className="text-[10px] text-gray-400 font-bold tracking-tight uppercase max-w-[120px] truncate bg-gray-100 px-1.5 py-0.5 rounded">
                              {t.category}
                            </span>
                          </div>
                          <div className="font-semibold text-gray-800 text-xs truncate">{t.userName}</div>
                          <div className="text-[10px] text-gray-400 truncate">{t.userEmail}</div>
                          <p className="text-gray-500 text-xs mt-1.5 italic line-clamp-1">&quot;{t.description}&quot;</p>
                        </div>

                        <div className="flex flex-col items-end justify-between h-full min-h-[70px] shrink-0 text-right">
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {getRelativeTime(t.createdAt)}
                          </span>

                          <div className="flex items-center gap-2 mt-2">
                            {/* Assigned Initials */}
                            {assigneeInitials ? (
                              <div
                                title={`Assigned to ${t.assignedName}`}
                                className="w-6 h-6 rounded-full bg-teal-100 text-[#00685f] flex items-center justify-center text-[10px] font-bold border border-teal-200"
                              >
                                {assigneeInitials}
                              </div>
                            ) : (
                              <div
                                title="Unassigned"
                                className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-[9px] font-semibold border border-gray-200"
                              >
                                UA
                              </div>
                            )}

                            {/* Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase text-white ${
                                t.status === "open"
                                  ? "bg-red-500"
                                  : t.status === "inprogress"
                                  ? "bg-amber-500"
                                  : "bg-green-600"
                              }`}
                            >
                              {t.status === "inprogress" ? "Progress" : t.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT PANEL: Scrollable Ticket Detail & Conversation */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden h-full shadow-sm">
              {selectedTicket ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Detail Header */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-gray-900 text-lg">#{selectedTicket.ticketId}</h2>
                        <span className="text-gray-400 font-semibold text-sm">&bull;</span>
                        <span className="text-xs text-gray-500 font-bold bg-teal-50 text-[#0D9488] px-2 py-0.5 rounded">
                          {selectedTicket.category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 font-semibold">
                        Student: {selectedTicket.userName} ({selectedTicket.userEmail})
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Assign to Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 font-bold uppercase">Assign:</span>
                        <select
                          value={selectedTicket.assignedTo || ""}
                          onChange={(e) => handleAssignChange(selectedTicket.ticketId, e.target.value)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0D9488]"
                        >
                          <option value="">Unassigned</option>
                          {TEAM_MEMBERS.map((m) => (
                            <option key={m.uid} value={m.uid}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 font-bold uppercase">Status:</span>
                        <select
                          value={selectedTicket.status}
                          onChange={(e) => handleStatusChange(selectedTicket.ticketId, e.target.value)}
                          className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0D9488]"
                        >
                          <option value="open">Open</option>
                          <option value="inprogress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Chat Container */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/10">
                    {/* Student Description Block */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-2xl">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                        <span className="text-xs font-bold text-gray-700">Initial Issue Description</span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {getRelativeTime(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">&quot;{selectedTicket.description}&quot;</p>
                      {selectedTicket.screenshotUrl && (
                        <div className="mt-3.5 pt-3.5 border-t border-gray-100">
                          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Attached Screenshot</p>
                          <a
                            href={selectedTicket.screenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block border border-gray-200 hover:border-[#0D9488] rounded-xl overflow-hidden shadow-sm hover:shadow transition-all max-w-[200px]"
                          >
                            <img
                              src={selectedTicket.screenshotUrl}
                              alt="Attachment"
                              className="w-full max-h-[120px] object-cover"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Separator */}
                    <div className="text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest py-2">
                      Message Thread
                    </div>

                    {/* Messages Array */}
                    {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                      <div className="text-center py-8 text-xs text-gray-400 italic">
                        No replies exchanged yet. Use the reply box below to address this issue.
                      </div>
                    )}

                    {selectedTicket.messages?.map((msg, idx) => {
                      const isSupport = msg.sender === "support";
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col ${isSupport ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl max-w-[70%] text-sm ${
                              isSupport
                                ? "bg-[#0D9488] text-white rounded-tr-none shadow-sm"
                                : "bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/50"
                            }`}
                          >
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px]">
                            <span className="font-bold text-gray-500">{msg.name}</span>
                            <span className="text-gray-300">&bull;</span>
                            <span className="text-gray-400">{getRelativeTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick Reply & Send Container */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {/* Quick Replies list */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {QUICK_REPLIES.map((replyTemplate, idx) => {
                        const filledTemplate = replyTemplate.replace("[name]", selectedTicket.userName.split(" ")[0]);
                        return (
                          <button
                            key={idx}
                            onClick={() => setReplyText(filledTemplate)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-100 hover:bg-teal-50 hover:border-teal-200 text-[11px] font-semibold text-gray-600 hover:text-[#0D9488] rounded-xl transition-all cursor-pointer"
                          >
                            {filledTemplate}
                          </button>
                        );
                      })}
                    </div>

                    {/* Reply Textarea */}
                    {selectedTicket.status !== "resolved" ? (
                      <div className="flex gap-3 items-end">
                        <textarea
                          placeholder="Type your reply..."
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0D9488] focus:bg-white text-gray-800 resize-none"
                        ></textarea>
                        <button
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyText.trim()}
                          className="px-5 py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-gray-300 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          {sendingReply ? (
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-sm text-gray-500 font-semibold bg-gray-50 border border-gray-100 rounded-xl">
                        This support ticket has been closed. Change status back to open or in progress to reply.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/10">
                  <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-gray-700 font-bold text-lg">No Ticket Selected</h3>
                  <p className="text-gray-400 text-sm mt-1 max-w-sm">
                    Select a ticket from the left panel list to view its conversation history, update status, and communicate with the student.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Secret Key Modal Configuration */}
        {showSecretPrompt && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl p-6 max-w-md w-full animate-fade-in">
              <div className="w-12 h-12 bg-teal-50 text-[#0D9488] rounded-full flex items-center justify-center mb-4">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Configure Admin Secret Key</h3>
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                To perform administrative actions (like sending replies via backend endpoints), please enter your shared <code className="bg-gray-100 text-red-500 font-bold px-1 py-0.5 rounded">ADMIN_SECRET_KEY</code>. This is stored securely in your browser&apos;s localStorage.
              </p>

              <form onSubmit={handleSaveSecretKey} className="mt-4 space-y-4">
                <input
                  type="password"
                  placeholder="Enter secret key..."
                  value={secretInput}
                  onChange={(e) => setSecretInput(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0D9488] focus:bg-white text-gray-800"
                />

                <div className="flex gap-3 justify-end pt-2">
                  {adminSecretKey && (
                    <button
                      type="button"
                      onClick={() => setShowSecretPrompt(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Save Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </AppShell>
  );
}
