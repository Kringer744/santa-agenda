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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  DollarSign,
  Pencil,
  Trash2,
  Loader2
} from 'lucide-react';
import { useUnidades, useCreateUnidade, useDeleteUnidade } from '@/hooks/useUnidades';
import { useServicos, useCreateServico, useUpdateServico } from '@/hooks/useServicos';

export default function Configuracoes() {
  const [isUnidadeDialogOpen, setIsUnidadeDialogOpen] = useState(false);
  const [isServicoDialogOpen, setIsServicoDialogOpen] = useState(false);

  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();
  const { data: servicos = [], isLoading: loadingServicos } = useServicos();
  const createUnidade = useCreateUnidade();
  const deleteUnidade = useDeleteUnidade();
  const createServico = useCreateServico();
  const updateServico = useUpdateServico();

  const handleAddUnidade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUnidade.mutate({
      nome: formData.get('nome') as string,
      endereco: formData.get('endereco') as string || null,
      cidade: formData.get('cidade') as string || null,
      estado: formData.get('estado') as string || null,
      capacidade_cachorro: parseInt(formData.get('capacidade_cachorro') as string) || 10,
      capacidade_gato: parseInt(formData.get('capacidade_gato') as string) || 5,
    }, {
      onSuccess: () => setIsUnidadeDialogOpen(false)
    });
  };

  const handleAddServico = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createServico.mutate({
      nome: formData.get('nome') as string,
      preco: parseFloat(formData.get('preco') as string) || 0,
      icone: formData.get('icone') as string || '⭐', // Changed default icon to emoji
      ativo: true,
    }, {
      onSuccess: () => setIsServicoDialogOpen(false)
    });
  };

  return (
    <Layout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Configure unidades, preços e serviços
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Unidades */}
          <Card className="animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <Building2 className="w-5 h-5 text-primary" />
                    Unidades
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Gerencie as unidades do hotel
                  </CardDescription>
                </div>
                <Dialog open={isUnidadeDialogOpen} onOpenChange={setIsUnidadeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Nova Unidade</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddUnidade} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da unidade</Label>
                        <Input id="nome" name="nome" required placeholder="Unidade Centro" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input id="endereco" name="endereco" placeholder="Rua das Flores, 123" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cidade">Cidade</Label>
                          <Input id="cidade" name="cidade" placeholder="São Paulo" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="estado">Estado</Label>
                          <Input id="estado" name="estado" placeholder="SP" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="capacidade_cachorro">Vagas cachorros</Label>
                          <Input id="capacidade_cachorro" name="capacidade_cachorro" type="number" defaultValue="10" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="capacidade_gato">Vagas gatos</Label>
                          <Input id="capacidade_gato" name="capacidade_gato" type="number" defaultValue="5" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUnidadeDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={createUnidade.isPending}>
                          {createUnidade.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingUnidades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : unidades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma unidade cadastrada</p>
              ) : (
                unidades.map((unidade, index) => (
                  <div 
                    key={unidade.id}
                    className="p-4 rounded-xl bg-muted/50 space-y-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="font-semibold text-foreground text-base">{unidade.nome}</h4>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteUnidade.mutate(unidade.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {(unidade.endereco || unidade.cidade || unidade.estado) && (
                      <p className="text-sm text-muted-foreground">
                        {unidade.endereco}
                        {unidade.endereco && (unidade.cidade || unidade.estado) ? ', ' : ''}
                        {unidade.cidade}
                        {unidade.cidade && unidade.estado ? ' - ' : ''}
                        {unidade.estado}
                      </p>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      <Badge className="bg-coral-light text-primary text-xs">
                        🐶 {unidade.capacidade_cachorro} vagas
                      </Badge>
                      <Badge className="bg-mint-light text-secondary text-xs">
                        🐱 {unidade.capacidade_gato} vagas
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Preços */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                    <DollarSign className="w-5 h-5 text-secondary" />
                    Serviços Adicionais
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    Configure serviços e preços
                  </CardDescription>
                </div>
                <Dialog open={isServicoDialogOpen} onOpenChange={setIsServicoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Novo Serviço</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddServico} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="servico_nome">Nome do serviço</Label>
                        <Input id="servico_nome" name="nome" required placeholder="Banho e Tosa" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preco">Preço (R$)</Label>
                          <Input id="preco" name="preco" type="number" step="0.01" required placeholder="50.00" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="icone">Ícone (emoji)</Label>
                          <Input id="icone" name="icone" placeholder="🛁" />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsServicoDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" className="flex-1" disabled={createServico.isPending}>
                          {createServico.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingServicos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : servicos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum serviço cadastrado</p>
              ) : (
                servicos.map((servico, index) => (
                  <div 
                    key={servico.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-honey-light/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="text-2xl">{servico.icone}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-base">{servico.nome}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground text-base">
                        R$ {Number(servico.preco).toFixed(2)}
                      </span>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}