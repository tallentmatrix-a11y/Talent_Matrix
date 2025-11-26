import React, { useState } from 'react';
import { useSelector } from 'react-redux';

// --- HELPER: Extract Username from LeetCode URL ---
const extractLeetCodeUsername = (url) => {
  if (!url) return null;
  
  let username = url;
  
  // If it's a full URL, strip it down
  if (username.includes("leetcode.com")) {
      const cleanUrl = username.replace(/\/+$/, ""); 
      const parts = cleanUrl.split('/');
      username = parts[parts.length - 1]; 
  }
  
  return username;
};

const Recommendation = () => {
  const user = useSelector((state) => state.user.data);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const handleRunAnalysis = async () => {
    if (!user.resumeRemoteUrl) {
      setError("Please upload a resume in your Profile first.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // 1. Get Name identifier (for display purposes)
      const displayName = user.githubUsername || user.name?.replace(/\s+/g, '').toLowerCase() || "guest";
      
      // 2. Extract LeetCode Handle from the correct Redux field: 'user.leetcodeUrl'
      const leetCodeHandle = extractLeetCodeUsername(user.leetcodeUrl);

      console.log(`📡 Sending Analysis. Name: ${displayName}, LeetCode Handle: ${leetCodeHandle}`);

      // 3. Send both to the backend
      const response = await fetch(`https://talentmatrix-backend.onrender.com/api/ai/analyze-career`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: displayName,          // Used for the report header
          leetcodeUsername: leetCodeHandle, // <--- CRITICAL: The extracted handle for stats
          resumeUrl: user.resumeRemoteUrl 
        })
      });
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Analysis failed.");
      }

      setReport(data);
    } catch (err) {
      console.error("Analysis Error:", err);
      setError(err.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentageString) => {
    if (!percentageString) return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600";
    const val = parseInt(percentageString);
    if (val >= 80) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    if (val >= 50) return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">AI Career Strategist</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time market analysis comparing your resume against live job listings.
          </p>
        </div>

        {!loading && (
            <button 
              onClick={handleRunAnalysis}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center gap-2"
            >
              {report ? "↻ Re-Run Analysis" : "🚀 Generate Skill Gap Report"}
            </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Analyzing Profile...</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
            Downloading resume, checking LeetCode, scraping live jobs... 
            <br/><span className="text-xs uppercase tracking-wide font-bold text-blue-500 dark:text-blue-400 mt-2 block">Please wait ~15 seconds</span>
          </p>
        </div>
      )}

      {!loading && report && (
        <div className="animate-fade-in-up">
          {/* Summary Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 p-6 rounded-xl mb-8 shadow-sm">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">🔎 Candidate Analysis</h3>
            <p className="text-blue-800 dark:text-blue-100 leading-relaxed">
              {report.user_summary?.candidate_summary || "Profile analyzed successfully."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-slate-600 shadow-sm">
                Jobs Scanned: {report.jobs_found_count || 0}
              </span>
              <span className="px-3 py-1 bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full border border-blue-200 dark:border-slate-600 shadow-sm">
                 LeetCode: {report.user_summary?.leetcode_level || "Not Linked"}
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Job Fit Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.analysis?.job_analyses?.map((job, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="p-5 border-b border-gray-100 dark:border-slate-700 flex justify-between items-start bg-gray-50/50 dark:bg-slate-800/50">
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{job.role}</h4>
                    <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{job.company}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getMatchColor(job.match_percentage)}`}>
                    {job.match_percentage} Match
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-2">
                      Missing Skills (Gap)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {job.missing_skills?.length > 0 ? (
                        job.missing_skills.map((skill, sIdx) => (
                          <span key={sIdx} className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-medium border border-red-100 dark:border-red-800">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                          ✓ No major skill gaps!
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-lg border border-slate-100 dark:border-slate-600/50">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Recommended Action
                    </label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                      "{job.action_plan}"
                    </p>
                  </div>
                  
                  {job.job_url && (
                    <a href={job.job_url} target="_blank" rel="noreferrer" className="block text-center w-full py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      View Job on LinkedIn ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendation;