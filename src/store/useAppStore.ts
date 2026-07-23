import { create } from 'zustand';
import { Task, Campaign, TaskHistoryEntry } from '@/types/index';
import { seedTasks, seedCampaigns } from '@/data/seed';
import {
  isActionsApiConfigured,
  fetchTasksFromApi,
  createTaskAction,
  updateTaskAction,
  completeTaskAction,
  ActionsApiError,
} from '@/services/actionsApi';

interface AppState {
  tasks: Task[];
  campaigns: Campaign[];
  selectedTaskId: string | null;
  selectedCampaignId: string | null;
  apiConnected: boolean;
  apiSyncing: boolean;

  // Task operations — write through to the Actions API when it's configured
  // (Settings > Claude Actions Integration), otherwise operate on
  // localStorage exactly as before.
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  selectTask: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  syncTasksFromApi: () => Promise<void>;

  // Campaign operations (not yet backed by the Actions API — local only)
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

const toDate = (val: any): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'string') return new Date(val);
  return null;
};

const hydrateTask = (task: any): Task => ({
  ...task,
  deadline: toDate(task.deadline),
  startDate: toDate(task.startDate),
  createdAt: toDate(task.createdAt) || new Date(),
  completedAt: toDate(task.completedAt),
  previousStatus: task.previousStatus ?? null,
  history: (task.history || []).map((entry: any) => ({
    ...entry,
    timestamp: toDate(entry.timestamp) || new Date(),
  })),
});

const hydrateDates = (data: any) => {
  if (!data.tasks) return data;

  return {
    ...data,
    tasks: data.tasks.map(hydrateTask),
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

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof ActionsApiError) return err.message;
  return 'Something went wrong talking to AI Office. Please try again.';
}

export const useAppStore = create<AppState>((set, get) => {
  // Load from localStorage on init (used as-is when the Actions API isn't
  // configured, and as an instant first paint while syncTasksFromApi runs
  // in the background when it is).
  const savedData = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : defaultState;
      return hydrateDates(parsed);
    } catch {
      return defaultState;
    }
  })();

  const persistLocal = (state: Pick<AppState, 'tasks' | 'campaigns' | 'selectedTaskId' | 'selectedCampaignId'>) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks: state.tasks,
        campaigns: state.campaigns,
        selectedTaskId: state.selectedTaskId,
        selectedCampaignId: state.selectedCampaignId,
      })
    );
  };

  const store: AppState = {
    ...savedData,
    selectedTaskId: savedData.selectedTaskId || null,
    selectedCampaignId: savedData.selectedCampaignId || null,
    apiConnected: false,
    apiSyncing: false,

    addTask: async (task: Task) => {
      if (isActionsApiConfigured()) {
        const requestId = `add-${task.id}-${Date.now()}`;
        let response = await createTaskAction(
          {
            title: task.title,
            notes: task.notes || undefined,
            brand: task.brand,
            priority: task.priority,
            status: task.status,
            campaign_id: task.campaignId || undefined,
          },
          requestId
        );

        if (!response.success && response.possible_duplicates?.length) {
          const names = (response.possible_duplicates as any[]).map((d) => `"${d.title}"`).join(', ');
          const proceed = window.confirm(
            `This looks similar to an existing task: ${names}. Create it anyway?`
          );
          if (!proceed) return;
          response = await createTaskAction(
            {
              title: task.title,
              notes: task.notes || undefined,
              brand: task.brand,
              priority: task.priority,
              status: task.status,
              campaign_id: task.campaignId || undefined,
              confirm_duplicate: true,
            },
            requestId
          );
        }

        if (!response.success) {
          alert(response.message || 'Could not create the task.');
          return;
        }

        await get().syncTasksFromApi();
        return;
      }

      set((state) => {
        const newState = { ...state, tasks: [...state.tasks, task] };
        persistLocal(newState);
        return newState;
      });
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
      if (isActionsApiConfigured()) {
        try {
          const payload: Record<string, unknown> = {};
          if (updates.title !== undefined) payload.title = updates.title;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.brand !== undefined) payload.brand = updates.brand;
          if (updates.priority !== undefined) payload.priority = updates.priority;
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.deadline !== undefined) {
            payload.deadline = updates.deadline ? updates.deadline.toISOString() : null;
          }
          if (updates.campaignId !== undefined) payload.campaign_id = updates.campaignId;

          const response = await updateTaskAction(id, payload);
          if (!response.success) {
            alert(response.message || 'Could not update the task.');
            return;
          }
          await get().syncTasksFromApi();
        } catch (err) {
          alert(friendlyErrorMessage(err));
        }
        return;
      }

      set((state) => {
        const newState = {
          ...state,
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        };
        persistLocal(newState);
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
        persistLocal(newState);
        return newState;
      });
    },

    completeTask: async (id: string) => {
      if (isActionsApiConfigured()) {
        try {
          const response = await completeTaskAction(id);
          if (!response.success) {
            alert(response.message || 'Could not complete the task.');
            return;
          }
          await get().syncTasksFromApi();
        } catch (err) {
          alert(friendlyErrorMessage(err));
        }
        return;
      }

      set((state) => {
        const newState = {
          ...state,
          tasks: state.tasks.map((t) => {
            if (t.id !== id || t.status === 'complete') return t;
            const entry: TaskHistoryEntry = {
              id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              action: 'completed',
              timestamp: new Date(),
              previousStatus: t.status,
              newStatus: 'complete',
            };
            return {
              ...t,
              previousStatus: t.status,
              status: 'complete' as const,
              completedAt: new Date(),
              history: [...t.history, entry],
            };
          }),
        };
        persistLocal(newState);
        return newState;
      });
    },

    reopenTask: async (id: string) => {
      const current = get().tasks.find((t) => t.id === id);
      if (!current || current.status !== 'complete') return;
      const restoredStatus = current.previousStatus || 'not-started';

      if (isActionsApiConfigured()) {
        try {
          const response = await updateTaskAction(id, { status: restoredStatus });
          if (!response.success) {
            alert(response.message || 'Could not reopen the task.');
            return;
          }
          await get().syncTasksFromApi();
        } catch (err) {
          alert(friendlyErrorMessage(err));
        }
        return;
      }

      set((state) => {
        const newState = {
          ...state,
          tasks: state.tasks.map((t) => {
            if (t.id !== id || t.status !== 'complete') return t;
            const entry: TaskHistoryEntry = {
              id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              action: 'reopened',
              timestamp: new Date(),
              previousStatus: 'complete',
              newStatus: restoredStatus,
            };
            return {
              ...t,
              status: restoredStatus,
              completedAt: null,
              previousStatus: null,
              history: [...t.history, entry],
            };
          }),
        };
        persistLocal(newState);
        return newState;
      });
    },

    selectTask: (id: string | null) => {
      set({ selectedTaskId: id });
    },

    getTaskById: (id: string) => {
      return get().tasks.find((t) => t.id === id);
    },

    syncTasksFromApi: async () => {
      if (!isActionsApiConfigured()) {
        set({ apiConnected: false });
        return;
      }
      set({ apiSyncing: true });
      try {
        const rawTasks = await fetchTasksFromApi();
        const tasks = rawTasks.map(hydrateTask);
        set({ tasks, apiConnected: true, apiSyncing: false });
      } catch {
        // Keep whatever is currently in state (local cache) and just flag
        // the connection as down — never wipe the dashboard because a sync
        // failed.
        set({ apiConnected: false, apiSyncing: false });
      }
    },

    addCampaign: (campaign: Campaign) => {
      set((state) => {
        const newState = { ...state, campaigns: [...state.campaigns, campaign] };
        persistLocal(newState);
        return newState;
      });
    },

    updateCampaign: (id: string, updates: Partial<Campaign>) => {
      set((state) => {
        const newState = {
          ...state,
          campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        };
        persistLocal(newState);
        return newState;
      });
    },

    deleteCampaign: (id: string) => {
      set((state) => {
        const newState = {
          ...state,
          campaigns: state.campaigns.filter((c) => c.id !== id),
        };
        persistLocal(newState);
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

  if (isActionsApiConfigured()) {
    // Fire-and-forget: paint instantly from local cache, then reconcile
    // with the backend once it responds.
    store.syncTasksFromApi();
  }

  return store;
});
