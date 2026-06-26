'use client';

/**
 * CategoryGrid
 * 
 * Displays 8 category tiles in a grid layout.
 * Used on the GD Pulse setup hub page.
 * 
 * Props:
 *   onSelectCategory  function — callback when a category is clicked
 */
export default function CategoryGrid({ onSelectCategory }) {
  const categories = [
    {
      id: 'current_affairs',
      name: 'Current Affairs',
      desc: 'National and global events, politics, and policy decisions.',
      icon: <GlobeIcon />,
      topicsCount: 18,
      difficulty: 'Medium',
      difficultyColor: 'text-amber-500 bg-amber-50',
    },
    {
      id: 'business',
      name: 'Business & Finance',
      desc: 'Strategy, corporate decisions, startup trends, and economic shifts.',
      icon: <BriefcaseIcon />,
      topicsCount: 15,
      difficulty: 'Hard',
      difficultyColor: 'text-rose-500 bg-rose-50',
    },
    {
      id: 'tech',
      name: 'Tech & Innovation',
      desc: 'AI policy, digital transformation, privacy, and future tech.',
      icon: <CpuIcon />,
      topicsCount: 12,
      difficulty: 'Medium',
      difficultyColor: 'text-amber-500 bg-amber-50',
    },
    {
      id: 'social',
      name: 'Social Issues',
      desc: 'Education reform, gender diversity, environmental sustainability.',
      icon: <UsersIcon />,
      topicsCount: 14,
      difficulty: 'Easy',
      difficultyColor: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: 'abstract',
      name: 'Abstract Topics',
      desc: 'Philosophical questions, metaphors, and creative reasoning.',
      icon: <SparklesIcon />,
      topicsCount: 10,
      difficulty: 'Hard',
      difficultyColor: 'text-rose-500 bg-rose-50',
    },
    {
      id: 'case_study',
      name: 'Case Study & Ops',
      desc: 'Solve real-world operational challenges under constraints.',
      icon: <FolderIcon />,
      topicsCount: 8,
      difficulty: 'Hard',
      difficultyColor: 'text-rose-500 bg-rose-50',
    },
    {
      id: 'stress_gd',
      name: 'Stress GD Boost',
      desc: 'Provocative statements designed to trigger intense AI debates.',
      icon: <ZapIcon />,
      topicsCount: 6,
      difficulty: 'Extreme',
      difficultyColor: 'text-red-600 bg-red-50 border border-red-200 font-extrabold',
    },
    {
      id: 'ethics',
      name: 'Ethics & Governance',
      desc: 'Corporate ethics, sustainability, and moral dilemmas in industry.',
      icon: <ShieldIcon />,
      topicsCount: 9,
      difficulty: 'Medium',
      difficultyColor: 'text-amber-500 bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory?.(cat.id, cat.name)}
          className="text-left bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-teal-500/50 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between h-full group focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <div>
            {/* Icon + Difficulty pill */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
                {cat.icon}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cat.difficultyColor}`}>
                {cat.difficulty}
              </span>
            </div>

            {/* Category Name & Desc */}
            <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-teal-600 transition-colors mb-1.5">
              {cat.name}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {cat.desc}
            </p>
          </div>

          {/* Topics Count info */}
          <div className="border-t border-slate-100/80 pt-3 mt-4 flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400 font-semibold">{cat.topicsCount} Practice Topics</span>
            <span className="text-xs font-bold text-teal-600 group-hover:translate-x-0.5 transition-transform duration-200 flex items-center gap-0.5">
              Practice →
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

// Icons
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="15" x2="23" y2="15" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="15" x2="4" y2="15" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
