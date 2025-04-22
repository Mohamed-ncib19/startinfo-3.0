import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Bot, BookOpen, Trophy, Users, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const Header = React.memo(function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-robotics-blue" />
          <h1 className="text-xl font-bold text-foreground">
            Start<span className="text-robotics-orange">info</span>
          </h1>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/courses"
            className="text-foreground/80 hover:text-foreground flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </Link>
          <Link
            to="/projects"
            className="text-foreground/80 hover:text-foreground flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            <span>Projects</span>
          </Link>
          <Link
            to="/certifications"
            className="text-foreground/80 hover:text-foreground flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            <span>Certifications</span>
          </Link>
          <Link
            to="/community"
            className="text-foreground/80 hover:text-foreground flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            <span>Community</span>
          </Link>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Link to="/login">
            <Button variant="outline">Log in</Button>
          </Link>
          <Link to="/signup">
            <Button>Sign up</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-background border-b border-border">
            <Link
              to="/courses"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground"
            >
              Courses
            </Link>
            <Link
              to="/projects"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground"
            >
              Projects
            </Link>
            <Link
              to="/certifications"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground"
            >
              Certifications
            </Link>
            <Link
              to="/community"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground"
            >
              Community
            </Link>
            <div className="pt-2 space-y-2">
              <Link to="/login" className="block w-full">
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link to="/signup" className="block w-full">
                <Button className="w-full">Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
})

export default Header;
