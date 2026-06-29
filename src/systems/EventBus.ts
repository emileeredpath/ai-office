export type EventType =
  | 'taskCreated'
  | 'taskCompleted'
  | 'taskReassigned'
  | 'taskApproved'
  | 'briefingStarted'
  | 'briefingEnded';

export interface EventPayload {
  taskCreated: { employeeId: string; taskId: string };
  taskCompleted: { employeeId: string; taskId: string };
  taskReassigned: { taskId: string; fromId: string; toId: string };
  taskApproved: { employeeId: string; taskId: string; approverId: string };
  briefingStarted: Record<string, never>;
  briefingEnded: Record<string, never>;
}

type EventCallback<T extends EventType> = (payload: EventPayload[T]) => void;

interface EventListener<T extends EventType> {
  callback: EventCallback<T>;
  once: boolean;
}

export class EventBus {
  private listeners: Map<EventType, EventListener<any>[]> = new Map();

  on<T extends EventType>(
    event: T,
    callback: EventCallback<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = { callback, once: false };
    this.listeners.get(event)!.push(listener);

    return () => {
      const list = this.listeners.get(event);
      if (list) {
        const index = list.indexOf(listener);
        if (index > -1) list.splice(index, 1);
      }
    };
  }

  once<T extends EventType>(
    event: T,
    callback: EventCallback<T>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listener = { callback, once: true };
    this.listeners.get(event)!.push(listener);

    return () => {
      const list = this.listeners.get(event);
      if (list) {
        const index = list.indexOf(listener);
        if (index > -1) list.splice(index, 1);
      }
    };
  }

  emit<T extends EventType>(event: T, payload: EventPayload[T]) {
    const list = this.listeners.get(event);
    if (!list) return;

    const toRemove: EventListener<T>[] = [];

    list.forEach((listener) => {
      listener.callback(payload);
      if (listener.once) toRemove.push(listener);
    });

    toRemove.forEach((listener) => {
      const index = list.indexOf(listener);
      if (index > -1) list.splice(index, 1);
    });
  }

  off<T extends EventType>(event: T) {
    this.listeners.delete(event);
  }

  clear() {
    this.listeners.clear();
  }
}

export const globalEventBus = new EventBus();
