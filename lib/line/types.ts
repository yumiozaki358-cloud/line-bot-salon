export interface LineTextMessage {
  id: string;
  type: "text";
  text: string;
}

export interface LineMessageEvent {
  type: "message";
  replyToken: string;
  message: LineTextMessage | { id: string; type: string };
  source: { type: string; userId?: string };
  timestamp: number;
}

export type LineEvent = LineMessageEvent | { type: string };

export interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}
