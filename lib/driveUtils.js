/**
 * Drive Utilities — shared helpers for TPO dashboard + student drives
 */

/**
 * Calculate drive readiness score for a student against a specific drive.
 * Formula: aptitude 40% + interview 25% + GD 20% + BRIDGE 15%, capped at 100.
 */
export function calculateDriveReadiness(student, drive) {
  const aptitudeThreshold = drive?.eligibility?.minBridgeScore || 600;
  const aptitudeScore = student.aptitudeBestScore || 0;
  const interviewAvg = student.interviewAvgScore || 0;
  const gdScore = student.gdBestScore || 0;
  const bridgeScore = student.bridgeScore || 0;

  const readiness =
    ((aptitudeScore / Math.max(aptitudeThreshold, 1)) * 100 * 0.40) +
    ((interviewAvg / 100) * 100 * 0.25) +
    ((gdScore / 100) * 100 * 0.20) +
    ((bridgeScore / 1000) * 100 * 0.15);

  return Math.min(Math.round(readiness), 100);
}

/**
 * Get readiness breakdown as individual percentages.
 */
export function getReadinessBreakdown(student, drive) {
  const aptitudeThreshold = drive?.eligibility?.minBridgeScore || 600;
  return {
    aptitude: Math.min(Math.round(((student.aptitudeBestScore || 0) / Math.max(aptitudeThreshold, 1)) * 100), 100),
    communication: Math.min(Math.round(student.interviewAvgScore || 0), 100),
    gd: Math.min(Math.round(student.gdBestScore || 0), 100),
    bridgeScore: Math.min(Math.round(((student.bridgeScore || 0) / 1000) * 100), 100),
  };
}

/**
 * Check if a student is eligible for a drive.
 * Returns { eligible: boolean, reasons: string[] }
 */
export function checkEligibility(student, drive) {
  const reasons = [];
  const elig = drive?.eligibility || {};

  if (elig.minCGPA && (student.cgpa || 0) < elig.minCGPA) {
    reasons.push(`Need CGPA ${elig.minCGPA}+`);
  }
  if (elig.minBridgeScore && (student.bridgeScore || 0) < elig.minBridgeScore) {
    reasons.push(`Need BRIDGE Score ${elig.minBridgeScore}+`);
  }
  if (elig.branches && elig.branches.length > 0 && student.branch) {
    if (!elig.branches.includes(student.branch)) {
      reasons.push(`Branch ${student.branch} not eligible`);
    }
  }
  if (elig.year && student.year && elig.year !== student.year) {
    reasons.push(`Year ${elig.year} only`);
  }

  return { eligible: reasons.length === 0, reasons };
}

/**
 * Get Clearbit company logo URL with fallback.
 */
export function getCompanyLogoUrl(companyDomain) {
  if (!companyDomain) return null;
  return `https://logo.clearbit.com/${companyDomain}`;
}

/**
 * Format a drive date into a countdown string.
 */
export function formatCountdown(driveDate) {
  if (!driveDate) return '';
  const now = new Date();
  const drive = driveDate instanceof Date ? driveDate : new Date(driveDate?.seconds ? driveDate.seconds * 1000 : driveDate);
  const diffMs = drive - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Completed';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 30) return `In ${diffDays} days`;
  return `In ${Math.ceil(diffDays / 7)} weeks`;
}

/**
 * Format a Firestore timestamp or Date to display string.
 */
export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date?.seconds ? date.seconds * 1000 : date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Get "time ago" string from a date.
 */
export function timeAgo(date) {
  if (!date) return 'Never';
  const d = date instanceof Date ? date : new Date(date?.seconds ? date.seconds * 1000 : date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(d);
}

/**
 * Get company initial and color for fallback logo.
 */
export function getCompanyFallback(companyName) {
  const initial = (companyName || '?').charAt(0).toUpperCase();
  const colors = ['#0D9488', '#2563EB', '#7C3AED', '#DC2626', '#EA580C', '#CA8A04', '#16A34A'];
  const index = (companyName || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return { initial, color: colors[index] };
}
