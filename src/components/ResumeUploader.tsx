'use client';
import { useState } from 'react';
import { UploadCloud, CheckCircle2, Loader2, AlertCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ResumeUploader({ onUploadSuccess }: { onUploadSuccess: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!isValidEmail(email)) {
      setError('Enter a valid email address for job alerts.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });
      const json = await parseApiResponse(res);
      if (!res.ok) throw new Error(json.error || 'Failed to upload');
      
      onUploadSuccess({ ...json.data, rawText: json.rawText, email: email.trim() });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-auto shadow-2xl"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Resume</h2>
        <p className="text-gray-400">Let our AI analyze your profile and find the perfect match.</p>
      </div>

      <div className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 ${file ? 'opacity-50' : ''}`}></div>
        <div className="relative bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-cyan-500 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]">
          <input 
            type="file" 
            accept=".pdf,.docx" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {file ? (
            <div className="flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-white font-medium text-lg">{file.name}</p>
              <p className="text-gray-400 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <UploadCloud className="w-12 h-12 text-cyan-500 mb-4" />
              <p className="text-gray-300 font-medium text-lg mb-1">Click or drag and drop to upload</p>
              <p className="text-gray-500 text-sm">PDF or DOCX (MAX. 5MB)</p>
            </div>
          )}
        </div>
      </div>

      <label className="block mt-6">
        <span className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-cyan-400" />
          Email for job alerts
        </span>
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-gray-700 bg-gray-950/70 px-4 py-3 text-white placeholder:text-gray-600 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
      </label>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-start text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-8 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing with AI...
          </>
        ) : (
          'Analyze Resume'
        )}
      </button>
    </motion.div>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function parseApiResponse(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  throw new Error(
    text.includes('<!DOCTYPE')
      ? 'The server returned an HTML error page. Check the Vercel function logs and environment variables.'
      : text || 'The server returned an invalid response.'
  );
}
