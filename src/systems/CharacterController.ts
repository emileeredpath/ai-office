import * as THREE from 'three';
import { CharacterAnimator, AnimationState } from './CharacterAnimator';
import { Navigation, Waypoint } from './Navigation';

export interface CharacterState {
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  currentWaypoint: string;
  path: Waypoint[];
  isMoving: boolean;
  animation: AnimationState;
}

export class CharacterController {
  private animator: CharacterAnimator;
  private navigation: Navigation;
  private state: CharacterState;
  private speed = 3;

  constructor(startingDeskId: string, navigation: Navigation) {
    this.animator = new CharacterAnimator();
    this.navigation = navigation;

    const startWaypoint = navigation.getWaypoint(startingDeskId);
    const pos = startWaypoint?.position || new THREE.Vector3(0, 0, 0);

    this.state = {
      position: pos.clone(),
      targetPosition: pos.clone(),
      currentWaypoint: startingDeskId,
      path: [],
      isMoving: false,
      animation: 'idle',
    };
  }

  moveTo(targetDeskId: string) {
    if (this.state.currentWaypoint === targetDeskId) return;

    const path = this.navigation.findPath(
      this.state.currentWaypoint,
      targetDeskId
    );
    if (path.length > 0) {
      this.state.path = path;
      this.state.isMoving = true;
      this.animator.setAnimation('walk', path.length * 2);
      this.updateTargetWaypoint();
    }
  }

  private updateTargetWaypoint() {
    if (this.state.path.length > 0) {
      const next = this.state.path.shift();
      if (next) {
        this.state.targetPosition = next.position.clone();
        this.state.currentWaypoint = next.id;
      }
    } else {
      this.state.isMoving = false;
      this.animator.setAnimation('idle');
    }
  }

  gesture(type: 'wave' | 'nod') {
    this.animator.setAnimation(type === 'wave' ? 'wave' : 'nod', 1);
  }

  celebrate() {
    this.animator.setAnimation('celebrate', 1.5);
  }

  update(deltaTime: number) {
    this.animator.update(deltaTime);

    if (this.state.isMoving) {
      const direction = this.state.targetPosition
        .clone()
        .sub(this.state.position);
      const distance = direction.length();

      if (distance < 0.2) {
        this.updateTargetWaypoint();
      } else {
        direction.normalize();
        this.state.position.addScaledVector(
          direction,
          this.speed * deltaTime
        );
      }
    }

    this.state.animation = this.animator.getCurrentState();
  }

  getState(): CharacterState {
    return { ...this.state };
  }

  getCurrentAnimation(): AnimationState {
    return this.animator.getCurrentState();
  }

  getAnimationProgress(): number {
    return this.animator.getProgress();
  }
}
