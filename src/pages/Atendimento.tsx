import { Card } from '@/components/ui/card';
import ConversationList from '../components/atendimento/ConversationList';
import ChatWindow from '../components/atendimento/ChatWindow';
import PatientSidebar from '../components/atendimento/PatientSidebar';

export default function Atendimento() {
  return (
    <Card className="h-[calc(100vh-220px)] flex overflow-hidden">
      <div className="w-1/4 border-r">
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatWindow />
      </div>
      <div className="w-1/4 border-l">
        <PatientSidebar />
      </div>
    </Card>
  );
}