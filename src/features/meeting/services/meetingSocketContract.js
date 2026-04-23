import { MEETING_SOCKET_EVENTS } from './meetingSocketEvents';

export const MEETING_SOCKET_PAYLOADS = Object.freeze({
  [MEETING_SOCKET_EVENTS.CLIENT.JOIN_ROOM]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
    userName: 'Alex Banks',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.OFFER]: {
    roomId: 'A1B2C3D4',
    senderUserId: 'user_01',
    targetUserId: 'user_02',
    offer: { type: 'offer', sdp: '...' },
  },
  [MEETING_SOCKET_EVENTS.CLIENT.ANSWER]: {
    roomId: 'A1B2C3D4',
    senderUserId: 'user_02',
    targetUserId: 'user_01',
    answer: { type: 'answer', sdp: '...' },
  },
  [MEETING_SOCKET_EVENTS.CLIENT.ICE_CANDIDATE]: {
    roomId: 'A1B2C3D4',
    senderUserId: 'user_02',
    targetUserId: 'user_01',
    candidate: { candidate: 'candidate:...', sdpMid: '0', sdpMLineIndex: 0 },
  },
  [MEETING_SOCKET_EVENTS.CLIENT.CHAT_MESSAGE]: {
    roomId: 'A1B2C3D4',
    message: {
      id: 'message_01',
      senderId: 'user_01',
      senderName: 'Alex Banks',
      text: 'Can everyone hear me?',
      type: 'user',
      createdAt: '2026-04-10T10:30:00.000Z',
    },
  },
  [MEETING_SOCKET_EVENTS.CLIENT.TOGGLE_AUDIO]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
    enabled: false,
  },
  [MEETING_SOCKET_EVENTS.CLIENT.TOGGLE_VIDEO]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
    enabled: true,
  },
  [MEETING_SOCKET_EVENTS.CLIENT.PARTICIPANT_MEDIA_UPDATED]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
    audioEnabled: false,
    videoEnabled: true,
  },
  [MEETING_SOCKET_EVENTS.CLIENT.RAISE_HAND]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.LOWER_HAND]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.START_SCREEN_SHARE]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.STOP_SCREEN_SHARE]: {
    roomId: 'A1B2C3D4',
    userId: 'user_01',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.SPOTLIGHT_USER]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.CLEAR_SPOTLIGHT]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.LOWER_HAND_FOR_USER]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.LOWER_ALL_HANDS]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.ADMIN_FORCE_MUTE]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.ADMIN_FORCE_CAMERA_OFF]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.ADMIN_MUTE_ALL]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.ADMIN_CAMERA_OFF_ALL]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
  },
  [MEETING_SOCKET_EVENTS.CLIENT.KICK_USER]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
    message: 'Host removed this participant from the room.',
  },
  [MEETING_SOCKET_EVENTS.SERVER.USER_JOINED]: {
    roomId: 'A1B2C3D4',
    hostUserId: 'user_host',
    participant: {
      userId: 'user_03',
      userName: 'Maya Patel',
      isHost: false,
      audioEnabled: true,
      videoEnabled: true,
      joinedAt: '2026-04-10T10:31:00.000Z',
    },
  },
  [MEETING_SOCKET_EVENTS.SERVER.PARTICIPANT_MEDIA_UPDATED]: {
    roomId: 'A1B2C3D4',
    hostUserId: 'user_host',
    userId: 'user_02',
    audioEnabled: false,
    videoEnabled: true,
    participant: {
      userId: 'user_02',
      audioEnabled: false,
      videoEnabled: true,
    },
  },
  [MEETING_SOCKET_EVENTS.SERVER.SCREEN_SHARE_UPDATED]: {
    roomId: 'A1B2C3D4',
    hostUserId: 'user_host',
    presenterUserId: 'user_02',
    participant: {
      userId: 'user_02',
      isPresenting: true,
    },
    room: {
      roomCode: 'A1B2C3D4',
      presenterUserId: 'user_02',
      spotlightUserId: null,
    },
  },
  [MEETING_SOCKET_EVENTS.SERVER.SPOTLIGHT_USER]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    spotlightUserId: 'user_02',
    room: {
      roomCode: 'A1B2C3D4',
      presenterUserId: 'user_02',
      spotlightUserId: 'user_02',
    },
  },
  [MEETING_SOCKET_EVENTS.SERVER.CLEAR_SPOTLIGHT]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    spotlightUserId: null,
    room: {
      roomCode: 'A1B2C3D4',
      presenterUserId: null,
      spotlightUserId: null,
    },
  },
  [MEETING_SOCKET_EVENTS.SERVER.LOWER_HAND_FOR_USER]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.SERVER.LOWER_ALL_HANDS]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserIds: ['user_01', 'user_02'],
  },
  [MEETING_SOCKET_EVENTS.SERVER.USER_LEFT]: {
    roomId: 'A1B2C3D4',
    participant: {
      userId: 'user_03',
      userName: 'Maya Patel',
    },
    participants: [],
  },
  [MEETING_SOCKET_EVENTS.SERVER.KICK_USER]: {
    roomId: 'A1B2C3D4',
    userId: 'user_02',
    actorUserId: 'user_host',
    message: 'The host removed you from the meeting.',
  },
  [MEETING_SOCKET_EVENTS.SERVER.ADMIN_FORCE_MUTE]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.SERVER.ADMIN_FORCE_CAMERA_OFF]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserId: 'user_02',
  },
  [MEETING_SOCKET_EVENTS.SERVER.ADMIN_MUTE_ALL]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserIds: ['user_01', 'user_02'],
  },
  [MEETING_SOCKET_EVENTS.SERVER.ADMIN_CAMERA_OFF_ALL]: {
    roomId: 'A1B2C3D4',
    actorUserId: 'user_host',
    targetUserIds: ['user_01', 'user_02'],
  },
});
