"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, Zap, Trophy, User, Briefcase } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/interview", icon: Mic, label: "Practice" },
  { href: "/pulse", icon: Zap, label: "PULSE" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/leaderboard", icon: Trophy, label: "Trophy" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10 z-50">
      <div className="max-w-md mx-auto px-6 py-3">
        <div className="grid grid-cols-6 gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all ${
                  isActive
                    ? "text-purple-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
