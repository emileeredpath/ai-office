import * as THREE from 'three';

export interface Waypoint {
  id: string;
  position: THREE.Vector3;
}

export class Navigation {
  private waypoints: Map<string, Waypoint> = new Map();
  private edges: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeWaypoints();
  }

  private initializeWaypoints() {
    const deskIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const positions: Record<string, [number, number, number]> = {
      '1': [-6, 0, -6],
      '2': [-2, 0, -6],
      '3': [2, 0, -6],
      '4': [6, 0, -6],
      '5': [-6, 0, 2],
      '6': [-2, 0, 2],
      '7': [2, 0, 2],
      '8': [6, 0, 2],
    };

    // Create waypoints at each desk
    deskIds.forEach((id) => {
      const pos = positions[id];
      this.waypoints.set(id, {
        id,
        position: new THREE.Vector3(pos[0], pos[1], pos[2]),
      });
    });

    // Add central gathering point
    this.waypoints.set('center', {
      id: 'center',
      position: new THREE.Vector3(0, 0, -2),
    });

    // Connect nearby desks
    this.edges.set('1', new Set(['2', '5', 'center']));
    this.edges.set('2', new Set(['1', '3', 'center']));
    this.edges.set('3', new Set(['2', '4', 'center']));
    this.edges.set('4', new Set(['3', '8', 'center']));
    this.edges.set('5', new Set(['1', '6', 'center']));
    this.edges.set('6', new Set(['5', '7', 'center']));
    this.edges.set('7', new Set(['6', '8', 'center']));
    this.edges.set('8', new Set(['4', '7', 'center']));
    this.edges.set('center', new Set(['1', '2', '3', '4', '5', '6', '7', '8']));
  }

  findPath(start: string, end: string): Waypoint[] {
    if (start === end) return [];

    const openSet = new Set([start]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    // Initialize scores
    this.waypoints.forEach((_, id) => {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    });

    gScore.set(start, 0);
    fScore.set(start, this.heuristic(start, end));

    while (openSet.size > 0) {
      let current = '';
      let lowestF = Infinity;

      openSet.forEach((id) => {
        const f = fScore.get(id) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      });

      if (current === end) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(current);
      const neighbors = this.edges.get(current) || new Set();

      neighbors.forEach((neighbor) => {
        const tentativeGScore = (gScore.get(current) || Infinity) + 1;
        const neighborG = gScore.get(neighbor) || Infinity;

        if (tentativeGScore < neighborG) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(
            neighbor,
            tentativeGScore + this.heuristic(neighbor, end)
          );
          openSet.add(neighbor);
        }
      });
    }

    return [];
  }

  private heuristic(a: string, b: string): number {
    const posA = this.waypoints.get(a)?.position;
    const posB = this.waypoints.get(b)?.position;

    if (!posA || !posB) return 0;
    return posA.distanceTo(posB);
  }

  private reconstructPath(
    cameFrom: Map<string, string>,
    current: string
  ): Waypoint[] {
    const path: Waypoint[] = [];
    let node: string | undefined = current;

    while (node) {
      const waypoint = this.waypoints.get(node);
      if (waypoint) path.unshift(waypoint);
      node = cameFrom.get(node);
    }

    return path;
  }

  getWaypoint(id: string): Waypoint | undefined {
    return this.waypoints.get(id);
  }
}
