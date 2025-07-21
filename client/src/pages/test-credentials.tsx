import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export default function TestCredentials() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCredentials = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        message: "Erro de conexão"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Testar Credenciais do Monde</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium mb-1">
              Login (ex: admin@suaagencia.monde.com.br)
            </label>
            <Input
              id="login"
              type="text"
              placeholder="usuario@agencia.monde.com.br"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Sua senha do Monde"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button 
            onClick={testCredentials} 
            disabled={testing || !login || !password}
            className="w-full"
          >
            {testing ? "Testando..." : "Testar Credenciais"}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-500" : "border-red-500"}>
              <AlertDescription>
                {result.success ? (
                  <div className="text-green-700">
                    ✅ Credenciais válidas!<br />
                    Login: {result.login}
                  </div>
                ) : (
                  <div className="text-red-700">
                    ❌ {result.message}<br />
                    Status: {result.status}<br />
                    <small className="text-gray-600">
                      Verifique se o usuário tem permissão de acesso total no sistema Monde
                    </small>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Dica:</strong> O login deve seguir o formato:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>usuario@suaagencia.monde.com.br</li>
              <li>admin@empresa.monde.com.br</li>
              <li>O usuário deve ter permissão de acesso total</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}