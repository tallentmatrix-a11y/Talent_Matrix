import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Ensure this matches your backend URL (no trailing slash)
const API_BASE = "https://talentmatrix-backend.onrender.com";

// ==========================================
//  ASYNCHRONOUS THUNKS (API Interactions)
// ==========================================

// 1. Fetch User Data (Profile + Skills + Projects + Semesters)
export const fetchUserData = createAsyncThunk('user/fetchData', async (userId) => {
    // A. Fetch Basic Profile
    const res = await fetch(`${API_BASE}/api/signup/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    const data = await res.json();

    // B. Parse Semesters from columns (gpa_sem_1, etc.)
    const semesters = {};
    for (let i = 1; i <= 8; i++) {
        if (data[`gpa_sem_${i}`]) semesters[`Semester ${i}`] = data[`gpa_sem_${i}`];
    }

    // C. Fetch Skills from DB
    // We use the specific route from Code One to ensure we get the full skill objects (ids, etc.)
    let skills = [];
    try {
        const skillRes = await fetch(`${API_BASE}/api/signup/${userId}/skills`);
        if (skillRes.ok) {
            skills = await skillRes.json();
        }
    } catch (e) { console.error("Skills fetch error", e); }

    // D. Fetch Manual Projects
    let manualProjects = [];
    try {
        const projRes = await fetch(`${API_BASE}/api/projects/${userId}`);
        if (projRes.ok) {
            const projData = await projRes.json();
            manualProjects = projData.map(p => ({ ...p, source: 'manual' }));
        }
    } catch (e) { console.warn("Projects fetch skipped or failed"); }

    // Return combined data structure
    return {
        id: data.id,
        name: data.full_name,
        email: data.email,
        rollNumber: data.roll_number || '',
        photoDataUrl: data.profile_image_url || '',
        resumeRemoteUrl: data.resume_url || '',
        semesters,
        mobileNumber: data.mobile_number || '',
        githubUsername: data.github_username || '',
        linkedinUrl: data.linkedin_url || '',
        leetcodeUrl: data.leetcode_url || '',
        hackerrankUrl: data.hackerrank_url || '',
        codechefUrl: data.codechef_url || '',
        codeforcesUrl: data.codeforces_url || '',
        skills: skills,
        appliedJobs: [],
        manualProjects,
        leetcodeStats: null,
        codingStats: {} // Placeholder from Code Two
    };
});

// 2. Add Skill to Backend
export const addSkillToBackend = createAsyncThunk('user/addSkillToBackend', async (skillData, { rejectWithValue }) => {
    try {
        // Route: POST /api/signup/skills
        const response = await fetch(`${API_BASE}/api/signup/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skillData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return rejectWithValue(errorData.error || 'Failed to save skill');
        }

        // Returns the created skill (including the new UUID)
        const savedSkill = await response.json();
        return savedSkill;
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// 3. Delete Skill from Backend
export const deleteSkillBackend = createAsyncThunk('user/deleteSkillBackend', async (skillId, { rejectWithValue }) => {
    try {
        // Route: DELETE /api/signup/skills/:id
        const response = await fetch(`${API_BASE}/api/signup/skills/${skillId}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete skill');

        return skillId; // Return ID so we can remove it from Redux state
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// 4. Update Profile Text Data
export const updateUserProfile = createAsyncThunk('user/update', async ({ userId, data }) => {
    // Convert camelCase keys to snake_case for the backend
    const payload = {};
    for (const key in data) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        payload[snakeKey] = data[key];
    }

    const res = await fetch(`${API_BASE}/api/signup/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Update failed');
    return data;
});

// 5. Upload Resume File
export const uploadResumeFile = createAsyncThunk('user/uploadResume', async ({ userId, file }) => {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await fetch(`${API_BASE}/api/signup/${userId}/resume`, { method: 'PUT', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    return data.resumeUrl || data.resume_url;
});

// 6. Upload Profile Image
export const uploadProfileImage = createAsyncThunk('user/uploadProfileImage', async ({ userId, file }) => {
    const formData = new FormData();
    formData.append('profileImage', file);
    const res = await fetch(`${API_BASE}/api/signup/${userId}/profile-image`, { method: 'PUT', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to upload image");
    return data.imageUrl;
});

// 7. Save Applied Job
export const saveJob = createAsyncThunk('user/saveJob', async (jobData, { rejectWithValue }) => {
    try {
        const response = await fetch(`${API_BASE}/api/applied-jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return rejectWithValue(errorData.error || `Failed to save job with status: ${response.status}`);
        }
        return jobData;
    } catch (error) {
        return rejectWithValue(error.message || "Network error: Could not save job.");
    }
});

// 8. Fetch GitHub Repos
export const fetchGithubRepos = createAsyncThunk('user/fetchGithub', async (username) => {
    if (!username) return [];
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    if (!res.ok) throw new Error("GitHub User not found");
    const repos = await res.json();
    return repos
        .filter((repo) => typeof repo.description === 'string' && repo.description.trim().length > 0)
        .map((repo) => ({
            source: 'github',
            id: repo.id,
            title: repo.name,
            link: repo.html_url,
            description: repo.description.trim(),
            tags: repo.language || "Code",
        }));
});

// 9. Fetch LeetCode Stats
export const fetchLeetCodeStats = createAsyncThunk('user/fetchLeetCode', async (username) => {
    if (!username) return null;
    const res = await fetch(`${API_BASE}/api/leetcode/${username}`);
    if (!res.ok) throw new Error("LeetCode User not found");
    const data = await res.json();
    return data;
});


// ==========================================
//  SLICE DEFINITION
// ==========================================

const userSlice = createSlice({
    name: 'user',
    initialState: {
        data: {
            id: '', name: '', photoDataUrl: '', resumeRemoteUrl: '',
            skills: [], appliedJobs: [], manualProjects: [], githubProjects: [], semesters: {},
            leetcodeStats: null,
            githubUsername: '', linkedinUrl: '', mobileNumber: '',
            leetcodeUrl: '', hackerrankUrl: '', codechefUrl: '', codeforcesUrl: ''
        },
        status: 'idle', // For fetching user data
        skillStatus: 'idle', // For adding/deleting skills
        githubStatus: 'idle',
        leetcodeStatus: 'idle',
        saveJobStatus: 'idle',
        error: null,
    },
    reducers: {
        logout: (state) => {
            localStorage.removeItem('userId');
            state.data = {};
            state.status = 'idle';
        },
        // Synchronous reducers for immediate UI updates
        updateLocalPhoto: (state, action) => {
            state.data.photoDataUrl = action.payload;
        },
        addAppliedJob: (state, action) => {
            const isDuplicate = state.data.appliedJobs.some(job => job.job_url === action.payload.job_url);
            if (!isDuplicate) state.data.appliedJobs.push(action.payload);
        },
        addManualProject: (state, action) => {
            // Adds to local state. Note: Requires backend implementation to persist.
            state.data.manualProjects.unshift({ ...action.payload, source: 'manual' });
        },
        removeManualProject: (state, action) => {
            state.data.manualProjects = state.data.manualProjects.filter(p => p.id !== action.payload);
        },
        updateSemester: (state, action) => {
            const { name, grade } = action.payload;
            state.data.semesters[name] = parseFloat(grade);
        }
    },
    extraReducers: (builder) => {
        builder
            // 1. Fetch User Data
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = { ...state.data, ...action.payload };
            })

            // 2. Add Skill (Async Backend Sync)
            .addCase(addSkillToBackend.pending, (state) => { state.skillStatus = 'loading'; })
            .addCase(addSkillToBackend.fulfilled, (state, action) => {
                state.skillStatus = 'succeeded';
                state.data.skills.push(action.payload); // Add the backend-confirmed skill
            })
            .addCase(addSkillToBackend.rejected, (state, action) => {
                state.skillStatus = 'failed';
                state.error = action.payload;
            })

            // 3. Delete Skill (Async Backend Sync)
            .addCase(deleteSkillBackend.fulfilled, (state, action) => {
                // Remove skill by ID
                state.data.skills = state.data.skills.filter(s => s.id !== action.payload);
            })

            // 4. Update Profile Text
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.data = { ...state.data, ...action.payload };
            })

            // 5. Upload Resume
            .addCase(uploadResumeFile.fulfilled, (state, action) => {
                state.data.resumeRemoteUrl = action.payload;
            })

            // 6. Upload Profile Image
            .addCase(uploadProfileImage.fulfilled, (state, action) => {
                state.data.photoDataUrl = action.payload;
            })

            // 7. Save Job
            .addCase(saveJob.pending, (state) => { state.saveJobStatus = 'loading'; })
            .addCase(saveJob.fulfilled, (state, action) => {
                state.saveJobStatus = 'succeeded';
                const isDuplicate = state.data.appliedJobs.some(job => job.job_url === action.payload.job_url);
                if (!isDuplicate) state.data.appliedJobs.push(action.payload);
            })
            .addCase(saveJob.rejected, (state, action) => {
                state.saveJobStatus = 'failed';
                state.error = action.payload;
            })

            // 8. External APIs (Github/LeetCode)
            .addCase(fetchGithubRepos.pending, (state) => { state.githubStatus = 'loading'; })
            .addCase(fetchGithubRepos.fulfilled, (state, action) => {
                state.githubStatus = 'succeeded';
                state.data.githubProjects = action.payload;
            })
            .addCase(fetchGithubRepos.rejected, (state) => { state.githubStatus = 'failed'; })

            .addCase(fetchLeetCodeStats.pending, (state) => { state.leetcodeStatus = 'loading'; })
            .addCase(fetchLeetCodeStats.fulfilled, (state, action) => {
                state.leetcodeStatus = 'succeeded';
                state.data.leetcodeStats = action.payload;
            })
            .addCase(fetchLeetCodeStats.rejected, (state) => { state.leetcodeStatus = 'failed'; });
    }
});

export const {
    logout,
    updateLocalPhoto,
    addAppliedJob,
    addManualProject,
    removeManualProject,
    updateSemester
} = userSlice.actions;

export default userSlice.reducer;