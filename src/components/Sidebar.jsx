import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, uploadProfileImage } from '../redux/userSlice';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const profileUploadRef = useRef(null);
  
  // Initialize state based on localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const user = useSelector((state) => state.user.data);

  // Effect to apply the class and save to localStorage whenever isDarkMode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && user.id) {
      try {
        await dispatch(uploadProfileImage({ userId: user.id, file })).unwrap();
      } catch (error) {
        console.error("Failed to upload profile photo:", error);
        alert("Failed to upload photo. Please try again.");
      }
    }
  };

  const isActive = (path) => {
    if (path === 'home') return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    return location.pathname.includes(path);
  };

  const navItems = [
    'home', 'jobs', 'applied', 'books', 'recommendation', 
    'resume', 'analytics', 'update-profile'
  ];

  return (
    <aside className={`
      w-[255px] h-screen sticky top-0 p-6 flex flex-col items-center transition-colors duration-300
      bg-gradient-to-b from-[#1e3a8a] to-[#1f40af] text-white
      dark:from-slate-900 dark:to-slate-900 dark:text-gray-100 dark:border-r dark:border-slate-800
    `}>
      <div className="text-center mb-6 w-full">
        <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-white dark:border-slate-700 mx-auto mb-3 bg-white relative group transition-colors">
          <img
            src={user.photoDataUrl || 'https://via.placeholder.com/120'}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <div 
            onClick={() => profileUploadRef.current?.click()}
            className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
          >
            <span className="text-xs text-white font-bold">Edit</span>
          </div>
        </div>

        <input type="file" ref={profileUploadRef} accept="image/*" className="hidden" onChange={handlePhotoUpload} />

        <button
          onClick={() => profileUploadRef.current?.click()}
          className="mt-2 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
        >
          Change Photo
        </button>

        <div className="font-bold text-base mt-3">{user.name || "User"}</div>
        <div className="text-sm opacity-90 mt-1 break-words">{user.email}</div>
      </div>

      <nav className="w-full flex flex-col gap-2 mb-auto overflow-y-auto custom-scrollbar">
        {navItems.map((section) => (
          <button
            key={section}
            onClick={() => navigate(section === 'home' ? '' : section)}
            className={`w-full text-left px-4 py-3 rounded-md font-medium transition-colors duration-200 
              ${isActive(section) 
                ? 'bg-blue-700 dark:bg-slate-800 border-l-4 border-white dark:border-blue-500' 
                : 'bg-blue-800/50 hover:bg-blue-700 dark:bg-slate-800/30 dark:hover:bg-slate-800'
              }`}
          >
            {section.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </button>
        ))}
      </nav>

      <div className="w-full flex flex-col gap-2 mt-4">
        <button onClick={handleLogout} className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-md font-semibold transition-colors">
          Logout
        </button>
        <button
          onClick={toggleDarkMode}
          className="w-full bg-blue-900 hover:bg-blue-950 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-md font-semibold transition-colors border border-transparent dark:border-slate-700"
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;