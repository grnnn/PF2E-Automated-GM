import "../types/types/foundry/client/data/documents";

import { ScenePF2e, TokenDocumentPF2e, TileDocumentPF2e } from "@module/scene";
import { IPointData } from "pixi.js";

namespace Pathfinder {
    interface Node {
        pos: IPointData;
        fScore: number;     // gScore + heuristic
        gScore: number;     // distance
        heuristic: number;
        parent: Node | null;
        diagonals: number;  // number of diagonal moves
    }

    export async function findPath( scene: ScenePF2e, start: IPointData, end: IPointData, maxDistance : number ) : Promise<IPointData[]> {
        const feetPerTile = 5; // todo get from scene
        const pixelsPerTile = scene.getDimensions().size;
        
        const walls = scene.walls;
        const grid = scene.tiles;

        const openSet: Node[] = [];
        const closedSet: Set<string> = new Set();
        const startNode = { 
            pos: {x: start.x, y: start.y},
            fScore: 0, 
            gScore: 0, 
            heuristic: heuristic(start, end), 
            parent: null,
            diagonals: 0 
        };
        openSet.push(startNode);

        return new Promise<IPointData[]>((resolve, reject) => {
            function step() {
                if (openSet.length === 0) {
                    reject("No path found");
                    return;
                }

                openSet.sort((a, b) => a.fScore - b.fScore);
                const current = openSet.shift()!;
                if (!current) {
                    reject("No path found");
                    return;
                }

                if (current.pos.x === end.x && current.pos.y === end.y) {
                    resolve(reconstructPath(current));
                    return;
                }

                if (current.gScore * feetPerTile >= maxDistance) {
                    openSet.push(current);
                    openSet.sort((a, b) => a!.heuristic - b!.heuristic); // grab path with lowest heuristic
                    resolve(reconstructPath(openSet.shift()!));
                    return;
                }

                closedSet.add(`${current.pos.x},${current.pos.y}`);

                for (const neighbor of getNeighbors(current, pixelsPerTile, walls)) {
                    if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
                        continue;
                    }

                    const tentativeG = current.gScore + 1 + ((neighbor?.isDiagonal && current?.diagonals % 2 == 1) ? 1 : 0);
                    const existingNode = openSet.find(node => node.pos.x === neighbor.x && node.pos.y === neighbor.y);

                    if (!existingNode || tentativeG < existingNode.gScore) {
                        const h = heuristic(neighbor, end);
                        const f = tentativeG + h;
                        const nextNode = { 
                            pos: {x: neighbor.x, y: neighbor.y},
                            gScore: tentativeG, 
                            fScore: f, 
                            heuristic: h, 
                            parent: current, 
                            diagonals: current.diagonals + (neighbor.isDiagonal ? 1 : 0) 
                        };

                        if (!existingNode) {
                            openSet.push(nextNode);
                        } else {
                            existingNode.fScore = f;
                            existingNode.gScore = tentativeG;
                            existingNode.heuristic = h;
                            existingNode.parent = current;
                            existingNode.diagonals = current.diagonals + (neighbor.isDiagonal ? 1 : 0);
                        }
                    }
                }

                // yield to event loop
                setTimeout(step, 0)
            }

            step(); // start A*
        });
    }

    interface PathPoint extends IPointData {    
        isDiagonal?: boolean;
    }

    function getNeighbors(node: Node, pixelsPerTile: number, walls: foundry.abstract.EmbeddedCollection<WallDocument<Scene>>) : PathPoint[] {
        const neighbors: PathPoint[] = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x === 0 && y === 0) {
                    continue;
                }

                const isDiagonal = x !== 0 && y !== 0;
                const neighbor = { x: node.pos.x + x, y: node.pos.y + y, isDiagonal };
                if (isWallBlocking(node, neighbor, pixelsPerTile, walls)) {
                    continue;
                }

                neighbors.push(neighbor);
            }
        }
        return neighbors;
    }

    function isWallBlocking(node: Node, neighbor: PathPoint, pixelsPerTile: number, walls: foundry.abstract.EmbeddedCollection<WallDocument<Scene>>) : boolean {
        for (const wall of walls) {
            if (wall.move === 0) continue;

            const trueX = (node.pos.x * pixelsPerTile) + (pixelsPerTile / 2);
            const trueY = (node.pos.y * pixelsPerTile) + (pixelsPerTile / 2);
            const trueNeighborX = (neighbor.x * pixelsPerTile) + (pixelsPerTile / 2);
            const trueNeighborY = (neighbor.y * pixelsPerTile) + (pixelsPerTile / 2);
            return wall.object!.canRayIntersect(Ray.fromArrays([trueX, trueY], [trueNeighborX, trueNeighborY]));
        }

        return false;
    }

    function reconstructPath(current: Node) : IPointData[] {
        let path: IPointData[] = [];
        let node: Node | null = current;
        while (node) {
            path.push({ x: node.pos.x, y: node.pos.y });
            node = node.parent;
        }
        return path.reverse();
    }

    function heuristic(start: IPointData, end: IPointData) : number {
        return Math.abs(start.x - end.x) + Math.abs(start.y - end.y); // manhattan distance
    }
}
