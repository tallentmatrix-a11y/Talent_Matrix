import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Backend URL
const API_BASE = "https://talentmatrix-backend.onrender.com";

// =======================================================
// 1. FETCH USER DATA
// =======================================================
export const fetchUserData = createAsyncThunk('user/fetchData', async (userId) => {
    const res = await fetch(`${API_BASE}/api/signup/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');

    const data = await res.json();

    // Parse semesters
    const semesters = {};
    for (let i = 1; i <= 8; i++) {
        if (data[`gpa_sem_${i}`]) semesters[`Semester ${i}`] = data[`gpa_sem_${i}`];
    }

    // Fetch skills
    let skills = [];
    try {
        const skillRes = await fetch(`${API_BASE}/api/signup/${userId}/skills`);
        if (skillRes.ok) skills = await skillRes.json();
    } catch (e) { console.error("Skills fetch error", e); }

    // Fetch manual projects
    let manualProjects = [];
    try {
        const projRes = await fetch(`${API_BASE}/api/projects/${userId}`);
        if (projRes.ok) {
            const projData = await projRes.json();
            manualProjects = projData.map(p => ({ ...p, source: 'manual' }));
        }
    } catch (e) { console.warn("Projects fetch failed"); }

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
        skills,
        appliedJobs: [],
        manualProjects,
        leetcodeStats: null,
        codingStats: {},
    };
});

// =======================================================
// 2. SKILL CRUD
// =======================================================
export const addSkillToBackend = createAsyncThunk('user/addSkill', async (skillData, { rejectWithValue }) => {
    try {
        const response = await fetch(`${API_BASE}/api/signup/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(skillData)
        });

        if (!response.ok) {
            const error = await response.json();
            return rejectWithValue(error.error || "Failed to save skill");
        }

        return await response.json();
    } catch (err) {
        return rejectWithValue(err.message);
    }
});

export const deleteSkillBackend = createAsyncThunk('user/deleteSkill', async (skillId, { rejectWithValue }) => {
    try {
        const res = await fetch(`${API_BASE}/api/signup/skills/${skillId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
        return skillId;
    } catch (err) {
        return rejectWithValue(err.message);
    }
});

// =======================================================
// 3. PROJECT CRUD
// =======================================================
export const addProjectToBackend = createAsyncThunk('user/addProject', async (projectData, { rejectWithValue }) => {
    try {
        const res = await fetch(`${API_BASE}/api/projects`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projectData)
        });

        if (!res.ok) {
            const error = await res.json();
            return rejectWithValue(error.error || 'Failed to add project');
        }

        const newProject = await res.json();
        return { ...newProject, source: 'manual' };
    } catch (err) {
        return rejectWithValue(err.message);
    }
});

export const deleteProjectFromBackend = createAsyncThunk('user/deleteProject', async (projectId, { rejectWithValue }) => {
    try {
        const res = await fetch(`${API_BASE}/api/projects/${projectId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete");
        return projectId;
    } catch (err) {
        return rejectWithValue(err.message);
    }
});

// =======================================================
// 4. UPDATE PROFILE TEXT
// =======================================================
export const updateUserProfile = createAsyncThunk('user/updateProfile', async ({ userId, data }) => {
    const payload = {};
    for (const key in data) {
        const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
        payload[snake] = data[key];
    }

    const res = await fetch(`${API_BASE}/api/signup/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Update failed");
    return data;
});

// =======================================================
// 5. FILE UPLOADS
// =======================================================
export const uploadResumeFile = createAsyncThunk('user/uploadResume', async ({ userId, file }) => {
    const fd = new FormData();
    fd.append('resume', file);

    const res = await fetch(`${API_BASE}/api/signup/${userId}/resume`, { method: 'PUT', body: fd });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.resumeUrl || data.resume_url;
});

export const uploadProfileImage = createAsyncThunk('user/uploadImage', async ({ userId, file }) => {
    const fd = new FormData();
    fd.append('profileImage', file);

    const res = await fetch(`${API_BASE}/api/signup/${userId}/profile-image`, {
        method: "PUT",
        body: fd
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    return data.imageUrl;
});

// =======================================================
// 6. JOB SAVE
// =======================================================
export const saveJob = createAsyncThunk('user/saveJob', async (jobData, { rejectWithValue }) => {
    try {
        const res = await fetch(`${API_BASE}/api/applied-jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jobData)
        });

        if (!res.ok) {
            const error = await res.json();
            return rejectWithValue(error.error || "Failed to save job");
        }

        return jobData;
    } catch (err) {
        return rejectWithValue(err.message);
    }
});

// =======================================================
// 7. EXTERNAL API FETCHES
// =======================================================
export const fetchGithubRepos = createAsyncThunk('user/github', async (username) => {
    if (!username) return [];

    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    if (!res.ok) throw new Error("GitHub user not found");

    const repos = await res.json();
    return repos
        .filter(r => r.description && r.description.trim())
        .map(r => ({
            source: 'github',
            id: r.id,
            title: r.name,
            link: r.html_url,
            description: r.description.trim(),
            tags: r.language || "Code"
        }));
});

export const fetchLeetCodeStats = createAsyncThunk('user/leetcode', async (username) => {
    if (!username) return null;

    const res = await fetch(`${API_BASE}/api/leetcode/${username}`);
    if (!res.ok) throw new Error("LeetCode user not found");
    return await res.json();
});

// =======================================================
// Slice
// =======================================================
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
        status: 'idle',
        skillStatus: 'idle',
        projectStatus: 'idle',
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
        updateLocalPhoto: (state, action) => {
            state.data.photoDataUrl = action.payload;
        },
        addAppliedJobLocal: (state, action) => {
            const exists = state.data.appliedJobs.some(j => j.job_url === action.payload.job_url);
            if (!exists) state.data.appliedJobs.push(action.payload);
        },
        updateSemesterLocal: (state, action) => {
            const { name, grade } = action.payload;
            state.data.semesters[name] = parseFloat(grade);
        }
    },

    extraReducers: (builder) => {
        builder
            // Fetch user
            .addCase(fetchUserData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = { ...state.data, ...action.payload };
            })

            // Add skill
            .addCase(addSkillToBackend.pending, (state) => { state.skillStatus = 'loading'; })
            .addCase(addSkillToBackend.fulfilled, (state, action) => {
                state.skillStatus = 'succeeded';
                state.data.skills.push(action.payload);
            })
            .addCase(addSkillToBackend.rejected, (state, action) => {
                state.skillStatus = 'failed';
                state.error = action.payload;
            })

            // Delete skill
            .addCase(deleteSkillBackend.fulfilled, (state, action) => {
                state.data.skills = state.data.skills.filter(s => s.id !== action.payload);
            })

            // Add project
            .addCase(addProjectToBackend.pending, (state) => { state.projectStatus = 'loading'; })
            .addCase(addProjectToBackend.fulfilled, (state, action) => {
                state.projectStatus = 'succeeded';
                state.data.manualProjects.unshift(action.payload);
            })
            .addCase(addProjectToBackend.rejected, (state, action) => {
                state.projectStatus = 'failed';
                state.error = action.payload;
            })

            // Delete project
            .addCase(deleteProjectFromBackend.fulfilled, (state, action) => {
                state.data.manualProjects = state.data.manualProjects.filter(p => p.id !== action.payload);
            })

            // Update profile
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.data = { ...state.data, ...action.payload };
            })

            // Upload resume
            .addCase(uploadResumeFile.fulfilled, (state, action) => {
                state.data.resumeRemoteUrl = action.payload;
            })

            // Upload profile image
            .addCase(uploadProfileImage.fulfilled, (state, action) => {
                state.data.photoDataUrl = action.payload;
            })

            // Save job
            .addCase(saveJob.pending, (state) => { state.saveJobStatus = 'loading'; })
            .addCase(saveJob.fulfilled, (state, action) => {
                state.saveJobStatus = 'succeeded';
                const exists = state.data.appliedJobs.some(j => j.job_url === action.payload.job_url);
                if (!exists) state.data.appliedJobs.push(action.payload);
            })

            // GitHub repos
            .addCase(fetchGithubRepos.fulfilled, (state, action) => {
                state.githubStatus = 'succeeded';
                state.data.githubProjects = action.payload;
            })

            // LeetCode stats
            .addCase(fetchLeetCodeStats.fulfilled, (state, action) => {
                state.leetcodeStatus = 'succeeded';
                state.data.leetcodeStats = action.payload;
            });
    }
});

export const {
    logout,
    updateLocalPhoto,
    addAppliedJobLocal,
    updateSemesterLocal
} = userSlice.actions;

export default userSlice.reducer;
