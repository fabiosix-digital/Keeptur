import { useState } from "react";
import { Card } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { User, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  status: 'pending' | 'progress' | 'review' | 'completed';
}

interface KanbanBoardProps {
  onTaskEdit: (task: Task) => void;
}

export function KanbanBoard({ onTaskEdit }: KanbanBoardProps) {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Reserva de hotel para Sr. João',
      description: 'Confirmar disponibilidade para 15-20 de janeiro',
      assignee: 'Ana Marques',
      priority: 'high',
      dueDate: '2 dias',
      status: 'pending',
    },
    {
      id: '2',
      title: 'Cotação passagem aérea',
      description: 'Verificar melhor preço para destino internacional',
      assignee: 'Carlos Silva',
      priority: 'medium',
      dueDate: '1 dia',
      status: 'progress',
    },
    {
      id: '3',
      title: 'Documentação de viagem',
      description: 'Verificar passaporte e vistos necessários',
      assignee: 'Maria Santos',
      priority: 'low',
      dueDate: 'Hoje',
      status: 'review',
    },
    {
      id: '4',
      title: 'Confirmação de reserva',
      description: 'Hotel confirmado com sucesso',
      assignee: 'Ana Marques',
      priority: 'medium',
      dueDate: 'Hoje',
      status: 'completed',
    },
  ]);

  const columns = [
    { id: 'pending', title: 'Pendentes', tasks: tasks.filter(t => t.status === 'pending') },
    { id: 'progress', title: 'Em Andamento', tasks: tasks.filter(t => t.status === 'progress') },
    { id: 'review', title: 'Revisão', tasks: tasks.filter(t => t.status === 'review') },
    { id: 'completed', title: 'Concluídas', tasks: tasks.filter(t => t.status === 'completed') },
  ];

  const getPriorityBadge = (priority: string) => {
    const classes = {
      low: 'priority-badge-low',
      medium: 'priority-badge-medium',
      high: 'priority-badge-high',
    };
    return classes[priority as keyof typeof classes] || classes.medium;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };
    return labels[priority as keyof typeof labels] || 'Média';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="kanban-column rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-sm text-primary">{column.title}</h3>
            <Badge variant="secondary" className="text-xs">
              {column.tasks.length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {column.tasks.map((task) => (
              <Card
                key={task.id}
                className="kanban-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onTaskEdit(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-sm text-primary line-clamp-2">
                    {task.title}
                  </h4>
                  <Badge className={`${getPriorityBadge(task.priority)} text-xs ml-2`}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {task.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="w-3 h-3 mr-1" />
                    {task.assignee}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {task.dueDate}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
