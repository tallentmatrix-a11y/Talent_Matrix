import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const API_BASE = "https://talentmatrix-backend.onrender.com";

// Helper function to get the initial theme preference
const getInitialTheme = () => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') === 'dark';
    }
    // Check system preference if no localStorage value is set
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Helper function to apply the 'dark' class to the document root
const applyTheme = (isDark) => {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

const AppliedJobs = () => {
    // Access user data from Redux
    const user = useSelector((state) => state.user.data);
    // Fallback to check for different ID field names (id vs student_id)
    const studentId = user?.student_id || user?.id;

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDark, setIsDark] = useState(getInitialTheme); // Theme State

    // --- Theme Management Effect ---
    useEffect(() => {
        applyTheme(isDark);
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchJobs = async () => {
            // If no user ID is found, don't attempt fetch
            if (!studentId) {
                setLoading(false);
                return;
            }

            try {
                // MATCHING YOUR BACKEND ROUTE: /api/applied-jobs/:studentId
                const response = await axios.get(`${API_BASE}/api/applied-jobs/${studentId}`);
                // Ensure data is an array, even if empty
                setJobs(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Error fetching applied jobs:", err);
                // Handle different error messages based on response status if possible, otherwise use generic error
                setError("Failed to load your saved jobs. Check the backend server status.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [studentId]);

    // --- Loading State UI ---
    if (loading) {
        return (
            <div className="flex justify-center items-center h-40 bg-white dark:bg-gray-900 transition-colors rounded-lg">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-blue-600 dark:border-blue-400"></div>
                <p className="ml-4 text-gray-700 dark:text-gray-300">Loading applied jobs...</p>
            </div>
        );
    }

    // --- Error State UI ---
    if (error) {
        return (
            <div className="bg-red-100 border border-red-300 text-red-800 px-6 py-4 rounded-xl relative dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                <strong className="font-bold">Connection Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        );
    }

    // --- Main Component UI ---
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors p-6 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header and Theme Toggle */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Job Dashboard</h2>
                    
                    <div className="flex items-center gap-4">
                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                            {jobs.length} Applied
                        </span>
                        
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-yellow-400 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? (
                                // Sun Icon (Light Mode)
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            ) : (
                                // Moon Icon (Dark Mode)
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Job List */}
                <div className="grid grid-cols-1 gap-6">
                    {jobs.length > 0 ? (
                        jobs.map((job) => (
                            <div 
                                key={job.id || job.job_url} 
                                className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 overflow-hidden dark:bg-gray-800 dark:border-gray-700"
                            >
                                <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    
                                    {/* Job Details Section */}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                                            {job.job_title || "Untitled Position"}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                                            🏢 {job.company_name || "Unknown Company"}
                                            </span>
                                            {job.location && (
                                            <span className="flex items-center gap-1">
                                                📍 {job.location}
                                            </span>
                                            )}
                                            {job.posted_date && (
                                            <span className="flex items-center gap-1">
                                                🕒 Posted: {new Date(job.posted_date).toLocaleDateString()}
                                            </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Button Section */}
                                    <div className="flex-shrink-0">
                                        <a 
                                            href={job.job_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md"
                                        >
                                            Apply/View
                                            <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                                
                                {/* Status Bar */}
                                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400">
                                    <span>Added on {new Date(job.created_at || Date.now()).toLocaleDateString()}</span>
                                    <span className="uppercase tracking-wider font-semibold text-green-600 dark:text-green-400">Active</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Empty State
                        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300 dark:bg-gray-800 dark:border-gray-600">
                            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No jobs saved</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by browsing the jobs section to save positions you've applied to.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppliedJobs;