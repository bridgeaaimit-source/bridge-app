"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
}

export default function BackButton({ href = "/dashboard", onClick }: BackButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    } else {
      // Simple toast notification for navigation
      toast("Going back to dashboard");
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
    >
      <ChevronLeft className="w-5 h-5" />
    </Link>
  );
}
