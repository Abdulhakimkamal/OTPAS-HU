/**
 * Student Academic Projects Page
 * Integrated view for project title submission, file upload, and evaluations
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectTitleSubmissionForm } from '@/components/academic/ProjectTitleSubmissionForm';
import { ProjectFileUpload } from '@/components/academic/ProjectFileUpload';
import { EvaluationViewer } from '@/components/academic/EvaluationViewer';
import { NotificationCenter } from '@/components/academic/NotificationCenter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, CheckCircle, Bell } from 'lucide-react';
import { api } from '@/services/api';

export default function AcademicProjects() {
  // Fetch student's assigned instructor
  const { data: instructorData, isLoading: loadingInstructor } = useQuery({
    queryKey: ['assigned-instructor'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: { instructor_id: number; instructor_name: string } }>('/student/assigned-instructor');
      return response.data;
    },
  });

  // Fetch student's projects
  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['student-projects'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; projects: any[] }>('/student/projects');
      return response;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });

  const instructorId = instructorData?.instructor_id || 0;
  const instructorName = instructorData?.instructor_name || 'Your Instructor';
  
  // Get the most recent project
  const project = projectsData?.projects?.[0];
  const projectId = project?.id || 0;
  const projectTitle = project?.title || 'Your Project';

  if (loadingInstructor || loadingProjects) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!instructorId) {
    return (
      <DashboardLayout>
        <div className="page-transition">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Instructor Assigned</h3>
                <p className="text-muted-foreground">
                  You haven't been assigned to an instructor yet. Please contact your department head.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-transition space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Academic Projects</h1>
          <p className="text-gray-600 mt-1">Manage your project submissions, files, and evaluations</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Submit Title</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Files</span>
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Evaluations</span>
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Notifications</h2>
                <p className="text-sm text-gray-600">Stay updated on your project status</p>
              </div>
              <NotificationCenter />
            </div>
          </TabsContent>

          {/* Submit Title Tab */}
          <TabsContent value="submit">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Submit Project Title</h2>
                <p className="text-sm text-gray-600">Submit your project title for instructor approval</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ProjectTitleSubmissionForm
                    instructorId={instructorId}
                    instructorName={instructorName}
                  />
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Workflow Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-sm">Submit Title</p>
                          <p className="text-xs text-gray-600">Fill in your project details</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-sm">Wait for Approval</p>
                          <p className="text-xs text-gray-600">Instructor reviews your title</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-sm">Upload Files</p>
                          <p className="text-xs text-gray-600">Submit your project files</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                          4
                        </div>
                        <div>
                          <p className="font-medium text-sm">Get Evaluated</p>
                          <p className="text-xs text-gray-600">Receive feedback and score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Upload Files Tab */}
          <TabsContent value="upload">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Upload Project Files</h2>
                <p className="text-sm text-gray-600">Upload your project files after title approval</p>
              </div>
              <ProjectFileUpload projectId={projectId} projectTitle={projectTitle} />
            </div>
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Your Evaluations</h2>
                <p className="text-sm text-gray-600">View feedback and scores from your instructor</p>
              </div>
              <EvaluationViewer />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
