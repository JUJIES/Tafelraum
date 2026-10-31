import { readInteractiveHtmlTextPresence, type InteractiveHtmlTextPresence } from '../canvas/interactive-html-focus.ts';

/** Ephemeral Room presence, separate from material edits and the remote wire. */
export type RoomHtmlFocusMessage = {
  type: 'room-html-focus'; channel: string; generation: number; revision: number;
  instanceId: string | null; key: string | null; active: boolean; presence: InteractiveHtmlTextPresence | null;
};

export function readRoomHtmlFocusMessage(value: unknown): RoomHtmlFocusMessage | null {
  if (!value || typeof value !== 'object') return null;
  const message = value as RoomHtmlFocusMessage;
  const bounded = (text: unknown) => typeof text === 'string' && text.length > 0 && text.length <= 200;
  if (message.type !== 'room-html-focus' || !bounded(message.channel)
    || !Number.isSafeInteger(message.generation) || message.generation < 1
    || !Number.isSafeInteger(message.revision) || message.revision < 1 || typeof message.active !== 'boolean') return null;
  if (message.instanceId === null && message.key === null)
    return { type: message.type, channel: message.channel, generation: message.generation, revision: message.revision,
      instanceId: null, key: null, active: false, presence: null };
  if (!bounded(message.instanceId) || !bounded(message.key)) return null;
  const presence = readInteractiveHtmlTextPresence(message.presence);
  if (message.presence !== null && !presence) return null;
  return { type: message.type, channel: message.channel, generation: message.generation, revision: message.revision,
    instanceId: message.instanceId, key: message.key, active: message.active, presence };
}
