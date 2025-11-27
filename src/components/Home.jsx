// src/components/Home.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchUserData,
  addSkillToBackend,
  deleteSkillBackend,
  addProjectToBackend,
  deleteProjectFromBackend,
  fetchGithubRepos,
  fetchLeetCodeStats,
  updateSemester
} from '../redux/userSlice';

const Home = () => {
  const dispatch = useDispatch();

  // Redux state
  const user = useSelector((state) => state.user.data || {});
  const status = useSelector((state) => state.user.status);
  const githubStatus = useSelector((state) => state.user.githubStatus);
  const skillStatus = useSelector((state) => state.user.skillStatus);
  const projectStatus = useSelector((state) => state.user.projectStatus);
  const leetcodeStatus = useSelector((state) => state.user.leetcodeStatus);

  // Local inputs
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [skillTags, setSkillTags] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  const [semInput, setSemInput] = useState({ name: '', grade: '' });

  const [projInput, setProjInput] = useState({
    title: '',
    desc: '',
    link: '',
    tags: ''
  });

  // Helpers
  const getSkillName = (s) => s.skill_name || s.skillName || s.name || '';
  const getSkillLevel = (s) => s.proficiency || s.level || 'Beginner';

  const skillLevelColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'beginner') return 'bg-amber-500';
    if (l === 'intermediate') return 'bg-blue-600';
    if (l === 'expert') return 'bg-emerald-500';
    return 'bg-gray-400';
  };

  const computeCgpa = () => {
    const vals = Object.values(user.semesters || {})
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 'N/A';
  };

  // Effects - load user, github, leetcode
  useEffect(() => {
    const userId = localStorage.getItem('userId') || user.id;
    if (userId && (!user.id || user.id !== userId || (user.skills && user.skills.length === 0 && (user.manualProjects || []).length === 0))) {
      dispatch(fetchUserData(userId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (user.githubUsername && (!user.githubProjects || user.githubProjects.length === 0)) {
      dispatch(fetchGithubRepos(user.githubUsername));
    }
  }, [dispatch, user.githubUsername]);

  useEffect(() => {
    if (!user.leetcodeUrl) return;
    let username = user.leetcodeUrl;
    if (username.includes('leetcode.com')) {
      username = username.replace(/\/+$/, '').split('/').pop();
    }
    if (username && !user.leetcodeStats) {
      dispatch(fetchLeetCodeStats(username));
    }
  }, [dispatch, user.leetcodeUrl]);

  // Skill handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput || !user.id) return;

    dispatch(addSkillToBackend({
      student_id: user.id,
      skill_name: skillInput,
      proficiency: skillLevel,
      tags: skillTags
    }));

    // clear local
    setSkillInput('');
    setSkillTags('');
    setSkillLevel('Beginner');
  };

  const handleDeleteSkill = (skillId) => {
    if (!skillId) return;
    dispatch(deleteSkillBackend(skillId));
  };

  // Project handlers
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projInput.title || !projInput.desc || !user.id) return;

    dispatch(addProjectToBackend({
      student_id: user.id,
      title: projInput.title,
      description: projInput.desc,
      link: projInput.link,
      tags: projInput.tags
    }));

    setProjInput({ title: '', desc: '', link: '', tags: '' });
  };

  const handleDeleteProject = (projectId) => {
    if (!projectId) return;
    dispatch(deleteProjectFromBackend(projectId));
  };

  // Semester handler
  const handleAddSemester = () => {
    if (!semInput.name) return;
    dispatch(updateSemester(semInput));
    setSemInput({ name: '', grade: '' });
  };

  // Filters + merges
  const filteredSkills = (user.skills || []).filter(s =>
    getSkillName(s).toLowerCase().includes((skillSearch || '').toLowerCase())
  );

  // Show github projects only when they were filtered by backend (have description)
  const githubProjects = user.githubProjects || [];
  const manualProjects = user.manualProjects || [];
  const allProjects = [...manualProjects, ...githubProjects];

  // UI
  return (
    <div className="transition-colors duration-300 p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Profile</h2>

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
        <div className="w-[200px] flex-shrink-0 mx-auto md:mx-0">
          <img
            src={user.photoDataUrl || 'https://via.placeholder.com/200'}
            alt="Profile"
            className="w-full aspect-[3/4] object-cover rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 text-sm block mb-2">Name</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 text-sm block mb-2">Hall Ticket No.</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user.rollNumber || '-'}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 text-sm block mb-2">CGPA</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{computeCgpa()}</div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Contact & Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-800 dark:text-gray-200">
            <strong>Mobile:</strong> {user.mobileNumber || 'N/A'}
          </div>

          <div className="text-gray-800 dark:text-gray-200">
            <strong>LinkedIn:</strong>{' '}
            {user.linkedinUrl ? <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600">Link</a> : 'N/A'}
          </div>

          <div className="text-gray-800 dark:text-gray-200">
            <strong>GitHub:</strong>{' '}
            {user.githubUsername ? <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noreferrer" className="text-blue-600">{user.githubUsername}</a> : 'N/A'}
          </div>
        </div>
      </div>

      {/* LeetCode */}
      {user.leetcodeStats && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">⚡ LeetCode Insights</h3>
            <div className="text-sm bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full">{`Total Solved: ${user.leetcodeStats.total || 0}`}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* difficulty bars */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-medium">Easy</span>
                  <span className="text-gray-600">{user.leetcodeStats.easy || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${((user.leetcodeStats.easy || 0) / (user.leetcodeStats.total || 1)) * 100}%`, background: '#22c55e' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-yellow-600 font-medium">Medium</span>
                  <span className="text-gray-600">{user.leetcodeStats.medium || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${((user.leetcodeStats.medium || 0) / (user.leetcodeStats.total || 1)) * 100}%`, background: '#f59e0b' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-600 font-medium">Hard</span>
                  <span className="text-gray-600">{user.leetcodeStats.hard || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${((user.leetcodeStats.hard || 0) / (user.leetcodeStats.total || 1)) * 100}%`, background: '#ef4444' }} />
                </div>
              </div>
            </div>

            {/* topics */}
            <div className="lg:col-span-2">
              <h4 className="font-semibold text-gray-700 mb-3">Top Skills (By Topics)</h4>
              {user.leetcodeStats.topics && user.leetcodeStats.topics.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {user.leetcodeStats.topics.slice(0, 9).map((topic, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-gray-50 dark:bg-slate-700/30">
                      <div className="font-semibold text-gray-800">{topic.topicName}</div>
                      <div className="text-xs text-gray-500">{topic.solved} Problems</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 italic">No topic data available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Semesters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4">Semester Grades</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Semester Name"
            value={semInput.name}
            onChange={(e) => setSemInput({ ...semInput, name: e.target.value })}
            className="px-3 py-2 rounded-md border w-60"
          />
          <input
            type="number"
            step="0.01"
            placeholder="CGPA"
            value={semInput.grade}
            onChange={(e) => setSemInput({ ...semInput, grade: e.target.value })}
            className="px-3 py-2 rounded-md border w-32"
          />
          <button onClick={handleAddSemester} className="px-4 py-2 bg-blue-600 text-white rounded-md">Add</button>
        </div>

        <ul className="space-y-2">
          {Object.entries(user.semesters || {}).map(([k, v]) => (
            <li key={k} className="p-3 bg-gray-50 rounded-md border">{k}: <strong>{v}</strong></li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">Skills</h3>
        </div>

        <input
          type="text"
          placeholder="Search skills..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className="w-full px-3 py-2 mb-4 rounded-md border"
        />

        <form onSubmit={handleAddSkill} className="flex gap-3 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Skill name"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            required
            className="px-3 py-2 rounded-md border flex-1"
          />
          <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="px-3 py-2 rounded-md border w-44">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
          <input
            type="text"
            placeholder="Tags"
            value={skillTags}
            onChange={(e) => setSkillTags(e.target.value)}
            className="px-3 py-2 rounded-md border w-56"
          />
          <button type="submit" disabled={skillStatus === 'loading'} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            {skillStatus === 'loading' ? 'Saving...' : 'Add'}
          </button>
        </form>

        <ul className="space-y-2">
          {filteredSkills.map((s) => (
            <li key={s.id || s.skill_name} className="flex justify-between items-center p-3 rounded-md bg-gray-50 border">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${skillLevelColor(getSkillLevel(s))}`} />
                <div>
                  <div className="font-semibold">{getSkillName(s)}</div>
                  <div className="text-xs text-gray-500">{getSkillLevel(s)}</div>
                </div>
              </div>
              <button onClick={() => handleDeleteSkill(s.id)} className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4">Projects</h3>

        <form onSubmit={handleAddProject} className="p-4 bg-gray-50 rounded-md border mb-6">
          <div className="flex gap-3 mb-3">
            <input
              placeholder="Project title"
              value={projInput.title}
              onChange={(e) => setProjInput({ ...projInput, title: e.target.value })}
              className="flex-1 px-3 py-2 rounded-md border"
              required
            />
            <input
              placeholder="Tags"
              value={projInput.tags}
              onChange={(e) => setProjInput({ ...projInput, tags: e.target.value })}
              className="w-64 px-3 py-2 rounded-md border"
            />
          </div>

          <input
            type="url"
            placeholder="Project Link"
            value={projInput.link}
            onChange={(e) => setProjInput({ ...projInput, link: e.target.value })}
            className="w-full px-3 py-2 mb-3 rounded-md border"
          />

          <textarea
            rows={3}
            placeholder="Description"
            value={projInput.desc}
            onChange={(e) => setProjInput({ ...projInput, desc: e.target.value })}
            className="w-full px-3 py-2 mb-3 rounded-md border"
            required
          />

          <button type="submit" disabled={projectStatus === 'loading'} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            {projectStatus === 'loading' ? 'Saving...' : 'Add Project'}
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {githubStatus === 'loading' && <div className="text-gray-500 text-center">Loading GitHub repos...</div>}

          {allProjects.length === 0 && <div className="text-gray-400 italic">No projects yet.</div>}

          {allProjects.map((p) => (
            <div key={p.id || p.title} className="p-4 border rounded-md bg-gray-50">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-900">{p.title}</div>
                    {p.source === 'github' ? (
                      <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">GITHUB</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">MANUAL</span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 mt-2">{p.description}</div>
                  {p.tags && <div className="text-xs text-gray-500 mt-2">{p.tags}</div>}
                </div>

                <div className="flex flex-col gap-2">
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="px-3 py-1 bg-white border rounded text-sm">View</a>}
                  {p.source !== 'github' && <button onClick={() => handleDeleteProject(p.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
