import { useState, useEffect, useCallback} from 'react';
import {
  BookOpen,
  Calendar,
  DollarSign,
  Star,
  Clock,
  Users,
  Search,
  Filter,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock as ClockIcon,
  User,
  Map,
  Heart,
  Eye,
  Video,
  ExternalLink,
  Copy,
  Target,
  List,
  Paperclip
} from 'lucide-react';
import apiClient from '../utils/api.js';
import Chat from '../components/Chat.jsx';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    totalEnrollments: 0,
    activeEnrollments: 0,
    upcomingSessions: 0,
    totalSpent: 0
  });
  const [courses, setCourses] = useState([]);
  const [requests, setRequests] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    gradeLevel: '',
    minPrice: 0,
    maxPrice: 1000
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [teacherReviews, setTeacherReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ average: 0, count: 0 });
  const [reviewsTeacher, setReviewsTeacher] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    sessionCount: 1,
    paymentMethod: 'credit_card',
    method: 'credit_card',
    notes: '',
    card: { holderName: '', number: '', expiryMonth: '', expiryYear: '', cvv: '' },
    proofImage: ''
  });
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  const statsCards = [
    { name: 'Active Sessions', value: stats.upcomingSessions, icon: Calendar, color: 'text-blue-600' },
    { name: 'My Courses', value: stats.activeEnrollments, icon: BookOpen, color: 'text-green-600' },
    { name: 'Pending Requests', value: stats.pendingRequests, icon: MessageSquare, color: 'text-orange-600' },
    { name: 'Total Spent', value: `$${stats.totalSpent.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600' },
    { name: 'Total Requests', value: stats.totalRequests, icon: TrendingUp, color: 'text-indigo-600' },
    { name: 'Completed Courses', value: stats.totalEnrollments - stats.activeEnrollments, icon: UserCheck, color: 'text-pink-600' }
  ];

  const subjects = [
    'Mathematics', 'Science', 'English', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  const gradeLevels = [
    'Primary', 'Secondary', 'Ordinary Level', 'Advance Level', 'Diploma Level', 'University Level'
  ];

  // Define fetchCourses first before using it in useEffect
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: searchTerm,
        subject: filters.subject,
        gradeLevel: filters.gradeLevel,
        minPrice: filters.minPrice.toString(),
        maxPrice: filters.maxPrice.toString()
      });

      const response = await apiClient.get(`/student/courses?${params}`);
      if (response.data.success) {
        setCourses(response.data.courses);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching courses', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters, setLoading, setCourses, setTotalPages]);

  useEffect(() => {
    fetchStats();
    fetchRequests();
    fetchEnrollments();
    fetchUpcomingSessions();
    fetchPayments();
    fetchPendingPayments();
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchTerm, filters, fetchCourses]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/student/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/student/requests');
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests', error);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await apiClient.get('/student/enrollments');
      if (response.data.success) {
        setEnrollments(response.data.enrollments);
      }
    } catch (error) {
      console.error('Error fetching enrollments', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      const response = await apiClient.get('/student/sessions/upcoming');
      if (response.data.success) {
        setUpcomingSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions', error);
    }
  };

  const fetchPayments = async () => {
    try {
      // Fetch courses needing payment
      const coursesResponse = await apiClient.get('/payment/courses-needing-payment');
      if (coursesResponse.data.success) {
        setPendingPayments(coursesResponse.data.coursesNeedingPayment || []);
      }

      // Fetch payment history
      const historyResponse = await apiClient.get('/payment/my-payments');
      if (historyResponse.data.success) {
        setPaymentHistory(historyResponse.data.payments || []);
        
        // Calculate total spent from payment history
        const totalSpent = historyResponse.data.payments.reduce((sum, payment) => {
          return sum + (payment.amount || 0);
        }, 0);
        
        // Update stats with calculated total spent
        setStats(prevStats => ({
          ...prevStats,
          totalSpent
        }));
      }
    } catch (error) {
      console.error('Error fetching payments', error);
      // Set empty arrays to prevent white screen
      setPendingPayments([]);
      setPaymentHistory([]);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await apiClient.get('/payment/courses-needing-payment');
      if (response.data.success) {
        setPendingPayments(response.data.coursesNeedingPayment || []);
      }
    } catch (error) {
      console.error('Error fetching pending payments', error);
    }
  };

  const requestCourse = async (courseId, message) => {
    try {
      const response = await apiClient.post(`/student/courses/${courseId}/request`, {
        message: message || `I would like to enroll in this course.`
      });
      
      if (response.data.success) {
        fetchCourses();
        fetchRequests();
        fetchStats();
        setShowCourseModal(false);
        alert('Course request sent successfully!');
      }
    } catch (error) {
      console.error('Error requesting course', error);
      alert(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handlePayment = async () => {
    try {
      if (!selectedEnrollment) return;

      const payload = {
        courseId: selectedEnrollment.course._id,
        paymentMethod: paymentData.method,
        amount: selectedEnrollment.course.pricing.pricePerSession,
        notes: paymentData.notes
      };

      if (['credit_card','debit_card'].includes(paymentData.method)) {
        const numberOk = /^\d{16}$/.test(paymentData.card.number || '');
        const cvvOk = /^\d{3,4}$/.test(paymentData.card.cvv || '');
        const monthOk = Number(paymentData.card.expiryMonth) >= 1 && Number(paymentData.card.expiryMonth) <= 12;
        const yearOk = Number(paymentData.card.expiryYear) >= new Date().getFullYear();
        if (!paymentData.card.holderName || !numberOk || !cvvOk || !monthOk || !yearOk) {
          alert('Please enter valid card details. Card number must be 16 digits.');
          return;
        }
        payload.card = {
          holderName: paymentData.card.holderName,
          number: paymentData.card.number,
          expiryMonth: Number(paymentData.card.expiryMonth),
          expiryYear: Number(paymentData.card.expiryYear),
          cvv: paymentData.card.cvv
        };
      }

      if (['bank_transfer','cash'].includes(paymentData.method)) {
        if (!paymentData.proofImage) {
          alert('Please upload payment proof image.');
          return;
        }
        payload.proofImage = paymentData.proofImage;
      }

      const response = await apiClient.post('/payment/create', payload);

      if (response.data.success) {
        setShowPaymentModal(false);
        fetchPayments();
        fetchEnrollments();
        
        // Update totalSpent locally immediately
        setStats(prevStats => ({
          ...prevStats,
          totalSpent: prevStats.totalSpent + selectedEnrollment.course.pricing.pricePerSession
        }));
        
        alert(response.data.payment?.paymentStatus === 'completed' ? 'Payment successful!' : 'Payment submitted and pending verification.');
      }
    } catch (error) {
      console.error('Error processing payment', error);
      alert(error.response?.data?.message || 'Payment failed. Please try again.');
    }
  };

  const cancelEnrollment = async (enrollmentId) => {
    if (window.confirm('Are you sure you want to cancel this enrollment?')) {
      try {
        const response = await apiClient.put(`/student/enrollments/${enrollmentId}/cancel`);
        
        if (response.data.success) {
          fetchEnrollments();
          fetchUpcomingSessions();
          fetchStats();
          alert(response.data.message);
        }
      } catch (error) {
        console.error('Error cancelling enrollment', error);
        alert('Failed to cancel enrollment');
      }
    }
  };

  const openCourseModal = (course) => {
    setSelectedCourse(course);
    setShowCourseModal(true);
  };

  const openPaymentModal = (item) => {
    setSelectedEnrollment(item);
    setPaymentData({
      method: 'credit_card',
      notes: '',
      card: { holderName: '', number: '', expiryMonth: '', expiryYear: '', cvv: '' },
      proofImage: ''
    });
    setShowPaymentModal(true);
  };

  const openReviewsModal = async (teacher, teacherName) => {
    try {
      setReviewsTeacher({ id: teacher, name: teacherName });
      setShowReviewsModal(true);
      setReviewsLoading(true);
      const res = await apiClient.get(`/reviews/teacher/${teacher}?limit=10`);
      if (res.data.success) {
        setTeacherReviews(res.data.reviews || []);
        setReviewsSummary(res.data.summary || { average: 0, count: 0 });
      } else {
        setTeacherReviews([]);
        setReviewsSummary({ average: 0, count: 0 });
      }
    } catch (err) {
      console.error('Error fetching reviews', err);
      setTeacherReviews([]);
      setReviewsSummary({ average: 0, count: 0 });
    } finally {
      setReviewsLoading(false);
    }
  };

  const submitReview = async (enrollment) => {
    try {
      setSubmittingReview(true);
      const payload = {
        teacherId: enrollment.teacher._id,
        courseId: enrollment.course._id,
        rating: Number(reviewData.rating),
        comment: reviewData.comment
      };
      const res = await apiClient.post('/reviews', payload);
      if (res.data.success) {
        alert('Review submitted successfully');
        setReviewData({ rating: 5, comment: '' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      subject: '',
      gradeLevel: '',
      minPrice: 0,
      maxPrice: 1000
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const copyMeetingLink = (meetingUrl) => {
    navigator.clipboard.writeText(meetingUrl);
    alert('Meeting link copied to clipboard!');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSessionToday = (date) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const sessionDate = new Date(date).setHours(0, 0, 0, 0);
    return today === sessionDate;
  };

  const getSessionStatusColor = (session) => {
    if (session.status === 'completed') return 'bg-green-100 text-green-800';
    if (session.status === 'started') return 'bg-yellow-100 text-yellow-800';
    if (session.status === 'cancelled') return 'bg-red-100 text-red-800';
    if (isSessionToday(session.scheduledAt)) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getSessionTimeUntil = (date) => {
    const now = new Date();
    const sessionTime = new Date(date);
    const diffMs = sessionTime - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffMs < 0) return 'Session has passed';
    if (diffDays > 0) return `${diffDays} day(s) remaining`;
    if (diffHours > 0) return `${diffHours} hour(s) remaining`;
    if (diffMinutes > 0) return `${diffMinutes} minute(s) remaining`;
    return 'Session starting now';
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
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Discover courses and connect with amazing teachers</p>
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
              { id: 'courses', name: 'Browse Courses', icon: BookOpen },
              { id: 'enrollments', name: 'My Courses', icon: UserCheck },
              { id: 'requests', name: 'Requests', icon: MessageSquare },
              { id: 'sessions', name: 'Upcoming Sessions', icon: Calendar },
              { id: 'payments', name: 'Payments', icon: CreditCard },
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
        {activeTab === 'courses' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="card">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-grow">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <select
                    className="input-field w-40"
                    value={filters.subject}
                    onChange={(e) => handleFilterChange('subject', e.target.value)}
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <select
                    className="input-field w-40"
                    value={filters.gradeLevel}
                    onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                  >
                    <option value="">All Levels</option>
                    {gradeLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Min Price"
                    className="input-field w-32"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    className="input-field w-32"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', parseFloat(e.target.value) || 1000)}
                  />
                  <button
                    onClick={resetFilters}
                    className="btn-secondary"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.subject} • {course.gradeLevel}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-600">{course.rating || 0}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.enrollmentCount} enrolled
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {course.pricing.freeTrialDays} days free
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-primary-600">
                      ${course.pricing.pricePerSession}/session
                    </div>
                    <div className="flex space-x-2">
                    <button
                      onClick={() => openReviewsModal(course.teacher._id || course.teacher.id, course.teacher.name)}
                      className="btn-secondary text-sm py-1 px-3"
                    >
                      View Reviews
                    </button>
                      <button
                        onClick={() => openCourseModal(course)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {course.isEnrolled ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Enrolled
                        </span>
                      ) : course.isRequested ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          course.requestStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          course.requestStatus === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {course.requestStatus}
                        </span>
                      ) : (
                        <button
                          onClick={() => requestCourse(course._id)}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary flex items-center space-x-1 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary flex items-center space-x-1 disabled:opacity-50"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'enrollments' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Enrolled Courses</h2>
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <div key={enrollment._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{enrollment.course.title}</h4>
                        <p className="text-sm text-gray-500">{enrollment.course.subject}</p>
                        <p className="text-sm text-gray-600">Teacher: {enrollment.teacher.name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        enrollment.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                        enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${enrollment.course.pricing.pricePerSession}/session
                        </span>
                        <span className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {enrollment.payment.sessionsCompleted} sessions completed
                        </span>
                        {enrollment.status === 'trial' && (
                          <span className="flex items-center text-orange-600">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            Trial ends: {new Date(enrollment.trialEndsAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {enrollment.status === 'active' && (
                          <button
                            onClick={() => openPaymentModal(enrollment)}
                            className="btn-primary text-sm py-1 px-3"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay Now
                          </button>
                        )}
                        <button
                          onClick={() => openReviewsModal(enrollment.teacher._id || enrollment.teacher.id, enrollment.teacher.name)}
                          className="btn-secondary text-sm py-1 px-3"
                        >
                          View Reviews
                        </button>
                        {/* Review form (students can review their teacher) */}
                        {enrollment.status !== 'cancelled' && (
                          <div className="flex items-center space-x-2">
                            <select
                              className="input-field text-xs w-20"
                              value={reviewData.rating}
                              onChange={(e) => setReviewData(prev => ({ ...prev, rating: e.target.value }))}
                            >
                              <option value={5}>5 ★</option>
                              <option value={4}>4 ★</option>
                              <option value={3}>3 ★</option>
                              <option value={2}>2 ★</option>
                              <option value={1}>1 ★</option>
                            </select>
                            <input
                              type="text"
                              className="input-field text-xs"
                              placeholder="Write a short review"
                              value={reviewData.comment}
                              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                            />
                            <button
                              disabled={submittingReview}
                              onClick={() => submitReview(enrollment)}
                              className="btn-secondary text-xs py-1 px-2"
                            >
                              {submittingReview ? 'Sending...' : 'Review'}
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => cancelEnrollment(enrollment._id)}
                          className="btn-secondary text-sm py-1 px-3 text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Course Requests</h2>
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.course.title}</h4>
                        <p className="text-sm text-gray-500">Teacher: {request.teacher.name}</p>
                        <p className="text-sm text-gray-600 mt-1">{request.message}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.status === 'accepted' && (
                        <button
                          onClick={() => {
                            fetchEnrollments();
                            setActiveTab('enrollments');
                          }}
                          className="btn-primary text-sm py-1 px-3"
                        >
                          View Enrollment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Sessions</h2>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{session.course.title}</h4>
                        <p className="text-sm text-gray-500">Teacher: {session.teacher.name}</p>
                        <p className="text-sm text-gray-600">
                          Session: {formatDate(session.scheduledAt)} at {formatTime(session.scheduledAt)}
                        </p>
                        <p className="text-sm text-gray-500">{getSessionTimeUntil(session.scheduledAt)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSessionStatusColor(session)}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                    )}
                    
                    {/* Meeting Information */}
                    {session.meeting && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Video className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">
                            {session.meeting.platform.charAt(0).toUpperCase()}{session.meeting.platform.slice(1)} Meeting
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Duration: {session.duration} minutes
                          </span>
                          {session.meeting.meetingId && (
                            <span className="flex items-center">
                              <Copy className="h-4 w-4 mr-1" />
                              ID: {session.meeting.meetingId}
                            </span>
                          )}
                          {session.meeting.meetingPassword && (
                            <span className="flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Password Protected
                            </span>
                          )}
                        </div>
                        
                        {session.meeting.meetingUrl && (
                          <div className="flex items-center space-x-2 mt-2">
                            <button
                              onClick={() => window.open(session.meeting.meetingUrl, '_blank')}
                              className="btn-primary text-sm py-1 px-3 flex items-center space-x-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>Join Meeting</span>
                            </button>
                            <button
                              onClick={() => copyMeetingLink(session.meeting.meetingUrl)}
                              className="btn-secondary text-sm py-1 px-3 flex items-center space-x-1"
                            >
                              <Copy className="h-4 w-4" />
                              <span>Copy Link</span>
                            </button>
                          </div>
                        )}
                        
                        {session.meeting.meetingPassword && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                            <span className="font-medium">Password:</span> {session.meeting.meetingPassword}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Session Materials */}
                    {session.materials && session.materials.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Session Materials</h5>
                        <div className="space-y-1">
                          {session.materials.map((material, index) => (
                            <a
                              key={index}
                              href={material}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Material {index + 1}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Course Details Modal */}
        {showCourseModal && selectedCourse && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedCourse.title}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Course Details</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedCourse.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="font-medium">Subject:</span> {selectedCourse.subject}
                      </div>
                      <div>
                        <span className="font-medium">Level:</span> {selectedCourse.gradeLevel}
                      </div>
                      <div>
                        <span className="font-medium">Price:</span> ${selectedCourse.pricing.pricePerSession}/session
                      </div>
                      <div>
                        <span className="font-medium">Free Trial:</span> {selectedCourse.pricing.freeTrialDays} days
                      </div>
                    </div>

                    {/* Course Content Section */}
                    {selectedCourse.content && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Course Content</h4>
                        
                        {/* Overview */}
                        {selectedCourse.content.overview && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Overview
                            </h5>
                            <p className="text-sm text-gray-600 pl-6">{selectedCourse.content.overview}</p>
                          </div>
                        )}

                        {/* Objectives */}
                        {selectedCourse.content.objectives && selectedCourse.content.objectives.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                              <Target className="h-4 w-4 mr-2" />
                              Learning Objectives
                            </h5>
                            <ul className="text-sm text-gray-600 pl-6 space-y-1">
                              {selectedCourse.content.objectives.map((objective, index) => (
                                <li key={index} className="flex items-start">
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-1 flex-shrink-0" />
                                  {objective}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Curriculum */}
                        {selectedCourse.content.curriculum && selectedCourse.content.curriculum.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                              <List className="h-4 w-4 mr-2" />
                              Curriculum
                            </h5>
                            <ul className="text-sm text-gray-600 pl-6 space-y-1">
                              {selectedCourse.content.curriculum.map((item, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mt-0.5 flex-shrink-0">
                                    {index + 1}
                                  </span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Materials */}
                        {selectedCourse.content.materials && selectedCourse.content.materials.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-800 mb-2 flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Materials & Resources
                            </h5>
                            <ul className="text-sm text-gray-600 pl-6 space-y-1">
                              {selectedCourse.content.materials.map((material, index) => (
                                <li key={index} className="flex items-start">
                                  <Paperclip className="h-3 w-3 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                                  {material}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Teacher</h4>
                    <div className="flex items-center space-x-3">
                      <User className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{selectedCourse.teacher.name}</p>
                        <p className="text-sm text-gray-500">{selectedCourse.teacher.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Availability</h4>
                    <p className="text-sm text-gray-600">
                      {selectedCourse.availableSlots} of {selectedCourse.enrollment.maxStudents} spots available
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowCourseModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  {!selectedCourse.isEnrolled && !selectedCourse.isRequested && (
                    <button
                      onClick={() => requestCourse(selectedCourse._id)}
                      className="btn-primary"
                    >
                      Request Enrollment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Pending Payments */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Pending Payments</h2>
                <p className="text-sm text-gray-500">Courses requiring payment to continue</p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {pendingPayments.length > 0 ? (
                  pendingPayments.map((item) => {
                    const trialEndsAt = new Date(item.enrollment.trialEndsAt);
                    
                    return (
                      <div key={item.course._id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{item.course.title}</h3>
                            <p className="text-sm text-gray-500">by {item.teacher.name}</p>
                            <p className="text-sm text-gray-600 mt-2">
                              {item.trialExpired ? (
                                <span className="text-red-600 font-medium">Trial period ended</span>
                              ) : (
                                <span className="text-orange-600">
                                  Trial ends: {trialEndsAt.toLocaleDateString()}
                                </span>
                              )}
                            </p>
                            {item.course.pricing.upfrontPayment && (
                              <p className="text-sm text-blue-600 mt-1">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                Upfront payment required
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                ${item.course.pricing.pricePerSession}
                              </p>
                              <p className="text-sm text-gray-500">per session</p>
                            </div>
                            
                            <button
                              onClick={() => openPaymentModal(item)}
                              className="btn-primary"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Make Payment
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending payments</p>
                    <p className="text-sm">All your enrolled courses are up to date</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment History</h2>
                <p className="text-sm text-gray-500">Your completed payments</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.length > 0 ? (
                      paymentHistory.map((payment) => (
                        <tr key={payment._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.course?.title || 'Unknown Course'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.teacher?.name || 'Unknown Teacher'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No payment history found</p>
                          <p className="text-sm">Your payments will appear here</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

        {/* Payment Modal */}
        {showPaymentModal && selectedEnrollment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment for {selectedEnrollment.course.title}</h3>
                <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course Details</label>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Teacher: {selectedEnrollment.teacher.name}</p>
                      <p>Subject: {selectedEnrollment.course.subject}</p>
                      <p>Grade Level: {selectedEnrollment.course.gradeLevel}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <div className="text-lg font-bold text-primary-600">
                      ${selectedEnrollment.course.pricing.pricePerSession}
                    </div>
                    <p className="text-sm text-gray-500">per session</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <select
                      className="input-field mt-1"
                      value={paymentData.method}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  {/* Conditional fields: card details */}
                  {['credit_card','debit_card'].includes(paymentData.method) && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name on Card</label>
                        <input
                          type="text"
                          className="input-field mt-1"
                          value={paymentData.card.holderName}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, card: { ...prev.card, holderName: e.target.value } }))}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Card Number</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={16}
                          className="input-field mt-1"
                          value={paymentData.card.number}
                          onChange={(e) => setPaymentData(prev => ({ ...prev, card: { ...prev.card, number: e.target.value.replace(/\D/g,'') } }))}
                          placeholder="1234123412341234"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Expiry Month</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            className="input-field mt-1"
                            value={paymentData.card.expiryMonth}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, card: { ...prev.card, expiryMonth: e.target.value } }))}
                            placeholder="MM"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Expiry Year</label>
                          <input
                            type="number"
                            min={new Date().getFullYear()}
                            className="input-field mt-1"
                            value={paymentData.card.expiryYear}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, card: { ...prev.card, expiryYear: e.target.value } }))}
                            placeholder="YYYY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">CVV</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            className="input-field mt-1"
                            value={paymentData.card.cvv}
                            onChange={(e) => setPaymentData(prev => ({ ...prev, card: { ...prev.card, cvv: e.target.value.replace(/\D/g,'') } }))}
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conditional fields: proof upload */}
                  {['bank_transfer','cash'].includes(paymentData.method) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload Payment Proof (image)</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setPaymentData(prev => ({ ...prev, proofImage: String(ev.target?.result || '') }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      {paymentData.proofImage && (
                        <img src={paymentData.proofImage} alt="proof" className="mt-2 h-24 object-contain border rounded" />
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                    <textarea
                      className="input-field mt-1"
                      rows="3"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any additional notes..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Create Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Modal */}
        {showReviewsModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Reviews for {reviewsTeacher?.name}</h3>
                    <p className="text-sm text-gray-600">
                      Average {reviewsSummary.average.toFixed(1)} / 5 • {reviewsSummary.count} review{reviewsSummary.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowReviewsModal(false); setTeacherReviews([]); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reviewsLoading ? (
                    <div className="py-10 text-center text-gray-500">Loading reviews...</div>
                  ) : teacherReviews.length > 0 ? (
                    teacherReviews.map((r) => (
                      <div key={r._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.student?.name || 'Student'}</p>
                            <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[1,2,3,4,5].map((i) => (
                              <Star key={i} className={`h-4 w-4 ${i <= r.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-gray-700 mt-2">{r.comment}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No reviews yet for this teacher.</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-4 pt-2 border-t">
                  <button
                    onClick={() => setShowReviewsModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;