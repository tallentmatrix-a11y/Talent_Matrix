import React, { useState, useEffect } from 'react';
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

  // Redux selectors
  const user = useSelector((state) => state.user.data);
  const githubStatus = useSelector((state) => state.user.githubStatus);
  const skillStatus = useSelector((state) => state.user.skillStatus);
  const projectStatus = useSelector((state) => state.user.projectStatus);

  // Local inputs
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [skillTags, setSkillTags] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [semInput, setSemInput] = useState({ name: '', grade: '' });
  const [projInput, setProjInput] = useState({ title: '', desc: '', link: '', tags: '' });

  // Helpers
  const getSkillName = (s) => s.skill_name || s.name || '';
  const getSkillLevel = (s) => s.proficiency || s.level || 'Beginner';

  const skillLevelColor = (level) => {
    const safeLevel = (level || '').toLowerCase();
    if (safeLevel === 'beginner') return 'bg-amber-500';
    if (safeLevel === 'intermediate') return 'bg-blue-600';
    if (safeLevel === 'expert') return 'bg-emerald-500';
    return 'bg-gray-400';
  };

  const getLeetCodeLevel = (solvedCount) => {
    if (solvedCount > 50) return { label: 'Advanced', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' };
    if (solvedCount > 20) return { label: 'Intermediate', color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' };
    return { label: 'Beginner', color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' };
  };

  const computeCgpa = () => {
    const vals = Object.values(user.semesters || {}).map(v => parseFloat(v)).filter(v => !isNaN(v));
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 'N/A';
  };

  // Effects
  useEffect(() => {
    const userId = localStorage.getItem('userId') || user.id;
    if (userId && (!user.skills || user.skills.length === 0)) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, user.id, user.skills]);

  useEffect(() => {
    if (user.githubUsername && (!user.githubProjects || user.githubProjects.length === 0)) {
      dispatch(fetchGithubRepos(user.githubUsername));
    }
  }, [dispatch, user.githubUsername, user.githubProjects]);

  useEffect(() => {
    if (user.leetcodeUrl && !user.leetcodeStats) {
      let username = user.leetcodeUrl;
      if (username.includes('leetcode.com')) {
        const cleanUrl = username.replace(/\/+$/, '');
        const parts = cleanUrl.split('/');
        username = parts[parts.length - 1];
      }
      if (username) dispatch(fetchLeetCodeStats(username));
    }
  }, [dispatch, user.leetcodeUrl, user.leetcodeStats]);

  // Handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput) return;
    const newSkillData = {
      student_id: user.id,
      skill_name: skillInput,
      proficiency: skillLevel,
      tags: skillTags
    };
    dispatch(addSkillToBackend(newSkillData));
    setSkillInput('');
    setSkillTags('');
    setSkillLevel('Beginner');
  };

  const handleDeleteSkill = (skillId) => {
    if (skillId) dispatch(deleteSkillBackend(skillId));
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projInput.title || !projInput.desc) return;

    const newProjectData = {
      student_id: user.id,
      title: projInput.title,
      description: projInput.desc,
      link: projInput.link,
      tags: projInput.tags
    };

    dispatch(addProjectToBackend(newProjectData));
    setProjInput({ title: '', desc: '', link: '', tags: '' });
  };

  const handleDeleteProject = (projectId) => {
    if (projectId) dispatch(deleteProjectFromBackend(projectId));
  };

  // Filters
  const filteredSkills = (user?.skills || []).filter((s) =>
    getSkillName(s).toLowerCase().includes(skillSearch.toLowerCase())
  );

  const allProjects = [
    ...(user.manualProjects || []),
    ...(user.githubProjects || [])
  ];

  // UI
  return (
    <div className="transition-colors duration-300">
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
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700 transition-colors">
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-2">Name</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700 transition-colors">
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-2">Hall Ticket No.</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user.rollNumber || '-'}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700 transition-colors">
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-2">CGPA</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{computeCgpa()}</div>
          </div>
        </div>
      </div>

      {/* Contact & Links */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700 transition-colors">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Contact & Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-800 dark:text-gray-200">
            <strong className="text-gray-600 dark:text-gray-400">Mobile:</strong> {user.mobileNumber || 'N/A'}
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            <strong className="text-gray-600 dark:text-gray-400">LinkedIn:</strong>{' '}
            {user.linkedinUrl ? <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">Link</a> : 'N/A'}
          </div>
          <div className="text-gray-800 dark:text-gray-200">
            <strong className="text-gray-600 dark:text-gray-400">GitHub:</strong>{' '}
            {user.githubUsername ? <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">{user.githubUsername}</a> : 'N/A'}
          </div>
        </div>
      </div>

      {/* Coding Profiles (rest of UI same as you provided) */}
      {/* ... (the rest of your UI remains unchanged) ... */}

      {/* Semesters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700 transition-colors">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Semester Grades</h3>
        <div className="flex gap-3 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Semester Name"
            value={semInput.name}
            onChange={(e) => setSemInput({ ...semInput, name: e.target.value })}
            className="px-3 py-2.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[180px] outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          />
          <input
            type="number"
            step="0.01"
            placeholder="CGPA"
            value={semInput.grade}
            onChange={(e) => setSemInput({ ...semInput, grade: e.target.value })}
            className="px-3 py-2.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[120px] outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          />
          <button
            onClick={() => { dispatch(updateSemester(semInput)); setSemInput({ name: '', grade: '' }); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md font-semibold transition-colors"
          >
            Add
          </button>
        </div>

        <ul className="list-none space-y-2">
          {Object.entries(user.semesters || {}).map(([sem, grade]) => (
            <li key={sem} className="flex justify-between items-center p-3 rounded-md bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 transition-colors">
              <span className="text-gray-800 dark:text-gray-200">{sem}: {grade}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700 transition-colors">
        <div className="mb-4">
          <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">Skills</h3>
          <input
            type="text"
            placeholder="Search skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          />
        </div>

        {/* Add skill */}
        <form onSubmit={handleAddSkill} className="flex gap-3 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Skill name"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[180px] outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            required
          />
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[160px] outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Expert">Expert</option>
          </select>
          <input
            type="text"
            placeholder="Tags"
            value={skillTags}
            onChange={(e) => setSkillTags(e.target.value)}
            className="px-3 py-2.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[180px] outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          />
          <button
            type="submit"
            disabled={skillStatus === 'loading'}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md font-semibold transition-colors disabled:opacity-50"
          >
            {skillStatus === 'loading' ? 'Saving...' : 'Add'}
          </button>
        </form>

        <ul className="list-none space-y-2">
          {filteredSkills.map((skill, idx) => (
            <li key={skill.id || idx} className="flex justify-between items-center p-3 rounded-md bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${skillLevelColor(getSkillLevel(skill))}`}></span>
                <span className="font-semibold text-gray-800 dark:text-white">{getSkillName(skill)}</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">({getSkillLevel(skill)})</span>
                {skill.tags && <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{skill.tags}</span>}
              </div>
              <button
                onClick={() => handleDeleteSkill(skill.id)}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Projects */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">Projects</h3>
          {user.githubUsername ? (
            <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full border border-green-300 dark:border-green-800">
              ✓ GitHub Linked: <strong>{user.githubUsername}</strong>
            </span>
          ) : (
            <span className="text-sm bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full border border-gray-300 dark:border-slate-600">GitHub not linked</span>
          )}
        </div>

        {/* Add Project */}
        <form onSubmit={handleAddProject} className="flex flex-col gap-3 mb-6 bg-gray-50 dark:bg-slate-700/30 p-4 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
          <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Add Manual Project</h4>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Project title"
              value={projInput.title}
              onChange={(e) => setProjInput({ ...projInput, title: e.target.value })}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
              required
            />
            <input
              type="text"
              placeholder="Tags (e.g., React, Node)"
              value={projInput.tags}
              onChange={(e) => setProjInput({ ...projInput, tags: e.target.value })}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            />
          </div>
          <input
            type="url"
            placeholder="Project Link"
            value={projInput.link}
            onChange={(e) => setProjInput({ ...projInput, link: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          />
          <textarea
            rows={2}
            placeholder="Description"
            value={projInput.desc}
            onChange={(e) => setProjInput({ ...projInput, desc: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
            required
          ></textarea>

          <button
            type="submit"
            disabled={projectStatus === 'loading'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-md font-semibold self-start text-sm transition-colors disabled:opacity-50"
          >
            {projectStatus === 'loading' ? 'Saving...' : 'Add Project'}
          </button>
        </form>

        {/* Project list */}
        <div className="flex flex-col gap-3">
          {githubStatus === 'loading' && <div className="text-center py-2 text-gray-500 dark:text-gray-400">Loading GitHub Repos...</div>}

          {allProjects.map((project, idx) => (
            <div key={project.id || idx} className={`p-4 rounded-md border transition-colors ${project.source === 'github' ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600'}`}>
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-gray-900 dark:text-white text-lg">{project.title}</div>
                    {project.source === 'github' ? (
                      <span className="bg-black dark:bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wider font-bold">GITHUB</span>
                    ) : (
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full tracking-wider font-bold">MANUAL</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{project.description}</div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded text-sm hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">View</a>}
                  {project.source !== 'github' && (
                    <button onClick={() => handleDeleteProject(project.id)} className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 text-white px-3 py-1 rounded text-sm transition-colors">Delete</button>
                  )}
                </div>
              </div>

              {project.tags && <small className="text-gray-500 dark:text-gray-400 block mt-2 font-mono text-xs">{project.tags}</small>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
