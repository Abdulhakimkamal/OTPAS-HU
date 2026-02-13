/**
 * Project Title Approval Panel
 * Allows instructors to view and approve/reject student project titles
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi, Project } from '@/services/academicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectTitleApprovalPanelProps {
  showApprovedOnly?: boolean;
  onProjectSelect?: (project: any) => void;
}

export function ProjectTitleApprovalPanel({ showApprovedOnly = false, onProjectSelect }: ProjectTitleApprovalPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Fetch pending or all projects based on prop
  const { data: projectsData, isLoading, error } = useQuery({
    queryKey: showApprovedOnly ? ['instructorProjects'] : ['pendingProjects'],
    queryFn: async () => {
      if (showApprovedOnly) {
        // Get all projects and filter for approved ones
        const projects = await instructorApi.getAllProjects();
        return projects;
      } else {
        // Get only pending projects
        const projects = await instructorApi.getPendingProjects();
        return projects;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Ensure projects is always an array
  let projects = Array.isArray(projectsData) ? projectsData : [];
  
  // Filter based on the mode
  if (showApprovedOnly) {
    // Filter for approved projects only
    projects = projects.filter(p => p.status === 'approved');
  } else {
    // Filter for pending projects only
    projects = projects.filter(p => p.status === 'pending');
  }

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (projectId: number) => instructorApi.approveTitle(projectId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project title approved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['pendingProjects'] });
      setSelectedProject(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve project title',
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (projectId: number) => instructorApi.disapproveTitle(projectId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project title rejected',
      });
      queryClient.invalidateQueries({ queryKey: ['pendingProjects'] });
      setSelectedProject(null);
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject project title',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = () => {
    if (selectedProject) {
      approveMutation.mutate(selectedProject.id);
    }
  };

  const handleReject = () => {
    if (selectedProject) {
      rejectMutation.mutate(selectedProject.id);
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load pending projects</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {showApprovedOnly ? 'Approved Projects' : 'Project Title Approvals'}
          </h3>
          <p className="text-sm text-gray-600">
            {showApprovedOnly 
              ? 'Select a project to create an evaluation' 
              : 'Review and approve student project titles'}
          </p>
        </div>
        <Badge variant="outline" className="text-lg">
          {projects.length} {showApprovedOnly ? 'Approved' : 'Pending'}
        </Badge>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">
                {showApprovedOnly 
                  ? 'No approved projects available' 
                  : 'No pending project titles to review'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{project.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    </div>
                    <Badge variant={showApprovedOnly ? "default" : "secondary"} className="ml-2">
                      {showApprovedOnly ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500">
                    Submitted: {new Date(project.submitted_at).toLocaleDateString()}
                    {showApprovedOnly && project.approved_at && (
                      <> • Approved: {new Date(project.approved_at).toLocaleDateString()}</>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {showApprovedOnly ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onProjectSelect?.(project)}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Select for Evaluation
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedProject(project);
                            setActionType('approve');
                          }}
                          disabled={approveMutation.isPending}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedProject(project);
                            setActionType('reject');
                          }}
                          disabled={rejectMutation.isPending}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedProject && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setSelectedProject(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Project Title?' : 'Reject Project Title?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'approve' ? (
                <>
                  <p className="mb-2">You are about to approve the following project title:</p>
                  <p className="font-semibold text-gray-900">{selectedProject?.title}</p>
                  <p className="text-sm mt-2">The student will be notified and can proceed with file uploads.</p>
                </>
              ) : (
                <>
                  <p className="mb-2">You are about to reject the following project title:</p>
                  <p className="font-semibold text-gray-900">{selectedProject?.title}</p>
                  <p className="text-sm mt-2">The student will be notified and can submit a new title.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === 'approve' ? handleApprove : handleReject}
              className={actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
