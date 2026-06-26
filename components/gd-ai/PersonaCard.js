'use client';

/**
 * PersonaCard
 * 
 * Renders a premium card summarizing an AI GD participant's profile.
 * Used on the setup/introduction screen.
 * 
 * Props:
 *   persona  object — containing id, name, avatarColor, avatarInitial, personality, background, styleDescription, sampleQuote, personalityDesc
 */
export default function PersonaCard({ persona }) {
  if (!persona) return null;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Decorative colored corner badge */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform duration-300"
        style={{ backgroundColor: persona.avatarColor }}
      />
      
      <div>
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
            style={{ backgroundColor: persona.avatarColor }}
          >
            {persona.avatarInitial}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{persona.name}</h3>
            <span 
              className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: `${persona.avatarColor}12`, color: persona.avatarColor }}
            >
              {persona.personality}
            </span>
          </div>
        </div>

        {/* Profile Description */}
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {persona.personalityDesc}
        </p>

        {/* Background & Style */}
        <div className="space-y-2 mb-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Style</span>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">{persona.styleDescription}</p>
          </div>
        </div>
      </div>

      {/* Sample Quote */}
      <div className="border-t border-slate-100 pt-4 mt-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Debate Preview</span>
        <blockquote className="text-xs italic text-slate-500 border-l-2 pl-3 py-0.5 leading-relaxed" style={{ borderColor: persona.avatarColor }}>
          "{persona.sampleQuote}"
        </blockquote>
      </div>
    </div>
  );
}
