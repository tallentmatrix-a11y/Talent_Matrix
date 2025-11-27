// src/components/Home.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addSkillToBackend,
  deleteSkillBackend,
  fetchUserData,
  fetchGithubRepos,
  fetchLeetCodeStats,
  addProjectToBackend,
  deleteProjectFromBackend,
  updateSemester
} from '../redux/userSlice';

const Home = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.data || {});
  const githubStatus = useSelector((state) => state.user.githubStatus);
  const skillStatus = useSelector((state) => state.user.skillStatus);
  const projectStatus = useSelector((state) => state.user.projectStatus);
  const leetcodeStatus = useSelector((state) => state.user.leetcodeStatus);

  // Local state
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
    const lvl = (level || '').toLowerCase();
    if (lvl === 'beginner') return 'bg-amber-500';
    if (lvl === 'intermediate') return 'bg-blue-600';
    if (lvl === 'expert') return 'bg-emerald-500';
    return 'bg-gray-400';
  };

  const computeCgpa = () => {
    const vals = Object.values(user.semesters || {}).map(v => parseFloat(v)).filter(v => !isNaN(v));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 'N/A';
  };

  /* -----------------------------------------------------------
     Load user, repos, leetcode
     ----------------------------------------------------------- */
  useEffect(() => {
    const userId = localStorage.getItem('userId') || user.id;
    if (userId && (!user.id || user.id !== userId || ((user.skills || []).length === 0 && (user.manualProjects || []).length === 0))) {
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
    if (username && !user.leetcodeStats && leetcodeStatus !== 'loading') {
      dispatch(fetchLeetCodeStats(username));
    }
  }, [dispatch, user.leetcodeUrl, user.leetcodeStats, leetcodeStatus]);

  /* -----------------------------------------------------------
     Handlers
     ----------------------------------------------------------- */
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput || !user.id) return;
    dispatch(addSkillToBackend({
      student_id: user.id,
      skill_name: skillInput,
      proficiency: skillLevel,
      tags: skillTags
    }));
    setSkillInput(''); setSkillTags(''); setSkillLevel('Beginner');
  };

  const handleDeleteSkill = (id) => {
    if (!id) return;
    dispatch(deleteSkillBackend(id));
  };

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

  const handleDeleteProject = (id) => {
    if (!id) return;
    dispatch(deleteProjectFromBackend(id));
  };

  const handleAddSemester = () => {
    if (!semInput.name) return;
    dispatch(updateSemester(semInput));
    setSemInput({ name: '', grade: '' });
  };

  // Filters & derived lists
  const filteredSkills = (user.skills || []).filter((s) =>
    getSkillName(s).toLowerCase().includes(skillSearch.toLowerCase())
  );

  // show only github projects that have description text
  const githubProjects = (user.githubProjects || []).filter(p => p.description && p.description.trim());
  const manualProjects = user.manualProjects || [];
  const allProjects = [...manualProjects, ...githubProjects];

  // LeetCode normalized fields
  const lc = user.leetcodeStats || null;
  const lcTotal = lc ? (lc.total ?? 0) : 0;
  const lcEasy = lc ? (lc.easy ?? 0) : 0;
  const lcMedium = lc ? (lc.medium ?? 0) : 0;
  const lcHard = lc ? (lc.hard ?? 0) : 0;
  const lcTopics = lc ? (Array.isArray(lc.topics) ? lc.topics : []) : [];

  /* -----------------------------------------------------------
     UI
     ----------------------------------------------------------- */
  return (
    <div className="transition-colors duration-300 p-6">
      <h2 className="text-3xl font-bold mb-8">Profile</h2>

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
            <div className="text-xl font-bold">{user.name}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 text-sm block mb-2">Hall Ticket No.</label>
            <div className="text-xl font-bold">{user.rollNumber || '-'}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 text-sm block mb-2">CGPA</label>
            <div className="text-xl font-bold">{computeCgpa()}</div>
          </div>
        </div>
      </div>

      {/* Contact & Links */}
      <div className="bg-white p-6 rounded-lg mb-6 border">
        <h3 className="font-bold text-xl mb-4">Contact & Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><strong>Mobile:</strong> {user.mobileNumber || 'N/A'}</div>
          <div>
            <strong>LinkedIn:</strong>{' '}
            {user.linkedinUrl ? <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600">Link</a> : 'N/A'}
          </div>
          <div>
            <strong>GitHub:</strong>{' '}
            {user.githubUsername ? <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noreferrer" className="text-blue-600">{user.githubUsername}</a> : 'N/A'}
          </div>
        </div>
      </div>

      {/* LeetCode Insights */}
      <div className="bg-white p-6 rounded-lg mb-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl">⚡ LeetCode Insights</h3>
          <div className="text-sm text-gray-600">Total Solved: <strong>{lcTotal}</strong></div>
        </div>

        {leetcodeStatus === 'loading' && <div className="text-gray-500 mb-4">Loading LeetCode data...</div>}

        {lc && leetcodeStatus !== 'loading' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <div className="mb-3">
                <div className="flex justify-between text-sm"><span className="text-green-600">Easy</span><span>{lcEasy}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${((lcEasy)/(lcTotal||1))*100}%`, background:'#22c55e' }} /></div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm"><span className="text-yellow-600">Medium</span><span>{lcMedium}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${((lcMedium)/(lcTotal||1))*100}%`, background:'#f59e0b' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-sm"><span className="text-red-600">Hard</span><span>{lcHard}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${((lcHard)/(lcTotal||1))*100}%`, background:'#ef4444' }} /></div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold mb-3">Top Skills (By Topics)</h4>
              {lcTopics.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lcTopics.slice(0, 9).map((t, i) => (
                    <div key={i} className="p-3 border rounded bg-gray-50">
                      <div className="font-semibold">{t.topicName}</div>
                      <div className="text-xs text-gray-500">{t.solved} Problems</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic">No topic data available.</div>
              )}
            </div>
          </div>
        ) : (
          leetcodeStatus !== 'loading' && <div className="text-gray-500 italic">LeetCode data not available.</div>
        )}
      </div>

      {/* Semester Grades */}
      <div className="bg-white p-6 rounded-lg mb-6 border">
        <h3 className="font-bold text-xl mb-4">Semester Grades</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Semester Name"
            value={semInput.name}
            onChange={(e) => setSemInput({ ...semInput, name: e.target.value })}
            className="px-3 py-2 rounded-md border w-64"
          />
          <input
            type="number"
            step="0.01"
            placeholder="CGPA"
            value={semInput.grade}
            onChange={(e) => setSemInput({ ...semInput, grade: e.target.value })}
            className="px-3 py-2 rounded-md border w-32"
          />
          <button onClick={handleAddSemester} className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
        </div>
        <ul className="space-y-2">
          {Object.entries(user.semesters || {}).map(([sem, grade]) => (
            <li key={sem} className="p-3 border rounded bg-gray-50">{sem}: <strong>{grade}</strong></li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      <div className="bg-white p-6 rounded-lg mb-6 border">
        <h3 className="font-bold text-xl mb-4">Skills</h3>
        <input
          type="text"
          placeholder="Search skills..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded"
        />

        <form onSubmit={handleAddSkill} className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Skill name"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            required
            className="px-3 py-2 rounded-md border flex-1"
          />
          <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="px-3 py-2 rounded-md border">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
          <input
            type="text"
            placeholder="Tags"
            value={skillTags}
            onChange={(e) => setSkillTags(e.target.value)}
            className="px-3 py-2 rounded-md border w-48"
          />
          <button type="submit" disabled={skillStatus === 'loading'} className="px-4 py-2 bg-blue-600 text-white rounded">
            {skillStatus === 'loading' ? 'Saving...' : 'Add'}
          </button>
        </form>

        <ul className="space-y-2">
          {filteredSkills.map((skill) => (
            <li key={skill.id || skill.skill_name} className="flex justify-between items-center p-3 border rounded">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${skillLevelColor(getSkillLevel(skill))}`} />
                <div>
                  <div className="font-semibold">{getSkillName(skill)}</div>
                  <div className="text-xs text-gray-500">{getSkillLevel(skill)}</div>
                </div>
              </div>
              <button onClick={() => handleDeleteSkill(skill.id)} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects */}
      <div className="bg-white p-6 rounded-lg mb-6 border">
        <h3 className="font-bold text-xl mb-4">Projects</h3>

        <form onSubmit={handleAddProject} className="p-4 bg-gray-50 rounded mb-6 border">
          <div className="flex gap-3 mb-3">
            <input value={projInput.title} onChange={(e) => setProjInput({ ...projInput, title: e.target.value })} placeholder="Project title" className="flex-1 px-3 py-2 border rounded" required />
            <input value={projInput.tags} onChange={(e) => setProjInput({ ...projInput, tags: e.target.value })} placeholder="Tags" className="w-48 px-3 py-2 border rounded" />
          </div>
          <input value={projInput.link} onChange={(e) => setProjInput({ ...projInput, link: e.target.value })} placeholder="Project Link" className="w-full px-3 py-2 border rounded mb-3" />
          <textarea value={projInput.desc} onChange={(e) => setProjInput({ ...projInput, desc: e.target.value })} placeholder="Description" rows={3} className="w-full px-3 py-2 border rounded mb-3" required />
          <button type="submit" disabled={projectStatus === 'loading'} className="px-4 py-2 bg-blue-600 text-white rounded">
            {projectStatus === 'loading' ? 'Saving...' : 'Add Project'}
          </button>
        </form>

        <div className="space-y-3">
          {allProjects.length === 0 && <div className="text-gray-500 italic">No projects yet.</div>}
          {allProjects.map(project => (
            <div key={project.id || project.title} className="p-4 border rounded bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{project.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{project.description}</div>
                  {project.tags && <small className="text-gray-500 mt-2 block">{project.tags}</small>}
                </div>
                <div className="flex flex-col gap-2">
                  {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="px-3 py-1 border rounded">View</a>}
                  {project.source !== 'github' && <button onClick={() => handleDeleteProject(project.id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 inline-block px-2 py-1 rounded bg-white">{(project.source || '').toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
