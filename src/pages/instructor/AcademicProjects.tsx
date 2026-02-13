/**
 * Instructor Academic Projects Page
 * Manage project title approvals and create evaluations
 */

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectTitleApprovalPanel } from '@/components/academic/ProjectTitleApprovalPanel';
import { EvaluationForm } from '@/components/academic/EvaluationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText } from 'lucide-react';
import { useState } from 'react';

export default function AcademicProjects() {
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('approvals');

  return (
    <DashboardLayout>
      <div className="page-transition space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Academic Project Management</h1>
          <p className="text-gray-600 mt-1">Approve project titles and create evaluations</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Title Approvals</span>
            </TabsTrigger>
            <TabsTrigger value="evaluations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Create Evaluation</span>
            </TabsTrigger>
          </TabsList>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Project Title Approvals</h2>
              <p className="text-sm text-gray-600">Review and approve student project titles</p>
            </div>
            <ProjectTitleApprovalPanel 
              onProjectSelect={(project) => {
                setSelectedProject(project);
                setActiveTab('evaluations');
              }}
            />
          </TabsContent>

          {/* Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Create Evaluation</h2>
              <p className="text-sm text-gray-600">Evaluate student project work</p>
            </div>

            {selectedProject ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EvaluationForm
                    projectId={selectedProject.id}
                    projectTitle={selectedProject.title}
                    studentName={selectedProject.student_name || selectedProject.studentName || 'Unknown Student'}
                    onSuccess={() => setSelectedProject(null)}
                  />
                </div>
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Selected Project</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-600">Title</p>
                        <p className="font-semibold">{selectedProject.title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Student</p>
                        <p className="font-semibold">{selectedProject.student_name || selectedProject.studentName || 'Unknown Student'}</p>
                      </div>
                      <button
                        onClick={() => setSelectedProject(null)}
                        className="w-full text-sm text-blue-600 hover:text-blue-700 py-2 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        Change Project
                      </button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <ProjectTitleApprovalPanel 
                showApprovedOnly={true}
                onProjectSelect={(project) => setSelectedProject(project)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
