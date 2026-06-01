"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, doc, updateDoc, arrayUnion, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { MessageCircle, X, Send, Image, Upload, CheckCircle, ChevronRight, MessageSquare, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const ISSUE_OPTIONS = [
  "Interview not loading",
  "Score not updating",
  "Login problem",
  "Question seems wrong",
  "Feature not working",
  "GD Battle issue",
  "Aptitude issue",
  "Other"
];

export default function SupportWidget() {
  const pathname = usePathname();
  const { isBypassed, mockUser } = useAuthBypass();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("new"); // "new" or "my-tickets"
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null); // stores { ticketId }

  // Tickets state
  const [tickets, setTickets] = useState([]);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [studentReply, setStudentReply] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const chatEndRef = useRef(null);

  // Auth State
  useEffect(() => {
    if (isBypassed) {
      setCurrentUser(mockUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          name: user.displayName || "Student",
          email: user.email || ""
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [isBypassed, mockUser]);

  // Real-time tickets listener
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "tickets"),
      where("uid", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsList = [];
      snapshot.forEach((docSnap) => {
        ticketsList.push(docSnap.data());
      });

      // Sort client-side by createdAt descending to avoid composite index requirement
      ticketsList.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      setTickets(ticketsList);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Calculate unread badge count
  useEffect(() => {
    let count = 0;
    tickets.forEach((ticket) => {
      const lastSeenStr = localStorage.getItem(`bridge_support_seen_${ticket.ticketId}`);
      if (!lastSeenStr) {
        const hasSupportMsg = ticket.messages?.some((m) => m.sender === "support");
        if (hasSupportMsg) count++;
      } else {
        const lastSeenTime = new Date(lastSeenStr).getTime();
        const hasNewSupportMsg = ticket.messages?.some((m) => {
          if (m.sender !== "support") return false;
          const msgTime = m.timestamp?.toDate ? m.timestamp.toDate().getTime() : new Date(m.timestamp).getTime();
          return msgTime > lastSeenTime;
        });
        if (hasNewSupportMsg) count++;
      }
    });
    setUnreadCount(count);
  }, [tickets]);

  // Scroll chat to bottom when ticket is expanded or replies added
  useEffect(() => {
    if (expandedTicketId) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [expandedTicketId, tickets]);

  // Hide widget on login page and admin panel
  if (pathname === "/login" || pathname.startsWith("/admin")) {
    return null;
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error("File size exceeds 3MB limit");
        return;
      }
      setScreenshotFile(file);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select an issue category");
      return;
    }
    if (!description.trim() || description.length < 10) {
      toast.error("Please describe your issue (min 10 characters)");
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = null;

      if (screenshotFile) {
        const fileRef = ref(storage, `support_screenshots/${currentUser.uid}_${Date.now()}_${screenshotFile.name}`);
        const uploadResult = await uploadBytes(fileRef, screenshotFile);
        screenshotUrl = await getDownloadURL(uploadResult.ref);
      }

      const res = await fetch("/api/support/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          userName: currentUser.name,
          userEmail: currentUser.email,
          category,
          description,
          screenshotUrl
        })
      });

      const data = await res.json();
      if (data.success) {
        setTicketSuccess({ ticketId: data.ticketId });
        setCategory("");
        setDescription("");
        setScreenshotFile(null);
        // Add to read tickets in local storage so it starts as read
        localStorage.setItem(`bridge_support_seen_${data.ticketId}`, new Date().toISOString());
      } else {
        toast.error(data.error || "Failed to create support ticket");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentReply = async (ticketId) => {
    if (!studentReply.trim()) return;

    try {
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        messages: arrayUnion({
          sender: "student",
          name: currentUser.name,
          text: studentReply.trim(),
          timestamp: new Date()
        }),
        updatedAt: new Date()
      });
      setStudentReply("");
    } catch (err) {
      console.error("Error replying to ticket:", err);
      toast.error("Could not send message. Please try again.");
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval}y ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval}mo ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval}d ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return "just now";
  };

  const expandTicket = (ticketId) => {
    setExpandedTicketId(ticketId);
    localStorage.setItem(`bridge_support_seen_${ticketId}`, new Date().toISOString());
    // Force unread badge calculation refresh
    setTickets([...tickets]);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 left-5 z-[90] w-14 h-14 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-spin-once" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-7 h-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Support Sliding Panel */}
      <div
        className={`fixed bottom-24 left-5 right-5 md:right-auto md:w-[400px] bg-white rounded-2xl border border-gray-100 shadow-2xl z-[90] flex flex-col transition-all duration-300 ease-in-out transform origin-bottom-left max-h-[70vh] overflow-hidden ${
          isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-75 translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-[#0D9488] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Help & Support</h3>
            <p className="text-teal-50 text-xs">We typically respond within 24 hours</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-teal-100 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Guard Check */}
        {!currentUser ? (
          <div className="p-8 flex flex-col items-center justify-center text-center flex-1">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 font-semibold mb-2">Login Required</p>
            <p className="text-gray-400 text-sm">Please sign in to your BRIDGE account to raise or view support tickets.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button
                onClick={() => {
                  setActiveTab("new");
                  setTicketSuccess(null);
                }}
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                  activeTab === "new"
                    ? "border-[#0D9488] text-[#0D9488]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                New Ticket
              </button>
              <button
                onClick={() => {
                  setActiveTab("my-tickets");
                  setExpandedTicketId(null);
                }}
                className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors relative ${
                  activeTab === "my-tickets"
                    ? "border-[#0D9488] text-[#0D9488]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                My Tickets
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-10 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
              {/* NEW TICKET TAB */}
              {activeTab === "new" && (
                <>
                  {ticketSuccess ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 animate-fade-in">
                      <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-10 h-10 text-[#0D9488]" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">Ticket Raised Successfully</h4>
                      <p className="text-[#0D9488] font-semibold text-sm mt-1">ID: #{ticketSuccess.ticketId}</p>
                      <p className="text-gray-500 text-sm mt-4 px-4">
                        Thank you for reaching out! We will look into this and respond within 24 hours. ✅
                      </p>
                      <button
                        onClick={() => setTicketSuccess(null)}
                        className="mt-6 px-6 py-2 border border-[#0D9488] text-[#0D9488] rounded-xl text-sm font-semibold hover:bg-teal-50 transition-colors"
                      >
                        Raise Another Ticket
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      {/* Issue Category Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          What's the issue?
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0D9488] focus:bg-white transition-all"
                        >
                          <option value="">Select issue category</option>
                          {ISSUE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Describe your issue
                          </label>
                          <span className="text-xs text-gray-400">{description.length}/300</span>
                        </div>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                          required
                          placeholder="Please provide details about what went wrong..."
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#0D9488] focus:bg-white transition-all resize-none"
                        ></textarea>
                      </div>

                      {/* Screenshot Attachment */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                          Add screenshot (optional)
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 hover:border-[#0D9488] rounded-xl text-xs font-semibold text-gray-600 hover:text-[#0D9488] cursor-pointer transition-colors flex-1">
                            <Upload className="w-4 h-4" />
                            {screenshotFile ? "Change Image" : "Upload File"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          {screenshotFile && (
                            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-xs text-gray-700 max-w-[180px] truncate">
                              <Image className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                              <span className="truncate">{screenshotFile.name}</span>
                              <button
                                type="button"
                                onClick={() => setScreenshotFile(null)}
                                className="text-gray-400 hover:text-red-500 ml-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full mt-2 py-3 bg-[#0D9488] hover:bg-[#0F766E] disabled:bg-gray-400 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Submitting Ticket...
                          </>
                        ) : (
                          "Raise Support Ticket"
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* MY TICKETS TAB */}
              {activeTab === "my-tickets" && (
                <div className="space-y-4">
                  {tickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-semibold text-sm">No tickets found</p>
                      <p className="text-gray-400 text-xs mt-1">If you have any issues, feel free to raise a new support ticket.</p>
                    </div>
                  ) : expandedTicketId ? (
                    /* Ticket Detail / Conversation view */
                    (() => {
                      const ticket = tickets.find((t) => t.ticketId === expandedTicketId);
                      if (!ticket) return null;

                      // Check if there are unread messages to clear
                      localStorage.setItem(`bridge_support_seen_${ticket.ticketId}`, new Date().toISOString());

                      return (
                        <div className="flex flex-col h-full space-y-3 animate-fade-in">
                          {/* Back Link */}
                          <button
                            onClick={() => setExpandedTicketId(null)}
                            className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 mb-2"
                          >
                            &larr; Back to My Tickets
                          </button>

                          {/* Ticket Info Card */}
                          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-800">#{ticket.ticketId} - {ticket.category}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase text-white ${
                                  ticket.status === "open"
                                    ? "bg-red-500"
                                    : ticket.status === "inprogress"
                                    ? "bg-amber-500"
                                    : "bg-green-600"
                                }`}
                              >
                                {ticket.status}
                              </span>
                            </div>
                            <p className="text-gray-600 italic">"{ticket.description}"</p>
                            {ticket.screenshotUrl && (
                              <a
                                href={ticket.screenshotUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[#0D9488] font-bold mt-2 hover:underline"
                              >
                                <Image className="w-3 h-3" /> View attached screenshot
                              </a>
                            )}
                          </div>

                          {/* Message Log */}
                          <div className="flex-1 overflow-y-auto max-h-[300px] border border-gray-50 rounded-xl p-3 bg-gray-50/20 space-y-3">
                            <div className="text-[10px] text-gray-400 text-center uppercase tracking-wider py-1 font-semibold">
                              Conversation Started ({getRelativeTime(ticket.createdAt)})
                            </div>

                            {/* Show original description if no messages yet */}
                            {(!ticket.messages || ticket.messages.length === 0) && (
                              <div className="text-center py-6 text-xs text-gray-400 italic">
                                Support team will respond shortly.
                              </div>
                            )}

                            {ticket.messages?.map((msg, idx) => {
                              const isStudent = msg.sender === "student";
                              return (
                                <div
                                  key={idx}
                                  className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`px-3 py-2 rounded-2xl max-w-[80%] text-sm ${
                                      isStudent
                                        ? "bg-gray-100 text-gray-800 rounded-tr-none"
                                        : "bg-[#0D9488] text-white rounded-tl-none"
                                    }`}
                                  >
                                    <p className="leading-relaxed">{msg.text}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1 px-1">
                                    <span className="text-[9px] font-bold text-gray-400">{msg.name}</span>
                                    <span className="text-[9px] text-gray-300">&bull;</span>
                                    <span className="text-[9px] text-gray-400">{getRelativeTime(msg.timestamp)}</span>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatEndRef} />
                          </div>

                          {/* Reply Box */}
                          {ticket.status !== "resolved" ? (
                            <div className="flex gap-2 items-center pt-2">
                              <input
                                type="text"
                                value={studentReply}
                                onChange={(e) => setStudentReply(e.target.value)}
                                placeholder="Type a reply..."
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleStudentReply(ticket.ticketId);
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm focus:outline-none focus:border-[#0D9488] text-gray-800"
                              />
                              <button
                                onClick={() => handleStudentReply(ticket.ticketId)}
                                className="w-10 h-10 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-2 text-xs text-gray-400 font-semibold bg-gray-50 rounded-xl">
                              This ticket is resolved and closed.
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    /* Ticket List cards */
                    tickets.map((ticket) => {
                      const lastSeenStr = localStorage.getItem(`bridge_support_seen_${ticket.ticketId}`);
                      let hasNewReply = false;
                      if (!lastSeenStr) {
                        hasNewReply = ticket.messages?.some((m) => m.sender === "support") || false;
                      } else {
                        const lastSeenTime = new Date(lastSeenStr).getTime();
                        hasNewReply = ticket.messages?.some((m) => {
                          if (m.sender !== "support") return false;
                          const msgTime = m.timestamp?.toDate ? m.timestamp.toDate().getTime() : new Date(m.timestamp).getTime();
                          return msgTime > lastSeenTime;
                        }) || false;
                      }

                      return (
                        <div
                          key={ticket.ticketId}
                          onClick={() => expandTicket(ticket.ticketId)}
                          className={`p-4 bg-white border rounded-xl hover:shadow-md cursor-pointer transition-all duration-200 relative group flex justify-between items-start ${
                            hasNewReply ? "border-[#0D9488] bg-teal-50/5" : "border-gray-100"
                          }`}
                        >
                          {hasNewReply && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                          )}
                          <div className="space-y-1.5 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">#{ticket.ticketId}</span>
                              <span className="text-xs text-gray-400 font-medium">
                                {getRelativeTime(ticket.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-bold tracking-tight uppercase">
                              {ticket.category}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-1 italic">
                              "{ticket.description}"
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-between h-full min-h-[50px]">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase text-white ${
                                ticket.status === "open"
                                  ? "bg-red-500"
                                  : ticket.status === "inprogress"
                                  ? "bg-amber-500"
                                  : "bg-green-600"
                              }`}
                            >
                              {ticket.status === "inprogress" ? "In Progress" : ticket.status}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0D9488] transition-colors mt-2" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin-once {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(90deg); }
        }
        .animate-spin-once {
          animation: spin-once 0.2s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
