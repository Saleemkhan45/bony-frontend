const EDGE_BRAND_PATTERN = /\bedg(e|a|ios)?\b/i;
const RECOVERABLE_MEDIA_ERROR_NAMES = new Set([
  'AbortError',
  'ConstraintNotSatisfiedError',
  'DevicesNotFoundError',
  'NotFoundError',
  'NotReadableError',
  'OverconstrainedError',
  'SourceUnavailableError',
  'TrackStartError',
]);
const PERMISSION_MEDIA_ERROR_NAMES = new Set([
  'NotAllowedError',
  'PermissionDeniedError',
  'SecurityError',
]);

function readUserAgentBrands() {
  if (typeof navigator === 'undefined' || !Array.isArray(navigator.userAgentData?.brands)) {
    return [];
  }

  return navigator.userAgentData.brands
    .map((brandEntry) => String(brandEntry?.brand ?? '').trim())
    .filter(Boolean);
}

export function getBrowserMediaDiagnostics() {
  if (typeof navigator === 'undefined') {
    return {
      hasGetUserMedia: false,
      hasMediaDevices: false,
      isEdge: false,
      isSecureContext: false,
      userAgent: '',
      userAgentBrands: [],
    };
  }

  const userAgent = String(navigator.userAgent ?? '');
  const userAgentBrands = readUserAgentBrands();
  const hasGetUserMedia = Boolean(
    navigator.mediaDevices?.getUserMedia ||
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia,
  );
  const isEdge =
    EDGE_BRAND_PATTERN.test(userAgent) ||
    userAgentBrands.some((brand) => EDGE_BRAND_PATTERN.test(brand));

  return {
    hasGetUserMedia,
    hasMediaDevices: Boolean(navigator.mediaDevices),
    isEdge,
    isSecureContext: typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false,
    userAgent,
    userAgentBrands,
  };
}

export function isRecoverableMediaError(error) {
  const errorName = String(error?.name ?? '').trim();
  return RECOVERABLE_MEDIA_ERROR_NAMES.has(errorName);
}

export function isPermissionMediaError(error) {
  const errorName = String(error?.name ?? '').trim();
  return PERMISSION_MEDIA_ERROR_NAMES.has(errorName);
}

export function describeMediaError(error) {
  if (!error) {
    return {
      constraint: null,
      message: '',
      name: '',
    };
  }

  return {
    constraint: error.constraint ?? null,
    message: error.message ?? '',
    name: error.name ?? 'Error',
  };
}

export function summarizeTrackConstraint(trackConstraint) {
  if (trackConstraint === false) {
    return {
      enabled: false,
    };
  }

  if (trackConstraint === true) {
    return {
      enabled: true,
      mode: 'default',
    };
  }

  if (!trackConstraint || typeof trackConstraint !== 'object') {
    return {
      enabled: Boolean(trackConstraint),
    };
  }

  const hasDeviceId = Object.prototype.hasOwnProperty.call(trackConstraint, 'deviceId');
  const deviceIdConstraint = hasDeviceId ? trackConstraint.deviceId : null;
  const usesExactDeviceId =
    typeof deviceIdConstraint === 'object' &&
    deviceIdConstraint !== null &&
    Object.prototype.hasOwnProperty.call(deviceIdConstraint, 'exact');
  const usesIdealDeviceId =
    typeof deviceIdConstraint === 'object' &&
    deviceIdConstraint !== null &&
    Object.prototype.hasOwnProperty.call(deviceIdConstraint, 'ideal');

  return {
    enabled: true,
    hasAspectRatio: Object.prototype.hasOwnProperty.call(trackConstraint, 'aspectRatio'),
    hasFrameRate: Object.prototype.hasOwnProperty.call(trackConstraint, 'frameRate'),
    hasHeight: Object.prototype.hasOwnProperty.call(trackConstraint, 'height'),
    hasWidth: Object.prototype.hasOwnProperty.call(trackConstraint, 'width'),
    usesExactDeviceId,
    usesIdealDeviceId,
  };
}

export function summarizeMediaConstraints(constraints) {
  return {
    audio: summarizeTrackConstraint(constraints?.audio),
    video: summarizeTrackConstraint(constraints?.video),
  };
}

export function supportsGetUserMedia() {
  return getBrowserMediaDiagnostics().hasGetUserMedia;
}

export function requestUserMedia(constraints) {
  if (typeof navigator === 'undefined') {
    return Promise.reject(new Error('Camera and microphone APIs are unavailable in this browser.'));
  }

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyGetUserMedia =
    navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

  if (typeof legacyGetUserMedia === 'function') {
    return new Promise((resolve, reject) => {
      legacyGetUserMedia.call(navigator, constraints, resolve, reject);
    });
  }

  return Promise.reject(new Error('Camera and microphone APIs are unavailable in this browser.'));
}
