import { apiRequest } from "./queryClient";

export interface MondeUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface MondeTask {
  id: number;
  titulo: string;
  descricao: string;
  cliente_id: number;
  usuario_id: number;
  categoria_id: number;
  status: string;
  prioridade: string;
  data_vencimento: string;
  created_at: string;
  updated_at: string;
}

export interface MondeClient {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  endereco: string;
  data_nascimento: string;
  responsavel_id: number;
  observacoes: string;
}

export interface MondeCategory {
  id: number;
  nome: string;
  cor: string;
  empresa_id: number;
}

export class MondeAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `/api/monde${endpoint}`;
    const keepturToken = localStorage.getItem('keeptur-token');
    
    const headers = {
      "Content-Type": "application/json",
      ...(keepturToken && { Authorization: `Bearer ${keepturToken}` }),
      ...options?.headers,
    };

    const response = await apiRequest(
      options?.method || "GET",
      url,
      options?.body ? JSON.parse(options.body as string) : undefined
    );

    return response.json();
  }

  // Authentication
  async login(email: string, password: string): Promise<{
    access_token: string;
    refresh_token: string;
    user: MondeUser;
    empresa_id: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Credenciais inválidas");
    }

    return response.json();
  }

  // Tasks
  async getTasks(filters?: {
    status?: string;
    cliente_id?: number;
    usuario_id?: number;
    categoria_id?: number;
  }): Promise<MondeTask[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/tarefas${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<MondeTask[]>(endpoint);
  }

  async getTask(id: number): Promise<MondeTask> {
    return this.request<MondeTask>(`/tarefas/${id}`);
  }

  async createTask(task: Omit<MondeTask, 'id' | 'created_at' | 'updated_at'>): Promise<MondeTask> {
    return this.request<MondeTask>('/tarefas', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, task: Partial<MondeTask>): Promise<MondeTask> {
    return this.request<MondeTask>(`/tarefas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: number): Promise<void> {
    await this.request<void>(`/tarefas/${id}`, {
      method: 'DELETE',
    });
  }

  // Clients
  async getClients(filters?: {
    nome?: string;
    email?: string;
    responsavel_id?: number;
  }): Promise<MondeClient[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/clientes${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<MondeClient[]>(endpoint);
  }

  async getClient(id: number): Promise<MondeClient> {
    return this.request<MondeClient>(`/clientes/${id}`);
  }

  async createClient(client: Omit<MondeClient, 'id'>): Promise<MondeClient> {
    return this.request<MondeClient>('/clientes', {
      method: 'POST',
      body: JSON.stringify(client),
    });
  }

  async updateClient(id: number, client: Partial<MondeClient>): Promise<MondeClient> {
    return this.request<MondeClient>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    });
  }

  async deleteClient(id: number): Promise<void> {
    await this.request<void>(`/clientes/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<MondeCategory[]> {
    return this.request<MondeCategory[]>('/categorias');
  }

  async getCategory(id: number): Promise<MondeCategory> {
    return this.request<MondeCategory>(`/categorias/${id}`);
  }

  async createCategory(category: Omit<MondeCategory, 'id'>): Promise<MondeCategory> {
    return this.request<MondeCategory>('/categorias', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: number, category: Partial<MondeCategory>): Promise<MondeCategory> {
    return this.request<MondeCategory>(`/categorias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: number): Promise<void> {
    await this.request<void>(`/categorias/${id}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers(): Promise<MondeUser[]> {
    return this.request<MondeUser[]>('/usuarios');
  }

  async getUser(id: number): Promise<MondeUser> {
    return this.request<MondeUser>(`/usuarios/${id}`);
  }

  async updateTaskStatus(taskId: string, completed: boolean, deleted: boolean): Promise<any> {
    const endpoint = `/tarefas/${taskId}`;
    const payload = {
      completed: completed,
      status: completed ? 'concluida' : 'pendente',
      ...(deleted && { deleted_at: new Date().toISOString() })
    };

    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
