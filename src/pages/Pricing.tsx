import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "€8.99",
      period: "/mese",
      description: "Perfetto per iniziare",
      features: [
        "50 generazioni al mese",
        "Supporto via email",
        "Template di base",
        "Export codice"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "€14.99",
      period: "/mese",
      description: "Per creatori professionali",
      features: [
        "100 generazioni al mese",
        "Supporto prioritario",
        "Template premium",
        "Export codice avanzato",
        "Collaborazione team",
        "API access"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Contattaci",
      period: "",
      description: "Per aziende che necessitano volumi maggiori",
      features: [
        "Generazioni illimitate",
        "Supporto dedicato",
        "Custom templates",
        "White-label solution",
        "Team management",
        "API illimitato",
        "SLA garantito"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Scegli il tuo{" "}
              <span className="bg-gradient-to-r from-faber-blue to-faber-blue-light bg-clip-text text-transparent">
                piano
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Inizia gratis e scala con le tue esigenze. Tutti i piani includono accesso completo alla piattaforma.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`relative bg-gradient-card border-border transition-all duration-300 hover:shadow-faber-card hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-primary shadow-faber-glow' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-button text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Più popolare
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="mb-4">
                    <span className="text-4xl md:text-5xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-card-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-button hover:shadow-faber-button' 
                        : 'bg-faber-surface-light hover:bg-faber-surface text-foreground border border-border'
                    } transition-all duration-300 transform hover:scale-105`}
                    size="lg"
                  >
                    {plan.name === 'Enterprise' ? 'Contatta il team' : 'Inizia ora'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ or additional info could go here */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground">
              Hai domande? <a href="mailto:support@faber.ai" className="text-primary hover:underline">Contattaci</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;