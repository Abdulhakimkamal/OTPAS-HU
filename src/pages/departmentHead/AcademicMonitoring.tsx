/**
 * Department Head Academic Monitoring Page
 * Comprehensive view of evaluations and projects
 */

import { DepartmentHeadLayout } from '@/components/departmentHead/DepartmentHeadLayout';
import { EvaluationMonitoringPanel } from '@/components/academic/EvaluationMonitoringPanel';
import { ProjectOverviewPanel } from '@/components/academic/ProjectOverviewPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FolderOpen } from 'lucide-react';

export default function AcademicMonitoring() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Academic Monitoring</h1>
        <p className="text-gray-600 mt-1">Monitor evaluations and projects across your department</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="evaluations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Evaluations</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            <span>Projects</span>
          </TabsTrigger>
        </TabsList>

        {/* Evaluations Tab */}
        <TabsContent value="evaluations">
          <EvaluationMonitoringPanel />
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <ProjectOverviewPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
