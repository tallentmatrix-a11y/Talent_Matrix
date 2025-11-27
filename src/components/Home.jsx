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

  const user = useSelector((state) => state.user.data);
  const githubStatus = useSelector((state) => state.user.githubStatus);
  const skillStatus = useSelector((state) => state.user.skillStatus);
  const projectStatus = useSelector((state) => state.user.projectStatus);

  // Inputs
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
  const getSkillName = (s) => s.skillName || s.skill_name || s.name || '';
  const getSkillLevel = (s) => s.proficiency || s.level || 'Beginner';

  const skillLevelColor = (level) => {
    const lvl = (level || '').toLowerCase();
    if (lvl === 'beginner') return 'bg-amber-500';
    if (lvl === 'intermediate') return 'bg-blue-600';
    if (lvl === 'expert') return 'bg-emerald-500';
    return 'bg-gray-400';
  };

  const computeCgpa = () => {
    const g = Object.values(user.semesters || {})
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    return g.length ? (g.reduce((a, b) => a + b, 0) / g.length).toFixed(2) : 'N/A';
  };

  /* =====================================================
     Load User
     ===================================================== */
  useEffect(() => {
    const userId = localStorage.getItem('userId') || user.id;
    if (userId && user.skills.length === 0 && user.manualProjects.length === 0) {
      dispatch(fetchUserData(userId));
    }
  }, [dispatch, user.id]);

  /* =====================================================
     Load GitHub Repos
     ===================================================== */
  useEffect(() => {
    if (user.githubUsername && user.githubProjects.length === 0) {
      dispatch(fetchGithubRepos(user.githubUsername));
    }
  }, [dispatch, user.githubUsername]);

  /* =====================================================
     Load LeetCode Stats
     ===================================================== */
  useEffect(() => {
    if (!user.leetcodeUrl) return;

    let username = user.leetcodeUrl;
    if (username.includes("leetcode.com")) {
      username = username.replace(/\/+$/, "");
      username = username.split("/").pop();
    }

    if (username && !user.leetcodeStats) {
      dispatch(fetchLeetCodeStats(username));
    }
  }, [dispatch, user.leetcodeUrl]);

  /* =====================================================
     Skill Handlers
     ===================================================== */
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput) return;

    dispatch(
      addSkillToBackend({
        student_id: user.id,
        skill_name: skillInput,
        proficiency: skillLevel,
        tags: skillTags
      })
    );

    setSkillInput('');
    setSkillTags('');
    setSkillLevel('Beginner');
  };

  const handleDeleteSkill = (id) => {
    dispatch(deleteSkillBackend(id));
  };

  /* =====================================================
     Project Handlers
     ===================================================== */
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!projInput.title || !projInput.desc) return;

    dispatch(
      addProjectToBackend({
        student_id: user.id,
        title: projInput.title,
        description: projInput.desc,
        link: projInput.link,
        tags: projInput.tags
      })
    );

    setProjInput({ title: '', desc: '', link: '', tags: '' });
  };

  const handleDeleteProject = (id) => {
    dispatch(deleteProjectFromBackend(id));
  };

  // Filter skills
  const filteredSkills = (user.skills || []).filter((s) =>
    getSkillName(s).toLowerCase().includes(skillSearch.toLowerCase())
  );

  // Merge manual + GitHub projects
  const allProjects = [
    ...(user.manualProjects || []),
    ...(user.githubProjects || [])
  ];

  /* =====================================================
     UI STARTS
     ===================================================== */
  return (
    <div className="transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Profile
      </h2>

      {/* HEADER */}
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
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-2">Name</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-2">Hall Ticket No.</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user.rollNumber || '-'}</div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex-1 border border-gray-200 dark:border-slate-700">
            <label className="text-gray-500 dark:text-gray-400 text-sm block mb-2">CGPA</label>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{computeCgpa()}</div>
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Contact & Links</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-800 dark:text-gray-200">
            <strong>Mobile:</strong> {user.mobileNumber || 'N/A'}
          </div>

          <div className="text-gray-800 dark:text-gray-200">
            <strong>LinkedIn:</strong>{' '}
            {user.linkedinUrl ? (
              <a href={user.linkedinUrl} target="_blank" className="text-blue-600 dark:text-blue-400 ml-1">
                Link
              </a>
            ) : 'N/A'}
          </div>

          <div className="text-gray-800 dark:text-gray-200">
            <strong>GitHub:</strong>{' '}
            {user.githubUsername ? (
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                className="text-blue-600 dark:text-blue-400 ml-1"
              >
                {user.githubUsername}
              </a>
            ) : 'N/A'}
          </div>
        </div>
      </div>

      {/* LEETCODE INSIGHTS */}
      {user.leetcodeStats && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
          <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4">
            ⚡ LeetCode Insights
          </h3>

          <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Total Solved: <strong>{user.leetcodeStats.total || 0}</strong>
          </div>

          {user.leetcodeStats.topics?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {user.leetcodeStats.topics.slice(0, 9).map((t, i) => (
                <div
                  key={i}
                  className="p-3 bg-gray-50 dark:bg-slate-700/30 rounded-lg border border-gray-200 dark:border-slate-600"
                >
                  <div className="font-bold text-gray-800 dark:text-white">{t.topicName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t.solved} problems</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 dark:text-gray-500 text-sm italic">
              No topic data available.
            </div>
          )}
        </div>
      )}

      {/* SEMESTERS */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Semester Grades</h3>

        <div className="flex gap-3 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Semester Name"
            value={semInput.name}
            onChange={(e) => setSemInput({ ...semInput, name: e.target.value })}
            className="px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />

          <input
            type="number"
            placeholder="CGPA"
            value={semInput.grade}
            onChange={(e) => setSemInput({ ...semInput, grade: e.target.value })}
            className="px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />

          <button
            onClick={() => {
              dispatch(updateSemester(semInput));
              setSemInput({ name: '', grade: '' });
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 text-white rounded-md"
          >
            Add
          </button>
        </div>

        <ul className="space-y-2">
          {Object.entries(user.semesters || {}).map(([sem, grade]) => (
            <li key={sem} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md border dark:border-slate-600">
              {sem}: <strong>{grade}</strong>
            </li>
          ))}
        </ul>
      </div>

      {/* SKILLS */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Skills</h3>

        <input
          type="text"
          placeholder="Search skills..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          className="w-full px-3 py-2 mb-4 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        />

        {/* Add Skill */}
        <form onSubmit={handleAddSkill} className="flex gap-3 flex-wrap mb-4">
          <input
            type="text"
            placeholder="Skill name"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            required
            className="px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <select
            value={skillLevel}
            onChange={(e) => setSkillLevel(e.target.value)}
            className="px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
          <input
            type="text"
            placeholder="Tags"
            value={skillTags}
            onChange={(e) => setSkillTags(e.target.value)}
            className="px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />

          <button
            type="submit"
            disabled={skillStatus === 'loading'}
            className="px-5 py-2 bg-blue-600 text-white rounded-md"
          >
            {skillStatus === 'loading' ? 'Saving...' : 'Add'}
          </button>
        </form>

        {/* Skill List */}
        <ul className="space-y-2">
          {filteredSkills.map((skill) => (
            <li
              key={skill.id}
              className="flex justify-between p-3 rounded-md bg-gray-50 dark:bg-slate-700/50 border dark:border-slate-600"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${skillLevelColor(getSkillLevel(skill))}`} />
                <span>{getSkillName(skill)}</span>
                <span className="text-gray-500 text-sm">({getSkillLevel(skill)})</span>
              </div>

              <button
                onClick={() => handleDeleteSkill(skill.id)}
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* PROJECTS */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-6 border dark:border-slate-700">
        <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">Projects</h3>

        {/* Add Project */}
        <form onSubmit={handleAddProject} className="p-4 bg-gray-50 dark:bg-slate-700/30 rounded-lg border dark:border-slate-700 mb-6">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Project title"
              value={projInput.title}
              onChange={(e) => setProjInput({ ...projInput, title: e.target.value })}
              required
              className="flex-1 px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />

            <input
              type="text"
              placeholder="Tags"
              value={projInput.tags}
              onChange={(e) => setProjInput({ ...projInput, tags: e.target.value })}
              className="flex-1 px-3 py-2 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          </div>

          <input
            type="url"
            placeholder="Project Link"
            value={projInput.link}
            onChange={(e) => setProjInput({ ...projInput, link: e.target.value })}
            className="w-full px-3 py-2 mb-3 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />

          <textarea
            rows={2}
            placeholder="Description"
            value={projInput.desc}
            onChange={(e) => setProjInput({ ...projInput, desc: e.target.value })}
            required
            className="w-full px-3 py-2 mb-3 rounded-md border dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />

          <button
            type="submit"
            disabled={projectStatus === 'loading'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            {projectStatus === 'loading' ? 'Saving...' : 'Add Project'}
          </button>
        </form>

        {/* All Projects */}
        <div className="flex flex-col gap-3">
          {githubStatus === 'loading' && (
            <div className="text-center text-gray-400">Loading GitHub repos...</div>
          )}

          {allProjects.map((project) => (
            <div
              key={project.id}
              className="p-4 border rounded-md bg-gray-50 dark:bg-slate-700/50 dark:border-slate-600"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{project.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {project.description}
                  </div>

                  {project.tags && (
                    <small className="text-gray-500 block mt-1">{project.tags}</small>
                  )}
                </div>

                <div className="flex gap-2">
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      className="px-3 py-1 bg-white dark:bg-slate-700 border dark:border-slate-600 rounded text-sm"
                    >
                      View
                    </a>
                  )}

                  {project.source !== 'github' && (
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <span className="text-[10px] px-2 py-1 mt-2 inline-block rounded bg-blue-100 dark:bg-slate-900 text-blue-600 dark:text-blue-300">
                {project.source?.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
