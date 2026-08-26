// TaskFlow Client Application
document.addEventListener('DOMContentLoaded', () => {
  // State
  let token = localStorage.getItem('tf_token') || null;
  let currentUser = JSON.parse(localStorage.getItem('tf_user')) || null;
  let projects = [];
  let currentProject = null;
  let currentActiveTask = null;
  let socket = null;

  // DOM Elements
  const appHeader = document.getElementById('appHeader');
  const authView = document.getElementById('authView');
  const dashboardView = document.getElementById('dashboardView');
  const projectBoardView = document.getElementById('projectBoardView');

  // Auth Elements
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTabBtn = document.getElementById('loginTabBtn');
  const registerTabBtn = document.getElementById('registerTabBtn');
  const userMenuBtn = document.getElementById('userMenuBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const headerUserName = document.getElementById('headerUserName');
  const headerUserAvatar = document.getElementById('headerUserAvatar');
  const dropdownUserEmail = document.getElementById('dropdownUserEmail');

  // Notifications Elements
  const notifBellBtn = document.getElementById('notifBellBtn');
  const notifBadge = document.getElementById('notifBadge');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifList = document.getElementById('notifList');
  const markAllReadBtn = document.getElementById('markAllReadBtn');

  // Dashboard Elements
  const projectsGrid = document.getElementById('projectsGrid');
  const openCreateProjectModalBtn = document.getElementById('openCreateProjectModalBtn');

  // Board Elements
  const backToProjectsBtn = document.getElementById('backToProjectsBtn');
  const boardProjectTitle = document.getElementById('boardProjectTitle');
  const boardProjectDesc = document.getElementById('boardProjectDesc');
  const boardProjectColor = document.getElementById('boardProjectColor');
  const boardTeamAvatars = document.getElementById('boardTeamAvatars');
  const openAddMemberModalBtn = document.getElementById('openAddMemberModalBtn');
  const openCreateTaskModalBtn = document.getElementById('openCreateTaskModalBtn');
  const deleteProjectBtn = document.getElementById('deleteProjectBtn');

  // Filters
  const taskPriorityFilter = document.getElementById('taskPriorityFilter');
  const taskAssigneeFilter = document.getElementById('taskAssigneeFilter');
  const taskSearchInput = document.getElementById('taskSearchInput');

  // Modals
  const createProjectModal = document.getElementById('createProjectModal');
  const createProjectForm = document.getElementById('createProjectForm');
  const taskModal = document.getElementById('taskModal');
  const taskForm = document.getElementById('taskForm');
  const addMemberModal = document.getElementById('addMemberModal');
  const addMemberForm = document.getElementById('addMemberForm');
  const taskDetailModal = document.getElementById('taskDetailModal');
  const commentForm = document.getElementById('commentForm');
  const commentsList = document.getElementById('commentsList');

  // --- INITIALIZATION ---
  initApp();

  function initApp() {
    setupEventListeners();
    if (token && currentUser) {
      connectSocket();
      showMainApp();
      loadProjects();
      loadNotifications();
    } else {
      showAuthView();
    }
  }

  // --- SOCKET.IO REAL-TIME CONNECTION ---
  function connectSocket() {
    if (socket) socket.disconnect();

    socket = io({
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to WebSockets real-time server');
      if (currentProject) {
        socket.emit('join_project', currentProject.id);
      }
    });

    // Real-Time Event Handlers
    socket.on('project_created', (project) => {
      showToast(`New project created: "${project.title}"`);
      loadProjects();
    });

    socket.on('project_updated', (project) => {
      if (currentProject && currentProject.id === project.id) {
        boardProjectTitle.textContent = project.title;
        boardProjectDesc.textContent = project.description;
        boardProjectColor.style.backgroundColor = project.color;
      }
      loadProjects();
    });

    socket.on('project_deleted', ({ projectId }) => {
      if (currentProject && currentProject.id === projectId) {
        showToast('This project was deleted by the owner');
        openProjectsDashboard();
      }
      loadProjects();
    });

    socket.on('member_added', ({ projectId, member }) => {
      if (currentProject && currentProject.id === projectId) {
        if (!currentProject.members.some(m => m.id === member.id)) {
          currentProject.members.push(member);
          renderBoardHeader();
          populateAssigneeDropdown();
        }
      }
      showToast(`${member.name} joined the project!`);
    });

    socket.on('task_created', (task) => {
      if (currentProject && currentProject.id === task.projectId) {
        currentProject.tasks.push(task);
        renderKanbanBoard();
      }
    });

    socket.on('task_updated', (task) => {
      if (currentProject && currentProject.id === task.projectId) {
        const idx = currentProject.tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) {
          currentProject.tasks[idx] = task;
        } else {
          currentProject.tasks.push(task);
        }
        renderKanbanBoard();
        if (currentActiveTask && currentActiveTask.id === task.id) {
          openTaskDetailModal(task);
        }
      }
    });

    socket.on('task_deleted', ({ taskId, projectId }) => {
      if (currentProject && currentProject.id === projectId) {
        currentProject.tasks = currentProject.tasks.filter(t => t.id !== taskId);
        renderKanbanBoard();
        if (currentActiveTask && currentActiveTask.id === taskId) {
          closeAllModals();
        }
      }
    });

    socket.on('comment_added', ({ taskId, comment }) => {
      if (currentActiveTask && currentActiveTask.id === taskId) {
        appendCommentUI(comment);
      }
      if (currentProject) {
        const task = currentProject.tasks.find(t => t.id === taskId);
        if (task) task.commentsCount = (task.commentsCount || 0) + 1;
        renderKanbanBoard();
      }
    });

    socket.on('notification', (notif) => {
      showToast(`🔔 ${notif.title}: ${notif.message}`);
      loadNotifications();
    });
  }

  // --- API HELPER ---
  async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const res = await fetch(endpoint, config);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      showToast(err.message, true);
      throw err;
    }
  }

  // --- AUTH FUNCTIONS ---
  async function login(email, password) {
    try {
      const data = await apiCall('/api/auth/login', 'POST', { email, password });
      setAuthData(data.token, data.user);
    } catch (e) {}
  }

  async function register(name, email, password) {
    try {
      const data = await apiCall('/api/auth/register', 'POST', { name, email, password });
      setAuthData(data.token, data.user);
    } catch (e) {}
  }

  function setAuthData(newToken, newUser) {
    token = newToken;
    currentUser = newUser;
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(currentUser));
    connectSocket();
    showMainApp();
    loadProjects();
    loadNotifications();
    showToast(`Welcome back, ${currentUser.name}!`);
  }

  function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    if (socket) socket.disconnect();
    showAuthView();
    showToast('Logged out successfully');
  }

  // --- NAVIGATION & VIEWS ---
  function showAuthView() {
    appHeader.style.display = 'none';
    authView.style.display = 'flex';
    dashboardView.style.display = 'none';
    projectBoardView.style.display = 'none';
  }

  function showMainApp() {
    appHeader.style.display = 'flex';
    authView.style.display = 'none';

    headerUserName.textContent = currentUser.name;
    headerUserAvatar.textContent = getInitials(currentUser.name);
    headerUserAvatar.style.backgroundColor = currentUser.avatarBg || '#4f46e5';
    dropdownUserEmail.textContent = currentUser.email;

    openProjectsDashboard();
  }

  function openProjectsDashboard() {
    if (currentProject && socket) {
      socket.emit('leave_project', currentProject.id);
    }
    currentProject = null;
    dashboardView.style.display = 'block';
    projectBoardView.style.display = 'none';
    loadProjects();
  }

  async function openProjectBoard(projectId) {
    try {
      const project = await apiCall(`/api/projects/${projectId}`);
      currentProject = project;
      
      if (socket) {
        socket.emit('join_project', projectId);
      }

      dashboardView.style.display = 'none';
      projectBoardView.style.display = 'block';

      renderBoardHeader();
      populateAssigneeDropdown();
      renderKanbanBoard();
    } catch (e) {}
  }

  // --- DASHBOARD RENDER ---
  async function loadProjects() {
    try {
      projects = await apiCall('/api/projects');
      renderDashboard();
    } catch (e) {}
  }

  function renderDashboard() {
    let totalTasks = 0;
    let completedTasks = 0;

    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
      projectsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <i class="fa-solid fa-folder-open" style="font-size: 40px; margin-bottom: 12px;"></i>
          <h3>No Projects Found</h3>
          <p>Create your first collaborative project to get started!</p>
        </div>
      `;
    }

    projects.forEach(p => {
      totalTasks += p.taskStats.total;
      completedTasks += p.taskStats.completed;

      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <div class="project-card-bar" style="background-color: ${p.color};"></div>
        <div class="project-card-header">
          <div>
            <h3 class="project-card-title">${escapeHtml(p.title)}</h3>
            <p class="project-card-desc">${escapeHtml(p.description || 'No description provided.')}</p>
          </div>
        </div>

        <div class="project-progress-box">
          <div class="progress-info">
            <span>Progress</span>
            <span>${p.taskStats.progress}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${p.taskStats.progress}%;"></div>
          </div>
        </div>

        <div class="project-card-footer">
          <div class="team-avatars-group">
            ${p.members.slice(0, 4).map(m => `
              <div class="avatar-sm" style="background-color: ${m.avatarBg};" title="${escapeHtml(m.name)}">${getInitials(m.name)}</div>
            `).join('')}
            ${p.members.length > 4 ? `<span class="avatar-sm" style="background:#475569;">+${p.members.length - 4}</span>` : ''}
          </div>
          <span class="text-muted"><i class="fa-solid fa-list-check"></i> ${p.taskStats.completed}/${p.taskStats.total} Tasks</span>
        </div>
      `;

      card.addEventListener('click', () => openProjectBoard(p.id));
      projectsGrid.appendChild(card);
    });

    document.getElementById('statTotalProjects').textContent = projects.length;
    document.getElementById('statTotalTasks').textContent = totalTasks;
    document.getElementById('statCompletedTasks').textContent = completedTasks;
    const overallProgress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('statOverallProgress').textContent = `${overallProgress}%`;
  }

  // --- KANBAN BOARD RENDER & DRAG-AND-DROP ---
  function renderBoardHeader() {
    if (!currentProject) return;

    boardProjectTitle.textContent = currentProject.title;
    boardProjectDesc.textContent = currentProject.description || 'Collaborative workspace board';
    boardProjectColor.style.backgroundColor = currentProject.color;

    boardTeamAvatars.innerHTML = currentProject.members.map(m => `
      <div class="avatar" style="background-color: ${m.avatarBg};" title="${escapeHtml(m.name)} (${m.role})">${getInitials(m.name)}</div>
    `).join('');
  }

  function populateAssigneeDropdown() {
    const taskAssigneeSelect = document.getElementById('taskAssignee');
    taskAssigneeSelect.innerHTML = '<option value="">Unassigned</option>';
    taskAssigneeFilter.innerHTML = '<option value="ALL">All Assignees</option>';

    if (!currentProject) return;

    currentProject.members.forEach(m => {
      taskAssigneeSelect.innerHTML += `<option value="${m.id}">${escapeHtml(m.name)}</option>`;
      taskAssigneeFilter.innerHTML += `<option value="${m.id}">${escapeHtml(m.name)}</option>`;
    });
  }

  function renderKanbanBoard() {
    if (!currentProject) return;

    const columns = {
      'To Do': document.getElementById('colTodoCards'),
      'In Progress': document.getElementById('colInProgressCards'),
      'In Review': document.getElementById('colInReviewCards'),
      'Done': document.getElementById('colDoneCards')
    };

    Object.values(columns).forEach(col => col.innerHTML = '');

    const counts = { 'To Do': 0, 'In Progress': 0, 'In Review': 0, 'Done': 0 };

    const priorityVal = taskPriorityFilter.value;
    const assigneeVal = taskAssigneeFilter.value;
    const searchVal = taskSearchInput.value.toLowerCase().trim();

    const filteredTasks = currentProject.tasks.filter(t => {
      if (priorityVal !== 'ALL' && t.priority !== priorityVal) return false;
      if (assigneeVal !== 'ALL' && t.assigneeId !== assigneeVal) return false;
      if (searchVal && !t.title.toLowerCase().includes(searchVal) && !t.description.toLowerCase().includes(searchVal)) return false;
      return true;
    });

    filteredTasks.forEach(task => {
      counts[task.status] = (counts[task.status] || 0) + 1;
      const card = createKanbanCardElement(task);
      if (columns[task.status]) {
        columns[task.status].appendChild(card);
      }
    });

    document.getElementById('countTodo').textContent = counts['To Do'];
    document.getElementById('countInProgress').textContent = counts['In Progress'];
    document.getElementById('countInReview').textContent = counts['In Review'];
    document.getElementById('countDone').textContent = counts['Done'];

    setupDragAndDrop();
  }

  function createKanbanCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.draggable = true;
    card.dataset.id = task.id;

    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    const assignee = task.assignee;

    card.innerHTML = `
      <div class="task-card-tags">
        <span class="badge ${priorityClass}">${task.priority}</span>
        ${task.dueDate ? `<span class="text-muted"><i class="fa-solid fa-clock"></i> ${task.dueDate}</span>` : ''}
      </div>
      <h4 class="task-card-title">${escapeHtml(task.title)}</h4>
      <div class="task-card-footer">
        <span class="text-muted"><i class="fa-solid fa-comments"></i> ${task.commentsCount || 0}</span>
        ${assignee ? `
          <div class="avatar-sm" style="background-color: ${assignee.avatarBg};" title="Assigned to ${escapeHtml(assignee.name)}">
            ${getInitials(assignee.name)}
          </div>
        ` : `<span class="text-muted"><i class="fa-solid fa-user-plus"></i></span>`}
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskDetailModal(task);
    });

    return card;
  }

  // --- DRAG AND DROP HANDLERS ---
  function setupDragAndDrop() {
    const cards = document.querySelectorAll('.task-card');
    const wrappers = document.querySelectorAll('.kanban-cards-wrapper');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.id);
        card.classList.add('dragging');
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
    });

    wrappers.forEach(wrapper => {
      wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        wrapper.classList.add('drag-over');
      });

      wrapper.addEventListener('dragleave', () => {
        wrapper.classList.remove('drag-over');
      });

      wrapper.addEventListener('drop', async (e) => {
        e.preventDefault();
        wrapper.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = wrapper.dataset.status;

        if (taskId && newStatus && currentProject) {
          const task = currentProject.tasks.find(t => t.id === taskId);
          if (task && task.status !== newStatus) {
            task.status = newStatus;
            renderKanbanBoard();
            try {
              await apiCall(`/api/tasks/${taskId}`, 'PUT', { status: newStatus });
            } catch (e) {
              loadProjects();
            }
          }
        }
      });
    });
  }

  // --- TASK DETAIL & COMMENT THREAD MODAL ---
  async function openTaskDetailModal(task) {
    currentActiveTask = task;
    document.getElementById('detailTitle').textContent = task.title;
    document.getElementById('detailDescription').textContent = task.description || 'No description provided.';
    document.getElementById('detailPriority').textContent = task.priority;
    document.getElementById('detailPriority').className = `badge priority-${task.priority.toLowerCase()}`;
    document.getElementById('detailStatus').textContent = task.status;
    document.getElementById('detailDueDate').textContent = task.dueDate || 'No due date';

    const assigneeContainer = document.getElementById('detailAssignee');
    if (task.assignee) {
      assigneeContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="avatar-sm" style="background:${task.assignee.avatarBg};">${getInitials(task.assignee.name)}</div>
          <span>${escapeHtml(task.assignee.name)}</span>
        </div>
      `;
    } else {
      assigneeContainer.textContent = 'Unassigned';
    }

    openModal(taskDetailModal);
    loadComments(task.id);
  }

  async function loadComments(taskId) {
    commentsList.innerHTML = '<div class="text-muted">Loading comments...</div>';
    try {
      const comments = await apiCall(`/api/tasks/${taskId}/comments`);
      commentsList.innerHTML = '';
      if (comments.length === 0) {
        commentsList.innerHTML = '<div class="text-muted">No comments yet. Start the conversation!</div>';
      } else {
        comments.forEach(appendCommentUI);
      }
    } catch (e) {}
  }

  function appendCommentUI(c) {
    const existingEmpty = commentsList.querySelector('.text-muted');
    if (existingEmpty) existingEmpty.remove();

    const user = c.user || { name: 'User', avatarBg: '#6366f1' };
    const card = document.createElement('div');
    card.className = 'comment-card';
    card.innerHTML = `
      <div class="avatar-sm" style="background-color: ${user.avatarBg};">${getInitials(user.name)}</div>
      <div class="comment-content">
        <div class="comment-author-row">
          <span class="comment-author-name">${escapeHtml(user.name)}</span>
          <span class="comment-time">${formatTime(c.createdAt)}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>
    `;
    commentsList.prepend(card);
  }

  // --- NOTIFICATIONS SYSTEM ---
  async function loadNotifications() {
    try {
      const notifs = await apiCall('/api/notifications');
      const unreadCount = notifs.filter(n => !n.read).length;

      if (unreadCount > 0) {
        notifBadge.style.display = 'inline-block';
        notifBadge.textContent = unreadCount;
      } else {
        notifBadge.style.display = 'none';
      }

      notifList.innerHTML = '';
      if (notifs.length === 0) {
        notifList.innerHTML = '<div class="empty-state">No notifications</div>';
      } else {
        notifs.forEach(n => {
          const item = document.createElement('div');
          item.className = `notif-item ${n.read ? '' : 'unread'}`;
          item.innerHTML = `
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div>${escapeHtml(n.message)}</div>
            <div class="notif-time">${formatTime(n.createdAt)}</div>
          `;
          notifList.appendChild(item);
        });
      }
    } catch (e) {}
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Auth Tabs
    loginTabBtn.addEventListener('click', () => {
      loginTabBtn.classList.add('active');
      registerTabBtn.classList.remove('active');
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
    });

    registerTabBtn.addEventListener('click', () => {
      registerTabBtn.classList.add('active');
      loginTabBtn.classList.remove('active');
      registerForm.style.display = 'flex';
      loginForm.style.display = 'none';
    });

    // Forms
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    });

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      register(document.getElementById('regName').value, document.getElementById('regEmail').value, document.getElementById('regPassword').value);
    });

    // Quick Demo Accounts
    document.querySelectorAll('.quick-demo-btn, .demo-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        login(email, 'password123');
      });
    });

    // Header Navigation
    document.getElementById('logoHomeBtn').addEventListener('click', openProjectsDashboard);
    document.getElementById('navProjectsBtn').addEventListener('click', openProjectsDashboard);
    backToProjectsBtn.addEventListener('click', openProjectsDashboard);
    logoutBtn.addEventListener('click', logout);

    // Dropdowns
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.parentElement.classList.toggle('active');
      notifDropdown.parentElement.classList.remove('active');
    });

    notifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.parentElement.classList.toggle('active');
      profileDropdown.parentElement.classList.remove('active');
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-wrapper').forEach(w => w.classList.remove('active'));
    });

    markAllReadBtn.addEventListener('click', async () => {
      try {
        await apiCall('/api/notifications/read', 'PUT');
        loadNotifications();
      } catch (e) {}
    });

    // Create Project
    openCreateProjectModalBtn.addEventListener('click', () => openModal(createProjectModal));
    createProjectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('newProjTitle').value;
      const description = document.getElementById('newProjDesc').value;
      const category = document.getElementById('newProjCategory').value;
      const color = document.getElementById('newProjColor').value;

      try {
        const proj = await apiCall('/api/projects', 'POST', { title, description, category, color });
        closeAllModals();
        createProjectForm.reset();
        openProjectBoard(proj.id);
        showToast('Project created successfully!');
      } catch (e) {}
    });

    // Delete Project
    deleteProjectBtn.addEventListener('click', async () => {
      if (!currentProject) return;
      if (confirm(`Are you sure you want to delete "${currentProject.title}"?`)) {
        try {
          await apiCall(`/api/projects/${currentProject.id}`, 'DELETE');
          closeAllModals();
          openProjectsDashboard();
          showToast('Project deleted');
        } catch (e) {}
      }
    });

    // Create / Add Task Card
    openCreateTaskModalBtn.addEventListener('click', () => openCreateTaskModal('To Do'));

    document.querySelectorAll('.column-add-task-btn').forEach(btn => {
      btn.addEventListener('click', () => openCreateTaskModal(btn.dataset.status));
    });

    function openCreateTaskModal(defaultStatus = 'To Do') {
      document.getElementById('taskModalHeading').textContent = 'Create Task Card';
      taskForm.reset();
      document.getElementById('taskEditId').value = '';
      document.getElementById('taskStatus').value = defaultStatus;
      openModal(taskModal);
    }

    taskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentProject) return;

      const taskId = document.getElementById('taskEditId').value;
      const payload = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDesc').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        assigneeId: document.getElementById('taskAssignee').value || null,
        dueDate: document.getElementById('taskDueDate').value || null
      };

      try {
        if (taskId) {
          await apiCall(`/api/tasks/${taskId}`, 'PUT', payload);
          showToast('Task updated');
        } else {
          await apiCall(`/api/projects/${currentProject.id}/tasks`, 'POST', payload);
          showToast('Task card created');
        }
        closeAllModals();
      } catch (e) {}
    });

    // Delete Task in Detail Modal
    document.getElementById('detailDeleteTaskBtn').addEventListener('click', async () => {
      if (!currentActiveTask) return;
      if (confirm('Delete this task card?')) {
        try {
          await apiCall(`/api/tasks/${currentActiveTask.id}`, 'DELETE');
          closeAllModals();
          showToast('Task deleted');
        } catch (e) {}
      }
    });

    // Comment Form
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentActiveTask) return;

      const input = document.getElementById('commentText');
      const text = input.value.trim();
      if (!text) return;

      try {
        const comment = await apiCall(`/api/tasks/${currentActiveTask.id}/comments`, 'POST', { text });
        input.value = '';
        appendCommentUI(comment);
      } catch (e) {}
    });

    // Add Collaborator Member Modal
    openAddMemberModalBtn.addEventListener('click', () => openModal(addMemberModal));
    addMemberForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentProject) return;

      const email = document.getElementById('memberEmailInput').value;
      try {
        await apiCall(`/api/projects/${currentProject.id}/members`, 'POST', { email });
        closeAllModals();
        addMemberForm.reset();
        showToast('Collaborator added to project!');
      } catch (e) {}
    });

    // Filters
    taskPriorityFilter.addEventListener('change', renderKanbanBoard);
    taskAssigneeFilter.addEventListener('change', renderKanbanBoard);
    taskSearchInput.addEventListener('input', renderKanbanBoard);

    // Modal Close buttons
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });
  }

  // --- MODAL UTILS ---
  function openModal(modal) {
    closeAllModals();
    modal.classList.add('active');
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    currentActiveTask = null;
  }

  // --- UTILS ---
  function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  function showToast(message, isError = false) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (isError) toast.style.borderColor = 'var(--rose)';
    toast.innerHTML = `
      <i class="fa-solid ${isError ? 'fa-triangle-exclamation text-danger' : 'fa-circle-info'}"></i>
      <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
