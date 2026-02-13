import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Upload, Link as LinkIcon } from 'lucide-react';

interface VideoUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  onAddLink: (url: string, type: string, title: string) => Promise<void>;
  isLoading?: boolean;
}

export function VideoUploadDialog({ isOpen, onClose, onUpload, onAddLink, isLoading = false }: VideoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState('youtube');
  const [videoTitle, setVideoTitle] = useState('');
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Video file must be smaller than 100MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a valid video file (MP4, AVI, MOV, etc.)",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleAddVideoLink = async () => {
    if (!videoUrl || !videoTitle) {
      toast({
        title: "Error",
        description: "Please enter both video URL and title",
        variant: "destructive",
      });
      return;
    }

    try {
      await onAddLink(videoUrl, videoType, videoTitle);
      setVideoUrl('');
      setVideoTitle('');
      setVideoType('youtube');
      onClose();
    } catch (error) {
      console.error('Add link error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Video to Tutorial</DialogTitle>
          <DialogDescription>
            Upload a video file or add a link to an external video
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Video</TabsTrigger>
            <TabsTrigger value="link">Video Link</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-file">Select Video File (MP4)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  id="video-file"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="video-file" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select video file'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Max 100MB</p>
                </label>
              </div>
            </div>

            <Button
              onClick={handleUploadVideo}
              disabled={!selectedFile || isLoading}
              className="w-full"
            >
              {isLoading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">Video Title</Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-type">Video Source</Label>
              <select
                id="video-type"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="youtube">YouTube</option>
                <option value="google_drive">Google Drive</option>
                <option value="vimeo">Vimeo</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={
                  videoType === 'youtube'
                    ? 'https://youtube.com/watch?v=...'
                    : videoType === 'google_drive'
                    ? 'https://drive.google.com/file/d/...'
                    : 'https://...'
                }
              />
              <p className="text-xs text-gray-500">
                {videoType === 'youtube' && 'Paste the full YouTube URL'}
                {videoType === 'google_drive' && 'Paste the Google Drive sharing link'}
                {videoType === 'vimeo' && 'Paste the Vimeo URL'}
                {videoType === 'custom' && 'Paste the video URL'}
              </p>
            </div>

            <Button
              onClick={handleAddVideoLink}
              disabled={!videoUrl || !videoTitle || isLoading}
              className="w-full"
            >
              {isLoading ? 'Adding...' : 'Add Video Link'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
