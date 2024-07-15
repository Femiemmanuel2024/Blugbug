// // src/event-bus.ts
import mitt from 'mitt';

type Events = {
  likeNotification: { userId: string; message: string };
};

export const eventBus = mitt<Events>();





