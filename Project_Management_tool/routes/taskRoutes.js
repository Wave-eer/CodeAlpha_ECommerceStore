const express = require('express');
const router = express.Router();
const { getData, saveData } = require('../db');
const { authenticateToken } = require('../middleware/auth');

function isUserProjectMember(db, projectId, userId) {
  return db.project_members.some(pm => pm.projectId === projectId && pm.userId === userId);
}

// POST /api/projects/:projectId/tasks - Create task
router.post('/projects/:projectId/tasks', authenticateToken, (req, res) => {
  const db = getData();
  const projectId = req.params.projectId;
  const currentUserId = req.user.id;

  if (!isUserProjectMember(db, projectId, currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, status, priority, assigneeId, dueDate } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Task title is required' });
  }

  const project = db.projects.find(p => p.id === projectId);

  const newTask = {
    id: `task-${Date.now()}`,
    projectId,
    title: title.trim(),
    description: (description || '').trim(),
    status: status || 'To Do',
    priority: priority || 'Medium',
    assigneeId: assigneeId || null,
    creatorId: currentUserId,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString()
  };

  db.tasks.push(newTask);

  // Send Notification if assigned to someone else
  if (assigneeId && assigneeId !== currentUserId) {
    const notification = {
      id: `notif-${Date.now()}`,
      userId: assigneeId,
      title: 'Task Assigned to You',
      message: `${req.user.name} assigned you to "${newTask.title}" in project "${project ? project.title : 'Project'}"`,
      read: false,
      link: `/projects/${projectId}`,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notification);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${assigneeId}`).emit('notification', notification);
    }
  }

  saveData(db);

  const assignee = db.users.find(u => u.id === newTask.assigneeId);
  const responseData = {
    ...newTask,
    assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatarBg: assignee.avatarBg } : null,
    commentsCount: 0
  };

  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId}`).emit('task_created', responseData);
  }

  res.status(201).json(responseData);
});

// PUT /api/tasks/:id - Update task details or move status
router.put('/tasks/:id', authenticateToken, (req, res) => {
  const db = getData();
  const taskId = req.params.id;
  const currentUserId = req.user.id;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!isUserProjectMember(db, task.projectId, currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { title, description, status, priority, assigneeId, dueDate } = req.body;

  const prevAssigneeId = task.assigneeId;

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description.trim();
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (assigneeId !== undefined) task.assigneeId = assigneeId;
  if (dueDate !== undefined) task.dueDate = dueDate;

  // If newly assigned
  if (assigneeId && assigneeId !== prevAssigneeId && assigneeId !== currentUserId) {
    const project = db.projects.find(p => p.id === task.projectId);
    const notification = {
      id: `notif-${Date.now()}`,
      userId: assigneeId,
      title: 'Task Reassigned',
      message: `${req.user.name} assigned you to "${task.title}"`,
      read: false,
      link: `/projects/${task.projectId}`,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notification);

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${assigneeId}`).emit('notification', notification);
    }
  }

  saveData(db);

  const assignee = db.users.find(u => u.id === task.assigneeId);
  const commentsCount = db.comments.filter(c => c.taskId === task.id).length;

  const responseData = {
    ...task,
    assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatarBg: assignee.avatarBg } : null,
    commentsCount
  };

  const io = req.app.get('io');
  if (io) {
    io.to(`project_${task.projectId}`).emit('task_updated', responseData);
  }

  res.json(responseData);
});

// DELETE /api/tasks/:id - Delete task
router.delete('/tasks/:id', authenticateToken, (req, res) => {
  const db = getData();
  const taskId = req.params.id;
  const currentUserId = req.user.id;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!isUserProjectMember(db, task.projectId, currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const projectId = task.projectId;

  db.tasks = db.tasks.filter(t => t.id !== taskId);
  db.comments = db.comments.filter(c => c.taskId !== taskId);
  saveData(db);

  const io = req.app.get('io');
  if (io) {
    io.to(`project_${projectId}`).emit('task_deleted', { taskId, projectId });
  }

  res.json({ message: 'Task deleted' });
});

// GET /api/tasks/:id/comments - List comments
router.get('/tasks/:id/comments', authenticateToken, (req, res) => {
  const db = getData();
  const taskId = req.params.id;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!isUserProjectMember(db, task.projectId, req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const comments = db.comments
    .filter(c => c.taskId === taskId)
    .map(c => {
      const user = db.users.find(u => u.id === c.userId);
      return {
        ...c,
        user: user ? { id: user.id, name: user.name, email: user.email, avatarBg: user.avatarBg } : null
      };
    });

  res.json(comments);
});

// POST /api/tasks/:id/comments - Add comment
router.post('/tasks/:id/comments', authenticateToken, (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const db = getData();
  const taskId = req.params.id;
  const currentUserId = req.user.id;

  const task = db.tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!isUserProjectMember(db, task.projectId, currentUserId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const newComment = {
    id: `comm-${Date.now()}`,
    taskId,
    userId: currentUserId,
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  db.comments.push(newComment);

  // Notify assignee or creator if they are not commenter
  const notifyUserIds = new Set();
  if (task.assigneeId && task.assigneeId !== currentUserId) notifyUserIds.add(task.assigneeId);
  if (task.creatorId && task.creatorId !== currentUserId) notifyUserIds.add(task.creatorId);

  const io = req.app.get('io');
  notifyUserIds.forEach(targetId => {
    const notification = {
      id: `notif-${Date.now()}-${targetId}`,
      userId: targetId,
      title: 'New Task Comment',
      message: `${req.user.name} commented on "${task.title}": "${text.trim().substring(0, 40)}..."`,
      read: false,
      link: `/projects/${task.projectId}`,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notification);
    if (io) {
      io.to(`user_${targetId}`).emit('notification', notification);
    }
  });

  saveData(db);

  const user = db.users.find(u => u.id === currentUserId);
  const responseData = {
    ...newComment,
    user: user ? { id: user.id, name: user.name, email: user.email, avatarBg: user.avatarBg } : null
  };

  if (io) {
    io.to(`project_${task.projectId}`).emit('comment_added', { taskId, comment: responseData });
  }

  res.status(201).json(responseData);
});

// DELETE /api/comments/:id - Delete comment
router.delete('/comments/:id', authenticateToken, (req, res) => {
  const db = getData();
  const commentId = req.params.id;
  const currentUserId = req.user.id;

  const comment = db.comments.find(c => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (comment.userId !== currentUserId) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }

  const task = db.tasks.find(t => t.id === comment.taskId);

  db.comments = db.comments.filter(c => c.id !== commentId);
  saveData(db);

  const io = req.app.get('io');
  if (io && task) {
    io.to(`project_${task.projectId}`).emit('comment_deleted', { taskId: task.id, commentId });
  }

  res.json({ message: 'Comment deleted' });
});

module.exports = router;
