export enum BehaviorStatus {
  Success = 'success',
  Failure = 'failure',
  Running = 'running',
}

export interface BehaviorNode {
  execute(): BehaviorStatus;
}

export class ActionNode implements BehaviorNode {
  constructor(private action: () => BehaviorStatus) {}

  execute(): BehaviorStatus {
    return this.action();
  }
}

export class SequenceNode implements BehaviorNode {
  private currentIndex = 0;

  constructor(private children: BehaviorNode[]) {}

  execute(): BehaviorStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].execute();

      if (status === BehaviorStatus.Failure) {
        this.currentIndex = 0;
        return BehaviorStatus.Failure;
      }

      if (status === BehaviorStatus.Running) {
        return BehaviorStatus.Running;
      }

      this.currentIndex++;
    }

    this.currentIndex = 0;
    return BehaviorStatus.Success;
  }
}

export class SelectorNode implements BehaviorNode {
  private currentIndex = 0;

  constructor(private children: BehaviorNode[]) {}

  execute(): BehaviorStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].execute();

      if (status === BehaviorStatus.Success) {
        this.currentIndex = 0;
        return BehaviorStatus.Success;
      }

      if (status === BehaviorStatus.Running) {
        return BehaviorStatus.Running;
      }

      this.currentIndex++;
    }

    this.currentIndex = 0;
    return BehaviorStatus.Failure;
  }
}

export class BehaviorTree {
  constructor(private root: BehaviorNode) {}

  tick(): BehaviorStatus {
    return this.root.execute();
  }
}
