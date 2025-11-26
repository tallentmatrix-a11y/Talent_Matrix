import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// API Base URL (kept as is)
const API_BASE = "https://talentmatrix-backend.onrender.com";

// Helper function to manage the 'dark' class on the HTML element
const applyTheme = (isDark) => {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

// Check for system preference or stored theme on initial load
const getInitialTheme = () => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const Books = () => {
    // Redux: Get user skills for default recommendations
    // Note: Assuming state.user.data.skills is available and structured like: [{name: 'Python'}, ...]
    const userSkills = useSelector((state) => state.user.data?.skills || []);

    // --- State ---
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBook, setSelectedBook] = useState(null); // Controls the Modal
    const [isDark, setIsDark] = useState(getInitialTheme); // Dark Mode State

    // --- Dark Mode Effect ---
    useEffect(() => {
        applyTheme(isDark);
    }, [isDark]);

    const toggleTheme = () => {
        setIsDark(prev => !prev);
    };

    // --- Fetch Function ---
    const fetchBooks = useCallback(async (query) => {
        if (!query) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/api/books?query=${encodeURIComponent(query)}`);
            
            // Check for successful response status codes (e.g., 200-299)
            if (!res.ok) throw new Error(`Server connection failed with status: ${res.status}`);

            const data = await res.json();

            if (data.status === 'ok' && Array.isArray(data.books)) {
                setBooks(data.books);
            } else {
                // Handle cases where the API returns 'ok' but no books (or an unexpected format)
                setBooks([]);
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            // Check if it's a TypeError (usually network-related or invalid JSON)
            if (e instanceof TypeError) {
                 setError("Network error or invalid response from backend. Ensure backend is running.");
            } else {
                 setError(e.message || "Could not load books.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Initial Load ---
    useEffect(() => {
        // Only fetch on initial render if no books are loaded
        if (books.length === 0) {
            // Load books based on first skill, or default to 'Python' if no skills
            const defaultQuery = userSkills.length > 0 ? userSkills[0].name : 'Python';
            fetchBooks(defaultQuery);
        }
    // Dependency array optimized: Removed books.length as it causes an infinite loop if fetch fails
    }, [userSkills, fetchBooks]); 

    // --- Search Handlers ---
    const handleManualSearch = () => {
        if (searchTerm.trim()) fetchBooks(searchTerm);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleManualSearch();
    };

    // --- Download Handler ---
    const handleDownload = () => {
        if (!selectedBook || !selectedBook.download) return;

        // Open download in new tab without leaving the current page
        const link = document.createElement('a');
        link.href = selectedBook.download;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Tailwind CSS classes updated for Dark Mode:
    // - Root div: `dark:bg-gray-900`
    // - Heading: `dark:text-white`
    // - Input: `dark:bg-gray-700 dark:border-gray-600 dark:text-white`
    // - Book Grid Container: `dark:bg-gray-800 dark:border-gray-700`
    // - Info Text: `dark:text-gray-400 dark:bg-gray-800`
    // - Book Card: `dark:bg-gray-900 dark:border-gray-700`
    // - Modal: `dark:bg-gray-800`

    return (
        <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="relative max-w-7xl mx-auto">
                {/* --- HEADER & THEME TOGGLE --- */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">📚 Free Books (dBooks)</h2>
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
                
                {/* --- SEARCH BAR --- */}
                <div className="flex gap-3 mb-8">
                    <input 
                        type="text" 
                        placeholder="Search by topic (e.g. Java, Algorithms)..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <button 
                        onClick={handleManualSearch}
                        disabled={loading || !searchTerm.trim()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-md transition-colors"
                    >
                        {loading ? '...' : 'Search'}
                    </button>
                </div>

                {/* --- BOOK GRID --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-gray-700 dark:text-gray-300">
                            {searchTerm ? (
                                <span>Results for: <strong>{searchTerm}</strong></span>
                            ) : (
                                <span>Recommended for: <strong>{userSkills.length > 0 ? userSkills[0].name : 'Technology'}</strong></span>
                            )}
                        </p>
                        <button 
                            onClick={() => { setSearchTerm(''); fetchBooks('Technology'); }} 
                            className="text-sm text-blue-500 hover:text-blue-400 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Reset to Default
                        </button>
                    </div>
                    
                    {loading && <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading library...</div>}
                    {error && <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded text-center dark:bg-red-900 dark:text-red-300 dark:border-red-700">{error}</div>}

                    {!loading && !error && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {books.length > 0 ? books.map(book => (
                                <div 
                                    key={book.id} 
                                    className="bg-white p-4 border rounded-lg hover:shadow-xl transition-shadow flex flex-col items-center text-center dark:bg-gray-900 dark:border-gray-700"
                                >
                                    <div className="h-48 w-36 mb-3 overflow-hidden rounded shadow-md relative bg-gray-100 dark:bg-gray-700">
                                        <img 
                                            src={book.image} 
                                            className="h-full w-full object-contain hover:scale-105 transition-transform duration-300" 
                                            alt={book.title} 
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x200?text=No+Image'; }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <h4 className="font-bold text-sm line-clamp-2 mb-1 text-gray-800 dark:text-gray-200" title={book.title}>{book.title}</h4>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-1 dark:text-gray-400">{book.authors}</p>
                                    
                                    <button 
                                        onClick={() => setSelectedBook(book)}
                                        className="mt-auto bg-blue-50 text-blue-700 px-4 py-2 rounded text-xs font-semibold hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 w-full transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            )) : (
                                <div className="col-span-full text-center py-10 text-gray-500 border-2 border-dashed rounded-lg dark:text-gray-400 dark:border-gray-600">
                                    No books found for this query. Try a different topic.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* --- MODAL POPUP --- */}
                {selectedBook && (
                    <div 
                        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedBook(null)} // Close on outside click
                    >
                        <div 
                            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] dark:bg-gray-800"
                            onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
                        >
                            
                            <div className="bg-gray-50 p-4 border-b flex justify-between items-center dark:bg-gray-900 dark:border-gray-700">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-4">{selectedBook.title}</h3>
                                <button onClick={() => setSelectedBook(null)} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-2xl leading-none">&times;</button>
                            </div>

                            <div className="p-6 flex gap-6 overflow-y-auto">
                                <img 
                                    src={selectedBook.image} 
                                    className="w-32 h-48 object-cover rounded shadow border flex-shrink-0"
                                    alt="Cover"
                                    onError={(e) => { e.target.src = 'https://placehold.co/150x200?text=No+Image'; }}
                                />
                                <div>
                                    <p className="text-sm text-gray-600 font-bold mb-1 dark:text-gray-400">{selectedBook.authors}</p>
                                    <p className="text-xs text-gray-500 mb-3 italic dark:text-gray-500">{selectedBook.subtitle}</p>
                                    <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">
                                        {selectedBook.description}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 dark:bg-gray-900 dark:border-gray-700">
                                <button 
                                    onClick={() => setSelectedBook(null)} 
                                    className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDownload}
                                    disabled={!selectedBook.download}
                                    className="px-4 py-2 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:bg-gray-500 flex items-center gap-2 shadow-sm transition-colors"
                                >
                                    <span>Download PDF</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Books;