// src/redux/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = "https://talentmatrix-backend.onrender.com";

async function parseJsonSafe(res) {
  try { return await res.json(); }
  catch { return null; }
}

/* ===================== THUNKS ===================== */

/** 1) Fetch user profile + semesters + skills + manual projects */
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) throw new Error('Missing userId');
      const res = await fetch(`${API_BASE}/api/signup/${userId}`);
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        throw new Error(err?.error || `Failed to fetch user (${res.status})`);
      }
      const data = await res.json();

      const semesters = {};
      for (let i = 1; i <= 8; i++) {
        const key = `gpa_sem_${i}`;
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          semesters[`Semester ${i}`] = data[key];
        }
      }

      // skills
      let skills = [];
      try {
        const sres = await fetch(`${API_BASE}/api/signup/${userId}/skills`);
        if (sres.ok) skills = await sres.json();
      } catch (e) { /* ignore */ }

      // manual projects
      let manualProjects = [];
      try {
        const pres = await fetch(`${API_BASE}/api/projects/${userId}`);
        if (pres.ok) {
          const projData = await pres.json();
          manualProjects = (projData || []).map(p => ({ ...p, source: 'manual' }));
        }
      } catch (e) { /* ignore */ }

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
        codingStats: {}
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 2) SKILL CRUD */
export const addSkillToBackend = createAsyncThunk(
  'user/addSkillToBackend',
  async (skillData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/signup/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData)
      });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to save skill (${res.status})`);
      }
      return await res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteSkillBackend = createAsyncThunk(
  'user/deleteSkillBackend',
  async (skillId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/signup/skills/${skillId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to delete skill (${res.status})`);
      }
      return skillId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 3) PROJECT CRUD */
export const addProjectToBackend = createAsyncThunk(
  'user/addProjectToBackend',
  async (projectData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to add project (${res.status})`);
      }
      const newProj = await res.json();
      return { ...newProj, source: 'manual' };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteProjectFromBackend = createAsyncThunk(
  'user/deleteProjectFromBackend',
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to delete project (${res.status})`);
      }
      return projectId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 4) UPDATE PROFILE TEXT */
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async ({ userId, data }, { rejectWithValue }) => {
    try {
      const payload = {};
      for (const key in data) {
        const snake = key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`);
        payload[snake] = data[key];
      }
      const res = await fetch(`${API_BASE}/api/signup/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Update failed (${res.status})`);
      }
      // return original camelCase data so UI reducer can merge
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 5) FILE UPLOADS */
export const uploadResumeFile = createAsyncThunk(
  'user/uploadResumeFile',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch(`${API_BASE}/api/signup/${userId}/resume`, { method: 'PUT', body: fd });
      const data = await parseJsonSafe(res);
      if (!res.ok) return rejectWithValue(data?.error || `Upload failed (${res?.status})`);
      return data?.resumeUrl || data?.resume_url || null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const uploadProfileImage = createAsyncThunk(
  'user/uploadProfileImage',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('profileImage', file);
      const res = await fetch(`${API_BASE}/api/signup/${userId}/profile-image`, { method: 'PUT', body: fd });
      const data = await parseJsonSafe(res);
      if (!res.ok) return rejectWithValue(data?.error || `Upload failed (${res?.status})`);
      return data?.imageUrl || data?.profile_image_url || null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 6) JOB SAVE */
export const saveJob = createAsyncThunk(
  'user/saveJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/applied-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to save job (${res.status})`);
      }
      return jobData;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 7) GITHUB REPOS (external) */
export const fetchGithubRepos = createAsyncThunk(
  'user/fetchGithubRepos',
  async (username, { rejectWithValue }) => {
    if (!username) return [];
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=20`);
      if (!res.ok) return [];
      const repos = await res.json();
      // normalize
      return (repos || [])
        .filter(r => r && r.name)
        .map(r => ({
          id: r.id,
          title: r.name,
          description: r.description || '',
          link: r.html_url,
          tags: r.language || '',
          source: 'github'
        }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** 8) LeetCode fetch (backend endpoint) - normalized */
export const fetchLeetCodeStats = createAsyncThunk(
  'user/fetchLeetCodeStats',
  async (usernameOrUrl, { rejectWithValue }) => {
    try {
      if (!usernameOrUrl) return null;
      let username = usernameOrUrl;
      if (username.includes('leetcode.com')) {
        username = username.replace(/\/+$/, '').split('/').pop();
      }
      username = (username || '').trim();
      if (!username) return null;

      const res = await fetch(`${API_BASE}/api/leetcode/${username}`);
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        throw new Error(err?.error || `LeetCode fetch failed (${res.status})`);
      }
      const raw = await res.json();

      const normalized = {
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        topics: []
      };

      normalized.total =
        raw?.totalSolved ??
        raw?.total ??
        raw?.total_solved ??
        raw?.totalSolvedQuestions ??
        raw?.total_problems_solved ??
        raw?.total_solved_questions ??
        0;

      normalized.easy =
        raw?.easy ??
        raw?.easySolved ??
        raw?.easy_count ??
        raw?.easy_solved ??
        0;

      normalized.medium =
        raw?.medium ??
        raw?.mediumSolved ??
        raw?.medium_count ??
        raw?.medium_solved ??
        0;

      normalized.hard =
        raw?.hard ??
        raw?.hardSolved ??
        raw?.hard_count ??
        raw?.hard_solved ??
        0;

      // topics
      if (Array.isArray(raw?.topics) && raw.topics.length > 0) {
        normalized.topics = raw.topics.map(t => ({
          topicName: t.topicName ?? t.name ?? t.topic ?? t.key ?? 'Unknown',
          solved: Number(t.solved ?? t.solvedCount ?? t.count ?? t.total ?? 0)
        }));
      } else if (raw?.topics_map && typeof raw.topics_map === 'object') {
        normalized.topics = Object.entries(raw.topics_map).map(([k, v]) => ({ topicName: k, solved: Number(v) || 0 }));
      } else if (Array.isArray(raw?.topicStats) && raw.topicStats.length > 0) {
        normalized.topics = raw.topicStats.map(t => ({ topicName: t.name ?? t.topic ?? 'Unknown', solved: Number(t.solved ?? t.count ?? 0) }));
      } else if (raw?.topicsSolved && typeof raw.topicsSolved === 'object') {
        normalized.topics = Object.entries(raw.topicsSolved).map(([k, v]) => ({ topicName: k, solved: Number(v) || 0 }));
      } else {
        // try to discover topic-like arrays in response
        const maybe = [];
        for (const k of Object.keys(raw || {})) {
          const val = raw[k];
          if (Array.isArray(val)) {
            val.forEach(item => {
              if (item && typeof item === 'object') {
                const name = item.topicName ?? item.name ?? item.title ?? item.key;
                const solved = item.solved ?? item.count ?? item.total ?? item.questionsSolved;
                if (name && (solved !== undefined)) maybe.push({ topicName: name, solved: Number(solved) || 0 });
              }
            });
          }
        }
        if (maybe.length) normalized.topics = maybe.slice(0, 50);
      }

      normalized.total = Number(normalized.total) || 0;
      normalized.easy = Number(normalized.easy) || 0;
      normalized.medium = Number(normalized.medium) || 0;
      normalized.hard = Number(normalized.hard) || 0;
      if (!normalized.total && (normalized.easy || normalized.medium || normalized.hard)) {
        normalized.total = normalized.easy + normalized.medium + normalized.hard;
      }

      return normalized;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* ===================== SLICE ===================== */

const initialState = {
  data: {
    id: '',
    name: '',
    email: '',
    rollNumber: '',
    photoDataUrl: '',
    resumeRemoteUrl: '',
    semesters: {},
    skills: [],
    manualProjects: [],
    githubProjects: [],
    appliedJobs: [],
    leetcodeStats: null,
    githubUsername: '',
    linkedinUrl: '',
    mobileNumber: '',
    leetcodeUrl: '',
    hackerrankUrl: '',
    codechefUrl: '',
    codeforcesUrl: ''
  },
  status: 'idle',
  skillStatus: 'idle',
  projectStatus: 'idle',
  githubStatus: 'idle',
  leetcodeStatus: 'idle',
  saveJobStatus: 'idle',
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('userId');
      state.data = initialState.data;
      state.status = 'idle';
    },
    addSkill(state, action) {
      state.data.skills = state.data.skills || [];
      state.data.skills.push(action.payload);
    },
    updateSemester(state, action) {
      const { name, grade } = action.payload || {};
      state.data.semesters = state.data.semesters || {};
      if (name) state.data.semesters[name] = parseFloat(grade);
    },
    updateLocalPhoto(state, action) {
      state.data.photoDataUrl = action.payload;
    },
    addAppliedJobLocal(state, action) {
      const job = action.payload;
      if (!job) return;
      state.data.appliedJobs = state.data.appliedJobs || [];
      const exists = state.data.appliedJobs.some(j => j.job_url === job.job_url);
      if (!exists) state.data.appliedJobs.push(job);
    }
  },
  extraReducers: builder => {
    builder
      // fetch user
      .addCase(fetchUserData.pending, state => { state.status = 'loading'; state.error = null; })
      .addCase(fetchUserData.fulfilled, (state, action) => { state.status = 'succeeded'; state.data = { ...state.data, ...action.payload }; })
      .addCase(fetchUserData.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || action.error?.message; })

      // add skill
      .addCase(addSkillToBackend.pending, state => { state.skillStatus = 'loading'; state.error = null; })
      .addCase(addSkillToBackend.fulfilled, (state, action) => {
        state.skillStatus = 'succeeded';
        state.data.skills = state.data.skills || [];
        state.data.skills.push(action.payload);
      })
      .addCase(addSkillToBackend.rejected, (state, action) => { state.skillStatus = 'failed'; state.error = action.payload || action.error?.message; })

      // delete skill
      .addCase(deleteSkillBackend.pending, state => { state.skillStatus = 'loading'; })
      .addCase(deleteSkillBackend.fulfilled, (state, action) => {
        state.skillStatus = 'succeeded';
        state.data.skills = (state.data.skills || []).filter(s => s.id !== action.payload);
      })
      .addCase(deleteSkillBackend.rejected, (state, action) => { state.skillStatus = 'failed'; state.error = action.payload || action.error?.message; })

      // add project
      .addCase(addProjectToBackend.pending, state => { state.projectStatus = 'loading'; })
      .addCase(addProjectToBackend.fulfilled, (state, action) => {
        state.projectStatus = 'succeeded';
        state.data.manualProjects = state.data.manualProjects || [];
        state.data.manualProjects.unshift(action.payload);
      })
      .addCase(addProjectToBackend.rejected, (state, action) => { state.projectStatus = 'failed'; state.error = action.payload || action.error?.message; })

      // delete project
      .addCase(deleteProjectFromBackend.pending, state => { state.projectStatus = 'loading'; })
      .addCase(deleteProjectFromBackend.fulfilled, (state, action) => {
        state.projectStatus = 'succeeded';
        state.data.manualProjects = (state.data.manualProjects || []).filter(p => p.id !== action.payload);
      })
      .addCase(deleteProjectFromBackend.rejected, (state, action) => { state.projectStatus = 'failed'; state.error = action.payload || action.error?.message; })

      // update profile
      .addCase(updateUserProfile.pending, state => { state.status = 'loading'; state.error = null; })
      .addCase(updateUserProfile.fulfilled, (state, action) => { state.status = 'succeeded'; state.data = { ...state.data, ...action.payload }; })
      .addCase(updateUserProfile.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || action.error?.message; })

      // uploads
      .addCase(uploadResumeFile.fulfilled, (state, action) => { state.data.resumeRemoteUrl = action.payload; })
      .addCase(uploadProfileImage.fulfilled, (state, action) => { state.data.photoDataUrl = action.payload; })

      // save job
      .addCase(saveJob.pending, state => { state.saveJobStatus = 'loading'; })
      .addCase(saveJob.fulfilled, (state, action) => {
        state.saveJobStatus = 'succeeded';
        state.data.appliedJobs = state.data.appliedJobs || [];
        const exists = state.data.appliedJobs.some(j => j.job_url === action.payload.job_url);
        if (!exists) state.data.appliedJobs.push(action.payload);
      })
      .addCase(saveJob.rejected, (state, action) => { state.saveJobStatus = 'failed'; state.error = action.payload || action.error?.message; })

      // github
      .addCase(fetchGithubRepos.pending, state => { state.githubStatus = 'loading'; })
      .addCase(fetchGithubRepos.fulfilled, (state, action) => { state.githubStatus = 'succeeded'; state.data.githubProjects = action.payload; })
      .addCase(fetchGithubRepos.rejected, (state, action) => { state.githubStatus = 'failed'; state.error = action.payload || action.error?.message; })

      // leetcode
      .addCase(fetchLeetCodeStats.pending, state => { state.leetcodeStatus = 'loading'; })
      .addCase(fetchLeetCodeStats.fulfilled, (state, action) => { state.leetcodeStatus = 'succeeded'; state.data.leetcodeStats = action.payload; })
      .addCase(fetchLeetCodeStats.rejected, (state, action) => { state.leetcodeStatus = 'failed'; state.error = action.payload || action.error?.message; });
  }
});

/* ===================== EXPORTS ===================== */

export const {
  logout,
  addSkill,
  updateSemester,
  updateLocalPhoto,
  addAppliedJobLocal
} = userSlice.actions;

export default userSlice.reducer;
