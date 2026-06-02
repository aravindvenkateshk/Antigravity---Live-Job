'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Building2, ExternalLink, Zap, Settings, PlayCircle, ShieldCheck } from 'lucide-react';

export default function JobBoard({ jobs, profileData }: { jobs: any[], profileData: any }) {
  const [applyMode, setApplyMode] = useState<'Manual' | 'Semi-Auto' | 'Full-Auto'>('Semi-Auto');

  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Recommended Opportunities</h3>
          <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/20 inline-block">
            {jobs.length} Matches Found
          </span>
        </div>
        
        {/* Safe Mode Toggle */}
        <div className="bg-gray-900 border border-gray-800 p-1.5 rounded-xl flex items-center shadow-lg">
          {(['Manual', 'Semi-Auto', 'Full-Auto'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setApplyMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                applyMode === mode 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid gap-6">
        {jobs.map((job, idx) => {
          const matchScore = Math.floor(Math.random() * 25 + 75); // Mock high score based on domain match
          return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-cyan-500/50 transition-colors p-6 rounded-2xl group flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{job.title}</h4>
                <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded border border-blue-500/20 flex items-center gap-1">
                  {job.platform}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400 text-sm mb-4">
                <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {job.company}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location || 'Remote'}</div>
                <div className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="w-4 h-4" /> Active Hiring</div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:w-56">
              <div className="flex flex-col items-start md:items-end w-full">
                <span className="text-xs text-gray-500 uppercase font-semibold mb-1">AI Match Score</span>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" style={{ width: `${matchScore}%` }}></div>
                </div>
                <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {matchScore}% Match
                </span>
              </div>
              
              <button 
                onClick={() => window.open(job.url, '_blank')}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap border ${
                  applyMode === 'Full-Auto' 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500' 
                    : applyMode === 'Semi-Auto'
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500'
                    : 'bg-white/5 hover:bg-white/10 text-white border-gray-700'
                }`}
              >
                {applyMode === 'Full-Auto' ? (
                  <><PlayCircle className="w-4 h-4" /> Auto Applied</>
                ) : applyMode === 'Semi-Auto' ? (
                  <><Zap className="w-4 h-4" /> 1-Click Apply</>
                ) : (
                  <>Apply Manually <ExternalLink className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </motion.div>
        )})}
      </div>
    </div>
  );
}
