import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  duration: number;
  order: number;
  isPublished: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  thumbnail: string;
  duration: number;
  published: boolean;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

const API_URL = 'http://localhost:5000/api';

const CoursesPage = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        console.log('Fetching courses...');
        const response = await fetch(`${API_URL}/courses`);
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        console.log('Courses data:', data);
        setCourses(data);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return <div className="container mx-auto py-8">Loading courses...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Available Courses</h1>
        <p className="text-muted-foreground">
          Choose from our selection of Arduino and robotics courses
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link key={course.id} to={`/courses/${course.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-t-lg mb-4"
                />
                <CardTitle>{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={
                    course.level === 'BEGINNER' ? 'default' :
                    course.level === 'INTERMEDIATE' ? 'secondary' : 'destructive'
                  }>
                    {course.level}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{Math.ceil(course.duration / 60)} hours</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{course.lessons.length} lessons</span>
                    <span>0% complete</span>
                  </div>
                  <Progress value={0} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
