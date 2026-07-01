'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Building2, ExternalLink, Zap, PlayCircle, ShieldCheck,
  Loader2, FileText, CheckCheck, Briefcase, Clock, RefreshCw, AlertCircle
} from 'lucide-react';

type ApplyMode = 'Manual' | 'Semi-Auto' | 'Full-Auto';

interface Job {
  url: string;
  title: string;
  company?: string;
  location?: string;
  platform?: string;
  matchScore?: number;
}

interface AppliedJob extends Job {
  appliedAt: string;
}

interface Props {
  jobs: Job[];
  profileData: any;
  userEmail?: string | null;
  onRefresh?: () => void;
}

const LOCAL_KEY = (email: string) => `applied_jobs_${email}`;
const PLATFORMS = ['All', 'LinkedIn', 'Naukri', 'Bayt', 'Monster', 'Shine', 'Gulf Jobs'];

export default function JobBoard({ jobs, profileData, userEmail, onRefresh }: Props) {
  const [applyMode, setApplyMode] = useState<ApplyMode>('Semi-Auto');
  const [activeTab, setActiveTab] = useState<'open' | 'applied'>('open');
  const [activePlatform, setActivePlatform] = useState<string>('All');
  const [activeJobUrl, setActiveJobUrl] = useState<string | null>(null);
  const [coverLetters, setCoverLetters] = useState<Record<string, string>>({});
  const [applyErrors, setApplyErrors] = useState<Record<string, string>>({});
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([]);
  const [loadingTracker, setLoadingTracker] = useState(false);

  // ── Load applied jobs on mount ──────────────────────────────────────────────
  const loadApplied = useCallback(async () => {
    if (!profileData?.email) return;
    setLoadingTracker(true);
    try {
      if (userEmail) {
        // Server-side tracker (logged-in user)
        const res = await fetch('/api/tracker');
        if (res.ok) {
          const json = await res.json();
          setAppliedJobs(json.jobs || []);
        }
      } else {
        // Guest: localStorage
        const raw = localStorage.getItem(LOCAL_KEY(profileData.email));
        setAppliedJobs(raw ? JSON.parse(raw) : []);
      }
    } catch {
      // Silently ignore
    } finally {
      setLoadingTracker(false);
    }
  }, [profileData?.email, userEmail]);

  useEffect(() => { loadApplied(); }, [loadApplied]);

  // ── Save an applied job ─────────────────────────────────────────────────────
  const markApplied = useCallback(async (job: Job) => {
    const entry: AppliedJob = { ...job, appliedAt: new Date().toISOString() };

    // Optimistic UI
    setAppliedJobs((prev) => {
      if (prev.some((j) => j.url === job.url)) return prev;
      return [entry, ...prev];
    });

    if (userEmail) {
      try {
        await fetch('/api/tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch { /* silent */ }
    } else if (profileData?.email) {
      const key = LOCAL_KEY(profileData.email);
      const current: AppliedJob[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (!current.some((j) => j.url === job.url)) {
        localStorage.setItem(key, JSON.stringify([entry, ...current]));
      }
    }
  }, [userEmail, profileData?.email]);

  // ── Filter: open = not yet applied ──────────────────────────────────────────
  // Unapplied jobs are those whose URL isn't in appliedJobs array
  let openJobs = jobs.filter((j) => !appliedJobs.some((a) => a.url === j.url));
  
  if (activePlatform !== 'All') {
    // If activePlatform is selected, check if job.platform matches, 
    // OR if it's Adzuna and the company/location name contains the platform name (since Adzuna aggregates)
    openJobs = openJobs.filter(j => 
      j.platform?.toLowerCase().includes(activePlatform.toLowerCase()) || 
      j.company?.toLowerCase().includes(activePlatform.toLowerCase())
    );
  }

  // ── Apply handler ───────────────────────────────────────────────────────────
  const handleApply = async (job: Job) => {
    if (applyMode === 'Manual') {
      window.open(job.url, '_blank');
      markApplied(job);
      return;
    }

    const applicationTab = window.open('about:blank', '_blank');
    if (applicationTab) {
      applicationTab.document.write('<p style="font-family: sans-serif; padding: 24px;">Preparing your application...</p>');
    }

    setActiveJobUrl(job.url);
    setApplyErrors((prev) => ({ ...prev, [job.url]: '' }));

    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: job.url,
          jobDescription: [job.title, job.company, job.location].filter(Boolean).join('\n'),
          profileData,
          applyMode,
        }),
      });

      let json: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        json = await res.json();
      } else {
        throw new Error('Server returned an unexpected response. Please check Vercel env vars.');
      }

      if (!res.ok) throw new Error(json.error || 'Failed to prepare application');

      if (json.coverLetter) {
        setCoverLetters((prev) => ({ ...prev, [job.url]: json.coverLetter }));
      }

      // Always redirect when semi-auto or full-auto (auto-apply may have failed)
      redirectToJob(applicationTab, job.url);
      markApplied(job);

    } catch (err: any) {
      // Even on error → redirect so the user can apply manually
      setApplyErrors((prev) => ({ ...prev, [job.url]: err.message || 'Could not prepare application. Redirecting you to apply manually…' }));
      redirectToJob(applicationTab, job.url);
      markApplied(job);
    } finally {
      setActiveJobUrl(null);
    }
  };

  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 space-y-6">

      {/* ── Header row ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Job Board</h3>
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/20">
              {openJobs.length} Open
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
              {appliedJobs.length} Applied
            </span>
          </div>
        </div>

        {/* Apply mode switcher */}
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

      {/* ── Tab switcher ── */}
      <div className="flex border-b border-gray-800 mb-6 px-6 pt-2">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'open'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Open Roles
          <span className="bg-gray-800 text-gray-400 rounded-full px-2 py-0.5 text-xs">{openJobs.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('applied')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'applied'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <CheckCheck className="w-4 h-4" /> Applied
          <span className="bg-gray-800 text-gray-400 rounded-full px-2 py-0.5 text-xs">{appliedJobs.length}</span>
        </button>
      </div>

      {/* Platform Tabs (Pills) */}
      {activeTab === 'open' && (
        <div className="flex gap-2 overflow-x-auto px-6 pb-6 mb-2 no-scrollbar">
          {PLATFORMS.map((platform) => (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                activePlatform === platform 
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                  : 'bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>
      )}

      {/* ── Open Roles Tab ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'open' && (
          <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-6">
            {openJobs.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <CheckCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500/40" />
                <p className="text-lg font-medium text-gray-400">You&apos;ve applied to all listed jobs!</p>
                <p className="text-sm mt-1 mb-6">Check back later for new openings or scroll to your Applied tracker.</p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30 px-6 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Load More Jobs
                  </button>
                )}
              </div>
            ) : (
              openJobs.map((job, idx) => {
                const matchScore = job.matchScore || Math.min(98, 72 + ((job.title || '').length % 21));
                const isPreparing = activeJobUrl === job.url;
                const hasError = !!applyErrors[job.url];

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    key={job.url || idx}
                    className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 hover:border-cyan-500/50 transition-colors p-6 rounded-2xl group flex flex-col gap-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{job.title}</h4>
                          <span className="bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded border border-blue-500/20">
                            {job.platform || 'Job Board'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-400 text-sm">
                          <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {job.company || 'Company not listed'}</div>
                          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location || 'Remote'}</div>
                          <div className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="w-4 h-4" /> Active Hiring</div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 md:w-56">
                        <div className="flex flex-col items-start md:items-end w-full">
                          <span className="text-xs text-gray-500 uppercase font-semibold mb-1">AI Match Score</span>
                          <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                            <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full" style={{ width: `${matchScore}%` }} />
                          </div>
                          <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3" /> {matchScore}% Match
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleApply(job)}
                            disabled={isPreparing}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap border disabled:opacity-60 ${
                              applyMode === 'Full-Auto'
                                ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500'
                                : applyMode === 'Semi-Auto'
                                ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500'
                                : 'bg-white/5 hover:bg-white/10 text-white border-gray-700'
                            }`}
                          >
                            {isPreparing ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</>
                            ) : applyMode === 'Full-Auto' ? (
                              <><PlayCircle className="w-4 h-4" /> Auto Apply</>
                            ) : applyMode === 'Semi-Auto' ? (
                              <><Zap className="w-4 h-4" /> 1-Click Apply</>
                            ) : (
                              <>Apply Manually <ExternalLink className="w-4 h-4" /></>
                            )}
                          </button>

                          {/* Always show a direct link */}
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Open job page
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Cover letter / error section */}
                    {(coverLetters[job.url] || applyErrors[job.url]) && (
                      <div className="border-t border-gray-800 pt-4 space-y-3">
                        {coverLetters[job.url] && (
                          <div className="bg-black/20 rounded-xl p-4 text-sm text-gray-300">
                            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-2">
                              <FileText className="w-4 h-4" /> Generated Cover Letter
                            </div>
                            <p className="whitespace-pre-wrap">{coverLetters[job.url]}</p>
                          </div>
                        )}
                        {hasError && (
                          <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 flex items-start gap-2 text-amber-400 text-xs">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{applyErrors[job.url]} &nbsp;
                              <a href={job.url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                                Open job page →
                              </a>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}

            {openJobs.length > 0 && onRefresh && (
              <div className="text-center pt-8">
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 px-6 py-2.5 rounded-xl font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" /> Load More Jobs
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Applied Tab ── */}
        {activeTab === 'applied' && (
          <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {userEmail
                  ? `Synced to your account (${userEmail})`
                  : 'Saved locally on this device. Log in to sync across devices.'}
              </p>
              <button onClick={loadApplied} className="text-gray-500 hover:text-cyan-400 transition-colors" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${loadingTracker ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {appliedJobs.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                <p className="text-lg font-medium text-gray-400">No applications tracked yet.</p>
                <p className="text-sm mt-1">Jobs you apply to will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {appliedJobs.map((job, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={job.url + idx}
                    className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <h4 className="text-white font-semibold truncate">{job.title}</h4>
                        <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded border border-blue-500/20 flex-shrink-0">
                          {job.platform || 'Job Board'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 text-xs">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          <Clock className="w-3 h-3" /> Applied {new Date(job.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-gray-500 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20"
                      title="View job"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function redirectToJob(tab: Window | null, url: string) {
  if (tab) {
    tab.location.href = url;
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}
