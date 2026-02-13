import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { studentApi, type CourseMaterial } from '@/services/studentApi';

interface CourseMaterialsWidgetProps {
  className?: string;
}

const fileTypeConfig = {
  pdf: { icon: '📄', color: 'text-red-500', bg: 'bg-red-50' },
  doc: { icon: '📝', color: 'text-blue-500', bg: 'bg-blue-50' },
  ppt: { icon: '📊', color: 'text-orange-500', bg: 'bg-orange-50' },
  video: { icon: '🎥', color: 'text-purple-500', bg: 'bg-purple-50' },
  other: { icon: '📎', color: 'text-gray-500', bg: 'bg-gray-50' },
};

export function CourseMaterialsWidget({ className }: CourseMaterialsWidgetProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseMaterials();
  }, []);

  const fetchCourseMaterials = async () => {
    try {
      const data = await studentApi.getCourseMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Failed to fetch course materials:', error);
      // Fallback to mock data
      const mockMaterials = [
        {
          id: '1',
          title: 'Software Design Patterns - Lecture 8',
          description: 'Comprehensive guide to design patterns',
          file_url: '/materials/design-patterns-lecture8.pdf',
          file_type: 'pdf',
          file_size: 2400000,
          course_name: 'Software Engineering',
          course_code: 'CS401',
          instructor_name: 'Dr. Ahmed Hassan',
          uploaded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          title: 'Database Normalization Assignment',
          description: 'Assignment on database normalization',
          file_url: '/materials/db-normalization-assignment.doc',
          file_type: 'doc',
          file_size: 1200000,
          course_name: 'Database Systems',
          course_code: 'CS402',
          instructor_name: 'Prof. Sarah Johnson',
          uploaded_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setMaterials(mockMaterials);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatUploadDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getFileTypeFromUrl = (url: string): 'pdf' | 'doc' | 'ppt' | 'video' | 'other' => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'doc';
      case 'ppt':
      case 'pptx': return 'ppt';
      case 'mp4':
      case 'avi':
      case 'mov': return 'video';
      default: return 'other';
    }
  };

  const handleDownload = (material: CourseMaterial) => {
    // In a real app, this would trigger the download
    console.log('Downloading:', material.title);
    window.open(material.file_url, '_blank');
  };

  const handlePreview = (material: CourseMaterial) => {
    // In a real app, this would open a preview
    console.log('Previewing:', material.title);
    window.open(material.file_url, '_blank');
  };

  if (loading) {
    return (
      <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Course Materials</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/student/materials')}>
          View All
        </Button>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {materials.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No materials available</p>
          </div>
        ) : (
          materials.map((material) => {
            const fileType = getFileTypeFromUrl(material.file_url);
            const fileConfig = fileTypeConfig[fileType];

            return (
              <div
                key={material.id}
                className="p-4 rounded-lg border border-border hover:border-primary/20 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
                    fileConfig.bg
                  )}>
                    <span className="text-lg">{fileConfig.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium line-clamp-1">
                        {material.title}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handlePreview(material)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDownload(material)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {material.course_code}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {material.course_name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {material.instructor_name}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatUploadDate(material.uploaded_at)}
                      </span>
                      
                      <span>{formatFileSize(material.file_size)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}