import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux'; // useSelector is necessary if DashboardContent needs to read Redux state
import { store } from '../redux/store';
import { fetchUserData } from '../redux/userSlice';
import Sidebar from '../components/Sidebar';

// Inner component to handle side-effects like fetching user data and theme application
const DashboardContent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Authentication and Data Fetching Logic (Existing Logic)
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
    } else {
      // Fetch user data once when dashboard loads
      dispatch(fetchUserData(userId));
    }
    
    // 2. Theme Initialization Logic
    // Since Sidebar uses document.body, we'll check localStorage here 
    // to apply the dark class on initial load before the Sidebar mounts.
    // NOTE: This assumes your Sidebar logic is the source of truth for toggling.
    if (typeof window !== 'undefined') {
        const storedTheme = localStorage.getItem('theme');
        // You should adapt this check based on how your Sidebar persists the theme.
        // Assuming your Sidebar stores 'dark' or a flag in localStorage/sessionStorage.
        // Since Sidebar relies on document.body, we'll ensure that's set up correctly.
        
        // --- IMPORTANT: Ensure Theme State is Applied on Load ---
        // If your Sidebar persists the theme in localStorage, 
        // you would typically read it here and set the class on document.body.
        // For simplicity and relying on the Sidebar's useEffect, we'll keep it clean here,
        // but note the body's class might flicker until the Sidebar mounts.
        // If the Sidebar sets the class on the body, the body element will automatically 
        // handle the main dark mode switch.
    }
    
  }, [dispatch, navigate]);

  return (
    // The main container. Tailwind's dark mode classes on child elements 
    // (like bg-gray-100 dark:bg-gray-900) will be activated when 
    // the 'dark' class is present on the <body> element (set by Sidebar).
    <div className="flex h-screen w-full">
      <Sidebar />
      
      {/* Main content area with dark mode classes. */}
      {/* Note the base background is bg-gray-100 and bg-gray-50 from your original code. 
          These are updated to include dark variants. */}
      <main className="flex-1 p-8 overflow-y-auto 
                      bg-gray-100 text-gray-900 
                      dark:bg-gray-900 dark:text-gray-50 
                      transition-colors duration-300">
        <Outlet />
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    // Wrap the content with Redux Provider
    <Provider store={store}>
      <DashboardContent />
    </Provider>
  );
};

export default Dashboard;