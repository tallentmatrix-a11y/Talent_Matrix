import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const Analyse = () => {
  const user = useSelector((state) => state.user.data);
  const [companies, setCompanies] = useState([]); 
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCompanies, setFetchingCompanies] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch Company List on Component Mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('https://talentmatrix-backend.onrender.com/api/ai/companies'); 
        const data = await response.json();
        
        if (data.success) {
            setCompanies(data.data);
        } else {
            setError("Failed to load company list.");
        }
      } catch (err) {
        setError("Error fetching company data.");
      } finally {
        setFetchingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleCompanyClick = async (company) => {
    setSelectedCompany(company);
    setAnalysis(null);
    setLoading(true);
    setError(null);

    try {
        if (!user?.resumeRemoteUrl) throw new Error("Please upload a resume first.");

        const username = user.githubUsername || "user";
        
        const response = await fetch('https://talentmatrix-backend.onrender.com/api/ai/analyze-target-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                resumeUrl: user.resumeRemoteUrl,
                companyName: company.company
            })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Analysis failed");
        
        setAnalysis(data.data);

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const closePopup = () => {
    setSelectedCompany(null);
    setAnalysis(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dream Company Analyzer</h2>
      
      {/* Loading State for List */}
      {fetchingCompanies && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading companies...</div>
      )}

      {/* Company Grid */}
      {!fetchingCompanies && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((comp, idx) => (
              <div 
                key={idx} 
                onClick={() => handleCompanyClick(comp)}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all"
              >
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{comp.company}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{comp.role}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {comp.skills.slice(0, 3).map(s => (
                        <span key={s} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">{s}</span>
                    ))}
                    {comp.skills.length > 3 && <span className="text-xs text-gray-400 dark:text-gray-500">+{comp.skills.length - 3} more</span>}
                </div>
                
                <div className="text-green-600 dark:text-green-400 font-semibold text-sm">💰 {comp.approx_CTC}</div>
              </div>
            ))}
          </div>
      )}

      {/* POPUP MODAL */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-fade-in-up border dark:border-slate-700">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCompany.company}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Role: {selectedCompany.role}</p>
                </div>
                <button onClick={closePopup} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl transition-colors">&times;</button>
            </div>

            {/* Content */}
            <div className="p-6">
                {loading && (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-300">Analyzing your profile against {selectedCompany.company}...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-center border border-red-100 dark:border-red-800">
                        {error}
                    </div>
                )}

                {!loading && analysis && (
                    <div className="space-y-6">
                        {/* Score */}
                        <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{analysis.match_percentage}</div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white">Profile Match</div>
                                <div className="text-sm text-blue-800 dark:text-blue-300">Based on Resume & LeetCode</div>
                            </div>
                        </div>

                        {/* Missing Skills */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">⚠️ Missing Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.missing_skills && analysis.missing_skills.length > 0 ? analysis.missing_skills.map(s => (
                                    <span key={s} className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-sm font-medium border border-red-100 dark:border-red-800">{s}</span>
                                )) : <span className="text-green-600 dark:text-green-400">You matched all key skills! 🎉</span>}
                            </div>
                        </div>

                        {/* Advice */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-2">💡 AI Advice</h4>
                            <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/30 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-sm leading-relaxed">
                                {analysis.advice}
                            </p>
                        </div>

                        {/* Roadmap */}
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-3">🗺️ Preparation Roadmap</h4>
                            <div className="space-y-3">
                                {analysis.roadmap && analysis.roadmap.map((step, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex-shrink-0 w-20 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mt-1">{step.step}</div>
                                        <div className="bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 p-3 rounded-lg flex-1 shadow-sm text-sm text-gray-700 dark:text-gray-200">
                                            {step.action}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analyse;