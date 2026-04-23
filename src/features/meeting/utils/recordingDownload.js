const SAFE_DOWNLOAD_PROTOCOLS = new Set(['http:', 'https:', 'blob:', 'data:']);
const SAFE_NEW_TAB_PROTOCOLS = new Set(['http:', 'https:']);

function resolveRecordingUrl(downloadUrl) {
  const normalizedUrl = String(downloadUrl ?? '').trim();

  if (!normalizedUrl) {
    return null;
  }

  try {
    if (typeof window !== 'undefined' && window.location?.href) {
      return new URL(normalizedUrl, window.location.href);
    }

    return new URL(normalizedUrl);
  } catch {
    return null;
  }
}

function toSafeFileName(fileName) {
  const normalizedFileName = String(fileName ?? '').trim();

  if (!normalizedFileName) {
    return 'meeting-recording.webm';
  }

  return normalizedFileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');
}

export function isRecordingDownloadUrlSupported(downloadUrl) {
  const resolvedUrl = resolveRecordingUrl(downloadUrl);

  if (!resolvedUrl) {
    return false;
  }

  return SAFE_DOWNLOAD_PROTOCOLS.has(resolvedUrl.protocol);
}

export function canOpenRecordingInNewTab(downloadUrl) {
  const resolvedUrl = resolveRecordingUrl(downloadUrl);

  if (!resolvedUrl) {
    return false;
  }

  return SAFE_NEW_TAB_PROTOCOLS.has(resolvedUrl.protocol);
}

export function triggerRecordingDownload(downloadUrl, fileName) {
  if (typeof document === 'undefined') {
    return false;
  }

  const resolvedUrl = resolveRecordingUrl(downloadUrl);

  if (!resolvedUrl || !SAFE_DOWNLOAD_PROTOCOLS.has(resolvedUrl.protocol)) {
    return false;
  }

  const anchor = document.createElement('a');

  anchor.href = resolvedUrl.toString();
  anchor.download = toSafeFileName(fileName);
  anchor.rel = 'noopener noreferrer';

  if (SAFE_NEW_TAB_PROTOCOLS.has(resolvedUrl.protocol)) {
    anchor.target = '_blank';
  }

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  return true;
}

export function openRecordingInNewTab(downloadUrl) {
  if (typeof window === 'undefined') {
    return false;
  }

  const resolvedUrl = resolveRecordingUrl(downloadUrl);

  if (!resolvedUrl || !SAFE_NEW_TAB_PROTOCOLS.has(resolvedUrl.protocol)) {
    return false;
  }

  window.open(resolvedUrl.toString(), '_blank', 'noopener,noreferrer');
  return true;
}
