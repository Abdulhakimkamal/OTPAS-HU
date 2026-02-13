/**
 * Project File Upload Component
 * Allows students to upload project files after title approval
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentApi, Project, ProjectFile } from '@/services/academicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Trash2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'application/x-rar-compressed',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface ProjectFileUploadProps {
  projectId: number;
  projectTitle: string;
}

export function ProjectFileUpload({ projectId, projectTitle }: ProjectFileUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);

  // Fetch project status
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => studentApi.getProjectStatus(projectId),
    enabled: projectId > 0, // Only fetch if we have a valid project ID
  });

  // Fetch project files
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['projectFiles', projectId],
    queryFn: () => studentApi.getProjectFiles(projectId),
    enabled: !!project && projectId > 0,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => studentApi.uploadFile(projectId, file),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId: number) => studentApi.deleteFile(fileId),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['projectFiles', projectId] });
      setFileToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete file',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a supported file type (PDF, Word, Excel, Image, ZIP, etc.)',
        variant: 'destructive',
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 50MB',
        variant: 'destructive',
      });
      e.target.value = ''; // Reset input
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    // Reset the file input
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const isApproved = project?.status === 'approved';
  const isLoading = projectLoading || filesLoading;

  // No project submitted yet
  if (projectId === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">No Project Yet</p>
              <p>Please submit your project title first in the "Submit Title" tab.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
          <CardDescription>
            Upload files for: {projectTitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Alert */}
          {!isApproved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-900">
                <p className="font-semibold">Project Title Not Approved</p>
                <p>You can only upload files after your project title is approved by your instructor.</p>
              </div>
            </div>
          )}

          {isApproved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold">Project Title Approved</p>
                <p>You can now upload your project files.</p>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          {isApproved && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploadMutation.isPending}
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, Word, Excel, Images, ZIP (max 50MB)
                  </p>
                </label>
              </div>

              {selectedFile && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="flex-1"
                  >
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload File'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploadMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Files ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.file_size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFileToDelete(file)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fileToDelete} onOpenChange={(open) => {
        if (!open) setFileToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{fileToDelete?.file_name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && deleteMutation.mutate(fileToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
