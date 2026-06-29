export type AnimationState = 'idle' | 'walk' | 'wave' | 'nod' | 'celebrate';

export interface CharacterAnimation {
  state: AnimationState;
  duration: number;
  speed: number;
}

export class CharacterAnimator {
  private currentAnimation: CharacterAnimation = {
    state: 'idle',
    duration: 0,
    speed: 1,
  };

  private elapsedTime = 0;

  setAnimation(state: AnimationState, duration: number = 1) {
    this.currentAnimation = { state, duration, speed: 1 };
    this.elapsedTime = 0;
  }

  update(deltaTime: number) {
    this.elapsedTime += deltaTime;
    return this.currentAnimation;
  }

  isAnimationComplete(): boolean {
    return this.elapsedTime >= this.currentAnimation.duration;
  }

  getProgress(): number {
    return Math.min(this.elapsedTime / this.currentAnimation.duration, 1);
  }

  getCurrentState(): AnimationState {
    return this.currentAnimation.state;
  }
}
