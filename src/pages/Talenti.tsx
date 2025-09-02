import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";

export default function Talenti() {
  const { toast } = useToast();
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    document.title = "Talenti – Lavora con noi | Faber";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Invia il tuo CV e candidati per entrare nel team Faber. Posizioni aperte e candidature spontanee.");
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Candidatura inviata",
      description: "Grazie! Ti contatteremo al più presto.",
    });
    (e.currentTarget as HTMLFormElement).reset();
    setCvFile(null);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-6">
      <section className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-section-title font-bold chrome-text">Entra nel team Faber</h1>
          <p className="mt-3 text-muted-foreground text-body">Siamo sempre alla ricerca di talento. Inviaci la tua candidatura.</p>
        </header>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Candidatura spontanea</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome e cognome</Label>
                  <Input id="name" name="name" placeholder="Mario Rossi" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" placeholder="mario@esempio.com" required />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="role">Ruolo di interesse</Label>
                  <Input id="role" name="role" placeholder="Frontend, Backend, Design..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedin">LinkedIn / Portfolio</Label>
                  <Input id="linkedin" name="linkedin" placeholder="https://linkedin.com/in/..." />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Presentazione</Label>
                <Textarea id="message" name="message" placeholder="Raccontaci qualcosa di te..." className="min-h-[120px]" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cv">Curriculum Vitae (PDF)</Label>
                <Input id="cv" name="cv" type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                {cvFile && (
                  <p className="text-sm text-muted-foreground">Selezionato: {cvFile.name}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-gradient-button">Invia candidatura</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
    </>
  );
}
