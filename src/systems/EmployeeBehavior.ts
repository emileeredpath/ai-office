import { CharacterController } from './CharacterController';
import { Navigation } from './Navigation';
import { BehaviorTree, ActionNode, SelectorNode } from './BehaviorTree';
import { EventBus } from './EventBus';
import { BehaviorStatus } from './BehaviorTree';

export class EmployeeBehavior {
  private controller: CharacterController;
  private behaviorTree!: BehaviorTree;
  private currentTask: string | null = null;
  private targetEmployee: string | null = null;
  private eventBus: EventBus;

  constructor(
    private employeeId: string,
    startingDeskId: string,
    navigation: Navigation,
    eventBus: EventBus
  ) {
    this.controller = new CharacterController(startingDeskId, navigation);
    this.eventBus = eventBus;

    this.buildBehaviorTree();
    this.setupEventListeners();
  }

  private buildBehaviorTree() {
    const workAtDesk = new ActionNode(() => {
      if (this.currentTask) {
        this.controller.gesture('nod');
        return BehaviorStatus.Running;
      }
      return BehaviorStatus.Success;
    });

    const moveToTask = new ActionNode(() => {
      if (this.targetEmployee) {
        this.controller.moveTo(this.targetEmployee);
        return BehaviorStatus.Running;
      }
      return BehaviorStatus.Success;
    });

    const idle = new ActionNode(() => {
      return BehaviorStatus.Running;
    });

    this.behaviorTree = new BehaviorTree(
      new SelectorNode([workAtDesk, moveToTask, idle])
    );
  }

  private setupEventListeners() {
    this.eventBus.on('taskCreated', (payload) => {
      if (payload.employeeId === this.employeeId) {
        this.currentTask = payload.taskId;
      }
    });

    this.eventBus.on('taskCompleted', (payload) => {
      if (payload.employeeId === this.employeeId) {
        this.currentTask = null;
        this.controller.celebrate();
      }
    });

    this.eventBus.on('taskReassigned', (payload) => {
      if (payload.fromId === this.employeeId) {
        this.currentTask = null;
      } else if (payload.toId === this.employeeId) {
        this.currentTask = payload.taskId;
      }
    });

    this.eventBus.on('briefingStarted', () => {
      this.targetEmployee = 'center';
      this.controller.moveTo('center');
    });

    this.eventBus.on('briefingEnded', () => {
      this.targetEmployee = this.employeeId;
      this.controller.moveTo(this.employeeId);
    });
  }

  update(deltaTime: number) {
    this.controller.update(deltaTime);
    this.behaviorTree.tick();
  }

  getController(): CharacterController {
    return this.controller;
  }

  respondToEmployee(employeeId: string) {
    this.targetEmployee = employeeId;
    this.controller.moveTo(employeeId);
    setTimeout(() => {
      this.controller.gesture('wave');
    }, 500);
  }
}
