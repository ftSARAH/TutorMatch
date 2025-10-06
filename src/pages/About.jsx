import { 
  BookOpen, 
  Users, 
  Award, 
  Target, 
  Heart, 
  Lightbulb,
  Globe,
  Shield,
  Clock,
  CheckCircle
} from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Users,
      title: "Expert Tutors",
      description: "Connect with qualified educators who specialize in various subjects and grade levels."
    },
    {
      icon: BookOpen,
      title: "Personalized Learning",
      description: "Tailored learning experiences designed to meet individual student needs and learning styles."
    },
    {
      icon: Award,
      title: "Quality Education",
      description: "High-quality educational content and teaching methods to ensure effective learning outcomes."
    },
    {
      icon: Target,
      title: "Goal-Oriented",
      description: "Structured learning paths that help students achieve their academic and personal goals."
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Student-Centered",
      description: "Every decision we make is focused on improving student learning and success."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We embrace new technologies and teaching methods to enhance the learning experience."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making quality education accessible to students from all backgrounds and locations."
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "A secure platform where students and tutors can connect with confidence and peace of mind."
    }
  ];

  const stats = [
    { number: "500+", label: "Active Tutors" },
    { number: "2,000+", label: "Students Helped" },
    { number: "50+", label: "Subjects Covered" },
    { number: "98%", label: "Success Rate" }
  ];

  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Executive Officer",
      bio: "Education PhD with 15+ years in educational technology and student success initiatives.",
      image: "https://unsplash.com/photos/woman-in-red-cardigan-smiling-mpDV4xaFP8c"
    },
      {
      name: "Prof. Michael Chen",
      role: "Chief Technology Officer",
      bio: "Computer Science professor specializing in educational platforms and learning management systems.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "Dr. Emily Rodriguez",
      role: "Head of Education",
      bio: "Curriculum specialist with expertise in personalized learning and educational assessment.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face"
    },
    {
      name: "James Wilson",
      role: "Student Success Manager",
      bio: "Former teacher with passion for student engagement and academic achievement.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              About TutorMatch
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
              Empowering students through personalized education and connecting them with expert tutors 
              who are passionate about making learning accessible, engaging, and effective.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto leading-relaxed">
              At TutorMatch, we believe that every student deserves access to quality education tailored to their unique learning needs. 
              Our platform bridges the gap between students seeking academic support and qualified tutors who are dedicated to fostering 
              learning and growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-primary-100">
              Numbers that reflect our commitment to educational excellence
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-primary-100">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Values
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do at TutorMatch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 rounded-lg bg-gray-50">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <value.icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Dedicated professionals committed to revolutionizing education through technology and personalized learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-w-1 aspect-h-1">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  TutorMatch was born from a simple observation: traditional education often fails to address 
                  the unique learning needs of individual students. Our founders, experienced educators and 
                  technology professionals, recognized the need for a platform that could connect students 
                  with tutors who truly understand their specific challenges and learning styles.
                </p>
                <p>
                  Since our launch, we've been committed to creating an environment where learning is not 
                  just about passing exams, but about fostering genuine understanding, curiosity, and a 
                  lifelong love of learning. We believe that with the right support and guidance, every 
                  student can achieve their full potential.
                </p>
                <p>
                  Today, TutorMatch continues to evolve, incorporating the latest educational research, 
                  technology innovations, and feedback from our community to provide an even better learning 
                  experience for students and tutors alike.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                  alt="Students learning together"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-primary-600 bg-opacity-20 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have found success through personalized tutoring on TutorMatch
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="btn-secondary bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started as Student
            </a>
            <a
              href="/register"
              className="btn-primary bg-primary-500 hover:bg-primary-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Become a Tutor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;

