/**
 * Project Title Submission Form
 * Allows students to submit project titles for instructor approval
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { studentApi } from '@/services/academicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle } from 'lucide-react';

const titleSubmissionSchema = z.object({
  instructor_id: z.number().min(1, 'Instructor is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
});

type TitleSubmissionData = z.infer<typeof titleSubmissionSchema>;

interface ProjectTitleSubmissionFormProps {
  instructorId: number;
  instructorName: string;
  onSuccess?: () => void;
}

export function ProjectTitleSubmissionForm({
  instructorId,
  instructorName,
  onSuccess,
}: ProjectTitleSubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [descriptionLength, setDescriptionLength] = useState(0);

  const form = useForm<TitleSubmissionData>({
    resolver: zodResolver(titleSubmissionSchema),
    defaultValues: {
      instructor_id: instructorId,
      title: '',
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: TitleSubmissionData) => studentApi.submitTitle(data),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Project title submitted successfully. Awaiting instructor approval.',
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      form.reset();
      setDescriptionLength(0);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit project title',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: TitleSubmissionData) => {
    mutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Project Title</CardTitle>
        <CardDescription>
          Submit your project title to {instructorName} for approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your project title"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for your project
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your project in detail..."
                      className="min-h-32"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setDescriptionLength(e.target.value.length);
                      }}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormDescription>
                      Minimum 20 characters. Explain your project goals and scope.
                    </FormDescription>
                    <span className={`text-sm ${descriptionLength < 20 ? 'text-red-600' : 'text-green-600'}`}>
                      {descriptionLength}/1000
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your instructor will review your project title</li>
                    <li>You'll receive a notification when it's approved or rejected</li>
                    <li>Once approved, you can upload project files</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Project Title'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
