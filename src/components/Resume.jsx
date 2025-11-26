import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { scanResume, toggleJsonView } from '../redux/resumeSlice';
import { addSkill } from '../redux/userSlice';

const Resume = () => {
  const dispatch = useDispatch();
  const resumeUploadRef = useRef(null);
  const user = useSelector((state) => state.user.data);
  const { parsedSkills, loading, error, showJson } = useSelector((state) => state.resume);

  useEffect(() => {
    if (user.resumeRemoteUrl && !parsedSkills && !loading && !error) {
      dispatch(scanResume(user.resumeRemoteUrl));
    }
  }, [user.resumeRemoteUrl, parsedSkills, loading, error, dispatch]);

  const handleManualUpload = () => {
    const file = resumeUploadRef.current?.files?.[0];
    if (file) dispatch(scanResume(file));
  };

  const handleAddSkills = () => {
    if (!parsedSkills) return;
    Object.values(parsedSkills).flat().forEach(skillName => {
        dispatch(addSkill({ name: skillName, level: 'Intermediate', tags: 'Extracted' }));
    });
    alert(`Skills added!`);
  };

  // Flatten skills for table view
  const flattenedParsedSkills = parsedSkills ? Object.entries(parsedSkills).flatMap(([cat, arr]) => arr.map(skill => ({ category: cat, skill }))) : [];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Resume Analyzer</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Upload New Resume</h3>
          
          {user.resumeRemoteUrl ? (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md border border-green-200 dark:border-green-800 text-sm font-medium">
                ✅ Stored Resume Found.
            </div>
          ) : (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md border border-amber-200 dark:border-amber-800 text-sm font-medium">
                ⚠️ No stored resume found.
            </div>
          )}

          <input 
            ref={resumeUploadRef} 
            type="file" 
            accept=".pdf" 
            className="mb-4 block w-full text-sm text-gray-800 dark:text-gray-300 
            file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 
            file:bg-blue-600 file:text-white hover:file:bg-blue-700
            dark:file:bg-blue-700 dark:hover:file:bg-blue-600" 
          />
          
          <div className="flex gap-3">
            <button 
                onClick={handleManualUpload} 
                disabled={loading} 
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:bg-gray-400 dark:disabled:bg-slate-600 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
            >
              {loading ? 'Scanning...' : '⚡ Scan Uploaded Resume'}
            </button>
          </div>
          
          {error && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800 rounded">
                {error}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 transition-colors duration-300">
          <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">Extracted Skills</h3>
          
          {loading ? (
            <div className="text-center py-10 text-gray-600 dark:text-gray-400">Analyzing...</div>
          ) : parsedSkills ? (
            <>
              <div className="mt-4 border border-gray-200 dark:border-slate-700 rounded-lg overflow-auto max-h-60 custom-scrollbar">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600 sticky top-0">
                    <tr>
                        <th className="px-3 py-2 text-gray-700 dark:text-gray-200">#</th>
                        <th className="px-3 py-2 text-gray-700 dark:text-gray-200">Skill</th>
                        <th className="px-3 py-2 text-gray-700 dark:text-gray-200">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {flattenedParsedSkills.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-700/30'}>
                        <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400">{idx + 1}</td>
                        <td className="px-3 py-1.5 text-gray-900 dark:text-gray-100 font-medium">{row.skill}</td>
                        <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button 
                    onClick={() => dispatch(toggleJsonView())} 
                    className="text-xs px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    {showJson ? 'Hide JSON' : 'Show JSON'}
                </button>
                <button 
                    onClick={handleAddSkills} 
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold ml-auto transition-colors"
                >
                    Add Skills to Profile
                </button>
              </div>
              
              {showJson && (
                <pre className="mt-3 bg-gray-900 dark:bg-slate-950 text-white dark:text-gray-200 p-4 text-xs rounded overflow-auto max-h-64 border border-gray-800 dark:border-slate-800">
                    {JSON.stringify(parsedSkills, null, 4)}
                </pre>
              )}
            </>
          ) : (
            <div className="h-full min-h-[150px] flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-600 rounded-md">
                Upload a resume to analyze.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resume;