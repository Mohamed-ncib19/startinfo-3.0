import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Clock, CheckCircle, ChevronRight, Star, Users, Award, BarChart, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LessonProgress {
  completed: boolean;
  timeSpent: number;
  attempts: number;
  completedAt?: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  videoPreview?: string;
  progress?: LessonProgress;
}

interface Certificate {
  id: number;
  certificateNumber: string;
  issuedAt: string;
}

const API_BASE_URL = 'http://localhost:5000';

const CourseDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAllCompleted, setIsAllCompleted] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);

  const fetchLessonsAndProgress = async () => {
    try {
      // Fetch lessons
      const lessonsResponse = await fetch(`${API_BASE_URL}/api/courses/${id}/lessons`);
      if (!lessonsResponse.ok) {
        throw new Error('Failed to fetch lessons');
      }
      const lessonsData = await lessonsResponse.json();

      // Fetch progress for each lesson
      const lessonsWithProgress = await Promise.all(
        lessonsData.map(async (lesson: Lesson) => {
          try {
            const progressResponse = await fetch(`${API_BASE_URL}/api/lessons/${lesson.id}/progress`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              return { ...lesson, progress: progressData };
            }
          } catch (error) {
            console.error(`Error fetching progress for lesson ${lesson.id}:`, error);
          }
          return lesson;
        })
      );

      setLessons(lessonsWithProgress);
      
      // Calculate course progress
      const completedLessons = lessonsWithProgress.filter(lesson => lesson.progress?.completed).length;
      const totalLessons = lessonsWithProgress.length;
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      setCourseProgress(progress);
      
      // Check if all lessons are completed
      const allCompleted = lessonsWithProgress.every(lesson => lesson.progress?.completed);
      setIsAllCompleted(allCompleted);

      // If all lessons are completed, check for existing certificate
      if (allCompleted) {
        try {
          const certResponse = await fetch(`${API_BASE_URL}/api/courses/${id}/certificate`);
          if (certResponse.ok) {
            const certData = await certResponse.json();
            setCertificate(certData);
          }
        } catch (error) {
          console.error('Error fetching certificate:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  // Fetch lessons and their progress
  useEffect(() => {
    if (id) {
      fetchLessonsAndProgress();
    }
  }, [id]);

  // Listen for lesson completion events
  useEffect(() => {
    const handleLessonComplete = async (event: MessageEvent) => {
      if (event.data.type === 'LESSON_COMPLETED') {
        await fetchLessonsAndProgress();
      }
    };

    window.addEventListener('message', handleLessonComplete);
    return () => window.removeEventListener('message', handleLessonComplete);
  }, []);

  const toggleLesson = (lessonId: string) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const handleReview = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowReview(true);
  };

  const generateCertificate = async () => {
    try {
      setIsGeneratingCertificate(true);
      const response = await fetch(`${API_BASE_URL}/api/courses/${id}/certificate`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }

      const data = await response.json();
      setCertificate(data);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  // Mock course data - replace with actual API call
  const course = {
    id,
    title: 'Introduction to Arduino',
    description: 'Learn the basics of Arduino programming and electronics through hands-on projects and interactive simulations. Perfect for beginners who want to start their journey in electronics and robotics.',
    progress: courseProgress,
    instructor: {
      name: 'John Doe',
      title: 'Senior Robotics Engineer',
      avatar: '/images/instructor.jpg'
    },
    rating: 4.8,
    students: 1234,
    level: 'Beginner',
    lastUpdated: '2024-02',
    thumbnail: '/images/courses/arduino-intro.jpg',
    lessons: lessons, // Use the fetched lessons with progress
  };

  return (
    <div className="container py-8">
      <div className="grid gap-8">
        {/* Course Header */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Button variant="outline" className="text-white border-white hover:bg-white/20">
                  <Play className="mr-2 h-4 w-4" />
                  Watch Preview
                </Button>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-4">{course.description}</p>
            <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground mb-6">
              <Badge variant="secondary">{course.level}</Badge>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span>{course.rating}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{course.students} students</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Last updated {course.lastUpdated}</span>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Track your progress through the course</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={course.progress} className="mb-2" />
                <p className="text-sm text-muted-foreground mb-4">{course.progress}% Complete</p>
                {isAllCompleted ? (
                  <div className="space-y-4">
                    {certificate ? (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            <span className="font-medium">Certificate Earned!</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/api/certificates/${certificate.id}/download`} download>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Certificate #{certificate.certificateNumber}
                          <br />
                          Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={generateCertificate}
                        disabled={isGeneratingCertificate}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        {isGeneratingCertificate ? 'Generating...' : 'Get Certificate'}
                      </Button>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setShowReview(true)}>
                      <BarChart className="w-4 h-4 mr-2" />
                      Review Course
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full">
                    Continue Learning
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium">{course.instructor.name}</h3>
                    <p className="text-sm text-muted-foreground">{course.instructor.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <Tabs defaultValue="content" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="content">Course Content</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            <div className="grid gap-4">
              {course.lessons.map((lesson) => (
                <motion.div
                  key={lesson.id}
                  initial={false}
                  animate={{ height: expandedLesson === lesson.id ? 'auto' : 'auto' }}
                >
                  <Card className="overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleLesson(lesson.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {lesson.progress?.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                          )}
                          <div>
                            <h3 className="font-medium">{lesson.title}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{lesson.duration}</span>
                            </div>
                          </div>
                        </div>
                        {lesson.progress?.completed ? (
                          <Button variant="outline" onClick={() => handleReview(lesson)}>
                            <BarChart className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        ) : (
                          <Button variant="default" asChild>
                            <Link to={`/courses/${course.id}/lessons/${lesson.id}`}>
                              <Play className="w-4 h-4 mr-2" />
                              Start
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    {expandedLesson === lesson.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="px-4 pb-4"
                      >
                        <p className="text-muted-foreground mb-4">{lesson.description}</p>
                        {lesson.videoPreview && (
                          <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
                            <iframe
                              src={lesson.videoPreview}
                              className="w-full h-full"
                              title={`Preview of ${lesson.title}`}
                              allowFullScreen
                            />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="prose dark:prose-invert max-w-none p-6">
                <h2>About this course</h2>
                <p>
                  This comprehensive Arduino course is designed for beginners who want to learn
                  electronics and programming. Through hands-on projects and interactive simulations,
                  you'll gain practical experience in:
                </p>
                <ul>
                  <li>Understanding basic electronics concepts</li>
                  <li>Programming with the Arduino IDE</li>
                  <li>Working with various sensors and actuators</li>
                  <li>Building complete Arduino projects</li>
                </ul>
                <h2>What you'll learn</h2>
                <ul>
                  <li>Set up your Arduino development environment</li>
                  <li>Write and upload Arduino sketches</li>
                  <li>Work with digital and analog signals</li>
                  <li>Build interactive electronic projects</li>
                </ul>
                <h2>Requirements</h2>
                <ul>
                  <li>No prior programming experience required</li>
                  <li>Basic understanding of electronics (helpful but not required)</li>
                  <li>Computer with internet access</li>
                  <li>Arduino UNO board (recommended for hands-on practice)</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Reviews coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Course Review: {course.title}</DialogTitle>
            <DialogDescription>
              Congratulations on completing the course! Here's your progress summary:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Lessons</span>
              <span className="text-sm font-medium">{lessons.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed Lessons</span>
              <span className="text-sm font-medium">{lessons.filter(l => l.progress?.completed).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Time Spent</span>
              <span className="text-sm font-medium">
                {Math.floor(lessons.reduce((total, l) => total + (l.progress?.timeSpent || 0), 0) / 60)} min
              </span>
            </div>
            {!certificate && (
              <Button 
                className="w-full" 
                onClick={generateCertificate}
                disabled={isGeneratingCertificate}
              >
                <Award className="w-4 h-4 mr-2" />
                {isGeneratingCertificate ? 'Generating Certificate...' : 'Get Your Certificate'}
              </Button>
            )}
            <Button className="w-full" variant="outline" asChild>
              <Link to="/courses">
                Back to Courses
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetail;
