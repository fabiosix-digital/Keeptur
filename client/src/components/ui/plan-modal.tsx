import { useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { Check, CheckCircle, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  users: string;
  features: string[];
  popular?: boolean;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelected: () => void;
}

export function PlanModal({ isOpen, onClose, onPlanSelected }: PlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      price: 49.90,
      users: "Até 5 usuários",
      features: [
        "Gestão de tarefas",
        "Calendário básico",
        "Suporte por e-mail",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 99.90,
      users: "De 6 a 10 usuários",
      features: [
        "Tudo do Starter",
        "Relatórios avançados",
        "Integrações API",
        "Suporte prioritário",
      ],
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: 149.90,
      users: "11 a 20 usuários",
      features: [
        "Tudo do Pro",
        "Usuários ilimitados",
        "Customizações",
        "Suporte 24/7",
      ],
    },
  ];

  const handlePlanSelection = async (planId: string) => {
    setSelectedPlan(planId);
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call parent callback
      onPlanSelected();
    } catch (error) {
      console.error("Error selecting plan:", error);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="text-muted-foreground mb-2">
          Você se conectou com sucesso ao sistema <strong>MONDE</strong>,<br />
          mas ainda não ativou seu plano de uso no Keeptur.
        </p>
        <h2 className="text-2xl font-bold text-foreground">
          Escolha seu plano para liberar o painel de agendamentos e tarefas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card p-6 ${plan.popular ? 'popular' : ''} ${
              plan.popular ? 'pt-8' : ''
            }`}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4">{plan.users}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-gray-600">/mês</span>
              </div>
              <ul className="text-sm text-gray-600 mb-6 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handlePlanSelection(plan.id)}
                disabled={loading}
                className="primary-button w-full py-3 px-4 text-sm font-semibold"
              >
                {loading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Assinar este plano"
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Todos os planos incluem 14 dias de teste gratuito</p>
      </div>
    </Modal>
  );
}
