const express = require('express');
const router = express.Router();
const { getData, saveData } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Helper to check user membership in project
function isUserProjectMember(db, projectId, userId) {
  return db.project_members.some(pm => pm.projectId === projectId && pm.userId === userId);
}

// GET /api/projects - List projects for logged in user
router.get('/', authenticateToken, (req, res) => {
  const db = getData();
  const userId = req.user.id;

  const memberRecords = db.project_members.filter(pm => pm.userId === userId);
  const projectIds = memberRecords.map(pm => pm.projectId);

  const projects = db.projects
    .filter(p => projectIds.includes(p.id))
    .map(p => {
      const members = db.project_members
        .filter(pm => pm.projectId === p.id)
        .map(pm => {
          const user = db.users.find(u => u.id === pm.userId);
          return user ? { id: user.id, name: user.name, email: user.email, avatarBg: user.avatarBg, role: pm.role } : null;
        })
        .filter(Boolean);

      const tasks = db.tasks.filter(t => t.projectId === p.id);
      const completedTasks = tasks.filter(t => t.status === 'Done').length;

      return {
        ...p,
        members,
        taskStats: {
          total: tasks.length,
          completed: completedTasks,
          progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
        }
      };
    });

  res.json(projects);
});

// POST /api/projects - Create project
router.post('/', authenticateToken, (req, res) => {
  const { title, description, category, color } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const db = getData();
  const userId = req.user.id;

  const newProject = {
    id: `proj-${Date.now()}`,
    title: title.trim(),
    description: (description || '').trim(),
    category: category || 'General',
    color: color || '#4f46e5',
    ownerId: userId,
    createdAt: new Date().toISOString()
  };

  const newMember = {
    id: `pm-${Date.now()}`,
    projectId: newProject.id,
    userId: userId,
    role: 'Owner',
    joinedAt: new Date().toISOString()
  };

  db.projects.push(newProject);
  db.project_members.push(newMember);
  saveData(db);

  const user = db.users.find(u => u.id === userId);
  const responseData = {
    ...newProject,
    members: user ? [{ id: user.id, name: user.name, email: user.email, avatarBg: user.avatarBg, role: 'Owner' }] : [],
    taskStats: { total: 0, completed: 0, progress: 0 }
  };

  // Broadcast if websocket IO available
  const io = req.app.get('io');
  if (io) {
    io.emit('project_created', responseData);
  }

  res.status(201).json(responseData);
});

// GET /api/projects/:id - Get project detail
router.get('/:id', authenticateToken, (req, res) => {
  const db = getData();
  const projectId = req.params.id;
  const userId = req.user.id;

  if (!isUserProjectMember(db, projectId, userId)) {
    return res.status(403).json({ error: 'Access denied to this project' });
  }

  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const members = db.project_members
    .filter(pm => pm.projectId === projectId)
    .map(pm => {
      const user = db.users.find(u => u.id === pm.userId);
      return user ? { id: user.id, name: user.name, email: user.email, avatarBg: user.avatarBg, role: pm.role } : null;
    })
    .filter(Boolean);

  const tasks = db.tasks
    .filter(t => t.projectId === projectId)
    .map(t => {
      const assignee = db.users.find(u => u.id === t.assigneeId);
      const commentsCount = db.comments.filter(c => c.taskId === t.id).length;
      return {
        ...t,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatarBg: assignee.avatarBg } : null,
        commentsCount
      };
    });

  const completedTasks = tasks.filter(t => t.status === 'Done').length;

  res.json({
    ...project,
    members,
    tasks,
    taskStats: {
      total: tasks.length,
      completed: completedTasks,
      progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
    }
  });
});

// PUT /api/projects/:id - Edit project
router.put('/:id', authenticateToken, (req, res) => {
  const db = getData();
  const projectId = req.params.id;
  const userId = req.user.id;

  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.ownerId !== userId) {
    return res.status(403).json({ error: 'Only the project owner can modify settings' });
  }

  const { title, description, category, color } = req.body;
  if (title) project.title = title.trim();
  if (description !== undefined) project.description = description.trim();
  if (category) project.category = category;
  if (color) project.color = color;

  saveData(db);

  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId}`).emit('project_updated', project);
  }

  res.json(project);
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', authenticateToken, (req, res) => {
  const db = getData();
  const projectId = req.params.id;
  const userId = req.user.id;

  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.ownerId !== userId) {
    return res.status(403).json({ error: 'Only the project owner can delete this project' });
  }

  db.projects = db.projects.filter(p => p.id !== projectId);
  db.project_members = db.project_members.filter(pm => pm.projectId !== projectId);
  
  const projectTasks = db.tasks.filter(t => t.projectId === projectId);
  const taskIds = projectTasks.map(t => t.id);

  db.tasks = db.tasks.filter(t => t.projectId !== projectId);
  db.comments = db.comments.filter(c => !taskIds.includes(c.taskId));

  saveData(db);

  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId}`).emit('project_deleted', { projectId });
  }

  res.json({ message: 'Project deleted successfully' });
});

// POST /api/projects/:id/members - Invite/Add member
router.post('/:id/members', authenticateToken, (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'User email is required' });
  }

  const db = getData();
  const projectId = req.params.id;
  const userId = req.user.id;

  if (!isUserProjectMember(db, projectId, userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const targetUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!targetUser) {
    return res.status(404).json({ error: 'No user registered with this email' });
  }

  const alreadyMember = db.project_members.some(pm => pm.projectId === projectId && pm.userId === targetUser.id);
  if (alreadyMember) {
    return res.status(400).json({ error: 'User is already a member of this project' });
  }

  const newMember = {
    id: `pm-${Date.now()}`,
    projectId,
    userId: targetUser.id,
    role: 'Member',
    joinedAt: new Date().toISOString()
  };

  db.project_members.push(newMember);

  // Send Notification
  const notification = {
    id: `notif-${Date.now()}`,
    userId: targetUser.id,
    title: 'Added to Project',
    message: `${req.user.name} added you to project "${project.title}"`,
    read: false,
    link: `/projects/${projectId}`,
    createdAt: new Date().toISOString()
  };

  db.notifications.push(notification);
  saveData(db);

  const io = req.app.get('io');
  if (io) {
    const memberObj = {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatarBg: targetUser.avatarBg,
      role: 'Member'
    };
    io.to(`project_${projectId}`).emit('member_added', { projectId, member: memberObj });
    io.to(`user_${targetUser.id}`).emit('notification', notification);
  }

  res.status(201).json({
    id: targetUser.id,
    name: targetUser.name,
    email: targetUser.email,
    avatarBg: targetUser.avatarBg,
    role: 'Member'
  });
});

// DELETE /api/projects/:id/members/:userId - Remove member
router.delete('/:id/members/:targetUserId', authenticateToken, (req, res) => {
  const db = getData();
  const projectId = req.params.id;
  const targetUserId = req.params.targetUserId;
  const currentUserId = req.user.id;

  const project = db.projects.find(p => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.ownerId !== currentUserId && currentUserId !== targetUserId) {
    return res.status(403).json({ error: 'Only project owner can remove other members' });
  }

  if (targetUserId === project.ownerId) {
    return res.status(400).json({ error: 'Project owner cannot be removed' });
  }

  db.project_members = db.project_members.filter(pm => !(pm.projectId === projectId && pm.userId === targetUserId));
  saveData(db);

  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId}`).emit('member_removed', { projectId, userId: targetUserId });
  }

  res.json({ message: 'Member removed from project' });
});

module.exports = router;
