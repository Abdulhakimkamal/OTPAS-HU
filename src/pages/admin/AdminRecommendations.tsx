import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, BookOpen, Users, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateEmail, validateRequired, validateLength, createErrorMessage } from '@/utils/validationErrors';

interface Recommendation {
  id: string;
  studentName: string;
  studentEmail: string;
  type: 'course' | 'project' | 'guidance';
  title: string;
  description: string;
  score: number;
  status: 'active' | 'completed' | 'dismissed';
  createdDate: string;
}

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    studentName: 'Abebe Kebede',
    studentEmail: 'abebe.kebede@student.haramaya.edu',
    type: 'course',
    title: 'Advanced Database Systems',
    description: 'Based on your strong performance in Database Fundamentals, we recommend this advanced course.',
    score: 92,
    status: 'active',
    createdDate: '2024-01-18',
  },
  {
    id: '2',
    studentName: 'Tigist Hailu',
    studentEmail: 'tigist.hailu@student.haramaya.edu',
    type: 'project',
    title: 'Machine Learning Project',
    description: 'Your skills in Python and statistics make you ideal for this ML project.',
    score: 88,
    status: 'active',
    createdDate: '2024-01-19',
  },
  {
    id: '3',
    studentName: 'Almaz Tekle',
    studentEmail: 'almaz.tekle@student.haramaya.edu',
    type: 'guidance',
    title: 'Academic Support Program',
    description: 'We recommend enrolling in our tutoring program to improve your GPA.',
    score: 65,
    status: 'active',
    createdDate: '2024-01-20',
  },
  {
    id: '4',
    studentName: 'Abebe Kebede',
    studentEmail: 'abebe.kebede@student.haramaya.edu',
    type: 'project',
    title: 'Web Development Capstone',
    description: 'Complete your degree with this comprehensive capstone project.',
    score: 95,
    status: 'completed',
    createdDate: '2024-01-10',
  },
];

export default function AdminRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    studentEmail: '',
    type: 'course',
    title: '',
    description: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
    setMessage(null);
  };

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate student email (required, valid format)
    const emailError = validateEmail(formData.studentEmail);
    if (emailError) {
      setFieldError('studentEmail', emailError);
      isValid = false;
    }

    // Validate title (required, 5-100 chars)
    const titleError = validateRequired(formData.title, 'Title') || 
                       validateLength(formData.title, 5, 100, 'Title');
    if (titleError) {
      setFieldError('title', titleError);
      isValid = false;
    }

    // Validate description (required, 10-500 chars)
    const descError = validateRequired(formData.description, 'Description') || 
                      validateLength(formData.description, 10, 500, 'Description');
    if (descError) {
      setFieldError('description', descError);
      isValid = false;
    }

    return isValid;
  };

  const handleAddRecommendation = async () => {
    setMessage(null);
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await adminApi.createRecommendation(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newRec: Recommendation = {
        id: String(recommendations.length + 1),
        studentName: 'New Student',
        studentEmail: formData.studentEmail,
        type: formData.type as 'course' | 'project' | 'guidance',
        title: formData.title,
        description: formData.description,
        score: 75,
        status: 'active',
        createdDate: new Date().toISOString().split('T')[0],
      };
      
      setRecommendations([...recommendations, newRec]);
      setFormData({ studentEmail: '', type: 'course', title: '', description: '' });
      clearErrors();
      setMessage({ type: 'success', text: 'Recommendation created successfully!' });
      
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1500);
    } catch (error: any) {
      handleApiError(error);
      if (!getError('studentEmail') && !getError('title') && !getError('description')) {
        setMessage({ type: 'error', text: createErrorMessage(error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: 'active' | 'completed' | 'dismissed') => {
    setRecommendations(
      recommendations.map((rec) =>
        rec.id === id ? { ...rec, status: newStatus } : rec
      )
    );
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesType = filterType === 'all' || rec.type === filterType;
    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'project':
        return <TrendingUp className="h-4 w-4" />;
      case 'guidance':
        return <Users className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-700';
      case 'project':
        return 'bg-purple-100 text-purple-700';
      case 'guidance':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'dismissed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Recommendation',
      render: (value: string, row: Recommendation) => (
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${getTypeColor(row.type)}`}>
            {getTypeIcon(row.type)}
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{row.studentName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value: string) => (
        <Badge variant="outline" className="capitalize">
          {value}
        </Badge>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ];

  const activeCount = recommendations.filter((r) => r.status === 'active').length;
  const completedCount = recommendations.filter((r) => r.status === 'completed').length;
  const avgScore = (recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length).toFixed(1);

  return (
    <AdminLayout
      title="Recommendation Engine"
      description="Manage system recommendations for courses, projects, and student guidance"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recommendations</p>
                  <p className="text-2xl font-bold">{recommendations.length}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{avgScore}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>Manage all system recommendations</CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Add Recommendation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Recommendation</DialogTitle>
                  <DialogDescription>Add a new recommendation for a student</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Alert Messages */}
                  {message && (
                    <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
                      {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="studentEmail">
                      Student Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      value={formData.studentEmail}
                      onChange={(e) => handleChange('studentEmail', e.target.value)}
                      placeholder="student@haramaya.edu"
                      className={getError('studentEmail') ? 'border-red-500' : ''}
                    />
                    <FormError error={getError('studentEmail')} />
                  </div>
                  <div>
                    <Label htmlFor="type">
                      Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="guidance">Guidance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="title">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Recommendation title"
                      className={getError('title') ? 'border-red-500' : ''}
                    />
                    <FormError error={getError('title')} />
                    <p className="text-xs text-muted-foreground mt-1">5-100 characters</p>
                  </div>
                  <div>
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      placeholder="Describe the recommendation"
                      rows={4}
                      className={getError('description') ? 'border-red-500' : ''}
                    />
                    <FormError error={getError('description')} />
                    <p className="text-xs text-muted-foreground mt-1">
                      10-500 characters ({formData.description.length}/500)
                    </p>
                  </div>
                  <Button onClick={handleAddRecommendation} className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Recommendation'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="course">Course</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="guidance">Guidance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Recommendations Table */}
            <div className="space-y-3">
              {filteredRecommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-2 rounded-lg ${getTypeColor(rec.type)}`}>
                          {getTypeIcon(rec.type)}
                        </div>
                        <h3 className="font-medium">{rec.title}</h3>
                        <Badge variant="outline" className="capitalize">
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{rec.studentName}</span>
                        <span>Score: {rec.score}</span>
                        <span>Created: {rec.createdDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={rec.status}
                        onValueChange={(value) => handleUpdateStatus(rec.id, value as 'active' | 'completed' | 'dismissed')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
