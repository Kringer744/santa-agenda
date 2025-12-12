import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  DollarSign,
  Pencil,
  Trash2
} from 'lucide-react';
import { unidades, servicosAdicionais } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function Configuracoes() {
  const [diaria, setDiaria] = useState('100');
  const [servicos, setServicos] = useState(servicosAdicionais);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure unidades, preços e serviços
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unidades */}
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Unidades
                  </CardTitle>
                  <CardDescription>
                    Gerencie as unidades do hotel
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {unidades.map((unidade, index) => (
                <div 
                  key={unidade.id}
                  className="p-4 rounded-xl bg-muted/50 space-y-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{unidade.nome}</h4>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{unidade.endereco}</p>
                  <div className="flex gap-3">
                    <Badge className="bg-coral-light text-primary">
                      🐶 {unidade.capacidadeCachorro} vagas
                    </Badge>
                    <Badge className="bg-mint-light text-secondary">
                      🐱 {unidade.capacidadeGato} vagas
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preços */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-secondary" />
                Precificação
              </CardTitle>
              <CardDescription>
                Configure valores da hospedagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="diaria">Valor da diária base</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input 
                    id="diaria"
                    type="number"
                    className="pl-12"
                    value={diaria}
                    onChange={(e) => setDiaria(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Serviços Adicionais</Label>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Novo
                  </Button>
                </div>
                
                {servicos.map((servico, index) => (
                  <div 
                    key={servico.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-honey-light/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-2xl">{servico.icone}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{servico.nome}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        R$ {servico.preco.toFixed(2)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full">
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
