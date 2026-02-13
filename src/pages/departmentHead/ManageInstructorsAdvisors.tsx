/**
 * Manage Instructors & Project Advisors Page
 * Department Head can view instructors and assign them as project advisors
 * Updated: Feb 11, 2026
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentHeadApi } from '@/services/academicApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignAdvisorModal } from '@/components/departmentHead/AssignAdvisorModal';
import { useToast } from '@/hooks/use-toast';
import {
  UserCheck,
  Users,
  FolderOpen,
  AlertCircle,
  Loader2,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function ManageInstructorsAdvisors() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState<any>(null);

  // Fetch available instructors
  const { data: instructors = [], isLoading: loadingInstructors } = useQuery({
    queryKey: ['availableInstructors'],
    queryFn: () => departmentHeadApi.getAvailableInstructors(),
  });

  // Fetch unassigned projects
  const { data: unassignedProjects = [], isLoading: loadingUnassigned } = useQuery({
    queryKey: ['unassignedProjects'],
    queryFn: () => departmentHeadApi.getUnassignedProjects(),
  });

  // Fetch projects with advisors
  const { data: assignedProjects = [], isLoading: loadingAssigned } = useQuery({
    queryKey: ['projectsWithAdvisors'],
    queryFn: () => departmentHeadApi.getProjectsWithAdvisors(),
  });

  // Remove advisor mutation
  const removeMutation = useMutation({
    mutationFn: (projectId: number) => departmentHeadApi.removeAdvisor(projectId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project advisor removed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['unassignedProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projectsWithAdvisors'] });
      queryClient.invalidateQueries({ queryKey: ['availableInstructors'] });
      setRemoveDialogOpen(false);
      setProjectToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove advisor',
        variant: 'destructive',
      });
    },
  });

  const handleAssignClick = (project?: any) => {
    setSelectedProject(project || null);
    setAssignModalOpen(true);
  };

  const handleRemoveClick = (project: any) => {
    setProjectToRemove(project);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (projectToRemove) {
      removeMutation.mutate(projectToRemove.id);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Project Advisors</h1>
        <p className="text-slate-600 mt-2">
          Assign instructors as project advisors to guide and evaluate student projects
        </p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
        <div className="space-y-6">

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Instructors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instructors.length}</div>
              <p className="text-xs text-muted-foreground">Ready to be assigned as advisors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Projects</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unassignedProjects.length}</div>
              <p className="text-xs text-muted-foreground">Projects waiting for advisor assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Projects</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignedProjects.filter((p: any) => p.advisor_id).length}
              </div>
              <p className="text-xs text-muted-foreground">Projects with assigned advisors</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unassigned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unassigned">
              Unassigned Projects ({unassignedProjects.length})
            </TabsTrigger>
            <TabsTrigger value="assigned">
              Assigned Projects ({assignedProjects.filter((p: any) => p.advisor_id).length})
            </TabsTrigger>
            <TabsTrigger value="instructors">
              Instructors ({instructors.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unassigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects Without Advisors</CardTitle>
                <CardDescription>Assign instructors to guide these projects</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUnassigned ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : unassignedProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">All projects have assigned advisors</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Title</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unassignedProjects.map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{project.student_name}</p>
                              <p className="text-xs text-gray-500">{project.student_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === 'approved' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(project.submitted_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => handleAssignClick(project)}>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Assign Advisor
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects With Advisors</CardTitle>
                <CardDescription>View and manage advisor assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAssigned ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : assignedProjects.filter((p: any) => p.advisor_id).length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No projects with assigned advisors yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Title</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Advisor</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedProjects.filter((p: any) => p.advisor_id).map((project: any) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{project.student_name}</p>
                              <p className="text-xs text-gray-500">{project.student_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="font-medium">{project.advisor_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {project.assigned_at ? new Date(project.assigned_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="destructive" onClick={() => handleRemoveClick(project)}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instructors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Instructors</CardTitle>
                <CardDescription>Instructors who can be assigned as project advisors</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInstructors ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : instructors.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No instructors available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Advised Projects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {instructors.map((instructor: any) => (
                        <TableRow key={instructor.id}>
                          <TableCell className="font-medium">{instructor.full_name}</TableCell>
                          <TableCell>{instructor.email}</TableCell>
                          <TableCell>{instructor.department_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{instructor.advised_projects_count} projects</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <AssignAdvisorModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        preselectedProjectId={selectedProject?.id}
        preselectedProjectTitle={selectedProject?.title}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Project Advisor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {projectToRemove?.advisor_name} as the advisor for
              "{projectToRemove?.title}"? This action can be undone by reassigning an advisor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              disabled={removeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {removeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Advisor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Export timestamp: 2026-02-11T12:00:00Z
export default ManageInstructorsAdvisors;
