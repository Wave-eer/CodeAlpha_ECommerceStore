const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, 'data.json');

// Default Database Schema
const initialData = {
  users: [],
  projects: [],
  project_members: [],
  tasks: [],
  comments: [],
  notifications: [],
  activity_logs: []
};

// Ensure database file exists with initial schema
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    saveData(seedInitialData());
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      JSON.parse(content);
    } catch (e) {
      console.warn('Database file corrupted, re-seeding...');
      saveData(seedInitialData());
    }
  }
}

function getData() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return initialData;
  }
}

function saveData(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function seedInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const demoUsers = [
    {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex@codealpha.com',
      password: passwordHash,
      avatarBg: '#4f46e5',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-2',
      name: 'Sarah Chen',
      email: 'sarah@codealpha.com',
      password: passwordHash,
      avatarBg: '#059669',
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-3',
      name: 'Marcus Vance',
      email: 'marcus@codealpha.com',
      password: passwordHash,
      avatarBg: '#d97706',
      createdAt: new Date().toISOString()
    }
  ];

  const demoProjects = [
    {
      id: 'proj-1',
      title: 'E-Commerce Store Redesign',
      description: 'Revamping the storefront UI, cart system, and payment checkout flow.',
      category: 'Development',
      color: '#4f46e5',
      ownerId: 'user-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'proj-2',
      title: 'Mobile App Launch',
      description: 'Preparing iOS & Android apps for public release and app store review.',
      category: 'Mobile',
      color: '#059669',
      ownerId: 'user-2',
      createdAt: new Date().toISOString()
    }
  ];

  const demoMembers = [
    { id: 'pm-1', projectId: 'proj-1', userId: 'user-1', role: 'Owner', joinedAt: new Date().toISOString() },
    { id: 'pm-2', projectId: 'proj-1', userId: 'user-2', role: 'Member', joinedAt: new Date().toISOString() },
    { id: 'pm-3', projectId: 'proj-1', userId: 'user-3', role: 'Member', joinedAt: new Date().toISOString() },
    { id: 'pm-4', projectId: 'proj-2', userId: 'user-2', role: 'Owner', joinedAt: new Date().toISOString() },
    { id: 'pm-5', projectId: 'proj-2', userId: 'user-1', role: 'Member', joinedAt: new Date().toISOString() }
  ];

  const demoTasks = [
    {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Design New Navigation & Header',
      description: 'Create responsive navbar with mega-menu dropdowns and modern search bar.',
      status: 'In Progress',
      priority: 'High',
      assigneeId: 'user-2',
      creatorId: 'user-1',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-2',
      projectId: 'proj-1',
      title: 'Setup Stripe & PayPal Checkout Integration',
      description: 'Integrate Webhooks, handles payment intents and receipt generation.',
      status: 'To Do',
      priority: 'Urgent',
      assigneeId: 'user-1',
      creatorId: 'user-1',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-3',
      projectId: 'proj-1',
      title: 'Optimize Product Image Loading & CWV',
      description: 'Implement responsive srcset, lazy loading, and WebP format converting.',
      status: 'In Review',
      priority: 'Medium',
      assigneeId: 'user-3',
      creatorId: 'user-2',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-4',
      projectId: 'proj-1',
      title: 'Setup User Registration & Auth API',
      description: 'JWT Auth token generation, bcrypt password hashing, and user sessions.',
      status: 'Done',
      priority: 'High',
      assigneeId: 'user-1',
      creatorId: 'user-1',
      dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ];

  const demoComments = [
    {
      id: 'comm-1',
      taskId: 'task-1',
      userId: 'user-1',
      text: 'Figma prototypes are ready for review! Please test mobile responsiveness.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'comm-2',
      taskId: 'task-1',
      userId: 'user-2',
      text: 'Looks awesome! Working on the CSS implementation now.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  const demoNotifications = [
    {
      id: 'notif-1',
      userId: 'user-2',
      title: 'New Task Assigned',
      message: 'Alex Johnson assigned you to "Design New Navigation & Header"',
      read: false,
      link: '/projects/proj-1',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    }
  ];

  return {
    users: demoUsers,
    projects: demoProjects,
    project_members: demoMembers,
    tasks: demoTasks,
    comments: demoComments,
    notifications: demoNotifications,
    activity_logs: []
  };
}

initDb();

module.exports = {
  initDb,
  getData,
  saveData
};
