export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 10,
    features: [
      '10 generazioni/mese',
      'Template base',
      'Export HTML',
      'Supporto community'
    ],
    limitations: [
      'Watermark sui progetti',
      'Nessun supporto prioritario'
    ]
  },
  starter: {
    id: 'starter',
    name: 'Starter', 
    price: 9,
    credits: 50,
    stripePriceId: 'price_starter_monthly',
    features: [
      '50 generazioni/mese',
      'Tutti i template',
      'Export React/Vue',
      'Supporto email',
      'Nessun watermark'
    ],
    popular: false
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    credits: 200,
    stripePriceId: 'price_pro_monthly',
    features: [
      '200 generazioni/mese',
      'Template custom',
      'Export Next.js/Nuxt',
      'Supporto prioritario',
      'API access',
      'Collaborazione team',
      'Versioning avanzato'
    ],
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    credits: 1000,
    stripePriceId: 'price_enterprise_monthly',
    features: [
      'Generazioni illimitate',
      'White-label solution',
      'Custom integrations',
      'Supporto dedicato',
      'SLA garantito',
      'Training personalizzato',
      'On-premise deployment'
    ],
    popular: false
  }
};

export function getPlanLimits(plan: string) {
  return PLANS[plan as keyof typeof PLANS] || PLANS.free;
}

export function canUserGenerate(user: any): { canGenerate: boolean; reason?: string } {
  if (!user) {
    return { canGenerate: false, reason: 'User not authenticated' };
  }

  const userPlan = getPlanLimits(user.plan || 'free');
  const creditsUsed = user.messages_used || 0;

  if (creditsUsed >= userPlan.credits) {
    return { 
      canGenerate: false, 
      reason: `You've reached your monthly limit of ${userPlan.credits} generations. Upgrade your plan to continue.` 
    };
  }

  return { canGenerate: true };
}

export function getUsagePercentage(user: any): number {
  if (!user) return 0;
  
  const userPlan = getPlanLimits(user.plan || 'free');
  const creditsUsed = user.messages_used || 0;
  
  return Math.round((creditsUsed / userPlan.credits) * 100);
}

export function getRemainingCredits(user: any): number {
  if (!user) return 0;
  
  const userPlan = getPlanLimits(user.plan || 'free');
  const creditsUsed = user.messages_used || 0;
  
  return Math.max(0, userPlan.credits - creditsUsed);
}

// Utility functions for plan management
export function isPlanActive(planId: string): boolean {
  return Object.keys(PLANS).includes(planId);
}

export function getNextPlan(currentPlan: string): string | null {
  const planOrder = ['free', 'starter', 'pro', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  
  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null;
  }
  
  return planOrder[currentIndex + 1];
}

export function getPlanFeatureComparison() {
  return Object.values(PLANS).map(plan => ({
    ...plan,
    features: plan.features.map(feature => ({
      name: feature,
      included: true
    }))
  }));
}