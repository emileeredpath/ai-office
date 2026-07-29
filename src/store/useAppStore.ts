import { create } from 'zustand';
import { Task, Campaign, TaskHistoryEntry } from '@/types/index';
import {
  fetchTasksFromApi,
  deleteTaskFromApi,
  createTaskAction,
  updateTaskAction,
  completeTaskAction,
  ActionsApiError,
} from '@/services/actionsApi';
import {
  fetchCampaignsFromApi,
  createCampaignInApi,
  updateCampaignInApi,
  deleteCampaignInApi,
} from '@/services/campaignsApi';

interface AppState {
  tasks: Task[];
  campaigns: Campaign[];
  selectedTaskId: string | null;
  selectedCampaignId: string | null;
  apiConnected: boolean;
  apiSyncing: boolean;

  // All reads and writes go straight through to the shared backend — the
  // same database Claude's MCP tools use — so there is nothing "local only"
  // left in this store. localStorage is not used for real data any more.
  addTask: (task: Task) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  reopenTask: (id: string) => Promise<void>;
  selectTask: (id: string | null) => void;
  getTaskById: (id: string) => Task | undefined;
  syncTasksFromApi: () => Promise<void>;

  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaignById: (id: string) => Campaign | undefined;
  selectCampaign: (id: string | null) => void;
  syncCampaignsFromApi: () => Promise<void>;

  // Derived data
  getTasksForToday: () => Task[];
  getOverdueTasks: () => Task[];
  getWaitingForJohnTasks: () => Task[];
  getCompletedToday: () => Task[];
  getActiveCampaigns: () => Campaign[];
}

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
  type: task.type ?? 'task',
  recipients: task.recipients ?? null,
  subject: task.subject ?? null,
});

const hydrateCampaign = (campaign: any): Campaign => ({
  ...campaign,
  startDate: toDate(campaign.startDate) || new Date(),
  endDate: toDate(campaign.endDate) || new Date(),
  spend: campaign.spend || 0,
  conversions: campaign.conversions || 0,
  leads: campaign.leads || 0,
  engagement: campaign.engagement || 0,
  notes: campaign.notes || '',
  entities: campaign.entities && campaign.entities.length > 0 ? campaign.entities : [campaign.brand],
  tasks: campaign.tasks ?? [],
  results: campaign.results
    ? { ...campaign.results, loggedAt: toDate(campaign.results.loggedAt) || new Date() }
    : null,
});

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof ActionsApiError) return err.message;
  return 'Something went wrong talking to AI Office. Please try again.';
}

export const useAppStore = create<AppState>((set, get) => {
  const store: AppState = {
    tasks: [],
    campaigns: [],
    selectedTaskId: null,
    selectedCampaignId: null,
    apiConnected: false,
    apiSyncing: false,

    addTask: async (task: Task) => {
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
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
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
    },

    deleteTask: async (id: string) => {
      try {
        await deleteTaskFromApi(id);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
        }));
      } catch (err) {
        alert(friendlyErrorMessage(err));
      }
    },

    completeTask: async (id: string) => {
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
    },

    reopenTask: async (id: string) => {
      const current = get().tasks.find((t) => t.id === id);
      if (!current || current.status !== 'complete') return;
      const restoredStatus = current.previousStatus || 'not-started';

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
    },

    selectTask: (id: string | null) => {
      set({ selectedTaskId: id });
    },

    getTaskById: (id: string) => {
      return get().tasks.find((t) => t.id === id);
    },

    syncTasksFromApi: async () => {
      set({ apiSyncing: true });
      try {
        const rawTasks = await fetchTasksFromApi();
        const tasks = rawTasks.map(hydrateTask);
        set({ tasks, apiConnected: true, apiSyncing: false });
      } catch {
        // Keep whatever is currently in state and just flag the connection
        // as down — never wipe the dashboard because a sync failed.
        set({ apiConnected: false, apiSyncing: false });
      }
    },

    addCampaign: async (campaign: Campaign) => {
      try {
        await createCampaignInApi({
          name: campaign.name,
          brand: campaign.brand,
          entities: campaign.entities,
          primaryIndustry: campaign.primaryIndustry,
          secondaryIndustry: campaign.secondaryIndustry,
          theme: campaign.theme,
          status: campaign.status,
          startDate: campaign.startDate.toISOString(),
          endDate: campaign.endDate.toISOString(),
          budget: campaign.budget,
          colour: campaign.colour,
          reactive: campaign.reactive,
          notes: campaign.notes,
        });
        await get().syncCampaignsFromApi();
      } catch (err) {
        alert(friendlyErrorMessage(err));
      }
    },

    updateCampaign: async (id: string, updates: Partial<Campaign>) => {
      try {
        const payload: Record<string, unknown> = { ...updates };
        if (updates.startDate !== undefined) payload.startDate = updates.startDate.toISOString();
        if (updates.endDate !== undefined) payload.endDate = updates.endDate.toISOString();
        if (updates.results !== undefined) {
          payload.results = updates.results
            ? { ...updates.results, loggedAt: updates.results.loggedAt.toISOString() }
            : null;
        }
        delete (payload as any).tasks;

        await updateCampaignInApi(id, payload);
        await get().syncCampaignsFromApi();
      } catch (err) {
        alert(friendlyErrorMessage(err));
      }
    },

    deleteCampaign: async (id: string) => {
      try {
        await deleteCampaignInApi(id);
        set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) }));
      } catch (err) {
        alert(friendlyErrorMessage(err));
      }
    },

    getCampaignById: (id: string) => {
      return get().campaigns.find((c) => c.id === id);
    },

    selectCampaign: (id: string | null) => {
      set({ selectedCampaignId: id });
    },

    syncCampaignsFromApi: async () => {
      try {
        const rawCampaigns = await fetchCampaignsFromApi();
        set({ campaigns: rawCampaigns.map(hydrateCampaign) });
      } catch {
        // Keep whatever is currently in state.
      }
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

  // Initial sync is triggered by AuthContext once a session is confirmed
  // (on load and immediately after a successful login) rather than here,
  // since this store's module executes before the login gate resolves.
  return store;
});
