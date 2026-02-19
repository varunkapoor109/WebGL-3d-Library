"use client";

import { useEffect, useRef, useState } from "react";
import {
  updateHandState,
  resetHandState,
} from "@/lib/hand-tracking-store";

type Status = "loading" | "ready" | "denied" | "error";

// Landmark indices
const WRIST = 0;
const THUMB_TIP = 4;
const THUMB_IP = 3;
const INDEX_TIP = 8;
const INDEX_PIP = 6;
const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;
const RING_TIP = 16;
const RING_PIP = 14;
const PINKY_TIP = 20;
const PINKY_PIP = 18;

export default function HandTrackingOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectorRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Load MediaPipe
        const vision = await import("@mediapipe/tasks-vision");
        const { HandLandmarker, FilesetResolver } = vision;

        if (cancelled) return;

        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (cancelled) return;

        const handLandmarker = await HandLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
          }
        );

        if (cancelled) return;
        detectorRef.current = handLandmarker;

        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        if (cancelled) return;
        setStatus("ready");

        // Detection loop
        let lastTime = -1;
        function detect() {
          if (cancelled) return;
          rafRef.current = requestAnimationFrame(detect);

          const v = videoRef.current;
          if (!v || v.readyState < 2) return;

          const now = performance.now();
          if (now === lastTime) return;
          lastTime = now;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const hl = detectorRef.current as any;
          const result = hl.detectForVideo(v, now);

          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            const fingers = countFingers(lm);
            // Normalize hand position: MediaPipe gives 0-1, map to -1..1
            const wrist = lm[WRIST];
            const nx = (wrist.x - 0.5) * 2;
            const ny = (wrist.y - 0.5) * 2;
            updateHandState(fingers, nx, ny);
          } else {
            resetHandState();
          }
        }

        detect();
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : String(err);
        if (
          msg.includes("Permission") ||
          msg.includes("NotAllowed")
        ) {
          setStatus("denied");
        } else {
          setStatus("error");
          console.error("Hand tracking error:", err);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (detectorRef.current) {
        (detectorRef.current as { close?: () => void }).close?.();
        detectorRef.current = null;
      }

      resetHandState();
    };
  }, []);

  return (
    <>
      {/* Hidden video element for MediaPipe */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: "none" }}
      />

      {/* PiP webcam preview */}
      {status === "ready" && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 20,
            width: 200,
            height: 150,
            borderRadius: 12,
            overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.2)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          <video
            ref={(el) => {
              if (el && videoRef.current) {
                el.srcObject = videoRef.current.srcObject;
                el.play().catch(() => {});
              }
            }}
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
            }}
          />
        </div>
      )}

      {/* Status overlays */}
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 20,
            padding: "8px 16px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.7)",
            color: "#a78bfa",
            fontSize: 13,
          }}
        >
          Loading hand tracking...
        </div>
      )}

      {status === "denied" && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 20,
            padding: "8px 16px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.7)",
            color: "#f87171",
            fontSize: 13,
          }}
        >
          Camera access denied
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 16,
            zIndex: 20,
            padding: "8px 16px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.7)",
            color: "#fbbf24",
            fontSize: 13,
          }}
        >
          Hand tracking unavailable
        </div>
      )}
    </>
  );
}

interface Landmark {
  x: number;
  y: number;
  z: number;
}

function countFingers(landmarks: Landmark[]): number {
  let count = 0;

  // Thumb: check distance from tip to wrist vs IP to wrist
  const wrist = landmarks[WRIST];
  const thumbTip = landmarks[THUMB_TIP];
  const thumbIp = landmarks[THUMB_IP];
  const thumbTipDist = Math.hypot(
    thumbTip.x - wrist.x,
    thumbTip.y - wrist.y
  );
  const thumbIpDist = Math.hypot(
    thumbIp.x - wrist.x,
    thumbIp.y - wrist.y
  );
  if (thumbTipDist > thumbIpDist * 1.1) count++;

  // Other fingers: tip.y < PIP.y means extended (y increases downward)
  if (landmarks[INDEX_TIP].y < landmarks[INDEX_PIP].y) count++;
  if (landmarks[MIDDLE_TIP].y < landmarks[MIDDLE_PIP].y) count++;
  if (landmarks[RING_TIP].y < landmarks[RING_PIP].y) count++;
  if (landmarks[PINKY_TIP].y < landmarks[PINKY_PIP].y) count++;

  return count;
}
