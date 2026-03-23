// src/hooks/useVoiceNotifications.js
/**
 * useVoiceNotifications
 *
 * Handles three voice notification scenarios:
 *
 * 1. speakReminder(reminder)
 *    — Called when a reminder fires (socket event or scheduler).
 *    — Claude generates a smart personalised message, then TTS speaks it.
 *
 * 2. speakSmartBriefing(digest)
 *    — Called when the StartupDigestPopup appears.
 *    — Reads the briefing aloud automatically on app open.
 *
 * 3. Background voice alert (option 4)
 *    — When app is closed, Browser Push Notification fires.
 *    — User taps it → app opens → speakReminder fires on arrival.
 *    — Handled via the `speakOnArrival` flag in NotificationContext socket handler.
 *
 * iOS note: auto-speak is blocked by iOS unless triggered by a direct user
 * gesture. On iOS, a "Tap to hear" button is shown instead.
 *
 * Usage:
 *   const { speakReminder, speakSmartBriefing, isSpeaking, stopSpeaking } = useVoiceNotifications();
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import AiService from '../services/AiService';

// ── Platform detection ────────────────────────────────────────
const detectIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// ── Strip markdown for clean speech ──────────────────────────
const cleanForSpeech = (text = '') =>
  text
    .replace(/[#*_`~]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/Actions completed:/g, 'Actions completed:')
    .trim();

// ── Pick best available English voice ────────────────────────
const pickVoice = (voices = []) =>
  voices.find(
    (v) =>
      v.name === 'Samantha' ||
      v.name === 'Karen' ||
      v.name === 'Moira' ||
      v.name.includes('Google US English') ||
      v.name.includes('Google') ||
      v.lang === 'en-US',
  ) || null;

const useVoiceNotifications = ({ rate = 1.0, pitch = 1.0, volume = 1.0 } = {}) => {
  const [isSpeaking, setIsSpeaking]       = useState(false);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [voices, setVoices]               = useState([]);
  const synthRef                          = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const onIOSRef                          = useRef(detectIOS());

  // Load voices — iOS loads async
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── Core TTS ─────────────────────────────────────────────────
  const speakText = useCallback((text, opts = {}) => {
    if (!synthRef.current || !text?.trim()) return;

    // iOS: block auto calls — only allow direct user gesture taps
    if (onIOSRef.current && opts.auto) return;

    synthRef.current.cancel();

    const utterance        = new SpeechSynthesisUtterance(cleanForSpeech(text));
    utterance.lang         = 'en-US';
    utterance.rate         = opts.rate   ?? (onIOSRef.current ? 0.95 : rate);
    utterance.pitch        = opts.pitch  ?? pitch;
    utterance.volume       = opts.volume ?? volume;

    const voiceList = voices.length > 0 ? voices : (window.speechSynthesis.getVoices() || []);
    const preferred = pickVoice(voiceList);
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') console.warn('TTS error:', e.error);
      setIsSpeaking(false);
    };

    // iOS: 100ms delay fixes silent playback bug
    if (onIOSRef.current) {
      setTimeout(() => synthRef.current?.speak(utterance), 100);
    } else {
      synthRef.current.speak(utterance);
    }
  }, [voices, rate, pitch, volume]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // ── 1. Speak a reminder when it fires ────────────────────────
  /**
   * @param {object} reminder  — reminder object from your scheduler/socket
   * @param {object} opts
   * @param {boolean} opts.auto — true = auto-speak (blocked on iOS)
   */
  const speakReminder = useCallback(async (reminder, opts = {}) => {
    if (!reminder?.title) return;

    // iOS: skip auto, show tap button instead (handled in UI)
    if (onIOSRef.current && opts.auto) return;

    setIsGenerating(true);
    try {
      // Ask Claude to generate a smart contextual reminder message
      const message = await AiService.generateSmartReminders(
        [],
        [{ title: reminder.title, priority: reminder.priority || 'medium', category: reminder.category || 'general' }],
        {},
      );

      // Pull the first reminder message Claude generated
      const firstReminder = message?.reminders?.[0];
      const voiceText = firstReminder?.message
        ? `${firstReminder.message}`
        : `Reminder: ${reminder.title}`;

      speakText(voiceText, { auto: opts.auto });
    } catch {
      // Fallback to plain title if Claude fails
      speakText(`Reminder: ${reminder.title}`, { auto: opts.auto });
    } finally {
      setIsGenerating(false);
    }
  }, [speakText]);

  // ── 2. Speak the smart briefing on app open ───────────────────
  /**
   * @param {object} digest — startupDigestSummary from Layout.jsx
   * @param {object} opts
   * @param {boolean} opts.auto — true = auto-speak (blocked on iOS)
   */
  const speakSmartBriefing = useCallback(async (digest, opts = {}) => {
    if (!digest) return;
    if (onIOSRef.current && opts.auto) return;

    const text = [
      digest.title ? `${digest.title}.` : '',
      digest.message ? digest.message : '',
      digest.urgentCount > 0
        ? `You have ${digest.urgentCount} urgent item${digest.urgentCount === 1 ? '' : 's'} due now.`
        : '',
      digest.topGoals?.length > 0
        ? `Top goals: ${digest.topGoals.map((g) => g.title).join(', ')}.`
        : '',
      digest.aiPrompt ? digest.aiPrompt : '',
    ]
      .filter(Boolean)
      .join(' ');

    speakText(text, { auto: opts.auto });
  }, [speakText]);

  // Cleanup
  useEffect(() => {
    return () => { synthRef.current?.cancel(); };
  }, []);

  return {
    isSpeaking,
    isGenerating,
    isIOS: onIOSRef.current,
    speakReminder,
    speakSmartBriefing,
    speakText,
    stopSpeaking,
  };
};

export default useVoiceNotifications;