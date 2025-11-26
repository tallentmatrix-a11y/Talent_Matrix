import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile, uploadResumeFile } from '../redux/userSlice';

const UpdateProfile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.data);
  const resumeRef = useRef(null);

  // Local State for form fields
  const [formData, setFormData] = useState({
    githubUsername: '',
    linkedinUrl: '',
    mobileNumber: '',
    leetcodeUrl: '',
    hackerrankUrl: '',
    codechefUrl: '',
    codeforcesUrl: ''
  });

  const [status, setStatus] = useState({}); // For field-specific "Saved!" messages

  // Populate form when user data loads
  useEffect(() => {
    setFormData({
      githubUsername: user.githubUsername || '',
      linkedinUrl: user.linkedinUrl || '',
      mobileNumber: user.mobileNumber || '',
      leetcodeUrl: user.leetcodeUrl || '',
      hackerrankUrl: user.hackerrankUrl || '',
      codechefUrl: user.codechefUrl || '',
      codeforcesUrl: user.codeforcesUrl || ''
    });
  }, [user]);

  const handleSave = (field) => {
    setStatus(prev => ({ ...prev, [field]: 'saving' }));
    
    dispatch(updateUserProfile({ 
        userId: user.id, 
        data: { [field]: formData[field] } 
    }))
    .then(() => {
        setStatus(prev => ({ ...prev, [field]: 'saved' }));
        setTimeout(() => setStatus(prev => ({ ...prev, [field]: null })), 2000);
    })
    .catch(() => {
        setStatus(prev => ({ ...prev, [field]: 'error' }));
    });
  };

  const handleResumeUpdate = () => {
      const file = resumeRef.current?.files?.[0];
      if(!file) return alert("Select a PDF file first.");
      dispatch(uploadResumeFile({ userId: user.id, file }))
        .then(() => alert("Resume Updated Successfully!"))
        .catch(() => alert("Failed to update resume"));
  };

  // Helper to render Status Icon
  const StatusIcon = ({ field }) => {
      const s = status[field];
      if(s === 'saving') return <span className="text-amber-500 dark:text-amber-400 text-sm ml-2">🔄 Saving...</span>;
      if(s === 'saved') return <span className="text-emerald-500 dark:text-emerald-400 text-sm ml-2">✅ Saved!</span>;
      if(s === 'error') return <span className="text-red-500 dark:text-red-400 text-sm ml-2">❌ Error</span>;
      return null;
  };

  // Helper for Input Fields to reduce repetition
  const InputField = ({ label, field, placeholder }) => (
    <div className="flex flex-col">
      <label className="text-gray-600 dark:text-gray-300 font-semibold mb-2 flex items-center">
        {label} <StatusIcon field={field}/>
      </label>
      <div className="flex gap-3">
        <input 
            type="text" 
            value={formData[field]} 
            onChange={e => setFormData({...formData, [field]: e.target.value})} 
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors" 
            placeholder={placeholder} 
        />
        <button 
            onClick={() => handleSave(field)} 
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
        >
            Save
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 max-w-2xl mx-auto transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">🔗 Update Contact & Links</h2>
      <div className="flex flex-col gap-6">
        
        {/* Resume Update */}
        <div className="pb-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">📄 Update Resume</h3>
            <div className="flex gap-3 items-center">
                <input 
                    ref={resumeRef} 
                    type="file" 
                    accept=".pdf" 
                    className="block w-full text-sm text-gray-700 dark:text-gray-300 
                    file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 
                    file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                    dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50" 
                />
                <button 
                    onClick={handleResumeUpdate} 
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white px-4 py-2 rounded-md font-semibold transition-colors whitespace-nowrap"
                >
                    Update Resume
                </button>
            </div>
            {user.resumeRemoteUrl && <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400">✓ Current resume uploaded to server</p>}
        </div>

        {/* Contact Fields */}
        <InputField label="GitHub Username" field="githubUsername" placeholder="e.g. yourusername" />
        <InputField label="LinkedIn URL" field="linkedinUrl" placeholder="https://linkedin.com/..." />
        <InputField label="Mobile Number" field="mobileNumber" placeholder="e.g. 9876543210" />

        <hr className="my-2 border-gray-200 dark:border-slate-700" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Coding Profiles</h3>

        {/* Coding Profile Fields */}
        <InputField label="LeetCode URL" field="leetcodeUrl" placeholder="https://leetcode.com/..." />
        <InputField label="HackerRank URL" field="hackerrankUrl" placeholder="" />
        <InputField label="CodeChef URL" field="codechefUrl" placeholder="" />
        <InputField label="CodeForces URL" field="codeforcesUrl" placeholder="" />

      </div>
    </div>
  );
};

export default UpdateProfile;