"use client";
import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";

interface PageLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export default function PageLayout({ 
  children, 
  showBottomNav = true, 
  className = "" 
}: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-[#0A0A0F] text-white ${className}`}>
      <div className="max-w-[430px] mx-auto w-full">
        <div className="pb-[100px]">
          {children}
        </div>
      </div>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}
