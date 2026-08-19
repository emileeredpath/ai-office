import { create } from 'zustand';
import { Task, Campaign, TaskHistoryEntry, FundingRecord } from '@/types/index';
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
import {
  fetchFundingRecordsFromApi,
  createFundingRecordInApi,
  updateFundingRecordInApi,
} from '@/services/fundingRecordsApi';
import { fetchRecentAuditLog, type AuditLogEntry } from '@/services/auditLogApi';

export interface Wave1CallData {
  id: string;
  date: string;
  time: string;
  duration: string;
  answered: boolean;
  callerNumber: string;
  campaign: string;
  recordingUrl?: string;
}

export interface Wave1BrandMetrics {
  clicks: number;
  pageViews: number;
  formSubmissions: number;
  conversionRate: number;
}

export interface Wave1PerformanceData {
  configured: boolean;
  ga4?: {
    clicks: number;
    pageViews: number;
    formSubmissions: number;
    conversionRate: number;
    byBrand: Record<string, Wave1BrandMetrics>;
  };
  infinity?: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    avgDuration: string;
    calls: Wave1CallData[];
  };
  errors: string[];
  lastSynced?: string;
}

interface AppState {
  tasks: Task[];
  campaigns: Campaign[];
  selectedTaskId: string | null;
  selectedCampaignId: string | null;
  apiConnected: boolean;
  apiSyncing: boolean;

  // Wave 1 Performance data
  wave1Performance: Wave1PerformanceData | null;
  wave1Syncing: boolean;

  // Funding & Rewards records
  fundingRecords: FundingRecord[];

  // Recent activity feed (Home screen)
  auditLog: AuditLogEntry[];

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

  // Wave 1 data
  syncWave1Performance: () => Promise<void>;
  syncWave1Calls: () => Promise<void>;

  // Funding & Rewards
  syncFundingRecordsFromApi: () => Promise<void>;
  addFundingRecord: (record: Omit<FundingRecord, 'id' | 'balanceToClaim' | 'percentOfTarget' | 'createdAt' | 'updatedAt' | 'archived' | 'archivedAt'>) => Promise<void>;
  updateFundingRecord: (id: string, updates: Partial<FundingRecord>) => Promise<void>;

  // Recent activity
  syncAuditLog: () => Promise<void>;

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
  cost: task.cost ?? null,
  currency: task.currency ?? null,
  scheduleId: task.scheduleId ?? null,
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
  planDocument: campaign.planDocument
    ? { ...campaign.planDocument, uploadDate: toDate(campaign.planDocument.uploadDate) || new Date() }
    : undefined,
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
    wave1Performance: null,
    wave1Syncing: false,
    fundingRecords: [],
    auditLog: [],

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
        if (updates.type !== undefined) payload.type = updates.type;
        if (updates.recipients !== undefined) payload.recipients = updates.recipients;
        if (updates.subject !== undefined) payload.subject = updates.subject;
        if (updates.cost !== undefined) payload.cost = updates.cost;
        if (updates.currency !== undefined) payload.currency = updates.currency;

        const response = await updateTaskAction(id, payload);
        if (!response.success) {
          alert(response.message || 'Could not update the task.');
          return;
        }
        await get().syncTasksFromApi();

        // Cascade: if deadline changed, update linked schedule item date
        if (updates.deadline !== undefined) {
          const task = get().tasks.find((t) => t.id === id);
          if (task && task.scheduleId && task.campaignId) {
            const campaign = get().campaigns.find((c) => c.id === task.campaignId);
            if (campaign && campaign.schedule) {
              const scheduleItem = campaign.schedule.find((s: any) => s.id === task.scheduleId);
              if (scheduleItem) {
                const newDate = updates.deadline
                  ? updates.deadline.toISOString().split('T')[0]
                  : scheduleItem.date;
                const updatedSchedule = campaign.schedule.map((s: any) =>
                  s.id === task.scheduleId ? { ...s, date: newDate } : s
                );
                // Update campaign with new schedule (without triggering cascade back)
                await get().updateCampaign(campaign.id, { schedule: updatedSchedule });
              }
            }
          }
        }
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
        if (updates.planDocument !== undefined) {
          payload.planDocument = updates.planDocument
            ? { ...updates.planDocument, uploadDate: updates.planDocument.uploadDate.toISOString() }
            : undefined;
        }
        delete (payload as any).tasks;

        console.log('Calling updateCampaignInApi with payload:', payload);
        await updateCampaignInApi(id, payload);
        console.log('API update complete, syncing campaigns...');
        await get().syncCampaignsFromApi();
        console.log('Sync complete');

        // Cascade: if schedule changed, update linked tasks' deadlines
        if (updates.schedule !== undefined) {
          const campaign = get().campaigns.find((c) => c.id === id);
          const oldSchedule = campaign?.schedule || [];
          const newSchedule = updates.schedule || [];

          // Find which schedule items changed dates
          for (const newItem of newSchedule) {
            const oldItem = oldSchedule.find((s: any) => s.id === (newItem as any).id);
            if (oldItem && oldItem.date !== (newItem as any).date) {
              // Schedule item date changed, find and update linked tasks
              const linkedTasks = get().tasks.filter(
                (t) => t.campaignId === id && t.scheduleId === (newItem as any).id
              );
              for (const task of linkedTasks) {
                const newDeadline = new Date((newItem as any).date);
                await get().updateTask(task.id, { deadline: newDeadline });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error updating campaign:', err);
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
        console.log('Syncing campaigns from API...');
        const rawCampaigns = await fetchCampaignsFromApi();
        console.log('Fetched campaigns, total:', rawCampaigns.length);
        const hydrated = rawCampaigns.map(hydrateCampaign);
        console.log('Hydrated campaigns, checking planDocuments...');
        hydrated.forEach(c => {
          if (c.planDocument) {
            console.log('Campaign', c.name, 'has planDocument:', c.planDocument.filename);
          }
        });
        set({ campaigns: hydrated });
        console.log('Campaign state updated');
      } catch (err) {
        console.error('Error syncing campaigns:', err);
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

    syncWave1Performance: async () => {
      set({ wave1Syncing: true });
      try {
        const response = await fetch('/api/analytics/wave1/performance');
        if (!response.ok) {
          console.error('Wave 1 performance sync failed:', response.status);
          return;
        }
        const data = await response.json();
        set({ wave1Performance: data, wave1Syncing: false });
      } catch (err) {
        console.error('Wave 1 performance sync error:', err);
        set({ wave1Syncing: false });
      }
    },

    syncWave1Calls: async () => {
      set({ wave1Syncing: true });
      try {
        const response = await fetch('/api/analytics/wave1/calls');
        if (!response.ok) {
          console.error('Wave 1 calls sync failed:', response.status);
          return;
        }
        const data = await response.json();
        // Merge call data with existing performance data
        set((state) => ({
          wave1Performance: state.wave1Performance ? { ...state.wave1Performance, infinity: data.metrics } : data,
          wave1Syncing: false,
        }));
      } catch (err) {
        console.error('Wave 1 calls sync error:', err);
        set({ wave1Syncing: false });
      }
    },

    syncFundingRecordsFromApi: async () => {
      try {
        const records = await fetchFundingRecordsFromApi();
        set({ fundingRecords: records as FundingRecord[] });
      } catch (err) {
        console.error('Funding records sync error:', err);
      }
    },

    addFundingRecord: async (record) => {
      try {
        await createFundingRecordInApi(record as Record<string, unknown>);
        await get().syncFundingRecordsFromApi();
      } catch (err) {
        alert(friendlyErrorMessage(err));
      }
    },

    updateFundingRecord: async (id: string, updates: Partial<FundingRecord>) => {
      try {
        const payload = { ...updates };
        delete (payload as any).id;
        delete (payload as any).balanceToClaim;
        delete (payload as any).percentOfTarget;
        delete (payload as any).createdAt;
        delete (payload as any).updatedAt;
        await updateFundingRecordInApi(id, payload as Record<string, unknown>);
        await get().syncFundingRecordsFromApi();
      } catch (err) {
        alert(friendlyErrorMessage(err));
      }
    },

    syncAuditLog: async () => {
      try {
        const entries = await fetchRecentAuditLog(10);
        set({ auditLog: entries });
      } catch (err) {
        console.error('Audit log sync error:', err);
      }
    },
  };

  // Initial sync is triggered by AuthContext once a session is confirmed
  // (on load and immediately after a successful login) rather than here,
  // since this store's module executes before the login gate resolves.
  return store;
});
