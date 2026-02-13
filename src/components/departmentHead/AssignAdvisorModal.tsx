/**
 * Assign Advisor Modal Component
 * Allows department head to assign an instructor as project advisor
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentHeadApi } from '@/services/academicApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCheck } from 'lucide-react';

interface AssignAdvisorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProjectId?: number;
  preselectedProjectTitle?: string;
}

export function AssignAdvisorModal({
  open,
  onOpenChange,
  preselectedProjectId,
  preselectedProjectTitle,
}: AssignAdvisorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    preselectedProjectId?.toString() || ''
  );
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('');

  // Fetch unassigned projects
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['unassignedProjects'],
    queryFn: () => departmentHeadApi.getUnassignedProjects(),
    enabled: open && !preselectedProjectId,
  });

  // Fetch available instructors
  const { data: instructors = [], isLoading: loadingInstructors } = useQuery({
    queryKey: ['availableInstructors'],
    queryFn: () => departmentHeadApi.getAvailableInstructors(),
    enabled: open,
  });

  // Assign advisor mutation
  const assignMutation = useMutation({
    mutationFn: ({ projectId, advisorId }: { projectId: number; advisorId: number }) =>
      departmentHeadApi.assignAdvisor(projectId, advisorId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project advisor assigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['unassignedProjects'] });
      queryClient.invalidateQueries({ queryKey: ['projectsWithAdvisors'] });
      queryClient.invalidateQueries({ queryKey: ['availableInstructors'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign advisor',
        variant: 'destructive',
      });
    },
  });

  const handleAssign = () => {
    const projectId = preselectedProjectId || parseInt(selectedProjectId, 10);
    const advisorId = parseInt(selectedAdvisorId, 10);

    if (!projectId || !advisorId) {
      toast({
        title: 'Validation Error',
        description: 'Please select both project and advisor',
        variant: 'destructive',
      });
      return;
    }

    assignMutation.mutate({ projectId, advisorId });
  };

  const handleClose = () => {
    setSelectedProjectId(preselectedProjectId?.toString() || '');
    setSelectedAdvisorId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Project Advisor
          </DialogTitle>
          <DialogDescription>
            Assign an instructor as a project advisor to guide and evaluate the student's work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            {preselectedProjectId ? (
              <div className="p-3 bg-gray-50 rounded-md border">
                <p className="text-sm font-medium">{preselectedProjectTitle}</p>
              </div>
            ) : (
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={loadingProjects}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {loadingProjects ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      Loading projects...
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="p-2 text-center text-sm text-gray-500">
                      No unassigned projects available
                    </div>
                  ) : (
                    projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{project.title}</span>
                          <span className="text-xs text-gray-500">
                            by {project.student_name}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Instructor Selection */}
          <div className="space-y-2">
            <Label htmlFor="advisor">Advisor (Instructor)</Label>
            <Select
              value={selectedAdvisorId}
              onValueChange={setSelectedAdvisorId}
              disabled={loadingInstructors}
            >
              <SelectTrigger id="advisor">
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {loadingInstructors ? (
                  <div className="p-2 text-center text-sm text-gray-500">
                    Loading instructors...
                  </div>
                ) : instructors.length === 0 ? (
                  <div className="p-2 text-center text-sm text-gray-500">
                    No instructors available
                  </div>
                ) : (
                  instructors.map((instructor: any) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{instructor.full_name}</span>
                        <span className="text-xs text-gray-500">
                          {instructor.email} • {instructor.advised_projects_count} projects
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={assignMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              assignMutation.isPending ||
              (!preselectedProjectId && !selectedProjectId) ||
              !selectedAdvisorId
            }
          >
            {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Advisor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
