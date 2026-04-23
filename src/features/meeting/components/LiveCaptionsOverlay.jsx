import { useEffect, useMemo, useState } from 'react';

const CAPTION_SEGMENT_LIMIT = 1;
const CAPTION_LINE_TTL_MS = 5000;
const CAPTION_FADE_IN_MS = 180;
const CAPTION_FADE_OUT_MS = 700;
const CAPTION_CLOCK_TICK_MS = 120;

function toCaptionIdentity(segment) {
  if (segment?.id) {
    return `id:${segment.id}`;
  }

  return `fallback:${segment?.speakerLabel ?? segment?.speakerUserName ?? 'Speaker'}:${segment?.startedAt ?? segment?.createdAt ?? ''}:${segment?.content ?? ''}`;
}

function parseTimestamp(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function LiveCaptionsOverlay({
  activeCaptionSegments = [],
  isVisible = false,
}) {
  const normalizedIncomingLines = useMemo(
    () =>
      (Array.isArray(activeCaptionSegments) ? activeCaptionSegments : [])
        .filter((segment) => typeof segment?.content === 'string' && segment.content.trim())
        .slice(-CAPTION_SEGMENT_LIMIT)
        .map((segment) => ({
          identity: toCaptionIdentity(segment),
          content: segment.content.trim(),
          startedAtMs: parseTimestamp(segment.startedAt ?? segment.createdAt),
        })),
    [activeCaptionSegments],
  );
  const hasActiveSegments = normalizedIncomingLines.length > 0;
  const [visibleLines, setVisibleLines] = useState([]);
  const [clockMs, setClockMs] = useState(Date.now());

  useEffect(() => {
    if (!isVisible) {
      setVisibleLines([]);
      return;
    }

    if (!hasActiveSegments) {
      return;
    }

    const nowMs = Date.now();

    setVisibleLines((currentLines) => {
      const lineByIdentity = new Map(
        currentLines.map((line) => [line.identity, line]),
      );

      normalizedIncomingLines.forEach((line) => {
        const existingLine = lineByIdentity.get(line.identity);
        const insertedAtMs =
          existingLine?.insertedAtMs ??
          (line.startedAtMs > 0 ? line.startedAtMs : nowMs);

        lineByIdentity.set(line.identity, {
          ...line,
          insertedAtMs,
          expiresAtMs: nowMs + CAPTION_LINE_TTL_MS,
        });
      });

      return Array.from(lineByIdentity.values())
        .sort((firstLine, secondLine) => firstLine.insertedAtMs - secondLine.insertedAtMs)
        .slice(-CAPTION_SEGMENT_LIMIT);
    });
  }, [hasActiveSegments, isVisible, normalizedIncomingLines]);

  useEffect(() => {
    if (!isVisible || visibleLines.length === 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const nextNow = Date.now();
      setClockMs(nextNow);
      setVisibleLines((currentLines) =>
        currentLines.filter((line) => line.expiresAtMs > nextNow),
      );
    }, CAPTION_CLOCK_TICK_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isVisible, visibleLines.length]);

  if (!isVisible || visibleLines.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 flex justify-center px-3 sm:bottom-24">
      <div className="flex w-full max-w-[min(88vw,560px)] flex-col items-center gap-1.5">
        {visibleLines.length > 0 ? visibleLines.map((line) => {
          const timeSinceInsertedMs = Math.max(0, clockMs - line.insertedAtMs);
          const remainingMs = Math.max(0, line.expiresAtMs - clockMs);
          const fadeInOpacity = Math.min(1, timeSinceInsertedMs / CAPTION_FADE_IN_MS);
          const fadeOutOpacity =
            remainingMs >= CAPTION_FADE_OUT_MS
              ? 1
              : Math.max(0, remainingMs / CAPTION_FADE_OUT_MS);
          const lineOpacity = Math.min(fadeInOpacity, fadeOutOpacity);
          const translateYOffset = (1 - fadeInOpacity) * 4;

          return (
            <p
              key={line.identity}
              className="max-w-[84vw] rounded-xl bg-black/72 px-3 py-1.5 text-center text-[10px] font-medium leading-4 text-white shadow-[0_12px_26px_rgba(0,0,0,0.32)] whitespace-normal break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:max-w-[min(76vw,560px)] sm:rounded-2xl sm:px-4 sm:py-2 sm:text-[13px] sm:leading-5"
              style={{
                opacity: lineOpacity,
                transform: `translateY(${translateYOffset}px)`,
                transition: 'opacity 120ms linear, transform 120ms linear',
              }}
            >
              {line.content}
            </p>
          );
        }) : (
          <p className="rounded-xl bg-black/65 px-2.5 py-1 text-[10px] font-medium text-white/90 sm:text-[11px]">
            Captions are on. Waiting for speech.
          </p>
        )}
      </div>
    </div>
  );
}

export default LiveCaptionsOverlay;
