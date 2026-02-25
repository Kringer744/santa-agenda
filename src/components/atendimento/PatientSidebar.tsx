import { CardHeader, CardTitle } from '@/components/ui/card';

export default function PatientSidebar() {
  return (
    <div className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Ficha do Paciente</CardTitle>
      </CardHeader>
      <div className="flex-1 p-4 text-center text-muted-foreground">
        <p className="text-sm">Os detalhes do paciente aparecerão aqui.</p>
      </div>
    </div>
  );
}