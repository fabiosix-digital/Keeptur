import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className = "" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
      <div className={`modal-content rounded-2xl p-6 max-w-2xl w-full mx-4 ${className}`}>
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-primary">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
