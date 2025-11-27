import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE = "https://talentmatrix-backend.onrender.com";

/* =======================================================
   Helper: safe JSON parse for responses (optional)
   ======================================================= */
async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* =======================================================
   Thunks
   ======================================================= */

/** Fetch complete user profile (profile + semesters + skills + manual projects) */
export const fetchUserData = createAsyncThunk(
  'user/fetchUserData',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/signup/${userId}`);
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        throw new Error(err?.error || `Failed to fetch user (${res.status})`);
      }
      const data = await res.json();

      // Parse semesters
      const semesters = {};
      for (let i = 1; i <= 8; i++) {
        if (data[`gpa_sem_${i}`] !== undefined && data[`gpa_sem_${i}`] !== null) {
          semesters[`Semester ${i}`] = data[`gpa_sem_${i}`];
        }
      }

      // Fetch skills (safe)
      let skills = [];
      try {
        const sres = await fetch(`${API_BASE}/api/signup/${userId}/skills`);
        if (sres.ok) skills = await sres.json();
      } catch (e) { /* ignore */ }

      // Fetch manual projects (safe)
      let manualProjects = [];
      try {
        const pres = await fetch(`${API_BASE}/api/projects/${userId}`);
        if (pres.ok) {
          const projData = await pres.json();
          manualProjects = projData.map(p => ({ ...p, source: 'manual' }));
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
        manualProjects,
        appliedJobs: [],
        githubProjects: [],
        leetcodeStats: null,
        codingStats: {}
      };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Add skill (backend) — maps to backend expected keys */
export const addSkillToBackend = createAsyncThunk(
  'user/addSkillToBackend',
  async (skillData, { rejectWithValue }) => {
    try {
      // Map keys to backend naming if needed
      const payload = {
        // backend may expect studentId and skillName, but accept variations — map both common forms
        studentId: skillData.student_id ?? skillData.studentId ?? skillData.studentId,
        skillName: skillData.skill_name ?? skillData.skillName ?? skillData.name ?? skillData.skill_name,
        proficiency: skillData.proficiency ?? skillData.level ?? 'Beginner',
        tags: skillData.tags ?? ''
      };

      const res = await fetch(`${API_BASE}/api/signup/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to save skill (${res.status})`);
      }
      const saved = await res.json();
      return saved;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Delete skill (backend) */
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

/** Add manual project — map to backend expected keys */
export const addProjectToBackend = createAsyncThunk(
  'user/addProjectToBackend',
  async (projectData, { rejectWithValue }) => {
    try {
      // Map fields to backend's expected keys (studentId, title, description, projectLink, tags)
      const payload = {
        studentId: projectData.student_id ?? projectData.studentId ?? projectData.studentId,
        title: projectData.title ?? projectData.name ?? '',
        description: projectData.description ?? projectData.desc ?? '',
        projectLink: projectData.link ?? projectData.projectLink ?? '',
        tags: projectData.tags ?? ''
      };

      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

/** Delete project (backend) */
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

/** Upload resume (file) */
export const uploadResumeFile = createAsyncThunk(
  'user/uploadResumeFile',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch(`${API_BASE}/api/signup/${userId}/resume`, { method: 'PUT', body: fd });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to upload resume (${res.status})`);
      }
      const data = await res.json();
      return data.resumeUrl ?? data.resume_url ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Upload profile image (file) */
export const uploadProfileImage = createAsyncThunk(
  'user/uploadProfileImage',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('profileImage', file);
      const res = await fetch(`${API_BASE}/api/signup/${userId}/profile-image`, { method: 'PUT', body: fd });
      if (!res.ok) {
        const err = await parseJsonSafe(res);
        return rejectWithValue(err?.error || `Failed to upload image (${res.status})`);
      }
      const data = await res.json();
      return data.imageUrl ?? data.profile_image_url ?? null;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Save applied job */
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

/** Fetch GitHub repos (external) */
export const fetchGithubRepos = createAsyncThunk(
  'user/fetchGithubRepos',
  async (username, { rejectWithValue }) => {
    if (!username) return [];
    try {
      const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
      if (!res.ok) return [];
      const repos = await res.json();
      return repos
        .filter(r => r && r.name)
        .map(r => ({
          id: r.id,
          title: r.name,
          description: r.description ?? '',
          link: r.html_url,
          tags: r.language ?? '',
          source: 'github'
        }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Fetch LeetCode stats — robust to URL or username and tolerant of empty responses */
export const fetchLeetCodeStats = createAsyncThunk(
  'user/fetchLeetCodeStats',
  async (usernameOrUrl, { rejectWithValue }) => {
    try {
      if (!usernameOrUrl) return null;

      // Accept either username or full URL; extract username if url given
      let username = usernameOrUrl;
      if (typeof username === 'string' && username.includes('leetcode.com')) {
        username = username.replace(/\/+$/, '');
        const parts = username.split('/');
        username = parts[parts.length - 1] || '';
      }
      username = (username || '').trim();
      if (!username) return null;

      const res = await fetch(`${API_BASE}/api/leetcode/${username}`);
      if (!res.ok) {
        // allow the UI to handle "not found" gracefully
        const err = await parseJsonSafe(res);
        throw new Error(err?.error || `LeetCode fetch failed (${res.status})`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* =======================================================
   Slice
   ======================================================= */

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
    codeforcesUrl: '',
  },
  status: 'idle',         // fetchUserData
  skillStatus: 'idle',    // add/delete skill
  projectStatus: 'idle',  // add/delete project
  githubStatus: 'idle',
  leetcodeStatus: 'idle',
  saveJobStatus: 'idle',
  error: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // synchronous compatibility actions (some components may import these)
    logout(state) {
      localStorage.removeItem('userId');
      state.data = initialState.data;
      state.status = 'idle';
    },

    // Keep a synchronous addSkill for components that still dispatch addSkill directly
    addSkill(state, action) {
      if (!state.data.skills) state.data.skills = [];
      state.data.skills.push(action.payload);
    },

    // Local-only semester update (UI)
    updateSemester(state, action) {
      const { name, grade } = action.payload || {};
      if (!state.data.semesters) state.data.semesters = {};
      if (name) state.data.semesters[name] = parseFloat(grade);
    },

    // Local quick set for photo (optimistic)
    updateLocalPhoto(state, action) {
      state.data.photoDataUrl = action.payload;
    },

    // Local addAppliedJob
    addAppliedJobLocal(state, action) {
      const job = action.payload;
      if (!job) return;
      const exists = state.data.appliedJobs.some(j => j.job_url === job.job_url);
      if (!exists) state.data.appliedJobs.push(job);
    }
  },

  extraReducers: builder => {
    // FETCH USER
    builder.addCase(fetchUserData.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    });
    builder.addCase(fetchUserData.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.data = { ...state.data, ...action.payload };
    });
    builder.addCase(fetchUserData.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // ADD SKILL (async)
    builder.addCase(addSkillToBackend.pending, (state) => {
      state.skillStatus = 'loading';
      state.error = null;
    });
    builder.addCase(addSkillToBackend.fulfilled, (state, action) => {
      state.skillStatus = 'succeeded';
      if (!state.data.skills) state.data.skills = [];
      state.data.skills.push(action.payload);
    });
    builder.addCase(addSkillToBackend.rejected, (state, action) => {
      state.skillStatus = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // DELETE SKILL
    builder.addCase(deleteSkillBackend.pending, (state) => {
      state.skillStatus = 'loading';
    });
    builder.addCase(deleteSkillBackend.fulfilled, (state, action) => {
      state.skillStatus = 'succeeded';
      state.data.skills = state.data.skills.filter(s => s.id !== action.payload);
    });
    builder.addCase(deleteSkillBackend.rejected, (state, action) => {
      state.skillStatus = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // ADD PROJECT (async)
    builder.addCase(addProjectToBackend.pending, (state) => {
      state.projectStatus = 'loading';
    });
    builder.addCase(addProjectToBackend.fulfilled, (state, action) => {
      state.projectStatus = 'succeeded';
      if (!state.data.manualProjects) state.data.manualProjects = [];
      // Add at front
      state.data.manualProjects.unshift(action.payload);
    });
    builder.addCase(addProjectToBackend.rejected, (state, action) => {
      state.projectStatus = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // DELETE PROJECT
    builder.addCase(deleteProjectFromBackend.pending, (state) => {
      state.projectStatus = 'loading';
    });
    builder.addCase(deleteProjectFromBackend.fulfilled, (state, action) => {
      state.projectStatus = 'succeeded';
      state.data.manualProjects = state.data.manualProjects.filter(p => p.id !== action.payload);
    });
    builder.addCase(deleteProjectFromBackend.rejected, (state, action) => {
      state.projectStatus = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // UPLOADS
    builder.addCase(uploadResumeFile.fulfilled, (state, action) => {
      state.data.resumeRemoteUrl = action.payload;
    });
    builder.addCase(uploadProfileImage.fulfilled, (state, action) => {
      state.data.photoDataUrl = action.payload;
    });

    // SAVE JOB
    builder.addCase(saveJob.pending, (state) => { state.saveJobStatus = 'loading'; });
    builder.addCase(saveJob.fulfilled, (state, action) => {
      state.saveJobStatus = 'succeeded';
      const exists = state.data.appliedJobs.some(j => j.job_url === action.payload.job_url);
      if (!exists) state.data.appliedJobs.push(action.payload);
    });
    builder.addCase(saveJob.rejected, (state, action) => {
      state.saveJobStatus = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // GITHUB
    builder.addCase(fetchGithubRepos.pending, (state) => { state.githubStatus = 'loading'; });
    builder.addCase(fetchGithubRepos.fulfilled, (state, action) => {
      state.githubStatus = 'succeeded';
      state.data.githubProjects = action.payload;
    });
    builder.addCase(fetchGithubRepos.rejected, (state, action) => {
      state.githubStatus = 'failed';
      state.error = action.payload || action.error?.message;
    });

    // LEETCODE
    builder.addCase(fetchLeetCodeStats.pending, (state) => { state.leetcodeStatus = 'loading'; });
    builder.addCase(fetchLeetCodeStats.fulfilled, (state, action) => {
      state.leetcodeStatus = 'succeeded';
      state.data.leetcodeStats = action.payload;
    });
    builder.addCase(fetchLeetCodeStats.rejected, (state, action) => {
      state.leetcodeStatus = 'failed';
      // keep existing leetcodeStats (don't clobber) — store error
      state.error = action.payload || action.error?.message;
    });
  }
});

/* =======================================================
   Exports
   ======================================================= */

// synchronous actions (for components that need them)
export const {
  logout,
  addSkill,           // synchronous push (compatibility)
  updateSemester,
  updateLocalPhoto,
  addAppliedJobLocal
} = userSlice.actions;

// thunks (async)
export {
  fetchUserData,
  addSkillToBackend,
  deleteSkillBackend,
  addProjectToBackend,
  deleteProjectFromBackend,
  uploadResumeFile,
  uploadProfileImage,
  saveJob,
  fetchGithubRepos,
  fetchLeetCodeStats
};

export default userSlice.reducer;
