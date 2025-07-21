import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { PlanModal } from "@/components/ui/plan-modal";
import { Modal } from "@/components/ui/modal";
import { Loader2, Eye, EyeOff, User, Lock, Globe, AlertCircle } from "lucide-react";
import logoKeeptur from "@/assets/logo-keeptur.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    serverUrl: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) newErrors.email = "Este campo é obrigatório";
    if (!formData.password) newErrors.password = "Este campo é obrigatório";
    if (!formData.serverUrl) {
      newErrors.serverUrl = "Digite uma URL válida";
    } else {
      try {
        new URL(formData.serverUrl);
      } catch {
        newErrors.serverUrl = "Digite uma URL válida";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await login(formData.email, formData.password, formData.serverUrl);
      
      if (formData.rememberMe) {
        localStorage.setItem("keeptur-remember", JSON.stringify({
          email: formData.email,
          serverUrl: formData.serverUrl,
        }));
      }
      
      if (result.has_active_plan) {
        setLocation("/dashboard");
      } else {
        setShowPlanModal(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Erro de conexão com o servidor");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelected = () => {
    setShowPlanModal(false);
    setLocation("/dashboard");
  };

  // Load remembered data
  useState(() => {
    const remembered = localStorage.getItem("keeptur-remember");
    if (remembered) {
      const data = JSON.parse(remembered);
      setFormData(prev => ({
        ...prev,
        email: data.email || "",
        serverUrl: data.serverUrl || "",
      }));
    }
  });

  return (
    <div className="login-body flex items-center justify-center min-h-screen p-4">
      <Card className="login-container w-full max-w-md p-8 rounded-2xl fade-in">
        <div className="text-center mb-8">
          <img src={logoKeeptur} alt="Keeptur" className="h-12 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Faça login para acessar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail ou nome de usuário
            </Label>
            <div className="input-group relative">
              <User className="input-icon w-5 h-5" />
              <Input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`form-input input-with-icon pl-10 pr-3 py-3 ${errors.email ? 'error' : ''}`}
                placeholder="Digite seu e-mail ou usuário"
                required
              />
            </div>
            {errors.email && (
              <div className="error-message">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </Label>
            <div className="input-group relative">
              <Lock className="input-icon w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className={`form-input input-with-icon pl-10 pr-10 py-3 ${errors.password ? 'error' : ''}`}
                placeholder="Digite sua senha"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            {errors.password && (
              <div className="error-message">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 mb-2">
              URL do servidor Monde
            </Label>
            <div className="input-group relative">
              <Globe className="input-icon w-5 h-5" />
              <Input
                id="serverUrl"
                type="url"
                value={formData.serverUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, serverUrl: e.target.value }))}
                className={`form-input input-with-icon pl-10 pr-3 py-3 ${errors.serverUrl ? 'error' : ''}`}
                placeholder="https://suaempresa.monde.com.br"
                required
              />
            </div>
            {errors.serverUrl && (
              <div className="error-message">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.serverUrl}</span>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <Checkbox
              id="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rememberMe: !!checked }))}
              className="checkbox-custom"
            />
            <Label htmlFor="rememberMe" className="ml-3 text-sm text-gray-700 cursor-pointer">
              Lembrar-me
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="primary-button w-full py-3 px-4 text-sm font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              className="text-sm text-primary hover:text-primary/80 transition-colors block w-full"
              onClick={() => alert("Entre em contato com o administrador do seu sistema Monde para recuperar sua senha.")}
            >
              Esqueci minha senha
            </button>
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors block"
              onClick={() => setShowFirstLoginModal(true)}
            >
              Primeiro acesso? Clique aqui
            </button>
          </div>
        </form>
      </Card>

      <PlanModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onPlanSelected={handlePlanSelected}
      />

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erro de Conexão"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <Button
            onClick={() => setShowErrorModal(false)}
            className="primary-button"
          >
            Tentar Novamente
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showFirstLoginModal}
        onClose={() => setShowFirstLoginModal(false)}
        title="Primeiro Acesso - Instruções Importantes"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Antes de usar o Keeptur:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Acesse seu sistema <strong>Monde</strong> diretamente</li>
              <li>Faça login normalmente no Monde</li>
              <li>Defina uma nova senha quando solicitado</li>
              <li>Confirme que consegue acessar o Monde sem problemas</li>
              <li>Anote seu <strong>nome de usuário</strong> e nova senha</li>
            </ol>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">⚠️ Dados para Login:</h3>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li><strong>Email ou Username:</strong> Use seu nome de usuário do Monde</li>
              <li><strong>Senha:</strong> A mesma senha que você usa no Monde</li>
              <li><strong>Servidor:</strong> URL do seu sistema Monde</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Exemplo:</h3>
            <div className="text-green-700">
              <p><strong>Username:</strong> joao.silva</p>
              <p><strong>Servidor:</strong> https://suaempresa.monde.com.br</p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={() => setShowFirstLoginModal(false)}
              className="primary-button"
            >
              Entendi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
