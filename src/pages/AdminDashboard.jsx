import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  BookOpen, 
  TrendingUp, 
  Search,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import apiClient from '../utils/api.js';
import Chat from '../components/Chat.jsx';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Only essential state
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    users: { total: 0, students: 0, teachers: 0, admins: 0 },
    courses: { total: 0, published: 0, draft: 0, archived: 0 },
    enrollments: { total: 0, active: 0 },
    sessions: { total: 0, upcoming: 0 }
  });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    subjects: [],
    gradeLevels: [],
    bio: ''
  });
  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'student',
    subjects: [],
    gradeLevels: [],
    bio: ''
  });
  const [contacts, setContacts] = useState([]);
  const [contactStats, setContactStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    closed: 0,
    recent: 0,
    weekly: 0
  });
  const [contactStatusFilter, setContactStatusFilter] = useState('');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [paymentAnalytics, setPaymentAnalytics] = useState({
    totalIncome: 0,
    incomeByStudent: [],
    incomeByTeacher: [],
    incomeByCourse: [],
    statusSummary: []
  });

  // Debug logging
  console.log('Admin Dashboard - Current user:', user?.name, user?.role);
  console.log('Admin Dashboard - User object:', user);

  // Static data
  const subjects = [
    'Mathematics', 'Science', 'English', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art'
  ];

  const gradeLevels = [
    'Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)',
    'College', 'Adult Education'
  ];


  // API functions
  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(userSearchTerm && { search: userSearchTerm }),
        ...(userRoleFilter && { role: userRoleFilter })
      });

      const response = await apiClient.get(`/admin/users?${params}`);
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, userSearchTerm, userRoleFilter]);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/courses?limit=10');
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses', error);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(contactStatusFilter && { status: contactStatusFilter }),
        ...(contactSearchTerm && { search: contactSearchTerm })
      });

      const response = await apiClient.get(`/contact?${params}`);
      if (response.data.success) {
        setContacts(response.data.contacts);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  }, [currentPage, contactStatusFilter, contactSearchTerm]);

  const fetchContactStats = async () => {
    try {
      const response = await apiClient.get('/contact/stats/summary');
      if (response.data.success) {
        setContactStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching contact stats:', error);
    }
  };

  const updateContactStatus = async (contactId, status, adminNotes = '') => {
    try {
      const response = await apiClient.put(`/contact/${contactId}`, {
        status,
        adminNotes
      });
      if (response.data.success) {
        fetchContacts();
        fetchContactStats();
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const deleteContact = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact submission?')) {
      try {
        const response = await apiClient.delete(`/contact/${contactId}`);
        if (response.data.success) {
          fetchContacts();
          fetchContactStats();
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await apiClient.get('/payment/admin/all');
      if (response.data.success) {
        // Payments are not used in the UI, only analytics
        console.log('Payments fetched:', response.data.payments?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPaymentAnalytics = async () => {
    try {
      const response = await apiClient.get('/payment/admin/analytics');
      if (response.data.success) {
        setPaymentAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchCourses();
    fetchContactStats();
    fetchPaymentAnalytics();
  }, [fetchUsers, fetchCourses]);

  // Reset to page 1 when search parameters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUsers();
    }
  }, [userSearchTerm, userRoleFilter, currentPage, fetchUsers]);

  // Fetch contacts when filters change
  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchContacts();
    } else if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, contactStatusFilter, contactSearchTerm, currentPage, fetchContacts]);

  // Fetch users when page changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, fetchUsers]);

  // Event handlers
  const openCourseModal = async (course) => {
    try {
      console.log('Opening course modal for:', course.title);
      setSelectedCourse(course);
      setShowCourseModal(true);
      
      // Fetch detailed course information
      const response = await apiClient.get(`/admin/courses/${course._id}`);
      if (response.data.success) {
        setCourseDetails(response.data.course);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  // User CRUD handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/admin/users', newUser);
      if (response.data.success) {
        setUsers([response.data.user, ...users]);
        setNewUser({
          name: '',
          email: '',
          role: 'student',
          password: '',
          subjects: [],
          gradeLevels: [],
          bio: ''
        });
        setShowCreateUser(false);
        // Refresh stats
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(`/admin/users/${selectedUser._id}`, editUser);
      if (response.data.success) {
        setUsers(users.map(user => 
          user._id === selectedUser._id ? response.data.user : user
        ));
        setShowEditUser(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await apiClient.delete(`/admin/users/${userId}`);
        if (response.data.success) {
          setUsers(users.filter(user => user._id !== userId));
          // Refresh stats
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'subjects' || name === 'gradeLevels') {
        setNewUser(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      }
    } else {
      setNewUser({
        ...newUser,
        [name]: value
      });
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'subjects' || name === 'gradeLevels') {
        setEditUser(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      }
    } else {
      setEditUser({
        ...editUser,
        [name]: value
      });
    }
  };

  // Conditional rendering checks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If no user, show error message
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">No user found. Please login first.</p>
          <p className="text-sm text-gray-500 mt-2">
            <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
          </p>
        </div>
      </div>
    );
  }
  
  // If user is not admin, show error message
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font Bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges.</p>
          <p className="text-sm text-gray-500 mt-2">Current role: {user.role}</p>
          <p className="text-sm text-gray-500 mt-1">
            <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users and courses, monitor system activity</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* User Stats Row */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users?.students || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlus className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users?.teachers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.users?.admins || 0}</p>
              </div>
            </div>
          </div>

          {/* Course Stats Row */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.courses?.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Published Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.courses?.published || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Enrollments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.enrollments?.active || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sessions?.upcoming || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-700">User:</span> {user?.name}
            </div>
            <div>
              <span className="font-medium text-blue-700">Role:</span> {user?.role}
            </div>
            <div>
              <span className="font-medium text-blue-700">Token:</span> {user?.token ? 'Present' : 'Missing'}
            </div>
            <div>
              <span className="font-medium text-blue-700">Stats Loaded:</span> {stats.users.total > 0 ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium text-blue-700">Users Count:</span> {users.length}
            </div>
            <div>
              <span className="font-medium text-blue-700">Courses Count:</span> {courses.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'users', name: 'User Management', icon: Users },
              { id: 'courses', name: 'Course Management', icon: BookOpen },
              { id: 'payments', name: 'Payment Analytics', icon: DollarSign },
              { id: 'contacts', name: 'Contact Messages', icon: MessageSquare },
              { id: 'chat', name: 'Messages', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </button>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                    >
                      <option value="">All Roles</option>
                      <option value="admin">Admins</option>
                      <option value="teacher">Teachers</option>
                      <option value="student">Students</option>
                    </select>
                  </div>
                  {(userSearchTerm || userRoleFilter) && (
                    <button
                      onClick={() => {
                        setUserSearchTerm('');
                        setUserRoleFilter('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              
              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {/* View Button */}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserDetails(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {/* Edit Button */}
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUser({
                                    name: user.name,
                                    email: user.email,
                                    role: user.role,
                                    subjects: user.subjects || [],
                                    gradeLevels: user.gradeLevels || [],
                                    bio: user.bio || ''
                                  });
                                  setShowEditUser(true);
                                }}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="Edit User"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between">
                      <div className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{currentPage}</span> of{' '}
                        <span className="font-medium">{totalPages}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Course Management</h2>
              </div>
              
              {/* Courses Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500">{course.subject} • {course.gradeLevel}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{course.teacher?.name}</div>
                              <div className="text-sm text-gray-500">{course.teacher?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              course.status === 'published' ? 'bg-green-100 text-green-800' :
                              course.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => openCourseModal(course)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          No courses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Course Details Modal */}
        {showCourseModal && (selectedCourse || courseDetails) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Course Details</h3>
                  <button
                    onClick={() => {
                      setShowCourseModal(false);
                      setSelectedCourse(null);
                      setCourseDetails(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Course Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      {courseDetails?.title || selectedCourse?.title}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div><span className="font-medium">Subject:</span> {courseDetails?.subject || selectedCourse?.subject}</div>
                      <div><span className="font-medium">Level:</span> {courseDetails?.gradeLevel || selectedCourse?.gradeLevel}</div>
                      <div><span className="font-medium">Price:</span> ${courseDetails?.pricing?.pricePerSession || selectedCourse?.pricing?.pricePerSession}/session</div>
                      <div><span className="font-medium">Status:</span> {courseDetails?.status || selectedCourse?.status}</div>
                    </div>
                    <p className="text-sm text-gray-600">{courseDetails?.description || selectedCourse?.description}</p>
                  </div>

                  {/* Teacher Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Teacher</h4>
                    <div className="flex items-center space-x-3">
                      <UserPlus className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="font-medium">{courseDetails?.teacher?.name || selectedCourse?.teacher?.name}</p>
                        <p className="text-sm text-gray-500">{courseDetails?.teacher?.email || selectedCourse?.teacher?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Course Statistics */}
                  {courseDetails && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Course Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="font-medium text-blue-800">{courseDetails.statistics?.activeEnrollments || 0}</div>
                          <div className="text-blue-600">Active Students</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="font-medium text-green-800">{courseDetails.statistics?.completedEnrollments || 0}</div>
                          <div className="text-green-600">Completed</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded">
                          <div className="font-medium text-yellow-800">{courseDetails.statistics?.upcomingSessions || 0}</div>
                          <div className="text-yellow-600">Upcoming Sessions</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="font-medium text-purple-800">{courseDetails.statistics?.totalSessions || 0}</div>
                          <div className="text-purple-600">Total Sessions</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enrolled Students */}
                  {courseDetails?.enrollments && courseDetails.enrollments.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Enrolled Students ({courseDetails.enrollments.length})
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded">
                        {courseDetails.enrollments.map((enrollment) => (
                          <div key={enrollment._id} className="flex items-center justify-between p-3 bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <UserCheck className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-sm">{enrollment.student?.name}</p>
                                <p className="text-xs text-gray-500">{enrollment.student?.email}</p>
                                <p className="text-xs text-gray-500">
                                  Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              enrollment.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                              enrollment.status === 'active' ? 'bg-green-100 text-green-800' :
                              enrollment.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {enrollment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  {courseDetails?.sessions && courseDetails.sessions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Recent Sessions</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded">
                        {courseDetails.sessions.slice(0, 5).map((session) => (
                          <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50">
                            <div>
                              <p className="font-medium text-sm">{new Date(session.scheduledAt).toLocaleDateString()}</p>
                              <p className="text-xs text-gray-500">{session.description || 'No description'}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              session.status === 'completed' ? 'bg-green-100 text-green-800' :
                              session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {session.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowCourseModal(false);
                      setSelectedCourse(null);
                      setCourseDetails(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                  <button
                    onClick={() => setShowCreateUser(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newUser.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newUser.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      name="role"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newUser.role}
                      onChange={handleInputChange}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={newUser.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  {(newUser.role === 'student' || newUser.role === 'teacher') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                          {subjects.map((subject) => (
                            <label key={subject} className="flex items-center">
                              <input
                                type="checkbox"
                                name="subjects"
                                value={subject}
                                checked={newUser.subjects.includes(subject)}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{subject}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade Levels</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                          {gradeLevels.map((level) => (
                            <label key={level} className="flex items-center">
                              <input
                                type="checkbox"
                                name="gradeLevels"
                                value={level}
                                checked={newUser.gradeLevels.includes(level)}
                                onChange={handleInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{level}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          name="bio"
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          value={newUser.bio}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateUser(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                  <button
                    onClick={() => setShowEditUser(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={editUser.name}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={editUser.email}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      name="role"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                      value={editUser.role}
                      onChange={handleEditInputChange}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {(editUser.role === 'student' || editUser.role === 'teacher') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                          {subjects.map((subject) => (
                            <label key={subject} className="flex items-center">
                              <input
                                type="checkbox"
                                name="subjects"
                                value={subject}
                                checked={editUser.subjects.includes(subject)}
                                onChange={handleEditInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{subject}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grade Levels</label>
                        <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                          {gradeLevels.map((level) => (
                            <label key={level} className="flex items-center">
                              <input
                                type="checkbox"
                                name="gradeLevels"
                                value={level}
                                checked={editUser.gradeLevels.includes(level)}
                                onChange={handleEditInputChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{level}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                          name="bio"
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                          value={editUser.bio}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowEditUser(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Update User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Payment Analytics Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Income</p>
                    <p className="text-2xl font-bold text-gray-900">${paymentAnalytics.totalIncome}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Students</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentAnalytics.incomeByStudent.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Teachers</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentAnalytics.incomeByTeacher.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Courses</p>
                    <p className="text-2xl font-bold text-gray-900">{paymentAnalytics.incomeByCourse.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Income by Student */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Income by Student</h2>
                <p className="text-sm text-gray-500">Top paying students</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentAnalytics.incomeByStudent.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${item.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Income by Teacher */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Income by Teacher</h2>
                <p className="text-sm text-gray-500">Teacher earnings</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentAnalytics.incomeByTeacher.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.teacher.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${item.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Income by Course */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Income by Course</h2>
                <p className="text-sm text-gray-500">Course performance</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payments</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentAnalytics.incomeByCourse.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.course.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.course.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.course.gradeLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${item.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Status Summary */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment Status Summary</h2>
                <p className="text-sm text-gray-500">Payment status breakdown</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentAnalytics.statusSummary.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item._id === 'completed' ? 'bg-green-100 text-green-800' :
                            item._id === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item._id === 'failed' ? 'bg-red-100 text-red-800' :
                            item._id === 'refunded' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item._id}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {item.count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Contact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{contactStats.total}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Messages</p>
                    <p className="text-2xl font-bold text-gray-900">{contactStats.new}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Replied</p>
                    <p className="text-2xl font-bold text-gray-900">{contactStats.replied}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{contactStats.weekly}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Management */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Contact Messages</h2>
                </div>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                        value={contactSearchTerm}
                        onChange={(e) => setContactSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={contactStatusFilter}
                      onChange={(e) => setContactStatusFilter(e.target.value)}
                    >
                      <option value="">All Status</option>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="replied">Replied</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Contacts Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.length > 0 ? (
                      contacts.map((contact) => (
                        <tr key={contact._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                              {contact.phone && (
                                <div className="text-sm text-gray-500">{contact.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {contact.message}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              contact.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                              contact.status === 'read' ? 'bg-blue-100 text-blue-800' :
                              contact.status === 'replied' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setShowContactDetails(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => updateContactStatus(contact._id, 'read')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as Read"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteContact(contact._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No contact messages found</p>
                          <p className="text-sm">Contact form submissions will appear here</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Role</label>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        selectedUser.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Subjects */}
                  {selectedUser.subjects && selectedUser.subjects.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Subjects</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.subjects.map((subject, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grade Levels */}
                  {selectedUser.gradeLevels && selectedUser.gradeLevels.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Grade Levels</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.gradeLevels.map((level, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md"
                          >
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Bio</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowUserDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
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

        {/* View Contact Details Modal */}
        {showContactDetails && selectedContact && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Contact Message Details</h3>
                  <button
                    onClick={() => setShowContactDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedContact.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedContact.email}</p>
                    </div>
                    {selectedContact.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedContact.phone}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedContact.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                        selectedContact.status === 'read' ? 'bg-blue-100 text-blue-800' :
                        selectedContact.status === 'replied' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedContact.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedContact.createdAt).toLocaleDateString()}</p>
                    </div>
                    {selectedContact.repliedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Replied At</label>
                        <p className="mt-1 text-sm text-gray-900">{new Date(selectedContact.repliedAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Message</label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedContact.message}</p>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {selectedContact.adminNotes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Admin Notes</label>
                      <div className="mt-1 p-4 bg-blue-50 rounded-md">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedContact.adminNotes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateContactStatus(selectedContact._id, 'read')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Mark as Read
                    </button>
                    <button
                      onClick={() => updateContactStatus(selectedContact._id, 'replied')}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Mark as Replied
                    </button>
                  </div>
                  <button
                    onClick={() => setShowContactDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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

export default AdminDashboard;