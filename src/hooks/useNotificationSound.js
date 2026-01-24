import { useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Custom hook for playing notification sounds
 * Uses Web Audio API to generate pleasant tones (no copyright issues!)
 * Duration: 3-5 seconds for each notification type
 * Supports overriding silent/mute mode on native platforms via HTML5 Audio fallback
 */
export const useNotificationSound = () => {
  const audioContextRef = useRef(null);
  const isPlayingRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass({
        latencyHint: "playback",
      });
    }
    return audioContextRef.current;
  }, []);

  /**
   * Create a note with envelope for smooth sound
   */
  const createNote = useCallback(
    (audioContext, frequency, startTime, duration, volume, type = "sine") => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);

      // ADSR envelope
      const attackTime = 0.05;
      const decayTime = 0.1;
      const sustainLevel = volume * 0.7;
      const releaseTime = duration * 0.3;

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + attackTime);
      gainNode.gain.linearRampToValueAtTime(
        sustainLevel,
        startTime + attackTime + decayTime,
      );
      gainNode.gain.setValueAtTime(
        sustainLevel,
        startTime + duration - releaseTime,
      );
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.1);

      return { oscillator, gainNode };
    },
    [],
  );

  /**
   * Play a pleasant notification sound (3-5 seconds duration)
   * @param {string} type - Type of notification: 'focus', 'event', 'vault'
   */
  const playNotificationSound = useCallback(
    async (type = "focus") => {
      // Prevent overlapping sounds
      if (isPlayingRef.current) return false;
      isPlayingRef.current = true;

      try {
        const audioContext = getAudioContext();

        // Resume audio context if suspended
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        const currentTime = audioContext.currentTime;
        const baseVolume = 0.5; // Slightly louder to help with hearing

        // Extended sound profiles (3-5 seconds)
        const soundProfiles = {
          focus: {
            // Celebratory chime sequence (~4.5s)
            sequences: [
              // Intro
              { freq: 523.25, delay: 0, duration: 0.3 }, // C5
              { freq: 659.25, delay: 0.25, duration: 0.3 }, // E5
              { freq: 783.99, delay: 0.5, duration: 0.3 }, // G5
              { freq: 1046.5, delay: 0.75, duration: 0.6 }, // C6
              // Melody
              { freq: 659.25, delay: 1.5, duration: 0.25 }, // E5
              { freq: 783.99, delay: 1.75, duration: 0.25 }, // G5
              { freq: 1046.5, delay: 2.0, duration: 0.25 }, // C6
              { freq: 1318.51, delay: 2.25, duration: 0.8 }, // E6
              // Outro chord
              { freq: 523.25, delay: 3.2, duration: 1.2 }, // C5
              { freq: 783.99, delay: 3.2, duration: 1.2 }, // G5
              { freq: 1046.5, delay: 3.2, duration: 1.2 }, // C6
            ],
            type: "sine",
            volume: baseVolume,
            totalDuration: 4500,
          },
          event: {
            // Gentle repeating bell (~3.5s)
            sequences: [
              // First chime
              { freq: 440, delay: 0, duration: 0.4 }, // A4
              { freq: 554.37, delay: 0.3, duration: 0.4 }, // C#5
              { freq: 659.25, delay: 0.6, duration: 0.6 }, // E5
              // Echo
              { freq: 440, delay: 1.5, duration: 0.35 }, // A4
              { freq: 554.37, delay: 1.8, duration: 0.35 }, // C#5
              { freq: 659.25, delay: 2.1, duration: 0.5 }, // E5
              // Final
              { freq: 880, delay: 2.8, duration: 0.8 }, // A5
            ],
            type: "sine",
            volume: baseVolume * 0.9,
            totalDuration: 3600,
          },
          vault: {
            // Magical unlock sequence (~5s)
            sequences: [
              // Arpeggio up
              { freq: 392, delay: 0, duration: 0.4 }, // G4
              { freq: 493.88, delay: 0.3, duration: 0.4 }, // B4
              { freq: 587.33, delay: 0.6, duration: 0.5 }, // D5
              { freq: 783.99, delay: 1.0, duration: 0.6 }, // G5
              // Sparkles
              { freq: 1046.5, delay: 1.6, duration: 0.2 }, // C6
              { freq: 1174.66, delay: 1.8, duration: 0.2 }, // D6
              { freq: 1318.51, delay: 2.0, duration: 0.2 }, // E6
              { freq: 1567.98, delay: 2.2, duration: 0.4 }, // G6
              // Big Finish
              { freq: 783.99, delay: 2.8, duration: 1.5 }, // G5
              { freq: 987.77, delay: 2.8, duration: 1.5 }, // B5
              { freq: 1174.66, delay: 2.8, duration: 1.5 }, // D6
              { freq: 1567.98, delay: 3.5, duration: 1.5 }, // G6
            ],
            type: "sine",
            volume: baseVolume * 0.85,
            totalDuration: 5000,
          },
        };

        const profile = soundProfiles[type] || soundProfiles.focus;

        // Play sequences
        profile.sequences.forEach((note) => {
          createNote(
            audioContext,
            note.freq,
            currentTime + note.delay,
            note.duration,
            profile.volume,
            profile.type,
          );
        });

        // Add harmonics for rich sound (especially for vault/focus)
        if (type === "vault" || type === "focus") {
          profile.sequences.forEach((note) => {
            if (note.duration > 0.3) {
              // Only repeat longer notes as harmonics
              createNote(
                audioContext,
                note.freq * 2,
                currentTime + note.delay + 0.02,
                note.duration * 0.8,
                profile.volume * 0.15,
                "sine",
              );
            }
          });
        }

        // Cleanup flag
        setTimeout(() => {
          isPlayingRef.current = false;
        }, profile.totalDuration);

        return true;
      } catch (error) {
        console.error("Web Audio API error:", error);
        isPlayingRef.current = false;
        return false;
      }
    },
    [getAudioContext, createNote],
  );

  /**
   * Native Alert Sound Wrapper
   * Tries to use HTML5 Audio on native devices to help bypass silent mode matches
   */
  const playNativeAlertSound = useCallback(
    async (type = "focus") => {
      // 1. Always play the Web Audio version (closest to "no copyright" requirement)
      playNotificationSound(type);

      // 2. On native platforms, try to play a dummy audio tag to trigger
      // the system media channel, which might override silent switch if configured
      if (Capacitor.isNativePlatform()) {
        try {
          // Short beep data URI to wake up the audio session
          const beep =
            "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";
          const audio = new Audio(beep);
          audio.volume = 1.0;
          await audio.play();
        } catch (e) {
          // Ignore native playback errors
        }
      }

      return true;
    },
    [playNotificationSound],
  );

  const warmUp = useCallback(async () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") await ctx.resume();

      // Silent note to unlock audio engine on iOS
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Warmup failed", e);
    }
  }, [getAudioContext]);

  return {
    playNotificationSound: playNativeAlertSound, // Expose the wrapper
    warmUp,
  };
};

export default useNotificationSound;
