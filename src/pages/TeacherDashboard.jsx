import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Calendar,
  DollarSign,
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Settings,
  TrendingUp,
  UserCheck,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Video,
  ExternalLink,
  Copy,
  Calendar as CalendarIcon
} from 'lucide-react';
import apiClient from '../utils/api.js';
import Chat from '../components/Chat.jsx';
import { useAuth } from '../contexts/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    activeStudents: 0,
    pendingRequests: 0,
    totalEarnings: 0
  });
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [courseStatus, setCourseStatus] = useState('');
  const [newCourse, setNewCourse] = useState({
    title: '',
    subject: '',
    gradeLevel: '',
    description: '',
    content: {
      overview: '',
      objectives: [],
      curriculum: [],
      materials: []
    },
    pricing: {
      pricePerSession: '',
      totalSessions: 1,
      freeTrialDays: 3,
      discountPercentage: 0,
      hasTrial: true,
      upfrontPayment: false
    },
    schedule: {
      availability: [],
      duration: 60,
      timezone: 'UTC'
    },
    enrollment: {
      maxStudents: 10
    },
    status: 'draft'
  });
  const [editCourse, setEditCourse] = useState({
    title: '',
    subject: '',
    gradeLevel: '',
    description: '',
    content: {
      overview: '',
      objectives: [],
      curriculum: [],
      materials: []
    },
    pricing: {
      pricePerSession: '',
      totalSessions: 1,
      freeTrialDays: 3,
      discountPercentage: 0,
      hasTrial: true,
      upfrontPayment: false
    },
    schedule: {
      availability: [],
      duration: 60,
      timezone: 'UTC'
    },
    enrollment: {
      maxStudents: 10
    },
    status: 'draft'
  });
  const [errors, setErrors] = useState({});
  const [newSession, setNewSession] = useState({
    student: '',
    course: '',
    scheduledAt: '',
    duration: 60,
    description: '',
    meeting: {
      platform: 'zoom',
      meetingId: '',
      meetingPassword: '',
      meetingUrl: '',
      meetingNumber: ''
    },
    materials: [],
    notes: '',
    homework: ''
  });
  const [selectedCourseStudents, setSelectedCourseStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentEarnings, setPaymentEarnings] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    thisMonth: 0,
    lastMonth: 0
  });

  const statsCards = [
    { name: 'Total Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-blue-600' },
    { name: 'Active Students', value: stats.activeStudents, icon: Users, color: 'text-green-600' },
    { name: 'Pending Requests', value: stats.pendingRequests, icon: MessageSquare, color: 'text-orange-600' },
    { name: 'Total Earnings', value: `$${stats.totalEarnings}`, icon: DollarSign, color: 'text-purple-600' },
    { name: 'Published Courses', value: stats.publishedCourses, icon: TrendingUp, color: 'text-indigo-600' },
    { name: 'Total Enrollments', value: stats.totalEnrollments, icon: UserCheck, color: 'text-pink-600' }
  ];

  const subjects = [
    'Mathematics', 'Science', 'English', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  const gradeLevels = [
    'Primary',
    'Secondary', 
    'Ordinary Level',
    'Advance Level',
    'Diploma Level',
    'University Level'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchRequests();
    fetchSessions();
    fetchPayments();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, courseStatus]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/teacher/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(courseStatus && { status: courseStatus })
      });

      const response = await apiClient.get(`/teacher/courses?${params}`);
      if (response.data.success) {
        setCourses(response.data.courses);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/teacher/requests');
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchEnrollments = async (courseId) => {
    try {
      const response = await apiClient.get(`/teacher/courses/${courseId}/enrollments`);
      if (response.data.success) {
        // Handle enrollments data if needed
        console.log('Enrollments fetched:', response.data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await apiClient.get('/teacher/sessions');
      if (response.data.success) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await apiClient.get('/payment/teacher-payments');
      if (response.data.success) {
        setPayments(response.data.payments || []);
        
        // Calculate earnings from payments
        const completedPayments = response.data.payments.filter(p => p.paymentStatus === 'completed');
        const pendingPayments = response.data.payments.filter(p => p.paymentStatus === 'pending');
        
        const totalEarnings = completedPayments.reduce((sum, p) => sum + p.amount, 0);
        const thisMonth = completedPayments
          .filter(p => new Date(p.paymentDate).getMonth() === new Date().getMonth())
          .reduce((sum, p) => sum + p.amount, 0);
        
        setPaymentEarnings({
          totalEarnings,
          pendingPayments: pendingPayments.length,
          completedPayments: completedPayments.length,
          thisMonth,
          lastMonth: 0 // Could be calculated if needed
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Set default values to prevent white screen
      setPayments([]);
      setPaymentEarnings({
        totalEarnings: 0,
        pendingPayments: 0,
        completedPayments: 0,
        thisMonth: 0,
        lastMonth: 0
      });
    }
  };

  const updatePaymentStatus = async (paymentId, status, refundAmount = 0, refundReason = '') => {
    try {
      const response = await apiClient.put(`/payment/${paymentId}`, {
        paymentStatus: status,
        refundAmount,
        refundReason
      });
      
      if (response.data.success) {
        fetchPayments();
        alert('Payment status updated successfully!');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const validateCourse = (course) => {
    const newErrors = {};

    // Basic validation
    if (!course.title || course.title.trim().length < 3) {
      newErrors.title = 'Course title must be at least 3 characters long';
    }
    if (!course.subject) {
      newErrors.subject = 'Please select a subject';
    }
    if (!course.gradeLevel) {
      newErrors.gradeLevel = 'Please select a grade level';
    }
    if (!course.description || course.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    // Content validation
    if (!course.content.overview || course.content.overview.trim().length === 0) {
      newErrors['content.overview'] = 'Course overview is required';
    }
    if (course.content.objectives.length === 0) {
      newErrors['content.objectives'] = 'At least one learning objective is required';
    }
    if (course.content.curriculum.length === 0) {
      newErrors['content.curriculum'] = 'At least one curriculum topic is required';
    }

    // Pricing validation
    if (!course.pricing.pricePerSession || course.pricing.pricePerSession <= 0) {
      newErrors['pricing.pricePerSession'] = 'Price per session must be greater than 0';
    }
    if (!course.pricing.totalSessions || course.pricing.totalSessions < 1) {
      newErrors['pricing.totalSessions'] = 'Total sessions must be at least 1';
    }
    // If no trial (upfront payment), force freeTrialDays to 0
    if (course.pricing.upfrontPayment) {
      course.pricing.freeTrialDays = 0;
      course.pricing.hasTrial = false;
    } else {
      course.pricing.hasTrial = true;
      if (course.pricing.freeTrialDays < 0) {
        newErrors['pricing.freeTrialDays'] = 'Free trial days cannot be negative';
      }
    }
    if (course.pricing.discountPercentage < 0 || course.pricing.discountPercentage > 100) {
      newErrors['pricing.discountPercentage'] = 'Discount must be between 0 and 100';
    }

    // Schedule validation
    if (course.schedule.availability.length === 0) {
      newErrors['schedule.availability'] = 'At least one availability slot is required';
    }

    // Enrollment validation
    if (!course.enrollment.maxStudents || course.enrollment.maxStudents < 1) {
      newErrors['enrollment.maxStudents'] = 'Maximum students must be at least 1';
    }

    return newErrors;
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Validate the form
    const validationErrors = validateCourse(newCourse);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/teacher/courses', newCourse);
      if (response.data.success) {
        fetchCourses();
        fetchStats();
        setNewCourse({
          title: '',
          subject: '',
          gradeLevel: '',
          description: '',
          content: {
            overview: '',
            objectives: [],
            curriculum: [],
            materials: []
          },
          pricing: {
            pricePerSession: '',
            totalSessions: 1,
            freeTrialDays: 3,
            discountPercentage: 0
          },
          schedule: {
            availability: [],
            duration: 60,
            timezone: 'UTC'
          },
          enrollment: {
            maxStudents: 10
          },
          status: 'draft'
        });
        setShowCreateCourse(false);
        setErrors({});
      }
    } catch (error) {
      console.error('Error creating course:', error);
      if (error.response?.data?.errors) {
        // Handle Joi validation errors from backend
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.path ? err.path.join('.') : 'general';
          backendErrors[field] = err.message;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to create course. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/teacher/courses/${selectedCourse._id}`, editCourse);
      if (response.data.success) {
        fetchCourses();
        setShowEditCourse(false);
        setSelectedCourse(null);
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const courseToDelete = courses.find(course => course._id === courseId);
    const hasEnrollments = courseToDelete?.enrollment?.currentStudents > 0;
    
    let confirmMessage = 'Are you sure you want to delete this course?';
    if (hasEnrollments) {
      confirmMessage += `\n\nWarning: This course has ${courseToDelete.enrollment.currentStudents} enrolled students. Deleting will cancel their enrollments.`;
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await apiClient.delete(`/teacher/courses/${courseId}`);
        if (response.data.success) {
          fetchCourses();
          fetchStats();
          alert('Course deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

  const openEditModal = (course) => {
    console.log('Opening edit modal for course:', course); // Debug log
    setSelectedCourse(course);
    setEditCourse({
      title: course.title,
      subject: course.subject,
      gradeLevel: course.gradeLevel,
      description: course.description,
      content: course.content || {
        overview: '',
        objectives: [],
        curriculum: [],
        materials: []
      },
      pricing: course.pricing || {
        pricePerSession: course.pricing?.pricePerSession || '',
        totalSessions: course.pricing?.totalSessions || 1,
        freeTrialDays: course.pricing?.freeTrialDays || 3,
        discountPercentage: course.pricing?.discountPercentage || 0
      },
      schedule: course.schedule || {
        availability: [],
        duration: 60,
        timezone: 'UTC'
      },
      enrollment: course.enrollment || {
        maxStudents: 10
      },
      status: course.status || 'draft'
    });
    setShowEditCourse(true);
    setErrors({}); // Clear any previous errors
  };

  const handleRequestAction = async (requestId, action, responseMessage = '') => {
    try {
      const response = await apiClient.put(`/teacher/requests/${requestId}`, {
        status: action,
        responseMessage
      });
      if (response.data.success) {
        fetchRequests();
        fetchStats();
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewCourse(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setNewCourse({
        ...newCourse,
        [name]: value
      });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditCourse(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : (type === 'checkbox' ? checked : value)
        }
      }));
    } else {
      setEditCourse({
        ...editCourse,
        [name]: value
      });
    }
  };

  const addAvailabilitySlot = (type) => {
    const newSlot = { day: '', start: '', end: '' };
    if (type === 'create') {
      setNewCourse(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          availability: [...prev.schedule.availability, newSlot]
        }
      }));
    } else {
      setEditCourse(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          availability: [...prev.schedule.availability, newSlot]
        }
      }));
    }
  };

  const updateAvailabilitySlot = (index, field, value, type) => {
    if (type === 'create') {
      setNewCourse(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          availability: prev.schedule.availability.map((slot, i) => 
            i === index ? { ...slot, [field]: value } : slot
          )
        }
      }));
    } else {
      setEditCourse(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          availability: prev.schedule.availability.map((slot, i) => 
            i === index ? { ...slot, [field]: value } : slot
          )
        }
      }));
    }
  };

  const removeAvailabilitySlot = (index, type) => {
    if (type === 'create') {
      setNewCourse(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          availability: prev.schedule.availability.filter((_, i) => i !== index)
        }
      }));
    } else {
      setEditCourse(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          availability: prev.schedule.availability.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post(`/teacher/courses/${newSession.course}/sessions`, newSession);
      if (response.data.success) {
        fetchSessions();
        setNewSession({
          student: '',
          course: '',
          scheduledAt: '',
          duration: 60,
          description: '',
          meeting: {
            platform: 'zoom',
            meetingId: '',
            meetingPassword: '',
            meetingUrl: '',
            meetingNumber: ''
          },
          materials: [],
          notes: '',
          homework: ''
        });
        setSelectedCourseStudents([]);
        setShowCreateSession(false);
        alert('Session created successfully!');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert(error.response?.data?.message || 'Failed to create session');
    }
  };

  const openCreateSessionModal = async (course) => {
    setSelectedCourse(course);
    setNewSession(prev => ({
      ...prev,
      course: course._id,
      student: ''
    }));
    setShowCreateSession(true);
    
    // Fetch enrolled students for this course
    await fetchCourseStudents(course._id);
  };

  const copyMeetingLink = (meetingUrl) => {
    navigator.clipboard.writeText(meetingUrl);
    alert('Meeting link copied to clipboard!');
  };

  const fetchCourseStudents = async (courseId) => {
    try {
      const response = await apiClient.get(`/teacher/courses/${courseId}/enrollments`);
      if (response.data.success) {
        // Filter only active enrollments (trial or active status)
        const activeStudents = response.data.enrollments.filter(enrollment => 
          enrollment.status === 'trial' || enrollment.status === 'active'
        );
        setSelectedCourseStudents(activeStudents);
      }
    } catch (error) {
      console.error('Error fetching course students:', error);
      setSelectedCourseStudents([]);
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your courses and connect with students</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          {statsCards.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: TrendingUp },
              { id: 'courses', name: 'My Courses', icon: BookOpen },
              { id: 'sessions', name: 'Schedule Sessions', icon: Video },
              { id: 'requests', name: 'Student Requests', icon: MessageSquare },
              { id: 'enrollments', name: 'Enrollments', icon: UserCheck },
              { id: 'payments', name: 'Payments', icon: DollarSign },
              { id: 'chat', name: 'Messages', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {requests.slice(0, 5).map((request) => (
                  <div key={request._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        New request from {request.student?.name}
                      </p>
                      <p className="text-xs text-gray-500">{request.course?.title}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Course Management */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Courses</h2>
                <div className="flex items-center space-x-4">
                  <select
                    className="input-field w-32"
                    value={courseStatus}
                    onChange={(e) => setCourseStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={() => setShowCreateCourse(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Course</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.subject} • {course.gradeLevel}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'published' ? 'bg-green-100 text-green-800' :
                          course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-600">{course.rating || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4">{course.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {course.enrollment?.currentStudents || 0} students
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${course.pricing?.pricePerSession}/session
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {course.pricing?.freeTrialDays} days free trial
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(course)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Edit Course"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openCreateSessionModal(course)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Create Session"
                        >
                          <Video className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course._id)}
                          disabled={course.status === 'published' && course.enrollment?.currentStudents > 0}
                          className={`p-1 ${
                            course.status === 'published' && course.enrollment?.currentStudents > 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title={
                            course.status === 'published' && course.enrollment?.currentStudents > 0
                              ? 'Cannot delete published course with enrolled students'
                              : 'Delete Course'
                          }
                        >
                          {course.status === 'published' && course.enrollment?.currentStudents > 0 ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="btn-secondary flex items-center space-x-1 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="btn-secondary flex items-center space-x-1 disabled:opacity-50"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Student Requests */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Requests</h2>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.student?.name}</h4>
                        <p className="text-sm text-gray-500">{request.student?.email}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.course?.title}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{request.message}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRequestAction(request._id, 'accepted')}
                            className="btn-primary text-sm py-1 px-3"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequestAction(request._id, 'rejected')}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            {/* Course Enrollments */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Enrollments</h2>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <p className="text-sm text-gray-500">{course.enrollment?.currentStudents || 0} enrolled students</p>
                      </div>
                      <button
                        onClick={() => fetchEnrollments(course._id)}
                        className="btn-secondary text-sm py-1 px-3"
                      >
                        View Details
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {course.enrollment?.enrolledStudents?.slice(0, 3).map((enrollment, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{enrollment.student?.name}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            enrollment.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                            enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {enrollment.status}
                          </span>
                        </div>
                      ))}
                      {course.enrollment?.enrolledStudents?.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{course.enrollment.enrolledStudents.length - 3} more students
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Earnings Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">${paymentEarnings.totalEarnings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentEarnings.completedPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentEarnings.pendingPayments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">${paymentEarnings.thisMonth}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Transactions */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment Transactions</h2>
                <p className="text-sm text-gray-500">All payments received for your courses</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <tr key={payment._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.course?.title || 'Unknown Course'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.student?.name || 'Unknown Student'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ${payment.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.course?.pricing?.totalSessions || 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                              payment.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {payment.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {payment.paymentStatus === 'pending' && (
                                <button
                                  onClick={() => updatePaymentStatus(payment._id, 'completed')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {payment.paymentStatus === 'completed' && (
                                <button
                                  onClick={() => {
                                    const refundAmount = prompt('Enter refund amount:', payment.amount);
                                    const refundReason = prompt('Enter refund reason:', '');
                                    if (refundAmount && refundReason) {
                                      updatePaymentStatus(payment._id, 'refunded', parseFloat(refundAmount), refundReason);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Process refund"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                              {payment.paymentStatus === 'pending' && (
                                <button
                                  onClick={() => updatePaymentStatus(payment._id, 'failed')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Mark as failed"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No payments received</p>
                          <p className="text-sm">Payment transactions will appear here</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Sessions Management */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Scheduled Sessions</h2>
                <button
                  onClick={() => setShowCreateSession(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Video className="h-4 w-4" />
                  <span>Create Session</span>
                </button>
              </div>

              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{session.course.title}</h4>
                        <p className="text-sm text-gray-500">Student: {session.student.name}</p>
                        <p className="text-sm text-gray-600">
                          Scheduled: {new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'started' ? 'bg-yellow-100 text-yellow-800' :
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Video className="h-4 w-4 mr-1" />
                          {session.meeting.platform.charAt(0).toUpperCase()}{session.meeting.platform.slice(1)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {session.duration} minutes
                        </span>
                        {session.meeting.meetingUrl && (
                          <span className="flex items-center">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Meeting Link Available
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {session.meeting.meetingUrl && (
                          <button
                            onClick={() => window.open(session.meeting.meetingUrl, '_blank')}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Join Meeting
                          </button>
                        )}
                        {session.meeting.meetingUrl && (
                          <button
                            onClick={() => copyMeetingLink(session.meeting.meetingUrl)}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-200px)]">
            <Chat currentUser={user} />
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Session</h3>
                <form onSubmit={handleCreateSession} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course</label>
                      <select
                        className="input-field mt-1"
                        value={newSession.course}
                        onChange={async (e) => {
                          const courseId = e.target.value;
                          setNewSession(prev => ({ ...prev, course: courseId, student: '' }));
                          if (courseId) {
                            await fetchCourseStudents(courseId);
                          } else {
                            setSelectedCourseStudents([]);
                          }
                        }}
                        required
                      >
                        <option value="">Select Course</option>
                        {courses.filter(course => course.status === 'published').map(course => (
                          <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Student {!newSession.course && "(Select a course first)"}
                      </label>
                      <select
                        className="input-field mt-1"
                        value={newSession.student}
                        onChange={(e) => setNewSession(prev => ({ ...prev, student: e.target.value }))}
                        required
                        disabled={!newSession.course}
                      >
                        <option value="">Select Student</option>
                        {selectedCourseStudents.map(enrollment => (
                          <option key={enrollment._id} value={enrollment.student._id}>
                            {enrollment.student.name} ({enrollment.student.email})
                          </option>
                        ))}
                      </select>
                      {!newSession.course && (
                        <p className="text-xs text-gray-500 mt-1">Please select a course to see enrolled students</p>
                      )}
                      {newSession.course && selectedCourseStudents.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">No active students enrolled in this course</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                      <input
                        type="datetime-local"
                        className="input-field mt-1"
                        value={newSession.scheduledAt}
                        onChange={(e) => setNewSession(prev => ({ ...prev, scheduledAt: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <input
                        type="number"
                        min="30"
                        max="180"
                        className="input-field mt-1"
                        value={newSession.duration}
                        onChange={(e) => setNewSession(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Description</label>
                    <textarea
                      rows={3}
                      className="input-field mt-1"
                      value={newSession.description}
                      onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What will be covered in this session?"
                    />
                  </div>

                  {/* Meeting Platform */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Meeting Platform</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Platform</label>
                        <select
                          className="input-field mt-1"
                          value={newSession.meeting.platform}
                          onChange={(e) => setNewSession(prev => ({
                            ...prev,
                            meeting: { ...prev.meeting, platform: e.target.value }
                          }))}
                          required
                        >
                          <option value="zoom">Zoom</option>
                          <option value="google_meet">Google Meets</option>
                          <option value="microsoft_teams">Microsoft Teams</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Meeting URL</label>
                        <input
                          type="url"
                          className="input-field mt-1"
                          value={newSession.meeting.meetingUrl}
                          onChange={(e) => setNewSession(prev => ({
                            ...prev,
                            meeting: { ...prev.meeting, meetingUrl: e.target.value }
                          }))}
                          placeholder="https://..."
                          required
                        />
                      </div>
                    </div>
                    
                    {(newSession.meeting.platform === 'zoom' || newSession.meeting.platform === 'other') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Meeting ID</label>
                          <input
                            type="text"
                            className="input-field mt-1"
                            value={newSession.meeting.meetingId}
                            onChange={(e) => setNewSession(prev => ({
                              ...prev,
                              meeting: { ...prev.meeting, meetingId: e.target.value }
                            }))}
                            placeholder="Meeting ID"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password</label>
                          <input
                            type="text"
                            className="input-field mt-1"
                            value={newSession.meeting.meetingPassword}
                            onChange={(e) => setNewSession(prev => ({
                              ...prev,
                              meeting: { ...prev.meeting, meetingPassword: e.target.value }
                            }))}
                            placeholder="Password (optional)"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateSession(false);
                        setSelectedCourseStudents([]);
                        setNewSession({
                          student: '',
                          course: '',
                          scheduledAt: '',
                          duration: 60,
                          description: '',
                          meeting: {
                            platform: 'zoom',
                            meetingId: '',
                            meetingPassword: '',
                            meetingUrl: '',
                            meetingNumber: ''
                          },
                          materials: [],
                          notes: '',
                          homework: ''
                        });
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Session
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Course Modal */}
        {showCreateCourse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h3>
                <form onSubmit={handleCreateCourse} className="space-y-6">
                  {/* Error Message */}
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{errors.general}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        className={`input-field mt-1 ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={newCourse.title}
                        onChange={handleInputChange}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <select
                        name="subject"
                        className={`input-field mt-1 ${errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={newCourse.subject}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                      <select
                        name="gradeLevel"
                        className={`input-field mt-1 ${errors.gradeLevel ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={newCourse.gradeLevel}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Grade Level</option>
                        {gradeLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.gradeLevel && (
                        <p className="mt-1 text-sm text-red-600">{errors.gradeLevel}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        className="input-field mt-1"
                        value={newCourse.status}
                        onChange={handleInputChange}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      name="description"
                      required
                      className={`input-field mt-1 ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      value={newCourse.description}
                      onChange={handleInputChange}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Course Content</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Course Overview</label>
                        <textarea
                          rows={3}
                          name="content.overview"
                          required
                          className={`input-field mt-1 ${errors['content.overview'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={newCourse.content.overview}
                          onChange={handleInputChange}
                          placeholder="Provide a detailed overview of what students will learn in this course..."
                        />
                        {errors['content.overview'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['content.overview']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Learning Objectives</label>
                        <div className="space-y-2">
                          {newCourse.content.objectives.map((objective, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                className="input-field flex-1"
                                value={objective}
                                onChange={(e) => {
                                  const newObjectives = [...newCourse.content.objectives];
                                  newObjectives[index] = e.target.value;
                                  setNewCourse(prev => ({
                                    ...prev,
                                    content: { ...prev.content, objectives: newObjectives }
                                  }));
                                }}
                                placeholder={`Objective ${index + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newObjectives = newCourse.content.objectives.filter((_, i) => i !== index);
                                  setNewCourse(prev => ({
                                    ...prev,
                                    content: { ...prev.content, objectives: newObjectives }
                                  }));
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setNewCourse(prev => ({
                                ...prev,
                                content: { 
                                  ...prev.content, 
                                  objectives: [...prev.content.objectives, ''] 
                                }
                              }));
                            }}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Add Objective
                          </button>
                          {errors['content.objectives'] && (
                            <p className="mt-1 text-sm text-red-600">{errors['content.objectives']}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Curriculum Topics</label>
                        <div className="space-y-2">
                          {newCourse.content.curriculum.map((topic, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                className="input-field flex-1"
                                value={topic}
                                onChange={(e) => {
                                  const newCurriculum = [...newCourse.content.curriculum];
                                  newCurriculum[index] = e.target.value;
                                  setNewCourse(prev => ({
                                    ...prev,
                                    content: { ...prev.content, curriculum: newCurriculum }
                                  }));
                                }}
                                placeholder={`Topic ${index + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newCurriculum = newCourse.content.curriculum.filter((_, i) => i !== index);
                                  setNewCourse(prev => ({
                                    ...prev,
                                    content: { ...prev.content, curriculum: newCurriculum }
                                  }));
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setNewCourse(prev => ({
                                ...prev,
                                content: { 
                                  ...prev.content, 
                                  curriculum: [...prev.content.curriculum, ''] 
                                }
                              }));
                            }}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Add Topic
                          </button>
                          {errors['content.curriculum'] && (
                            <p className="mt-1 text-sm text-red-600">{errors['content.curriculum']}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Required Materials</label>
                        <div className="space-y-2">
                          {newCourse.content.materials.map((material, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                className="input-field flex-1"
                                value={material}
                                onChange={(e) => {
                                  const newMaterials = [...newCourse.content.materials];
                                  newMaterials[index] = e.target.value;
                                  setNewCourse(prev => ({
                                    ...prev,
                                    content: { ...prev.content, materials: newMaterials }
                                  }));
                                }}
                                placeholder={`Material ${index + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newMaterials = newCourse.content.materials.filter((_, i) => i !== index);
                                  setNewCourse(prev => ({
                                    ...prev,
                                    content: { ...prev.content, materials: newMaterials }
                                  }));
                                }}
                                className="text-red-600 hover:text-red-800"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setNewCourse(prev => ({
                                ...prev,
                                content: { 
                                  ...prev.content, 
                                  materials: [...prev.content.materials, ''] 
                                }
                              }));
                            }}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Add Material
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Pricing & Structure</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price per Session ($)</label>
                        <input
                          type="number"
                          name="pricing.pricePerSession"
                          required
                          className={`input-field mt-1 ${errors['pricing.pricePerSession'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={newCourse.pricing.pricePerSession}
                          onChange={handleInputChange}
                        />
                        {errors['pricing.pricePerSession'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['pricing.pricePerSession']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Sessions</label>
                        <input
                          type="number"
                          name="pricing.totalSessions"
                          className={`input-field mt-1 ${errors['pricing.totalSessions'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={newCourse.pricing.totalSessions}
                          onChange={handleInputChange}
                        />
                        {errors['pricing.totalSessions'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['pricing.totalSessions']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Free Trial Days</label>
                        <input
                          type="number"
                          name="pricing.freeTrialDays"
                          className={`input-field mt-1 ${errors['pricing.freeTrialDays'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={newCourse.pricing.freeTrialDays}
                          onChange={handleInputChange}
                        />
                        {errors['pricing.freeTrialDays'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['pricing.freeTrialDays']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Students</label>
                        <input
                          type="number"
                          name="enrollment.maxStudents"
                          className={`input-field mt-1 ${errors['enrollment.maxStudents'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={newCourse.enrollment.maxStudents}
                          onChange={handleInputChange}
                        />
                        {errors['enrollment.maxStudents'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['enrollment.maxStudents']}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Schedule</h4>
                    <div className="space-y-3">
                      {newCourse.schedule.availability.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <select
                            className="input-field w-32"
                            value={slot.day}
                            onChange={(e) => updateAvailabilitySlot(index, 'day', e.target.value, 'create')}
                          >
                            <option value="">Day</option>
                            {days.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                          <input
                            type="time"
                            className="input-field w-32"
                            value={slot.start}
                            onChange={(e) => updateAvailabilitySlot(index, 'start', e.target.value, 'create')}
                          />
                          <input
                            type="time"
                            className="input-field w-32"
                            value={slot.end}
                            onChange={(e) => updateAvailabilitySlot(index, 'end', e.target.value, 'create')}
                          />
                          <button
                            type="button"
                            onClick={() => removeAvailabilitySlot(index, 'create')}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addAvailabilitySlot('create')}
                        className="btn-secondary text-sm py-1 px-3"
                      >
                        Add Time Slot
                      </button>
                      {errors['schedule.availability'] && (
                        <p className="mt-1 text-sm text-red-600">{errors['schedule.availability']}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCourse(false);
                        setErrors({});
                      }}
                      className="btn-secondary"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary flex items-center space-x-2"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>{loading ? 'Creating...' : 'Create Course'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal */}
        {showEditCourse && selectedCourse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Course</h3>
                <form onSubmit={handleEditCourse} className="space-y-6">
                  {/* Error Message */}
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{errors.general}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Course Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        className={`input-field mt-1 ${errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={editCourse.title}
                        onChange={handleEditInputChange}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <select
                        name="subject"
                        className={`input-field mt-1 ${errors.subject ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={editCourse.subject}
                        onChange={handleEditInputChange}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                      <select
                        name="gradeLevel"
                        className={`input-field mt-1 ${errors.gradeLevel ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        value={editCourse.gradeLevel}
                        onChange={handleEditInputChange}
                      >
                        <option value="">Select Grade Level</option>
                        {gradeLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                      {errors.gradeLevel && (
                        <p className="mt-1 text-sm text-red-600">{errors.gradeLevel}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        name="status"
                        className="input-field mt-1"
                        value={editCourse.status}
                        onChange={handleEditInputChange}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      name="description"
                      required
                      className={`input-field mt-1 ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      value={editCourse.description}
                      onChange={handleEditInputChange}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Pricing & Structure</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price per Session ($)</label>
                        <input
                          type="number"
                          name="pricing.pricePerSession"
                          required
                          className={`input-field mt-1 ${errors['pricing.pricePerSession'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={editCourse.pricing.pricePerSession}
                          onChange={handleEditInputChange}
                        />
                        {errors['pricing.pricePerSession'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['pricing.pricePerSession']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Sessions</label>
                        <input
                          type="number"
                          name="pricing.totalSessions"
                          className={`input-field mt-1 ${errors['pricing.totalSessions'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={editCourse.pricing.totalSessions}
                          onChange={handleEditInputChange}
                        />
                        {errors['pricing.totalSessions'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['pricing.totalSessions']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Free Trial Days</label>
                        <input
                          type="number"
                          name="pricing.freeTrialDays"
                          className={`input-field mt-1 ${errors['pricing.freeTrialDays'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={editCourse.pricing.freeTrialDays}
                          onChange={handleEditInputChange}
                        />
                        {errors['pricing.freeTrialDays'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['pricing.freeTrialDays']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Students</label>
                        <input
                          type="number"
                          name="enrollment.maxStudents"
                          className={`input-field mt-1 ${errors['enrollment.maxStudents'] ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          value={editCourse.enrollment.maxStudents}
                          onChange={handleEditInputChange}
                        />
                        {errors['enrollment.maxStudents'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['enrollment.maxStudents']}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditCourse(false);
                        setSelectedCourse(null);
                        setErrors({});
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>Update Course</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;

