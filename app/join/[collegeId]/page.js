"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Building2, Check, LogIn } from "lucide-react";
import Link from "next/link";

export default function JoinCollegePage({ params }) {
  const { collegeId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch college info
    const fetchCollege = async () => {
      try {
        const collegeDoc = await getDoc(doc(db, "colleges", collegeId));
        if (collegeDoc.exists()) {
          setCollegeName(collegeDoc.data().name || "Unknown College");
        } else {
          setError("This college link is invalid or has expired.");
        }
      } catch (e) {
        setError("Failed to load college info.");
      }
    };

    fetchCollege();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collegeId]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    setError("");

    try {
      // Update student's user doc
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          collegeId,
          college: collegeName,
          updatedAt: new Date().toISOString(),
        });
      }

      // Add student to college's studentUids
      const collegeRef = doc(db, "colleges", collegeId);
      await updateDoc(collegeRef, {
        studentUids: arrayUnion(user.uid),
      });

      setSuccess(true);
    } catch (e) {
      console.error("Join error:", e);
      setError("Failed to join college. Please try again.");
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5FAFA] flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-white to-[#F0FDFA] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          {/* College Icon */}
          <div className="w-16 h-16 bg-[#CCFBF1] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-[#0D9488]" />
          </div>

          {error && !collegeName ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
              <p className="text-gray-500 text-sm mb-6">{error}</p>
              <Link href="/login" className="text-[#0D9488] font-semibold text-sm hover:underline">
                Go to Login →
              </Link>
            </>
          ) : success ? (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to {collegeName}!</h2>
              <p className="text-gray-500 text-sm mb-6">
                You've joined the <strong>{collegeName}</strong> batch on BRIDGE.
                Your TPO can now see your progress and help you prepare for placements.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-teal-200"
              >
                Go to Dashboard →
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Join {collegeName} on BRIDGE
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Your TPO has invited you to join the placement preparation batch.
                Join to track your readiness and get personalized prep plans.
              </p>

              {user ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#0D9488] text-white flex items-center justify-center text-sm font-bold">
                        {(user.displayName || "U").charAt(0)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">{user.displayName || "User"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {error && (
                    <p className="text-red-500 text-sm mb-4">{error}</p>
                  )}

                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-teal-200 disabled:opacity-60"
                  >
                    {joining ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Join {collegeName}
                      </>
                    )}
                  </button>
                </>
              ) : (
                <Link
                  href={`/login?redirect=/join/${collegeId}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-teal-200"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Join
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
