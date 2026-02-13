/**
 * Evaluation Form Component
 * Allows instructors to create evaluations for student projects
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { instructorApi } from '@/services/academicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

const evaluationSchema = z.object({
  project_id: z.number().min(1, 'Project is required'),
  evaluation_type: z.enum(['proposal', 'project_progress', 'final_project', 'tutorial_assignment']),
  score: z.number().min(0).max(100),
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  status: z.enum(['Approved', 'Needs Revision', 'Rejected']),
});

type EvaluationFormData = z.infer<typeof evaluationSchema>;

interface EvaluationFormProps {
  projectId: number;
  projectTitle: string;
  studentName: string;
  onSuccess?: () => void;
}

export function EvaluationForm({
  projectId,
  projectTitle,
  studentName,
  onSuccess,
}: EvaluationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [score, setScore] = useState(75);

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      project_id: projectId,
      evaluation_type: 'project_progress',
      score: 75,
      feedback: '',
      recommendation: '',
      status: 'Approved',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: EvaluationFormData) => instructorApi.createEvaluation(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Evaluation created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create evaluation',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: EvaluationFormData) => {
    mutation.mutate(data);
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Evaluation</CardTitle>
        <CardDescription>
          Evaluate {studentName}'s project: {projectTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Evaluation Type */}
            <FormField
              control={form.control}
              name="evaluation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evaluation Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="project_progress">Project Progress</SelectItem>
                      <SelectItem value="final_project">Final Project</SelectItem>
                      <SelectItem value="tutorial_assignment">Tutorial Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Score with Slider */}
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score: <span className={`font-bold ${getScoreColor(score)}`}>{score}/100</span></FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[score]}
                        onValueChange={(value) => {
                          setScore(value[0]);
                          field.onChange(value[0]);
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0</span>
                        <span>50</span>
                        <span>100</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Score must be between 0 and 100
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feedback */}
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed feedback on the student's work..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 10 characters. Be specific and constructive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recommendation */}
            <FormField
              control={form.control}
              name="recommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide your academic recommendation..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Suggest next steps or areas for improvement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evaluation Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Approved
                        </div>
                      </SelectItem>
                      <SelectItem value="Needs Revision">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          Needs Revision
                        </div>
                      </SelectItem>
                      <SelectItem value="Rejected">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          Rejected
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? 'Creating Evaluation...' : 'Create Evaluation'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
