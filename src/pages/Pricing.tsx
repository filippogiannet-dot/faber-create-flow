import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PLANS } from "@/lib/plans";
import { useAuth } from "@/integrations/supabase/AuthProvider";
import { useNavigate } from "react-router-dom";
const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const plans = Object.values(PLANS).map(plan => ({
    ...plan,
    price: plan.price === 0 ? "Gratis" : `€${plan.price}`,
    period: plan.price === 0 ? "" : "/mese",
    description: plan.id === 'free' ? "Perfetto per iniziare" :
                plan.id === 'starter' ? "Per creatori individuali" :
                plan.id === 'pro' ? "Per professionisti" :
                "Per aziende enterprise"
  }));

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (planId === 'free') {
      navigate('/');
      return;
    }

    // TODO: Integrate with Stripe for payment processing
    console.log('Selected plan:', planId);
    // For now, just redirect to home
    navigate('/');
  };
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-section-title font-bold chrome-text mb-6 mx-[9px] my-0 px-[11px] py-[6px]">
              Scegli il tuo{" "}
              <span className="chrome-text">
                piano
              </span>
            </h1>
            <p className="text-subtitle text-muted-foreground max-w-2xl mx-auto">
              Inizia gratis e scala con le tue esigenze. Tutti i piani includono accesso completo alla piattaforma.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => <Card key={plan.id} className={`relative bg-gradient-card border-border transition-all duration-300 hover:shadow-faber-card hover:scale-[1.02] ${plan.popular ? 'ring-2 ring-primary shadow-faber-glow' : ''}`}>
                {plan.popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-button text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Più popolare
                    </span>
                  </div>}
                
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                  <div className="mb-4">
                    <span className="text-3xl md:text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-sm text-muted-foreground ml-1">
                        {plan.period}
                      </span>}
                  </div>
                  {plan.credits && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {plan.credits} generazioni/mese
                    </Badge>
                  )}
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => <li key={idx} className="flex items-start">
                        <Check className="w-4 h-4 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-sm text-card-foreground">{feature}</span>
                      </li>)}
                  </ul>

                  <Button 
                    className={`w-full text-sm ${plan.popular ? 'bg-gradient-button hover:shadow-faber-button' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border'} transition-all duration-300 transform hover:scale-[1.02]`} 
                    size="lg"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.id === 'enterprise' ? 'Contatta il team' : 
                     plan.id === 'free' ? 'Inizia gratis' : 
                     user?.user_metadata?.plan === plan.id ? 'Piano attuale' : 'Aggiorna'}
                  </Button>
                </CardContent>
              </Card>)}
          </div>

          {/* FAQ or additional info could go here */}
          <div className="text-center mt-16">
            <p className="text-sm text-muted-foreground">
              Hai domande? <a href="mailto:support@faber.ai" className="text-primary hover:underline">Contattaci</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>;
};
export default Pricing;