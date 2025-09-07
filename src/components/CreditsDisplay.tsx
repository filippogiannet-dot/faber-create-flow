import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Crown, Rocket, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { PLANS, getPlanLimits, getUsagePercentage, getRemainingCredits } from '@/lib/plans';
import { useNavigate } from 'react-router-dom';

interface CreditsDisplayProps {
  className?: string;
  showUpgrade?: boolean;
}

export default function CreditsDisplay({ className, showUpgrade = true }: CreditsDisplayProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const userPlan = getPlanLimits(user.user_metadata?.plan || 'free');
  const usagePercentage = getUsagePercentage(user);
  const remainingCredits = getRemainingCredits(user);
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = remainingCredits <= 0;

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro': return <Crown className="w-4 h-4" />;
      case 'enterprise': return <Rocket className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'pro': return 'text-yellow-500';
      case 'enterprise': return 'text-purple-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Card className={`bg-gradient-card border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            {getPlanIcon(userPlan.id)}
            Piano {userPlan.name}
          </CardTitle>
          <Badge 
            variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "default"}
            className={`text-xs ${getPlanColor(userPlan.id)}`}
          >
            {remainingCredits} / {userPlan.credits}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Generazioni utilizzate</span>
            <span className="text-foreground font-medium">{usagePercentage}%</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${isAtLimit ? 'bg-destructive/20' : isNearLimit ? 'bg-yellow-500/20' : ''}`}
          />
        </div>

        {/* Status Message */}
        {isAtLimit ? (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-destructive">Limite raggiunto</p>
              <p className="text-destructive/80">Aggiorna il piano per continuare</p>
            </div>
          </div>
        ) : isNearLimit ? (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-yellow-700">Quasi al limite</p>
              <p className="text-yellow-600">Considera un upgrade</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            <p>{remainingCredits} generazioni rimanenti questo mese</p>
          </div>
        )}

        {/* Upgrade Button */}
        {showUpgrade && (userPlan.id === 'free' || isNearLimit) && (
          <Button 
            size="sm" 
            className="w-full bg-gradient-button hover:shadow-faber-button transition-all duration-300"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="w-4 h-4 mr-2" />
            Aggiorna Piano
          </Button>
        )}

        {/* Plan Features Preview */}
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">Piano attuale include:</p>
          <ul className="space-y-1">
            {userPlan.features.slice(0, 3).map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}