"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  Building2, Link2, Plus, Check, Copy, ArrowRight, ArrowLeft, ChevronRight, MapPin, Calendar, DollarSign, Users, Briefcase, ExternalLink,
} from "lucide-react";

export default function TPOOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userData, setUserData] = useState(null);
  const [collegeData, setCollegeData] = useState(null);

  const [college, setCollege] = useState({ name: "", city: "" });
  const [joinLink, setJoinLink] = useState("");

  const [drive, setDrive] = useState({
    company: "", companyDomain: "", role: "", package: "",
    location: "", driveDate: "", lastApplyDate: "",
    minCGPA: "", minBridgeScore: "", superset_link: "",
    rounds: [],
  });

  const roundOptions = ["Aptitude", "GD", "Technical", "HR", "Coding", "Case Study"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/tpo/login"); return; }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "tpo") {
        router.replace("/tpo/login");
        return;
      }

      const data = userDoc.data();
      setUserData(data);

      if (data.onboardingCompleted) {
        router.replace("/tpo");
        return;
      }

      // Load college
      if (data.collegeId) {
        const collegeDoc = await getDoc(doc(db, "colleges", data.collegeId));
        if (collegeDoc.exists()) {
          const cd = collegeDoc.data();
          setCollegeData(cd);
          setCollege({ name: cd.name || "", city: cd.city || "" });
          const origin = typeof window !== "undefined" ? window.location.origin : "https://appbridgeai.in";
          setJoinLink(`${origin}/join/${data.collegeId}`);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCollege = async () => {
    if (!userData?.collegeId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "colleges", userData.collegeId), {
        name: college.name,
        city: college.city,
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        college: college.name,
      });
      setStep(2);
    } catch (e) {
      console.error("Save college error:", e);
    }
    setSaving(false);
  };

  const handleAddDrive = async () => {
    if (!drive.company || !drive.role) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "drives"), {
        collegeId: userData.collegeId,
        company: drive.company,
        companyDomain: drive.companyDomain || "",
        role: drive.role,
        package: drive.package || "",
        location: drive.location || "",
        eligibility: {
          minCGPA: parseFloat(drive.minCGPA) || 0,
          minBridgeScore: parseInt(drive.minBridgeScore) || 0,
          branches: [],
          year: "",
        },
        driveDate: drive.driveDate ? new Date(drive.driveDate) : null,
        lastApplyDate: drive.lastApplyDate ? new Date(drive.lastApplyDate) : null,
        rounds: drive.rounds,
        status: "upcoming",
        superset_link: drive.superset_link || "",
        createdAt: serverTimestamp(),
      });
      setStep(4);
    } catch (e) {
      console.error("Add drive error:", e);
    }
    setSaving(false);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
      router.replace("/tpo");
    } catch (e) {
      console.error("Finish error:", e);
    }
    setSaving(false);
  };

  const toggleRound = (r) => {
    setDrive(prev => ({
      ...prev,
      rounds: prev.rounds.includes(r)
        ? prev.rounds.filter(x => x !== r)
        : [...prev.rounds, r],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s
                  ? "bg-[#0D9488] text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-8 h-0.5 ${step > s ? "bg-[#0D9488]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Step 1: College Details */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#CCFBF1] rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Confirm College Details</h2>
                  <p className="text-sm text-gray-500">Verify your college information</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                  <input
                    type="text"
                    value={college.name}
                    onChange={(e) => setCollege({ ...college, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={college.city}
                    onChange={(e) => setCollege({ ...college, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveCollege}
                disabled={saving || !college.name}
                className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Continue"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Share Join Link */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#CCFBF1] rounded-xl flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invite Your Students</h2>
                  <p className="text-sm text-gray-500">Share this link with your batch</p>
                </div>
              </div>

              <div className="bg-[#F0FDFA] border border-[#99F6E4] rounded-xl p-4 mb-4">
                <p className="text-xs text-[#0D9488] font-semibold mb-2">Student Join Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-200 truncate">
                    {joinLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-all ${
                      copied
                        ? "bg-[#0D9488] text-white"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                When students visit this link and sign in, they'll be added to your <strong>{college.name}</strong> batch.
                You'll be able to track their progress from your dashboard.
              </p>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white text-sm font-semibold">
                  Continue <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Add First Drive */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#CCFBF1] rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[#0D9488]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add First Drive</h2>
                  <p className="text-sm text-gray-500">Set up your first campus placement drive</p>
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
                    <input
                      type="text"
                      value={drive.company}
                      onChange={(e) => setDrive({ ...drive, company: e.target.value })}
                      placeholder="e.g. TCS"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company Domain</label>
                    <input
                      type="text"
                      value={drive.companyDomain}
                      onChange={(e) => setDrive({ ...drive, companyDomain: e.target.value })}
                      placeholder="e.g. tcs.com"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
                    <input
                      type="text"
                      value={drive.role}
                      onChange={(e) => setDrive({ ...drive, role: e.target.value })}
                      placeholder="e.g. SDE"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Package</label>
                    <input
                      type="text"
                      value={drive.package}
                      onChange={(e) => setDrive({ ...drive, package: e.target.value })}
                      placeholder="e.g. 6.5 LPA"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={drive.location}
                    onChange={(e) => setDrive({ ...drive, location: e.target.value })}
                    placeholder="e.g. Pan India"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Drive Date</label>
                    <input
                      type="date"
                      value={drive.driveDate}
                      onChange={(e) => setDrive({ ...drive, driveDate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Last Apply Date</label>
                    <input
                      type="date"
                      value={drive.lastApplyDate}
                      onChange={(e) => setDrive({ ...drive, lastApplyDate: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min CGPA</label>
                    <input
                      type="number"
                      step="0.1"
                      value={drive.minCGPA}
                      onChange={(e) => setDrive({ ...drive, minCGPA: e.target.value })}
                      placeholder="e.g. 6.0"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min BRIDGE Score</label>
                    <input
                      type="number"
                      value={drive.minBridgeScore}
                      onChange={(e) => setDrive({ ...drive, minBridgeScore: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Rounds</label>
                  <div className="flex flex-wrap gap-2">
                    {roundOptions.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRound(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          drive.rounds.includes(r)
                            ? "bg-[#0D9488] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Superset Application Link</label>
                  <input
                    type="url"
                    value={drive.superset_link}
                    onChange={(e) => setDrive({ ...drive, superset_link: e.target.value })}
                    placeholder="https://superset.com/..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Back
                </button>
                <button onClick={() => setStep(4)} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50">
                  Skip
                </button>
                <button
                  onClick={handleAddDrive}
                  disabled={saving || !drive.company || !drive.role}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Adding..." : "Add Drive"} <Plus className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-[#CCFBF1] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-[#0D9488]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
              <p className="text-gray-500 text-sm mb-8">
                Your dashboard is ready. Share the join link with your students and start tracking their placement readiness.
              </p>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-teal-200 disabled:opacity-60"
              >
                {saving ? "Setting up..." : "Go to Dashboard"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
