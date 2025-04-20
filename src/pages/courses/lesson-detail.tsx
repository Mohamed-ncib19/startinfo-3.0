import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, BookOpen, Code, Play, Pause, RotateCw, BarChart, Award, Download, Share } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface SimulatorConfig {
  files: {
    [key: string]: string;
  };
  parts: Array<{
    type: string;
    id: string;
    top: number;
    left: number;
    attrs?: { [key: string]: string };
  }>;
  connections: Array<string[]>;
  wokwiId?: string;
}

interface LessonProgress {
  completed: boolean;
  timeSpent: number;
  attempts: number;
  completedAt?: string;
}

interface Resource {
  title: string;
  url: string;
}

interface Certificate {
  id: number;
  certificateNumber: string;
  issuedAt: string;
  userName: string;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isPublished: boolean;
  courseId: number;
  nextLessonId: string | null;
  prevLessonId: string | null;
  objectives: string[];
  hints: string[];
  resources: Resource[];
  simulatorConfig: SimulatorConfig | null;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = 'http://localhost:5000';

const LessonDetail = () => {
  const { courseId, lessonId } = useParams();
  const [activeTab, setActiveTab] = useState('content');
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [progress, setProgress] = useState<LessonProgress>({ 
    completed: false, 
    timeSpent: 0, 
    attempts: 0,
    completedAt: undefined
  });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    // Fetch lesson data
    const fetchLesson = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate IDs
        if (!courseId || !lessonId) {
          throw new Error('Invalid course or lesson ID');
        }

        const numericCourseId = parseInt(courseId);
        const numericLessonId = parseInt(lessonId);

        if (isNaN(numericCourseId) || isNaN(numericLessonId)) {
          throw new Error('Invalid course or lesson ID format');
        }

        console.log('Fetching lesson:', { courseId: numericCourseId, lessonId: numericLessonId });
        const response = await fetch(`${API_BASE_URL}/api/courses/${numericCourseId}/lessons/${numericLessonId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch lesson');
        }

        const data = await response.json();
        console.log('Raw lesson data received:', JSON.stringify(data, null, 2));
        console.log('Simulator config:', data.simulatorConfig);
        
        if (!data) {
          throw new Error('No lesson data received');
        }

        setLesson(data);
        setNextLessonId(data.nextLessonId);
      } catch (error) {
        console.error('Error fetching lesson:', error);
        setError(error instanceof Error ? error.message : 'Failed to load lesson. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [courseId, lessonId]);

  useEffect(() => {
    // Fetch lesson progress
    const fetchProgress = async () => {
      try {
        if (!lessonId) return;

        const numericLessonId = parseInt(lessonId);
        if (isNaN(numericLessonId)) return;

        const response = await fetch(`${API_BASE_URL}/api/lessons/${numericLessonId}/progress`);
        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }
        const data = await response.json();
        setProgress(data);
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
  }, [lessonId]);

  useEffect(() => {
    // Start timer when component mounts
    setStartTime(new Date());

    // Cleanup timer when component unmounts
    return () => {
      if (startTime) {
        const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        updateProgress(timeSpent);
      }
    };
  }, []);

  const updateProgress = async (timeSpent: number) => {
    try {
      if (!lessonId) return;

      const numericLessonId = parseInt(lessonId);
      if (isNaN(numericLessonId)) return;

      const response = await fetch(`${API_BASE_URL}/api/lessons/${numericLessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          timeSpent,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update progress');
      }
      const data = await response.json();
      setProgress(data);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleComplete = async () => {
    try {
      console.log('Starting lesson completion...');
      setIsCompleting(true);
      
      if (!lessonId || !courseId) {
        console.error('Missing IDs:', { lessonId, courseId });
        throw new Error('Missing lesson or course ID');
      }

      const numericLessonId = parseInt(lessonId);
      const numericCourseId = parseInt(courseId);
      
      if (isNaN(numericLessonId) || isNaN(numericCourseId)) {
        console.error('Invalid IDs:', { numericLessonId, numericCourseId });
        throw new Error('Invalid lesson or course ID');
      }

      console.log('Sending completion request:', {
        lessonId: numericLessonId,
        courseId: numericCourseId,
        timeSpent: startTime 
          ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
          : progress.timeSpent
      });

      const response = await fetch(`${API_BASE_URL}/api/lessons/${numericLessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          timeSpent: startTime 
            ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
            : progress.timeSpent
        }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update progress');
      }

      setProgress(responseData);
      setShowReview(true);

      // Notify parent window about completion
      const message = { 
        type: 'LESSON_COMPLETED', 
        lessonId: numericLessonId,
        courseId: numericCourseId
      };
      console.log('Sending completion message:', message);
      
      if (window.parent) {
        window.parent.postMessage(message, '*');
      }

      // Check if all lessons are completed
      console.log('Checking for course completion...');
      const certResponse = await fetch(`${API_BASE_URL}/api/courses/${numericCourseId}/certificate`, {
        method: 'POST',
      });

      console.log('Certificate response status:', certResponse.status);
      if (certResponse.ok) {
        const certData = await certResponse.json();
        console.log('Certificate data:', certData);
        if (certData && !certData.error) {
          setShowCertificate(true);
          setCertificate(certData);
        }
      }

      console.log('Lesson completion successful!');
    } catch (error) {
      console.error('Error completing lesson:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete lesson. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNextLesson = () => {
    if (nextLessonId) {
      window.location.href = `/courses/${courseId}/lessons/${nextLessonId}`;
    } else {
      window.location.href = `/courses/${courseId}`;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Navigation Skeleton */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4"
          >
            <Skeleton className="h-10 w-32 bg-primary/20" />
            <div className="ml-auto flex items-center gap-4">
              <Skeleton className="h-10 w-40 bg-primary/20" />
              <Skeleton className="h-10 w-40 bg-primary/20" />
            </div>
          </motion.div>

          {/* Content Skeleton */}
          <div className="grid md:grid-cols-[1fr_300px] gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-8"
            >
              {/* Title and Duration */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-10 w-96 bg-primary/20" />
                  <Skeleton className="h-10 w-32 ml-auto bg-primary/20" />
                </div>
                <Skeleton className="h-6 w-64 bg-primary/20" />
              </div>

              {/* Tabs */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-32 bg-primary/20" />
                  <Skeleton className="h-12 w-32 bg-primary/20" />
                </div>
                <Skeleton className="h-[500px] w-full bg-primary/20" />
              </div>
            </motion.div>

            {/* Sidebar Skeleton */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Progress Card */}
              <div className="space-y-4 p-6 border rounded-lg">
                <Skeleton className="h-8 w-40 bg-primary/20" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 bg-primary/20" />
                    <Skeleton className="h-6 w-20 bg-primary/20" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 bg-primary/20" />
                    <Skeleton className="h-6 w-20 bg-primary/20" />
                  </div>
                  <Skeleton className="h-10 w-full bg-primary/20" />
                </div>
              </div>

              {/* Objectives Card */}
              <div className="space-y-4 p-6 border rounded-lg">
                <Skeleton className="h-8 w-40 bg-primary/20" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full bg-primary/20" />
                      <Skeleton className="h-6 flex-1 bg-primary/20" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Hints Card */}
              <div className="space-y-4 p-6 border rounded-lg">
                <Skeleton className="h-8 w-40 bg-primary/20" />
                <Skeleton className="h-10 w-full bg-primary/20" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full bg-primary/20" />
                  ))}
                </div>
              </div>

              {/* Resources Card */}
              <div className="space-y-4 p-6 border rounded-lg">
                <Skeleton className="h-8 w-40 bg-primary/20" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-8 w-full bg-primary/20" />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button asChild>
            <Link to={`/courses/${courseId}`}>
              Back to Course
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <Button variant="ghost" asChild>
            <Link to={`/courses/${courseId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Link>
          </Button>
          <div className="ml-auto flex items-center gap-4">
            {lesson.prevLessonId && (
              <Button variant="ghost" asChild>
                <Link to={`/courses/${courseId}/lessons/${lesson.prevLessonId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous Lesson
                </Link>
              </Button>
            )}
            {lesson.nextLessonId && (
              <Button asChild>
                <Link to={`/courses/${courseId}/lessons/${lesson.nextLessonId}`}>
                  Next Lesson
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Lesson Content */}
        <div className="grid md:grid-cols-[1fr_300px] gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold">{lesson.title}</h1>
                <Badge variant="secondary" className="ml-auto">
                  <Clock className="w-4 h-4 mr-2" />
                  {lesson.duration} minutes
                </Badge>
              </div>
              <p className="text-muted-foreground">{lesson.description?.split('\n')[0]}</p>
            </div>

            <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="simulator" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Simulator
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-6">
                <Card>
                  <CardContent className="prose dark:prose-invert max-w-none p-6">
                    <ReactMarkdown>{lesson.content || ''}</ReactMarkdown>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="simulator" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Arduino Simulator</CardTitle>
                    <CardDescription>Try out the circuit in Wokwi's online simulator</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full aspect-video rounded-lg overflow-hidden border">
                      <iframe 
                        src="https://wokwi.com/projects/new/arduino-uno"
                        className="w-full h-full border-none"
                        title="Arduino Simulator"
                        allow="camera; display-capture"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {!progress.completed && (
              <div className="mt-8 flex justify-end">
                <Button 
                  size="lg" 
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <div className="animate-spin mr-2">⏳</div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Lesson Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Time Spent</span>
                    <span className="text-sm font-medium">
                      {Math.floor(progress.timeSpent / 60)} min {progress.timeSpent % 60} sec
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Attempts</span>
                    <span className="text-sm font-medium">{progress.attempts}</span>
                  </div>
                  {!progress.completed ? (
                    <Button className="w-full" onClick={handleComplete}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Complete
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => setShowReview(true)}>
                      <BarChart className="mr-2 h-4 w-4" />
                      Review Lesson
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lesson.objectives?.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex-shrink-0 mt-0.5" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={() => setShowHint(!showHint)}
                >
                  Show Hints
                </Button>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    {lesson.hints?.map((hint: string, index: number) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        • {hint}
                      </p>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lesson.resources?.map((resource: Resource, index: number) => (
                    <li key={index}>
                      <a
                        href={resource.url}
                        className="text-sm text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lesson Review</DialogTitle>
            <DialogDescription>
              Here's how you did in this lesson
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Time Spent</span>
              <span className="text-sm font-medium">
                {Math.floor(progress.timeSpent / 60)} min {progress.timeSpent % 60} sec
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attempts</span>
              <span className="text-sm font-medium">{progress.attempts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completion Date</span>
              <span className="text-sm font-medium">
                {new Date(progress.completedAt || '').toLocaleDateString()}
              </span>
            </div>
            <Button className="w-full" onClick={handleNextLesson}>
              {nextLessonId ? 'Next Lesson' : 'Back to Course'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Course Certificate</DialogTitle>
            <DialogDescription>
              Congratulations! You've completed all lessons in this course.
            </DialogDescription>
          </DialogHeader>
          {certificate && (
            <div className="space-y-6 py-4">
              <div className="bg-card p-6 rounded-lg border text-center space-y-4">
                <Award className="w-12 h-12 mx-auto text-primary" />
                <h3 className="text-2xl font-bold">Certificate of Completion</h3>
                <p className="text-muted-foreground">This certifies that</p>
                <p className="text-xl font-semibold">{certificate.userName}</p>
                <p className="text-muted-foreground">has successfully completed</p>
                <p className="text-lg font-medium">{lesson.title}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Certificate #{certificate.certificateNumber}<br />
                  Issued on {new Date(certificate.issuedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-4">
                <Button className="flex-1" asChild>
                  <a href={`${API_BASE_URL}/api/certificates/${certificate.id}/download`} download>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => {
                  // Implement share functionality
                  navigator.share?.({
                    title: 'My Course Certificate',
                    text: `I've completed the ${lesson.title} course!`,
                    url: `${window.location.origin}/certificates/${certificate.id}`
                  }).catch(console.error);
                }}>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonDetail;
