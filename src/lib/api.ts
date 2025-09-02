import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  name: string;
  description?: string;
  libraries: string[];
  state: any;
  messages_used: number;
  created_at: string;
  updated_at: string;
}

export interface Usage {
  user: {
    plan: 'free' | 'pro' | 'enterprise';
    messagesUsed: number;
    messagesLimit: number;
    messagesRemaining: number;
    usagePercentage: number;
  };
  projects: {
    total: number;
    list: Array<{
      id: string;
      name: string;
      messagesUsed: number;
      createdAt: string;
    }>;
  };
  recentActivity: Array<{
    id: string;
    prompt_text: string;
    tokens_used: number;
    created_at: string;
    projects: { name: string };
  }>;
}

export interface AIResponse {
  components: Array<{
    name: string;
    code: string;
    type: 'component' | 'page' | 'util';
  }>;
  explanation: string;
  libraries: string[];
}

// Project Management API
export const projectAPI = {
  create: async (name: string, description?: string, libraries: string[] = []): Promise<Project> => {
    const { data, error } = await supabase.functions.invoke('create-project', {
      body: { name, description, libraries }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.project;
  },

  getAll: async (): Promise<Project[]> => {
    const { data, error } = await supabase.functions.invoke('get-projects');

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.projects;
  },

  getById: async (id: string): Promise<Project> => {
    const { data, error } = await supabase.functions.invoke('get-projects', {
      body: {},
      method: 'GET'
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.project;
  },

  update: async (projectId: string, updates: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase.functions.invoke('update-project', {
      body: { projectId, updates }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.project;
  }
};

// AI Generation API
export const aiAPI = {
  generate: async (
    projectId: string, 
    prompt: string, 
    isInitial: boolean = false
  ): Promise<{
    response: AIResponse;
    version: number;
    tokensUsed: number;
  }> => {
    const { data, error } = await supabase.functions.invoke('ai-generate', {
      body: { projectId, prompt, isInitial }
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return {
      response: data.response,
      version: data.version,
      tokensUsed: data.tokensUsed
    };
  }
};

// Usage API
export const usageAPI = {
  get: async (): Promise<Usage> => {
    const { data, error } = await supabase.functions.invoke('get-usage');

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.usage;
  }
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error?.message) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
};