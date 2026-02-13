import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Settings, User, Lock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentSettings() {
  return (
    <DashboardLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Placeholder content */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Account Settings</h2>
            </div>
            
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Settings Page</h3>
              <p className="text-muted-foreground mb-4">
                This page will allow you to manage your account settings, change password, update profile information, and configure notifications.
              </p>
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}