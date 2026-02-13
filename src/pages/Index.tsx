import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  FolderOpen, 
  BarChart3, 
  Users, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const features = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Online Tutorials',
    description: 'Access course materials, video lectures, and study resources anytime, anywhere.',
  },
  {
    icon: <FolderOpen className="h-6 w-6" />,
    title: 'Project Advising',
    description: 'Get guidance from advisors, submit projects, and receive structured feedback.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Progress Tracking',
    description: 'Monitor your academic progress with detailed analytics and insights.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Role-Based Access',
    description: 'Dedicated dashboards for students, instructors, department heads, and admins.',
  },
];

const roles = [
  { name: 'Students', description: 'Access tutorials, submit projects, track progress' },
  { name: 'Instructors', description: 'Upload materials, supervise projects, provide feedback' },
  { name: 'Department Heads', description: 'Manage department, assign advisors, view reports' },
  { name: 'Administrators', description: 'Configure system, manage users, monitor activity' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/80 backdrop-blur-md border-b border-slate-700">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <a href="https://www.haramaya.edu.et" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white p-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <img 
                src={`/images/logo-haramaya.png?v=${Date.now()}`}
                alt="Haramaya University Logo" 
                className="w-full h-full object-cover rounded-full"
                onLoad={(e) => {
                  console.log('University logo loaded successfully');
                }}
                onError={(e) => {
                  console.log('University logo failed to load, showing fallback');
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center justify-center w-full h-full rounded-full bg-blue-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-normal text-white">OTPAS-HU</span>
              <span className="text-xs text-gray-400 block -mt-1">Haramaya University</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#about" className="text-gray-300 hover:text-white transition">About</a>
            <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
            <a href="#roles" className="text-gray-300 hover:text-white transition">Roles</a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-gray-300 hover:text-white">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden text-white hover:text-blue-400 transition"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-800 border-t border-slate-700">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <a 
                href="#about" 
                onClick={closeMobileMenu}
                className="block text-gray-300 hover:text-white transition py-2"
              >
                About
              </a>
              <a 
                href="#features" 
                onClick={closeMobileMenu}
                className="block text-gray-300 hover:text-white transition py-2"
              >
                Features
              </a>
              <a 
                href="#roles" 
                onClick={closeMobileMenu}
                className="block text-gray-300 hover:text-white transition py-2"
              >
                Roles
              </a>

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-700">
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button variant="outline" className="w-full border-gray-400 text-gray-300 hover:text-white">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/30 text-blue-300 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Secure & Modern Academic Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight mb-6 text-white">
              Online Tutorial & <br />
              <span className="text-blue-400">Project Advising</span> System
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              A comprehensive platform designed to modernize tutorial delivery and project supervision 
              at Haramaya University. Centralized management, transparent tracking, and accessible support services.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="gap-3 shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25 relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-3">
                    Access Your Dashboard
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-2 border-gray-400 text-gray-300 hover:bg-slate-800 hover:border-blue-400 hover:text-blue-400 px-8 py-4 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-normal mb-4 text-white">
              Everything You Need for Academic Success
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              OTPAS-HU provides a complete suite of tools to enhance the learning experience 
              and streamline academic processes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title} 
                className="bg-slate-700 rounded-xl p-6 border border-slate-600 hover:shadow-lg hover:border-blue-500 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900/30 text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-normal mb-4 text-white">About OTPAS-HU</h2>
              <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
            </div>

            <div className="space-y-8">
              {/* Introduction */}
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-normal text-white mb-4">What is OTPAS-HU?</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The Online Tutorial and Project Advising System for Haramaya University (OTPAS-HU) is a comprehensive digital platform designed to transform academic support and supervision processes. Developed as a Final Year Project by Computer Science Department students (Group 4, 2026) under the guidance of advisor Mr. Keno B., OTPAS-HU represents a modern solution to contemporary academic challenges.
                </p>
              </div>

              {/* Problem Statement */}
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-normal text-white mb-4">The Challenge</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Traditional tutorial delivery and project advising systems face significant challenges:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-300"><strong>Limited Access:</strong> Students struggle to access academic support outside regular office hours</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-300"><strong>Inefficient Communication:</strong> Feedback and guidance delivery remains slow and fragmented</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-300"><strong>Poor Documentation:</strong> Progress tracking and project milestones lack centralized management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-300"><strong>Remote Support Gap:</strong> Off-campus and remote students face barriers to academic guidance</span>
                  </li>
                </ul>
              </div>

              {/* System Overview */}
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-normal text-white mb-4">Our Solution</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  OTPAS-HU is a centralized, web-based academic support platform that integrates students, instructors, advisors, and administrators into a unified ecosystem. The system supports:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl">✓</span>
                    <span className="text-gray-300">Online tutorial scheduling and session management</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl">✓</span>
                    <span className="text-gray-300">Structured project advising with milestone tracking</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl">✓</span>
                    <span className="text-gray-300">Real-time communication and feedback systems</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl">✓</span>
                    <span className="text-gray-300">Comprehensive progress tracking and analytics</span>
                  </div>
                </div>
              </div>

              {/* Technical Stack */}
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-normal text-white mb-4">Technical Foundation</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  OTPAS-HU is built on modern, scalable technologies:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-blue-400 font-normal mb-2">Frontend</p>
                    <p className="text-gray-300 text-sm">React.js with HTML5, CSS3, and JavaScript for responsive user interfaces</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-normal mb-2">Backend</p>
                    <p className="text-gray-300 text-sm">Node.js with Express.js for robust API and server-side logic</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-normal mb-2">Database</p>
                    <p className="text-gray-300 text-sm">PostgreSQL for secure, reliable data management</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-normal mb-2">Intelligence</p>
                    <p className="text-gray-300 text-sm">Python with Scikit-learn for personalized recommendations</p>
                  </div>
                </div>
              </div>

              {/* User Roles */}
              <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
                <h3 className="text-2xl font-normal text-white mb-4">For Every Role</h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  OTPAS-HU provides tailored experiences for all academic stakeholders:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-blue-400 font-normal mb-2">Students</p>
                    <p className="text-gray-300 text-sm">Access tutorials, submit projects, track progress</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-blue-400 font-normal mb-2">Instructors</p>
                    <p className="text-gray-300 text-sm">Upload materials, supervise projects, provide feedback</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-blue-400 font-normal mb-2">Department Heads</p>
                    <p className="text-gray-300 text-sm">Manage departments, assign advisors, view reports</p>
                  </div>
                  <div className="bg-slate-700 rounded-lg p-4">
                    <p className="text-blue-400 font-normal mb-2">Administrators</p>
                    <p className="text-gray-300 text-sm">Configure system, manage users, monitor activity</p>
                  </div>
                </div>
              </div>

              {/* Impact */}
              <div className="bg-gradient-to-r from-blue-900/30 to-slate-800 rounded-xl p-8 border border-blue-700/30">
                <h3 className="text-2xl font-normal text-white mb-4">Our Impact</h3>
                <p className="text-gray-300 leading-relaxed">
                  OTPAS-HU enhances academic service delivery through digital transformation, improves learning outcomes for students, streamlines supervision for advisors and instructors, and provides reliable academic data for administration. As a case study for Ethiopian higher education institutions, OTPAS-HU demonstrates the potential of technology-driven solutions in modernizing academic support systems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="py-20 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-normal mb-6 text-white">
                Designed for Every Role in Academia
              </h2>
              <p className="text-gray-400 mb-8">
                Our role-based system ensures that each user gets a tailored experience 
                with relevant features and permissions.
              </p>
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.name} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-900/50 text-blue-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-normal text-white">{role.name}</p>
                      <p className="text-sm text-gray-400">{role.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-900/20 via-slate-800 to-slate-900 rounded-2xl p-8 lg:p-12 border border-slate-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700 rounded-xl p-4 shadow-soft border border-slate-600">
                    <div className="text-3xl font-normal text-blue-400">1,200+</div>
                    <div className="text-sm text-gray-400">Active Students</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4 shadow-soft border border-slate-600">
                    <div className="text-3xl font-normal text-blue-400">50+</div>
                    <div className="text-sm text-gray-400">Instructors</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4 shadow-soft border border-slate-600">
                    <div className="text-3xl font-normal text-blue-400">150+</div>
                    <div className="text-sm text-gray-400">Courses</div>
                  </div>
                  <div className="bg-slate-700 rounded-xl p-4 shadow-soft border border-slate-600">
                    <div className="text-3xl font-normal text-blue-400">8</div>
                    <div className="text-sm text-gray-400">Departments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-blue-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-normal text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8">
            Join the OTPAS-HU community and experience a modern approach to academic support.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="gap-2 bg-white text-blue-900 hover:bg-gray-100">
              Sign In Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-700 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white p-1 shadow-lg">
                <img 
                  src={`/images/logo-haramaya.png?v=${Date.now()}`}
                  alt="Haramaya University Logo" 
                  className="w-full h-full object-cover rounded-full"
                  onLoad={(e) => {
                    console.log('Footer university logo loaded successfully');
                  }}
                  onError={(e) => {
                    console.log('Footer university logo failed to load, showing fallback');
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden items-center justify-center w-full h-full rounded-full bg-blue-600">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <span className="font-normal text-white">OTPAS-HU</span>
                <span className="text-xs text-gray-400 block">Haramaya University</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Haramaya University. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
