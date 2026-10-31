import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type { ExcalidrawFreeDrawElement, ExcalidrawLinearElement } from '@excalidraw/excalidraw/element/types';
import { markerGeometry, markerOpacity, markerRole } from '../canvas/marker-stroke.ts';
import { penEngineWidth, penGeometry, penRole } from '../canvas/pen-stroke.ts';
import type { ExternalInkCommit } from '../canvas/useInkInput.ts';

export type RoomInkCommand = ExternalInkCommit & {
  type: 'ink-commit'; channel: string; generation: number;
  target: { mode: 'free' | 'clip'; id: string | null };
  htmlScroll?:{materialId:string;offset:{x:number;y:number}};
};

export function validRoomInkCommand(value: unknown): value is RoomInkCommand {
  if (!value || typeof value !== 'object') return false;
  const command = value as Partial<RoomInkCommand>;
  return command.type === 'ink-commit'
    && typeof command.channel === 'string'
    && Number.isSafeInteger(command.generation) && command.generation! > 0
    && typeof command.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(command.id)
    && (command.kind === 'pen' || command.kind === 'marker')
    && typeof command.color === 'string' && /^#[0-9a-f]{6}$/i.test(command.color)
    && typeof command.width === 'number' && Number.isFinite(command.width) && command.width >= 0.5 && command.width <= 200
    && Array.isArray(command.points) && command.points.length > 0 && command.points.length <= 20_000
    && command.points.every(point => Array.isArray(point) && point.length === 2
      && point.every(coordinate => typeof coordinate === 'number' && Number.isFinite(coordinate) && Math.abs(coordinate) <= 1_000_000))
    && (command.htmlScroll===undefined||command.htmlScroll!==null&&typeof command.htmlScroll==='object'
      && typeof command.htmlScroll.materialId==='string'
      && /^[A-Za-z0-9_-]{1,128}$/.test(command.htmlScroll.materialId)
      && [command.htmlScroll.offset?.x,command.htmlScroll.offset?.y].every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1_000_000))
    && (command.target?.mode === 'free' && command.target.id === null
      || command.target?.mode === 'clip' && typeof command.target.id === 'string');
}

/** Rebuild from a bounded gesture. No public scene element or engine metadata is trusted. */
export function roomInkElement(command: RoomInkCommand): ExcalidrawFreeDrawElement | ExcalidrawLinearElement {
  const points = command.points;
  if (command.kind === 'pen') {
    return {
      ...convertToExcalidrawElements([{ type: 'rectangle', x: points[0][0], y: points[0][1],
        width: 0, height: 0, strokeColor: command.color, strokeWidth: penEngineWidth(command.width),
        backgroundColor: 'transparent', roughness: 0, roundness: null, opacity: 100,
        customData: { role: penRole, penGeometryVersion: 2 },
      }])[0],
      id: command.id, type: 'freedraw', ...penGeometry(points),
    } as ExcalidrawFreeDrawElement;
  }
  const geometry = markerGeometry(points, command.width);
  if (geometry.points.length > 20_000) throw new Error('Der Markerstrich ist zu lang.');
  return {
    ...convertToExcalidrawElements([{ type: 'line', ...geometry,
      backgroundColor: command.color, fillStyle: 'solid', strokeColor: 'transparent', strokeWidth: 0,
      roughness: 0, roundness: null, opacity: markerOpacity,
      startArrowhead: null, endArrowhead: null,
      customData: { role: markerRole, markerGeometryVersion: 4 },
    }])[0], id: command.id,
  } as ExcalidrawLinearElement;
}
