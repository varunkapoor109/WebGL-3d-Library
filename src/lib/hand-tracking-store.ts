export type Gesture = "open" | "fist" | "two" | "three" | "four" | "none";

export interface HandState {
  isTracking: boolean;
  fingerCount: number;
  smoothFingerCount: number;
  handX: number;
  handY: number;
  target3D: { x: number; y: number; z: number };
  gesture: Gesture;
}

export const handState: HandState = {
  isTracking: false,
  fingerCount: 0,
  smoothFingerCount: 0,
  handX: 0,
  handY: 0,
  target3D: { x: 0, y: 0, z: 0 },
  gesture: "none",
};

function classifyGesture(count: number): Gesture {
  if (count === 0) return "fist";
  if (count === 2) return "two";
  if (count === 3) return "three";
  if (count === 4) return "four";
  if (count >= 5) return "open";
  return "none";
}

export function updateHandState(
  fingerCount: number,
  normalizedX: number,
  normalizedY: number
) {
  handState.isTracking = true;
  handState.fingerCount = fingerCount;
  handState.smoothFingerCount +=
    (fingerCount - handState.smoothFingerCount) * 0.15;
  handState.handX = normalizedX;
  handState.handY = normalizedY;
  handState.target3D.x = normalizedX * 5;
  handState.target3D.y = -normalizedY * 4;
  handState.target3D.z = 0;
  handState.gesture = classifyGesture(fingerCount);
}

export function resetHandState() {
  handState.isTracking = false;
  handState.fingerCount = 0;
  handState.smoothFingerCount = 0;
  handState.handX = 0;
  handState.handY = 0;
  handState.target3D.x = 0;
  handState.target3D.y = 0;
  handState.target3D.z = 0;
  handState.gesture = "none";
}
