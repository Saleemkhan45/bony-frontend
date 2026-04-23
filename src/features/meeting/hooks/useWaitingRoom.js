import { useEffect, useMemo, useState } from 'react';
import useMeetingAuth from './useMeetingAuth';
import { getMeetingWaitingRoomState, leaveMeetingRoom } from '../services/roomApi';
import { getOrCreateMeetingProfile, normalizeRoomId } from '../utils/meetingRoom';

function useWaitingRoom(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const [profile] = useState(() => getOrCreateMeetingProfile());
  const meetingAuth = useMeetingAuth(profile);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [admissionStatus, setAdmissionStatus] = useState(null);
  const [waitingParticipants, setWaitingParticipants] = useState([]);
  const [currentRole, setCurrentRole] = useState('participant');

  useEffect(() => {
    if (meetingAuth.status !== 'ready') {
      return undefined;
    }

    let isMounted = true;

    async function loadWaitingState() {
      try {
        const payload = await getMeetingWaitingRoomState(normalizedRoomId);

        if (!isMounted) {
          return;
        }

        setRoom(payload.room ?? null);
        setParticipant(payload.participant ?? null);
        setAdmissionStatus(payload.admissionStatus ?? null);
        setWaitingParticipants(Array.isArray(payload.waitingParticipants) ? payload.waitingParticipants : []);
        setCurrentRole(payload.currentRole ?? 'participant');
        setError('');
        setStatus('ready');
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setStatus('error');
        setError(loadError.message ?? 'Unable to load the waiting room state.');
      }
    }

    void loadWaitingState();
    const intervalId = window.setInterval(() => {
      void loadWaitingState();
    }, 4000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [meetingAuth.status, normalizedRoomId]);

  async function leaveWaitingRoom() {
    await leaveMeetingRoom(normalizedRoomId);
  }

  return useMemo(
    () => ({
      admissionStatus,
      authError: meetingAuth.errorMessage,
      authStatus: meetingAuth.status,
      currentRole,
      error,
      leaveWaitingRoom,
      participant,
      room,
      roomId: normalizedRoomId,
      status,
      waitingParticipants,
    }),
    [
      admissionStatus,
      currentRole,
      error,
      meetingAuth.errorMessage,
      meetingAuth.status,
      normalizedRoomId,
      participant,
      room,
      status,
      waitingParticipants,
    ],
  );
}

export default useWaitingRoom;
