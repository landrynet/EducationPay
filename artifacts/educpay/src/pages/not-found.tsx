import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background p-5">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Page introuvable
            </h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Cette adresse ne correspond à aucun espace EducPAY.
          </p>
          <Link href="/" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Retour à l’accueil</Link>
        </CardContent>
      </Card>
    </div>
  );
}
