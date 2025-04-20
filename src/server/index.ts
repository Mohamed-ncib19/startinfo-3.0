//server/index.ts : 

import express from 'express';
import cors from 'cors';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const app = express();
const PORT = 5000;

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000'], // Allow Vite dev server ports
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());

// Verify database connection on startup
async function verifyDatabaseConnection() {
  try {
    console.log('Verifying database connection...');
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Test query to verify User table access
    const userCount = await prisma.user.count();
    console.log(`Database connection verified. Current user count: ${userCount}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'All fields are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ status: 'error', message: 'Email already in use.' });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: { name, email, password }, // You should hash the password in production!
    });

    res.status(201).json({ status: 'success', user: newUser });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Email and password are required.',
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.',
      });
    }

    // Generate a random token (you can store it if needed for sessions)
    const token = crypto.randomBytes(32).toString('hex');

    res.status(200).json({
      ok: true,
      status: 'success',
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error.',
    });
  }
});




// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    console.log('Fetching courses...');
    const courses = await prisma.course.findMany({
      include: {
        lessons: true,
      },
    });
    console.log('Courses fetched:', courses);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    console.log('Fetching course with ID:', req.params.id);
    const course = await prisma.course.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        lessons: true,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log('Course fetched:', course);
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});



// Get lesson progress
app.get('/api/lessons/:lessonId/progress', async (req, res) => {
  try {
    // Ensure default user exists
    const defaultUser = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'default@startinfo.com',
        password: 'defaultpass123',
        name: 'Default User',
        role: 'STUDENT',
        verified: true
      }
    });

    const userId = defaultUser.id;
    const lessonId = parseInt(req.params.lessonId);
    
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    res.json(progress || { completed: false, timeSpent: 0, attempts: 0 });
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    res.status(500).json({ error: 'Failed to fetch lesson progress' });
  }
});

// Update lesson progress
app.post('/api/lessons/:lessonId/progress', async (req, res) => {
  try {
    console.log('Received progress update request:', {
      params: req.params,
      body: req.body
    });

    // Ensure default user exists
    const defaultUser = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        email: 'default@startinfo.com',
        password: 'defaultpass123',
        name: 'Default User',
        role: 'STUDENT',
        verified: true
      }
    });

    const userId = defaultUser.id;
    const lessonId = parseInt(req.params.lessonId);
    const { completed, timeSpent } = req.body;

    if (isNaN(lessonId)) {
      console.error('Invalid lesson ID:', req.params.lessonId);
      return res.status(400).json({ error: 'Invalid lesson ID' });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      console.error('Lesson not found:', lessonId);
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (typeof completed !== 'boolean' || typeof timeSpent !== 'number') {
      console.error('Invalid progress data:', { completed, timeSpent });
      return res.status(400).json({ error: 'Invalid progress data' });
    }

    console.log('Updating progress for lesson:', {
      lessonId: lesson.id,
      lessonTitle: lesson.title
    });

    // Update progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
        timeSpent: Math.max(timeSpent, 0),
        attempts: {
          increment: 1
        }
      },
      create: {
        userId,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
        timeSpent: Math.max(timeSpent, 0),
        attempts: 1
      }
    });

    console.log('Progress updated successfully:', progress);
    res.json(progress);
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(500).json({ 
      error: 'Failed to update lesson progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get lesson by ID
app.get('/api/courses/:courseId/lessons/:lessonId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);

    console.log('Fetching lesson:', { courseId, lessonId });

    const lesson = await prisma.lesson.findUnique({
      where: {
        id: lessonId,
        courseId: courseId
      },
      include: {
        resources: true,
        simulator: true
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    console.log('Raw lesson data:', JSON.stringify(lesson, null, 2));
    console.log('Simulator data:', lesson.simulator);

    // Transform simulator data if it exists
    let simulatorConfig = null;
    if (lesson.simulator) {
      try {
        const config = JSON.parse(lesson.simulator.config);
        const components = JSON.parse(lesson.simulator.components);
        simulatorConfig = {
          files: config.files || {},
          parts: components.parts || [],
          connections: components.connections || []
        };
        console.log('Transformed simulator config:', JSON.stringify(simulatorConfig, null, 2));
      } catch (error) {
        console.error('Error parsing simulator data:', error);
      }
    }

    // Get next and previous lesson IDs
    const [prevLesson, nextLesson] = await Promise.all([
      prisma.lesson.findFirst({
        where: {
          courseId,
          order: { lt: lesson.order }
        },
        orderBy: { order: 'desc' },
        select: { id: true }
      }),
      prisma.lesson.findFirst({
        where: {
          courseId,
          order: { gt: lesson.order }
        },
        orderBy: { order: 'asc' },
        select: { id: true }
      })
    ]);

    // Remove the simulator field and add simulatorConfig
    const { simulator, ...lessonWithoutSimulator } = lesson;
    
    const response = {
      ...lessonWithoutSimulator,
      simulatorConfig,
      nextLessonId: nextLesson?.id.toString() || null,
      prevLessonId: prevLesson?.id.toString() || null
    };

    console.log('Final response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Get all lessons for a course
app.get('/api/courses/:courseId/lessons', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        courseId: courseId,
      },
      orderBy: {
        order: 'asc',
      },
      include: {
        resources: true,
        simulator: true,
      },
    });

    if (!lessons) {
      return res.status(404).json({ error: 'No lessons found for this course' });
    }

    // Transform lessons to include simulator config if it exists
    const transformedLessons = lessons.map(lesson => {
      let simulatorConfig = null;
      if (lesson.simulator) {
        try {
          const config = JSON.parse(lesson.simulator.config);
          const components = JSON.parse(lesson.simulator.components);
          simulatorConfig = {
            files: config.files || {},
            parts: components.parts || [],
            connections: components.connections || []
          };
        } catch (error) {
          console.error('Error parsing simulator data:', error);
        }
      }

      const { simulator, ...lessonWithoutSimulator } = lesson;
      return {
        ...lessonWithoutSimulator,
        simulatorConfig
      };
    });

    res.json(transformedLessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get user's certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const userId = 1; // TODO: Get from auth context
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            title: true,
            description: true,
            level: true
          }
        }
      }
    });
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Download certificate
app.get('/api/certificates/:id/download', async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        course: true,
        user: true
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // TODO: Generate PDF certificate
    // For now, return a placeholder
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateNumber}.pdf`);
    res.send('Certificate PDF content');
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
});

// Generate certificate when course is completed
app.post('/api/courses/:courseId/certificate', async (req, res) => {
  try {
    const userId = 1;
    const courseId = parseInt(req.params.courseId);

    console.log('Generating certificate for:', { userId, courseId });

    if (isNaN(courseId)) {
      console.error('Invalid course ID:', req.params.courseId);
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // First check if the course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      console.error('Course not found:', courseId);
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log('Course found:', course);

    // Get all lessons for the course
    const lessons = await prisma.lesson.findMany({
      where: { courseId }
    });

    console.log('Lessons found:', lessons.length);

    if (!lessons.length) {
      console.error('No lessons found for course:', courseId);
      return res.status(400).json({ error: 'Course has no lessons' });
    }

    // Get progress for all lessons
    const progress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: {
          in: lessons.map(lesson => lesson.id)
        }
      }
    });

    console.log('Lesson progress:', progress);

    // Check if all lessons are completed
    const allLessonsCompleted = lessons.every(lesson => {
      const lessonProgress = progress.find(p => p.lessonId === lesson.id);
      const isCompleted = lessonProgress?.completed;
      console.log(`Lesson ${lesson.id} completed:`, isCompleted);
      return isCompleted;
    });

    if (!allLessonsCompleted) {
      console.error('Not all lessons are completed');
      return res.status(400).json({ 
        error: 'Course not completed',
        details: 'Some lessons are not marked as completed'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId,
        courseId
      }
    });

    if (existingCertificate) {
      console.error('Certificate already exists:', existingCertificate);
      return res.status(400).json({ error: 'Certificate already exists' });
    }

    // Generate certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        issuedAt: new Date()
      },
      include: {
        course: true
      }
    });

    console.log('Certificate generated successfully:', certificate);
    res.json(certificate);
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ 
      error: 'Failed to generate certificate',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Received registration request body:', req.body);
    const { email, password } = req.body;

    console.log('Parsed registration data:', { email });

    // Validate required fields
    if (!email || !password) {
      console.error('Missing required fields:', { email: !!email, password: !!password });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      console.error('Password too short');
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    console.log('Checking if user exists:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.error('User already exists:', email);
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate a default name from email
    const defaultName = email.split('@')[0];

    // Hash the password
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('Attempting to create user with:', {
      email,
      name: defaultName,
      role: 'STUDENT',
      verified: false
    });

    try {
      // Create new user
      console.log('Creating user in database...');
      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: defaultName,
          role: 'STUDENT', // Default role
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('User created successfully:', { 
        id: newUser.id, 
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      });

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (dbError) {
      console.error('Database error during user creation:', dbError);
      if (dbError instanceof Error) {
        console.error('Database error details:', {
          name: dbError.name,
          message: dbError.message,
          stack: dbError.stack
        });
      }
      throw dbError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error registering user:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ 
      error: 'Failed to register user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await verifyDatabaseConnection();
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
}); 