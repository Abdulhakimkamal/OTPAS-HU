import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play } from 'lucide-react';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoType?: 'mp4' | 'youtube' | 'google_drive' | 'vimeo' | 'custom';
  title: string;
  thumbnail?: string;
}

export function VideoPlayer({ isOpen, onClose, videoUrl, videoType, title, thumbnail }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const detectVideoType = (url: string): 'mp4' | 'youtube' | 'google_drive' | 'vimeo' | 'custom' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('drive.google.com')) return 'google_drive';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('.mp4') || url.includes('.avi') || url.includes('.mov')) return 'mp4';
    return 'custom';
  };

  const finalVideoType = videoType || detectVideoType(videoUrl);

  const getEmbedUrl = (url: string, type: string) => {
    if (type === 'youtube') {
      // Extract YouTube video ID
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    } else if (type === 'google_drive') {
      // Extract Google Drive file ID
      const driveRegex = /\/d\/([a-zA-Z0-9-_]+)/;
      const match = url.match(driveRegex);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    } else if (type === 'vimeo') {
      // Extract Vimeo video ID
      const vimeoRegex = /vimeo\.com\/(\d+)/;
      const match = url.match(vimeoRegex);
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`;
      }
    }
    return url;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full bg-black rounded-lg overflow-hidden">
          {finalVideoType === 'mp4' ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-auto"
              onLoadedData={() => setIsLoading(false)}
              poster={thumbnail}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={getEmbedUrl(videoUrl, finalVideoType)}
              width="100%"
              height="500"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              className="w-full"
            />
          )}
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {finalVideoType === 'mp4' && <p>Local video file</p>}
          {finalVideoType === 'youtube' && <p>YouTube video</p>}
          {finalVideoType === 'google_drive' && <p>Google Drive video</p>}
          {finalVideoType === 'vimeo' && <p>Vimeo video</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
