import { Modal } from "./modal";
import { Button } from "./button";
import { Label } from "./label";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: string;
  birthdate: string;
  responsible: string;
  notes: string;
}

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  if (!client) return null;

  const clientData = {
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 99999-9999",
    document: "123.456.789-00",
    address: "Rua das Flores, 123 - São Paulo, SP",
    birthdate: "15/03/1985",
    responsible: "Ana Marques",
    notes: "Cliente preferencial - Viagens corporativas",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Cliente"
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.name}
            </div>
          </div>
          
          <div>
            <Label>Email</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.email}
            </div>
          </div>
          
          <div>
            <Label>Telefone</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.phone}
            </div>
          </div>
          
          <div>
            <Label>Documento</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.document}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Label>Endereço</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.address}
            </div>
          </div>
          
          <div>
            <Label>Data de Nascimento</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.birthdate}
            </div>
          </div>
          
          <div>
            <Label>Responsável</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted">
              {clientData.responsible}
            </div>
          </div>
          
          <div className="md:col-span-2">
            <Label>Observações</Label>
            <div className="form-input w-full px-3 py-2 rounded-lg text-sm bg-muted h-20">
              {clientData.notes}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="primary-button">
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
