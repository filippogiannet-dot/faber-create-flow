import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log("Login attempt:", { email, password });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Errore di accesso",
          description: error.message === "Invalid login credentials" 
            ? "Email o password non corretti" 
            : error.message,
        });
      } else if (data.user) {
        toast({
          title: "Accesso effettuato",
          description: "Benvenuto in Faber!",
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante l'accesso",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Le password non coincidono",
      });
      return;
    }
    
    setIsLoading(true);
    
    console.log("Signup attempt:", { email, password });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Errore di registrazione",
          description: error.message,
        });
      } else if (data.user) {
        toast({
          title: "Registrazione completata",
          description: "Controlla la tua email per confermare l'account",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Si è verificato un errore durante la registrazione",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-6">
      {/* Background Planet Effect */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[150%] h-[150%] bg-gradient-planet pointer-events-none opacity-60" />
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna alla home
          </Button>
        </Link>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-gradient-card border-border shadow-faber-card">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Benvenuto in Faber
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Accedi o crea un account per iniziare a generare
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Accedi</TabsTrigger>
                <TabsTrigger value="signup">Registrati</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-faber-surface border-border"
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-faber-surface border-border"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-button hover:shadow-faber-button transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Accesso in corso..." : "Accedi"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-faber-surface border-border"
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-faber-surface border-border"
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Conferma password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-faber-surface border-border"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-button hover:shadow-faber-button transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrazione in corso..." : "Crea account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Continuando accetti i nostri{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Termini di servizio
                </Link>{" "}
                e la{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;