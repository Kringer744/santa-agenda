"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout'; // Importar Layout para manter a estrutura

export default function Login() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4"> {/* Ajuste para o header mobile */}
        <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-card">
          <h1 className="text-3xl font-bold text-center text-foreground">Bem-vindo ao PetHotel</h1>
          <p className="text-center text-muted-foreground">Faça login ou crie sua conta para continuar</p>
          <Auth
            supabaseClient={supabase}
            providers={[]} // Você pode adicionar 'google', 'github' etc. aqui se quiser
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light" // Ou "dark" se preferir
            redirectTo={window.location.origin + '/'} // Redireciona para a raiz após o login
          />
        </div>
      </div>
    </Layout>
  );
}