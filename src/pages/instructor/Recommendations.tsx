import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Filter, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: string;
  student_id: number;
  student_name: string;
  student_email: string;
  recommendation_type: 'Academic' | 'Project' | 'Skill' | 'Performance' | 'Career' | 'Mentorship';
  title: string;
  description: string;
  priority_level: 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Submitted' | 'Reviewed';
  is_read: boolean;
  course_title?: string;
  course_code?: string;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: number;
  full_name: string;
  email: string;
  department_name: string;
  recommendation_count: number;
}

interface Statistics {
  total_recommendations: number;
  draft_count: number;
  submitted_count: number;
  reviewed_count: number;
  high_priority_count: number;
  unread_count: number;
}

const RECOMMENDATION_TYPES = ['Academic', 'Project', 'Skill', 'Performance', 'Career', 'Mentorship'];
const PRIORITY_LEVELS = ['Low', 'Medium', 'High'];
const STATUSES = ['Draft', 'Submitted', 'Reviewed'];

export default function InstructorRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [filters, setFilters] = useState({
    student_id: 'all',
    recommendation_type: 'all',
    status: 'all',
    priority_level: 'all'
  });

  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    recommendation_type: '',
    title: '',
    description: '',
    priority_level: 'Medium',
    status: 'Draft'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchRecommendations({}), // Pass empty filters for initial load
        fetchStudents(),
        fetchStatistics()
      ]);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (customFilters = null) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const queryParams = new URLSearchParams();
      
      // Use custom filters if provided, otherwise use component state filters
      const filtersToUse = customFilters || filters;
      
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value && value !== 'all') queryParams.append(key, value);
      });

      const url = `/api/instructor/recommendations?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error);
      throw error;
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const url = '/api/instructor/recommendations/students/assigned';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      const studentsArray = data.students || [];
      setStudents(studentsArray);
      
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      throw error;
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      const url = '/api/instructor/recommendations/stats/overview';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setStatistics(data.statistics);
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      throw error;
    }
  };

  const handleCreateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.student_id) {
      toast({
        title: "Validation Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    if (formData.title.trim().length < 5) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    if (formData.description.trim().length < 20) {
      toast({
        title: "Validation Error",
        description: "Description must be at least 20 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!formData.recommendation_type) {
      toast({
        title: "Validation Error",
        description: "Please select a recommendation type",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/instructor/recommendations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          student_id: parseInt(formData.student_id)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create recommendation');
      }

      toast({
        title: "Success",
        description: "Recommendation created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating recommendation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create recommendation",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecommendation) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/instructor/recommendations/${selectedRecommendation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update recommendation');
      }

      toast({
        title: "Success",
        description: "Recommendation updated successfully",
      });

      setIsEditDialogOpen(false);
      setSelectedRecommendation(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update recommendation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/instructor/recommendations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete recommendation');
      }

      toast({
        title: "Success",
        description: "Recommendation deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete recommendation",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      recommendation_type: '',
      title: '',
      description: '',
      priority_level: 'Medium',
      status: 'Draft'
    });
  };

  const openEditDialog = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setFormData({
      student_id: recommendation.student_id.toString(),
      recommendation_type: recommendation.recommendation_type,
      title: recommendation.title,
      description: recommendation.description,
      priority_level: recommendation.priority_level,
      status: recommendation.status
    });
    setIsEditDialogOpen(true);
  };

  const applyFilters = () => {
    fetchRecommendations(filters);
  };

  const clearFilters = () => {
    setFilters({
      student_id: 'all',
      recommendation_type: 'all',
      status: 'all',
      priority_level: 'all'
    });
    fetchRecommendations({});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Reviewed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading recommendations...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setError(null);
                  fetchData();
                }}
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Recommendations</h1>
            <p className="text-gray-600">Manage academic and career recommendations for your students</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create Recommendation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Recommendation</DialogTitle>
                <DialogDescription>
                  Provide academic, project, or career guidance to your students
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRecommendation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="student">Student *</Label>
                    <Select value={formData.student_id} onValueChange={(value) => setFormData({...formData, student_id: value})}>
                      <SelectTrigger className={!formData.student_id ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.length === 0 ? (
                          <SelectItem value="no-students" disabled>
                            No students assigned
                          </SelectItem>
                        ) : (
                          students.map((student) => {
                            return (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.full_name} ({student.email})
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {!formData.student_id && (
                      <p className="text-xs text-red-500 mt-1">Please select a student</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="type">Recommendation Type *</Label>
                    <Select value={formData.recommendation_type} onValueChange={(value) => setFormData({...formData, recommendation_type: value})}>
                      <SelectTrigger className={!formData.recommendation_type ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECOMMENDATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formData.recommendation_type && (
                      <p className="text-xs text-red-500 mt-1">Please select a recommendation type</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Brief title for the recommendation (minimum 5 characters)"
                    className={formData.title.trim().length > 0 && formData.title.trim().length < 5 ? 'border-red-300' : ''}
                    required
                  />
                  <p className={`text-xs mt-1 ${formData.title.trim().length < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.title.length}/255 characters (minimum 5 required)
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detailed recommendation and guidance... (minimum 20 characters)"
                    className={formData.description.trim().length > 0 && formData.description.trim().length < 20 ? 'border-red-300' : ''}
                    rows={4}
                    required
                  />
                  <p className={`text-xs mt-1 ${formData.description.trim().length < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                    {formData.description.length}/2000 characters (minimum 20 required)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={formData.priority_level} onValueChange={(value) => setFormData({...formData, priority_level: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={
                      !formData.student_id || 
                      !formData.recommendation_type || 
                      formData.title.trim().length < 5 || 
                      formData.description.trim().length < 20
                    }
                    className="flex-1"
                  >
                    Create Recommendation
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Recommendations</p>
                    <p className="text-2xl font-bold text-gray-900">{statistics.total_recommendations}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.high_priority_count}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.submitted_count}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-orange-600">{statistics.unread_count}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={filters.student_id || 'all'} onValueChange={(value) => setFilters({...filters, student_id: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.length === 0 ? (
                    <SelectItem value="no-students" disabled>
                      No students assigned
                    </SelectItem>
                  ) : (
                    students.map((student) => {
                      return (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.full_name}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <Select value={filters.recommendation_type || 'all'} onValueChange={(value) => setFilters({...filters, recommendation_type: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {RECOMMENDATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({...filters, status: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.priority_level || 'all'} onValueChange={(value) => setFilters({...filters, priority_level: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {PRIORITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2 mt-4">
              <Button onClick={applyFilters} variant="outline">Apply Filters</Button>
              <Button onClick={clearFilters} variant="ghost">Clear Filters</Button>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations List */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations ({recommendations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recommendations found</p>
                <p className="text-sm text-gray-500">Create your first recommendation to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                          <Badge className={getPriorityColor(recommendation.priority_level)}>
                            {recommendation.priority_level}
                          </Badge>
                          <Badge className={getStatusColor(recommendation.status)}>
                            {recommendation.status}
                          </Badge>
                          <Badge variant="outline">{recommendation.recommendation_type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Student:</strong> {recommendation.student_name} ({recommendation.student_email})
                        </p>
                        <p className="text-gray-700 mb-2">{recommendation.description}</p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(recommendation.created_at).toLocaleDateString()}
                          {recommendation.updated_at !== recommendation.created_at && (
                            <span> • Updated: {new Date(recommendation.updated_at).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(recommendation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteRecommendation(recommendation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Recommendation</DialogTitle>
              <DialogDescription>
                Update the recommendation details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateRecommendation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Recommendation Type</Label>
                  <Select value={formData.recommendation_type} onValueChange={(value) => setFormData({...formData, recommendation_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECOMMENDATION_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority Level</Label>
                  <Select value={formData.priority_level} onValueChange={(value) => setFormData({...formData, priority_level: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Brief title for the recommendation"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed recommendation and guidance..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Recommendation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}