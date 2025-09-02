import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { usageAPI, type Usage } from "@/lib/api";

const Settings = () => {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const data = await usageAPI.get();
      setUsage(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load usage data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and usage</p>
          </header>

          {usage && (
            <>
              {/* Plan & Usage Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Current Plan
                    <Badge variant={usage.user.plan === 'free' ? 'secondary' : 'default'}>
                      {usage.user.plan.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Your current usage and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Messages Used</span>
                      <span>{usage.user.messagesUsed} / {usage.user.messagesLimit}</span>
                    </div>
                    <Progress value={usage.user.usagePercentage} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {usage.user.messagesRemaining}
                      </div>
                      <div className="text-sm text-muted-foreground">Messages Remaining</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {usage.projects.total}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Projects</div>
                    </div>
                  </div>

                  {usage.user.plan === 'free' && (
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Upgrade to Pro for more messages and advanced features
                      </p>
                      <Button size="sm">Upgrade Plan</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Projects Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Projects</CardTitle>
                  <CardDescription>
                    Overview of your active projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usage.projects.list.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No projects yet. Create your first project to get started!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {usage.projects.list.map((project) => (
                        <div key={project.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{project.messagesUsed} messages</div>
                            <div className="text-xs text-muted-foreground">used</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest AI interactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usage.recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {usage.recentActivity.map((activity) => (
                        <div key={activity.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm font-medium">{activity.projects.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(activity.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {activity.prompt_text}
                          </p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {activity.tokens_used} tokens used
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default Settings;