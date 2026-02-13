import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CourseMaterialsDashboard } from '@/components/departmentHead/CourseMaterialsDashboard';
import { TutorialFileManager } from '@/components/tutorial/TutorialFileManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Settings, 
  Eye, 
  AlertCircle,
  Users,
  Plus
} from 'lucide-react';

export default function CourseMaterials() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Course Materials Management</h1>
            <p className="text-muted-foreground">
              Monitor and manage tutorial materials across your department
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Read-Only Access
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Materials Overview</TabsTrigger>
            <TabsTrigger value="courses">Course Management</TabsTrigger>
            <TabsTrigger value="permissions">Permissions & Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CourseMaterialsDashboard />
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            {/* Course Management Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Structure Management
                  </CardTitle>
                  <CardDescription>
                    Manage courses and assign instructors (Department Head responsibility)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Register New Course</h4>
                        <p className="text-sm text-muted-foreground">
                          Create new courses in your department
                        </p>
                      </div>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Course
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Assign Instructors</h4>
                        <p className="text-sm text-muted-foreground">
                          Assign instructors to courses
                        </p>
                      </div>
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Assignments
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Course Information</h4>
                        <p className="text-sm text-muted-foreground">
                          Update course details and settings
                        </p>
                      </div>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Courses
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    Material Upload Restrictions
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    Important information about tutorial material management
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-amber-700">
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <h4 className="font-medium mb-2">Department Head Role:</h4>
                      <ul className="space-y-1 text-xs">
                        <li>• Manage course structure and information</li>
                        <li>• Assign instructors to courses</li>
                        <li>• Monitor tutorial content availability</li>
                        <li>• View all materials (read-only access)</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
                      <h4 className="font-medium mb-2">Instructor Role:</h4>
                      <ul className="space-y-1 text-xs">
                        <li>• Upload tutorial files and videos</li>
                        <li>• Manage materials for assigned courses</li>
                        <li>• Update and delete own materials</li>
                        <li>• Create and publish tutorials</li>
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-green-100 rounded-lg text-green-700">
                      <h4 className="font-medium mb-2">Student Role:</h4>
                      <ul className="space-y-1 text-xs">
                        <li>• View published tutorial materials</li>
                        <li>• Download files and stream videos</li>
                        <li>• Track tutorial progress</li>
                        <li>• Access course content</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Role-Based Access Control (RBAC)</CardTitle>
                  <CardDescription>
                    Understanding permissions and responsibilities in the tutorial system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Department Head Permissions */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Badge variant="outline">Department Head</Badge>
                        Academic Structure Management
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">✅ Allowed Actions:</h4>
                          <ul className="text-sm space-y-1 text-green-600">
                            <li>• Register and manage courses</li>
                            <li>• Update course information</li>
                            <li>• Assign instructors to courses</li>
                            <li>• View all tutorial materials (read-only)</li>
                            <li>• Monitor content availability</li>
                            <li>• Generate department reports</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">❌ Restricted Actions:</h4>
                          <ul className="text-sm space-y-1 text-red-600">
                            <li>• Upload tutorial files or videos</li>
                            <li>• Delete tutorial materials</li>
                            <li>• Modify tutorial content</li>
                            <li>• Create tutorials directly</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Instructor Permissions */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Badge variant="default">Instructor</Badge>
                        Tutorial Material Management
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">✅ Allowed Actions:</h4>
                          <ul className="text-sm space-y-1 text-green-600">
                            <li>• Upload tutorial files and videos</li>
                            <li>• Create and publish tutorials</li>
                            <li>• Update materials for assigned courses</li>
                            <li>• Delete own materials</li>
                            <li>• Manage tutorial content</li>
                            <li>• View student progress</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">❌ Restricted Actions:</h4>
                          <ul className="text-sm space-y-1 text-red-600">
                            <li>• Upload to unassigned courses</li>
                            <li>• Modify course structure</li>
                            <li>• Delete other instructors' materials</li>
                            <li>• Access other departments' content</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Student Permissions */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Badge variant="secondary">Student</Badge>
                        Tutorial Access & Learning
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-medium text-green-700 mb-2">✅ Allowed Actions:</h4>
                          <ul className="text-sm space-y-1 text-green-600">
                            <li>• View published tutorial materials</li>
                            <li>• Download tutorial files</li>
                            <li>• Stream tutorial videos</li>
                            <li>• Track learning progress</li>
                            <li>• Submit assignments</li>
                            <li>• Provide feedback</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-700 mb-2">❌ Restricted Actions:</h4>
                          <ul className="text-sm space-y-1 text-red-600">
                            <li>• Upload any materials</li>
                            <li>• Modify tutorial content</li>
                            <li>• Access unpublished tutorials</li>
                            <li>• Delete any materials</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Notes */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Implementation Notes</CardTitle>
                </CardHeader>
                <CardContent className="text-blue-700 text-sm">
                  <div className="space-y-2">
                    <p>
                      <strong>Backend Enforcement:</strong> All permissions are enforced at the API level using middleware that checks user roles and course assignments.
                    </p>
                    <p>
                      <strong>Course Ownership:</strong> Instructors can only upload materials to courses they are assigned to by the department head.
                    </p>
                    <p>
                      <strong>Department Isolation:</strong> Department heads can only manage courses and view materials within their own department.
                    </p>
                    <p>
                      <strong>Audit Trail:</strong> All material uploads and modifications are logged with user information and timestamps.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}