"use client";

import { useState } from "react";
import { getCompanyLogoUrl, getCompanyFallback } from "@/lib/driveUtils";

/**
 * Shared CompanyLogo component used across TPO and Drives pages.
 * Renders a Clearbit logo image with a colored initial-letter fallback.
 *
 * @param {string} domain  - Company domain (e.g. "google.com") for Clearbit lookup
 * @param {string} name    - Company name (used for fallback initial + color)
 * @param {number} size    - Width and height in px (default: 40)
 * @param {string} rounded - Tailwind rounded class (default: "rounded-xl")
 */
export default function CompanyLogo({ domain, name, size = 40, rounded = "rounded-xl" }) {
  const [imgError, setImgError] = useState(false);
  const fb = getCompanyFallback(name);
  const url = getCompanyLogoUrl(domain);

  if (!url || imgError) {
    return (
      <div
        className={`${rounded} flex items-center justify-center text-white font-bold shrink-0`}
        style={{ width: size, height: size, backgroundColor: fb.color, fontSize: size * 0.4 }}
      >
        {fb.initial}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className={`${rounded} object-contain bg-white border border-gray-100 shrink-0`}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
}
