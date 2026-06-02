'use client';
import { useState } from 'react';
import ResumeUploader from '@/components/ResumeUploader';
import JobBoard from '@/components/JobBoard';
import { Bot, Sparkles, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [profileData, setProfileData] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const handleUploadSuccess = async (data: any) => {
    setProfileData(data);
    
    setLoadingJobs(true);
    try {
      const keyword = data.domainExpertise || "Cybersecurity";
      const res = await fetch('/api/jobs/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location: "India" })
      });
      const json = await res.json();
      if (json.success) setJobs(json.data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/20 blur-3xl rounded-full"></div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center p-3 bg-gray-900 rounded-2xl mb-6 border border-gray-800 shadow-2xl relative z-10">
            <Bot className="w-10 h-10 text-cyan-400" />
          </motion.div>
          <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 relative z-10">
            AI Recruiter <br className="hidden md:block"/> & Auto Apply Engine
          </motion.h1>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl text-gray-400 max-w-2xl mx-auto relative z-10">
            Upload your resume and let our intelligent engine find, score, and automatically apply to the best matching roles.
          </motion.p>
        </header>

        {!profileData ? (
          <ResumeUploader onUploadSuccess={handleUploadSuccess} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-4 mb-8 border-b border-gray-800 pb-6">
                <Sparkles className="w-8 h-8 text-cyan-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Profile Insights</h2>
                  <p className="text-gray-400">AI Analysis of your resume</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                  <div className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Domain Expertise</div>
                  <div className="text-xl font-semibold text-white">{profileData.domainExpertise || 'General'}</div>
                </div>
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                  <div className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Experience Level</div>
                  <div className="text-xl font-semibold text-white">{profileData.experienceLevel || 'Not Detected'}</div>
                </div>
                <div className="bg-black/20 rounded-2xl p-6 border border-white/5 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 z-0"></div>
                  <div className="text-gray-400 text-sm font-medium mb-1 z-10">ATS Readability Score</div>
                  <div className="text-4xl font-extrabold text-cyan-400 z-10">{profileData.atsScore || 85}<span className="text-lg text-gray-500">/100</span></div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Extracted Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills?.map((skill: string, i: number) => (
                    <span key={i} className="bg-gray-800/80 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {loadingJobs ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-6"></div>
                <h3 className="text-2xl font-bold text-white mb-2">Scouting the Web</h3>
                <p className="text-gray-400 text-center max-w-md">Our AI agents are currently scraping LinkedIn and Naukri for the best {profileData.domainExpertise} roles...</p>
              </div>
            ) : (
              <JobBoard jobs={jobs} profileData={profileData} />
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
