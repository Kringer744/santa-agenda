"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Stethoscope } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-dental text-white shadow-soft mb-4">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">DentalClinic</h1>
          <p className="text-muted-foreground mt-2">Acesse sua conta para gerenciar a clínica</p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-elevated border border-border/50">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  }
                }
              }
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-mail',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                  loading_button_label: 'Entrando...',
                  email_input_placeholder: 'seu@email.com',
                  password_input_placeholder: 'Sua senha',
                }
              }
            }}
            providers={[]}
            theme="light"
          />
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed border-border">
            <p className="text-xs text-center text-muted-foreground">
              <strong>Acesso de Demonstração:</strong><br />
              dr.fabiotieri@gmail.com / DrF@abio12
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}