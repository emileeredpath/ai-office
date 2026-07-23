import { create } from 'zustand';
import { Task, Campaign } from '@/types/index';
import { seedTasks, seedCampaigns } from '@/data/seed';

interface AppState {
  tasks: Task[];
  campaigns: Campaign[];
  selectedTaskId: string | null;
  selectedCampaignId: string | null;

  // Task operations
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  selectTask: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;

  // Campaign operations
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  getCampaignById: (id: string) => Campaign | undefined;
  selectCampaign: (id: string | null) => void;

  // Derived data
  getTasksForToday: () => Task[];
  getOverdueTasks: () => Task[];
  getWaitingForJohnTasks: () => Task[];
  getCompletedToday: () => Task[];
  getActiveCampaigns: () => Campaign[];
}

const STORAGE_KEY = 'ai-office-data';

const defaultState = {
  tasks: seedTasks,
  campaigns: seedCampaigns,
  selectedTaskId: null,
  selectedCampaignId: null,
};

const hydrateDates = (data: any) => {
  if (!data.tasks) return data;

  const toDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') return new Date(val);
    return null;
  };

  return {
    ...data,
    tasks: data.tasks.map((task: any) => ({
      ...task,
      deadline: toDate(task.deadline),
      startDate: toDate(task.startDate),
      createdAt: toDate(task.createdAt) || new Date(),
      completedAt: toDate(task.completedAt),
    })),
    campaigns: (data.campaigns || []).map((campaign: any) => ({
      ...campaign,
      startDate: toDate(campaign.startDate) || new Date(),
      endDate: toDate(campaign.endDate) || new Date(),
      spend: campaign.spend || 0,
      conversions: campaign.conversions || 0,
      leads: campaign.leads || 0,
      engagement: campaign.engagement || 0,
      notes: campaign.notes || '',
    })),
  };
};

export const useAppStore = create<AppState>((set, get) => {
  // Load from localStorage on init
  const savedData = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : defaultState;
      return hydrateDates(parsed);
    } catch {
      return defaultState;
    }
  })();

  return {
    ...savedData,
    selectedTaskId: savedData.selectedTaskId || null,
    selectedCampaignId: savedData.selectedCampaignId || null,

    addTask: (task: Task) => {
      set((state) => {
        const newState = { ...state, tasks: [...state.tasks, task] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },

    updateTask: (id: string, updates: Partial<Task>) => {
      set((state) => {
        const newState = {
          ...state,
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },

    deleteTask: (id: string) => {
      set((state) => {
        const newState = {
          ...state,
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },

    selectTask: (id: string | null) => {
      set({ selectedTaskId: id });
    },

    getTaskById: (id: string) => {
      return get().tasks.find((t) => t.id === id);
    },

    addCampaign: (campaign: Campaign) => {
      set((state) => {
        const newState = { ...state, campaigns: [...state.campaigns, campaign] };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },

    updateCampaign: (id: string, updates: Partial<Campaign>) => {
      set((state) => {
        const newState = {
          ...state,
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },

    deleteCampaign: (id: string) => {
      set((state) => {
        const newState = {
          ...state,
          campaigns: state.campaigns.filter((c) => c.id !== id),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      });
    },

    getCampaignById: (id: string) => {
      return get().campaigns.find((c) => c.id === id);
    },

    selectCampaign: (id: string | null) => {
      set({ selectedCampaignId: id });
    },

    getTasksForToday: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return get().tasks.filter((t) => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline >= today && deadline < tomorrow && t.status !== 'complete';
      });
    },

    getOverdueTasks: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return get().tasks.filter((t) => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline < today && t.status !== 'complete';
      });
    },

    getWaitingForJohnTasks: () => {
      return get().tasks.filter((t) => t.status === 'waiting-john');
    },

    getCompletedToday: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return get().tasks.filter((t) => {
        if (!t.completedAt) return false;
        const completed = new Date(t.completedAt);
        return completed >= today && completed < tomorrow;
      });
    },

    getActiveCampaigns: () => {
      return get().campaigns.filter((c) => c.status === 'active');
    },
  };
});
