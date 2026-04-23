import { MEETING_SOCKET_EVENTS } from './meetingSocketEvents';

function parseIceServerUrls(value) {
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const turnIceServerUrls = parseIceServerUrls(import.meta.env.VITE_TURN_URLS);
const turnIceServer =
  turnIceServerUrls.length > 0
    ? {
        urls: turnIceServerUrls,
        ...(import.meta.env.VITE_TURN_USERNAME
          ? { username: import.meta.env.VITE_TURN_USERNAME }
          : {}),
        ...(import.meta.env.VITE_TURN_CREDENTIAL
          ? { credential: import.meta.env.VITE_TURN_CREDENTIAL }
          : {}),
      }
    : null;

const DEFAULT_RTC_CONFIGURATION = Object.freeze({
  iceServers: [
    ...(turnIceServer ? [turnIceServer] : []),
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
});
const peerStatsSnapshotStore = new WeakMap();

function toSerializableCandidate(candidate) {
  if (!candidate) {
    return null;
  }

  return typeof candidate.toJSON === 'function'
    ? candidate.toJSON()
    : {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      };
}

export function describeMediaTrack(track) {
  if (!track) {
    return null;
  }

  return {
    id: track.id,
    kind: track.kind,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
    label: track.label,
  };
}

export function describeMediaStream(stream) {
  if (!stream) {
    return {
      id: null,
      audioTrackCount: 0,
      videoTrackCount: 0,
      audioTracks: [],
      videoTracks: [],
    };
  }

  const audioTracks = stream.getAudioTracks().map(describeMediaTrack);
  const videoTracks = stream.getVideoTracks().map(describeMediaTrack);

  return {
    id: stream.id,
    audioTrackCount: audioTracks.length,
    videoTrackCount: videoTracks.length,
    audioTracks,
    videoTracks,
  };
}

export function logMediaStreamDetails(label, stream) {
  console.info(`[webrtc] ${label}`, describeMediaStream(stream));
}

async function logPeerStats(peerConnection, label) {
  if (typeof peerConnection.getStats !== 'function') {
    return;
  }

  try {
    const statsReport = await peerConnection.getStats();
    const summary = {
      inboundAudioPackets: 0,
      outboundAudioPackets: 0,
      inboundVideoPackets: 0,
      outboundVideoPackets: 0,
    };

    statsReport.forEach((stat) => {
      if (stat.type === 'inbound-rtp' && !stat.isRemote) {
        if (stat.kind === 'audio') {
          summary.inboundAudioPackets += stat.packetsReceived ?? 0;
        }

        if (stat.kind === 'video') {
          summary.inboundVideoPackets += stat.packetsReceived ?? 0;
        }
      }

      if (stat.type === 'outbound-rtp' && !stat.isRemote) {
        if (stat.kind === 'audio') {
          summary.outboundAudioPackets += stat.packetsSent ?? 0;
        }

        if (stat.kind === 'video') {
          summary.outboundVideoPackets += stat.packetsSent ?? 0;
        }
      }
    });

    console.info(`[webrtc] ${label} stats`, summary);
  } catch (error) {
    console.warn(`[webrtc] ${label} stats failed`, error);
  }
}

function roundMetric(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export function deriveConnectionQualityLabel({
  packetLossPct = null,
  jitterMs = null,
  roundTripTimeMs = null,
} = {}) {
  if (
    (typeof packetLossPct === 'number' && packetLossPct >= 8) ||
    (typeof jitterMs === 'number' && jitterMs >= 120) ||
    (typeof roundTripTimeMs === 'number' && roundTripTimeMs >= 450)
  ) {
    return 'poor';
  }

  if (
    (typeof packetLossPct === 'number' && packetLossPct >= 3) ||
    (typeof jitterMs === 'number' && jitterMs >= 45) ||
    (typeof roundTripTimeMs === 'number' && roundTripTimeMs >= 220)
  ) {
    return 'fair';
  }

  if (
    typeof packetLossPct === 'number' ||
    typeof jitterMs === 'number' ||
    typeof roundTripTimeMs === 'number'
  ) {
    return 'good';
  }

  return 'unknown';
}

export async function collectPeerConnectionStatsSummary(peerConnection) {
  if (!peerConnection || typeof peerConnection.getStats !== 'function') {
    return {
      packetLossPct: null,
      jitterMs: null,
      roundTripTimeMs: null,
      audioBitrateKbps: null,
      videoBitrateKbps: null,
      qualityLabel: 'unknown',
    };
  }

  const statsReport = await peerConnection.getStats();
  const previousSnapshot = peerStatsSnapshotStore.get(peerConnection) ?? new Map();
  const nextSnapshot = new Map();
  let packetsLost = 0;
  let packetsReceived = 0;
  let jitterSum = 0;
  let jitterCount = 0;
  let roundTripTimeMs = null;
  let audioBitrateKbps = 0;
  let videoBitrateKbps = 0;

  statsReport.forEach((stat) => {
    if (stat.type === 'candidate-pair' && stat.state === 'succeeded' && typeof stat.currentRoundTripTime === 'number') {
      roundTripTimeMs = roundMetric(stat.currentRoundTripTime * 1000);
    }

    if (stat.type === 'inbound-rtp' && !stat.isRemote) {
      packetsLost += stat.packetsLost ?? 0;
      packetsReceived += stat.packetsReceived ?? 0;

      if (typeof stat.jitter === 'number') {
        jitterSum += stat.jitter * 1000;
        jitterCount += 1;
      }
    }

    if (stat.type === 'outbound-rtp' && !stat.isRemote) {
      const snapshotKey = stat.id;
      const previousOutboundSnapshot = previousSnapshot.get(snapshotKey);
      const nextOutboundSnapshot = {
        bytesSent: stat.bytesSent ?? 0,
        timestamp: stat.timestamp ?? 0,
      };

      nextSnapshot.set(snapshotKey, nextOutboundSnapshot);

      if (
        previousOutboundSnapshot &&
        nextOutboundSnapshot.timestamp > previousOutboundSnapshot.timestamp &&
        nextOutboundSnapshot.bytesSent >= previousOutboundSnapshot.bytesSent
      ) {
        const bitsSent = (nextOutboundSnapshot.bytesSent - previousOutboundSnapshot.bytesSent) * 8;
        const elapsedSeconds = (nextOutboundSnapshot.timestamp - previousOutboundSnapshot.timestamp) / 1000;
        const bitrateKbps = elapsedSeconds > 0 ? bitsSent / elapsedSeconds / 1000 : 0;

        if (stat.kind === 'audio') {
          audioBitrateKbps += bitrateKbps;
        }

        if (stat.kind === 'video') {
          videoBitrateKbps += bitrateKbps;
        }
      }
    }
  });

  peerStatsSnapshotStore.set(peerConnection, nextSnapshot);

  const totalInboundPackets = packetsReceived + packetsLost;
  const packetLossPct =
    totalInboundPackets > 0 ? roundMetric((packetsLost / totalInboundPackets) * 100) : null;
  const jitterMs = jitterCount > 0 ? roundMetric(jitterSum / jitterCount) : null;
  const normalizedAudioBitrateKbps = audioBitrateKbps > 0 ? roundMetric(audioBitrateKbps) : null;
  const normalizedVideoBitrateKbps = videoBitrateKbps > 0 ? roundMetric(videoBitrateKbps) : null;

  return {
    packetLossPct,
    jitterMs,
    roundTripTimeMs,
    audioBitrateKbps: normalizedAudioBitrateKbps,
    videoBitrateKbps: normalizedVideoBitrateKbps,
    qualityLabel: deriveConnectionQualityLabel({
      packetLossPct,
      jitterMs,
      roundTripTimeMs,
    }),
  };
}

function addStreamTrackIfNeeded(stream, track) {
  if (!track) {
    return;
  }

  const alreadyAttached = stream.getTracks().some((existingTrack) => existingTrack.id === track.id);

  if (!alreadyAttached) {
    stream.addTrack(track);
  }
}

function addLocalTracks(peerConnection, localStream, label) {
  if (!localStream) {
    console.warn(`[webrtc] ${label} has no local stream to publish.`);
    return;
  }

  localStream.getTracks().forEach((track) => {
    const sender = peerConnection.addTrack(track, localStream);

    console.info(`[webrtc] ${label} addTrack`, {
      senderTrack: describeMediaTrack(sender.track),
      track: describeMediaTrack(track),
    });
  });

  console.info(`[webrtc] ${label} senders`, {
    senderTracks: peerConnection.getSenders().map((sender) => describeMediaTrack(sender.track)),
  });
}

export function getPeerConnectionSenderByKind(peerConnection, kind) {
  return (
    peerConnection
      ?.getSenders?.()
      .find((sender) => sender.track?.kind === kind) ?? null
  );
}

export async function replacePeerConnectionTrack(peerConnection, kind, nextTrack) {
  const sender = getPeerConnectionSenderByKind(peerConnection, kind);

  if (!sender) {
    return null;
  }

  await sender.replaceTrack(nextTrack ?? null);
  return sender;
}

function toSessionDescription(description) {
  return description instanceof RTCSessionDescription
    ? description
    : new RTCSessionDescription(description);
}

function toIceCandidate(candidate) {
  return candidate instanceof RTCIceCandidate ? candidate : new RTCIceCandidate(candidate);
}

export function createPeerLink({
  roomId,
  localUserId,
  remoteUserId,
  localStream,
  onSignal,
  onRemoteStream,
  onConnectionStateChange,
}) {
  const label = `${localUserId}->${remoteUserId}`;
  const peerConnection = new RTCPeerConnection(DEFAULT_RTC_CONFIGURATION);
  const remoteStream = new MediaStream();
  const pendingIceCandidates = [];

  addLocalTracks(peerConnection, localStream, label);

  peerConnection.addEventListener('connectionstatechange', () => {
    console.info(`[webrtc] ${label} connectionstatechange`, {
      connectionState: peerConnection.connectionState,
    });

    onConnectionStateChange?.(peerConnection.connectionState);

    if (peerConnection.connectionState === 'connected') {
      void logPeerStats(peerConnection, label);
    }
  });

  peerConnection.addEventListener('iceconnectionstatechange', () => {
    console.info(`[webrtc] ${label} iceconnectionstatechange`, {
      iceConnectionState: peerConnection.iceConnectionState,
    });
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.info(`[webrtc] ${label} signalingstatechange`, {
      signalingState: peerConnection.signalingState,
    });
  });

  peerConnection.addEventListener('icecandidate', (event) => {
    if (!event.candidate) {
      console.info(`[webrtc] ${label} icecandidate gathering complete`);
      return;
    }

    const serializedCandidate = toSerializableCandidate(event.candidate);

    console.info(`[webrtc] ${label} local ICE candidate`, serializedCandidate);

    onSignal?.(MEETING_SOCKET_EVENTS.CLIENT.ICE_CANDIDATE, {
      roomId,
      senderUserId: localUserId,
      targetUserId: remoteUserId,
      candidate: serializedCandidate,
    });
  });

  peerConnection.addEventListener('track', (event) => {
    console.info(`[webrtc] ${label} remote track received`, {
      track: describeMediaTrack(event.track),
      streamCount: event.streams?.length ?? 0,
    });

    if (event.streams?.[0]) {
      event.streams[0].getTracks().forEach((track) => addStreamTrackIfNeeded(remoteStream, track));
    } else {
      addStreamTrackIfNeeded(remoteStream, event.track);
    }

    logMediaStreamDetails(`${label} remote stream`, remoteStream);
    onRemoteStream?.(remoteStream);
  });

  async function flushPendingIceCandidates() {
    while (pendingIceCandidates.length > 0 && peerConnection.remoteDescription) {
      const nextCandidate = pendingIceCandidates.shift();
      await peerConnection.addIceCandidate(toIceCandidate(nextCandidate));
      console.info(`[webrtc] ${label} pending ICE candidate applied`, nextCandidate);
    }
  }

  async function createAndSendOffer() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.info(`[webrtc] ${label} offer created`, {
      type: offer.type,
      hasSdp: Boolean(offer.sdp),
    });

    onSignal?.(MEETING_SOCKET_EVENTS.CLIENT.OFFER, {
      roomId,
      senderUserId: localUserId,
      targetUserId: remoteUserId,
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    });
  }

  async function handleOffer(offer) {
    console.info(`[webrtc] ${label} offer received`, {
      type: offer?.type ?? null,
      hasSdp: Boolean(offer?.sdp),
    });

    await peerConnection.setRemoteDescription(toSessionDescription(offer));
    await flushPendingIceCandidates();

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.info(`[webrtc] ${label} answer created`, {
      type: answer.type,
      hasSdp: Boolean(answer.sdp),
    });

    onSignal?.(MEETING_SOCKET_EVENTS.CLIENT.ANSWER, {
      roomId,
      senderUserId: localUserId,
      targetUserId: remoteUserId,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    });
  }

  async function handleAnswer(answer) {
    console.info(`[webrtc] ${label} answer received`, {
      type: answer?.type ?? null,
      hasSdp: Boolean(answer?.sdp),
    });

    await peerConnection.setRemoteDescription(toSessionDescription(answer));
    await flushPendingIceCandidates();
  }

  async function handleIceCandidate(candidate) {
    if (!candidate) {
      return;
    }

    console.info(`[webrtc] ${label} remote ICE candidate received`, candidate);

    if (!peerConnection.remoteDescription) {
      pendingIceCandidates.push(candidate);
      console.info(`[webrtc] ${label} queued ICE candidate until remote description is set`);
      return;
    }

    await peerConnection.addIceCandidate(toIceCandidate(candidate));
  }

  function close() {
    console.info(`[webrtc] ${label} closing peer connection`);

    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) {
        console.info(`[webrtc] ${label} closing sender track`, describeMediaTrack(sender.track));
      }
    });

    peerConnection.close();
  }

  return {
    close,
    createAndSendOffer,
    handleAnswer,
    handleIceCandidate,
    handleOffer,
    peerConnection,
    remoteStream,
  };
}
