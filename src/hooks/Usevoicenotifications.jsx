// src/hooks/useVoiceNotifications.js
/**
 * useVoiceNotifications
 *
 * Handles three voice notification scenarios:
 *
 * 1. speakReminder(reminder)
 *    - Called when a reminder fires (socket event or scheduler).
 *    - Claude generates a smart personalised message, then TTS speaks it.
 *
 * 2. speakSmartBriefing(digest)
 *    - Called when the StartupDigestPopup appears.
 *    - Reads the briefing aloud automatically on app open.
 *
 * 3. Background voice alert (option 4)
 *    - When app is closed, Browser Push Notification fires.
 *    - User taps it -> app opens -> speakReminder fires on arrival.
 *    - Handled via the `speakOnArrival` flag in NotificationContext socket handler.
 *
 * iOS note: auto-speak is blocked by iOS unless triggered by a direct user
 * gesture. On iOS, a "Tap to hear" button is shown instead.
 *
 * Usage:
 *   const { speakReminder, speakSmartBriefing, isSpeaking, stopSpeaking } = useVoiceNotifications();
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import AiService from '../services/AiService';

const VOICE_SETTINGS_STORAGE_KEY = 'noxa_voice_notification_voice';

const detectIOS = () => {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const vendor = navigator.vendor || '';
  const touchPoints = navigator.maxTouchPoints || 0;

  const isClassicIOS = /\b(iPad|iPhone|iPod)\b/i.test(userAgent);
  const isIPadDesktopMode =
    /\bMacintosh\b/i.test(userAgent) &&
    /\bAppleWebKit\b/i.test(userAgent) &&
    /Apple/i.test(vendor) &&
    touchPoints > 1;

  return isClassicIOS || isIPadDesktopMode;
};

const cleanForSpeech = (text = '') =>
  text
    .replace(/[#*_`~]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/Actions completed:/g, 'Actions completed:')
    .trim();

const pickVoice = (voiceList = [], selectedVoiceName = '') =>
  voiceList.find((voice) => voice.name === selectedVoiceName) ||
  voiceList.find(
    (voice) =>
      voice.name === 'Samantha' ||
      voice.name === 'Karen' ||
      voice.name === 'Moira' ||
      voice.name.includes('Google US English') ||
      voice.name.includes('Google') ||
      voice.lang === 'en-US',
  ) ||
  null;

const readStoredVoiceName = () => {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const createSpeechQueueItem = (text, opts = {}) => ({
  text,
  opts,
});

const useVoiceNotifications = ({ rate = 1.0, pitch = 1.0, volume = 1.0 } = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState([]);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const [isIOS] = useState(() => detectIOS());
  const [selectedVoiceName, setSelectedVoiceNameState] = useState(() => readStoredVoiceName());
  const isSpeakingRef = useRef(false);
  const queuedSpeechRef = useRef([]);
  const supportsSpeech = Boolean(synthRef.current);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();

    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }

    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (window.speechSynthesis.onvoiceschanged === loadVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const setSelectedVoiceName = useCallback((voiceName) => {
    const nextVoiceName = typeof voiceName === 'string' ? voiceName : '';
    setSelectedVoiceNameState(nextVoiceName);

    if (typeof window === 'undefined') return;

    try {
      if (nextVoiceName) {
        window.localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, nextVoiceName);
      } else {
        window.localStorage.removeItem(VOICE_SETTINGS_STORAGE_KEY);
      }
    } catch {
      // Keep the in-memory selection even if persistence fails.
    }
  }, []);

  const flushQueuedSpeech = useCallback(() => {
    const synth = synthRef.current;
    if (!synth || isSpeakingRef.current) return;

    const nextQueuedSpeech = queuedSpeechRef.current.shift();
    if (!nextQueuedSpeech?.text?.trim()) return;

    window.setTimeout(() => {
      if (!isSpeakingRef.current) {
        const { text, opts } = nextQueuedSpeech;
        const voiceList =
          voices.length > 0 ? voices : window.speechSynthesis?.getVoices?.() || [];
        const preferredVoice = pickVoice(voiceList, selectedVoiceName);
        const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
        utterance.lang = 'en-US';
        utterance.rate = opts.rate ?? (isIOS ? 0.95 : rate);
        utterance.pitch = opts.pitch ?? pitch;
        utterance.volume = opts.volume ?? volume;

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
        };
        utterance.onend = () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          flushQueuedSpeech();
        };
        utterance.onerror = (event) => {
          if (event.error !== 'interrupted') {
            console.warn('TTS error:', event.error);
          }
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          flushQueuedSpeech();
        };

        if (isIOS) {
          window.setTimeout(() => synthRef.current?.speak(utterance), 100);
        } else {
          synthRef.current?.speak(utterance);
        }
      }
    }, 0);
  }, [isIOS, pitch, rate, selectedVoiceName, voices, volume]);

  const speakText = useCallback(
    (text, opts = {}) => {
      if (!synthRef.current || !text?.trim()) return;

      if (isIOS && opts.auto) return;

      const shouldQueue = opts.interrupt === false && (isSpeakingRef.current || synthRef.current.speaking);
      if (shouldQueue) {
        queuedSpeechRef.current.push(createSpeechQueueItem(text, opts));
        return;
      }

      queuedSpeechRef.current = [];
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
      utterance.lang = 'en-US';
      utterance.rate = opts.rate ?? (isIOS ? 0.95 : rate);
      utterance.pitch = opts.pitch ?? pitch;
      utterance.volume = opts.volume ?? volume;

      const voiceList =
        voices.length > 0 ? voices : window.speechSynthesis?.getVoices?.() || [];
      const preferredVoice = pickVoice(voiceList, selectedVoiceName);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        flushQueuedSpeech();
      };
      utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
          console.warn('TTS error:', event.error);
        }
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        flushQueuedSpeech();
      };

      if (isIOS) {
        window.setTimeout(() => synthRef.current?.speak(utterance), 100);
      } else {
        synthRef.current.speak(utterance);
      }
    },
    [flushQueuedSpeech, isIOS, pitch, rate, selectedVoiceName, voices, volume],
  );

  const stopSpeaking = useCallback(() => {
    queuedSpeechRef.current = [];
    isSpeakingRef.current = false;
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const speakReminder = useCallback(
    async (reminder, opts = {}) => {
      if (!reminder?.title) return;
      if (isIOS && opts.auto) return;

      setIsGenerating(true);
      try {
        const message = await AiService.generateSmartReminders(
          [],
          [
            {
              title: reminder.title,
              priority: reminder.priority || 'medium',
              category: reminder.category || 'general',
            },
          ],
          {},
        );

        const firstReminder = message?.reminders?.[0];
        const voiceText = firstReminder?.message
          ? `${firstReminder.message}`
          : `Reminder: ${reminder.title}`;

        speakText(voiceText, { auto: opts.auto, interrupt: false });
      } catch {
        speakText(`Reminder: ${reminder.title}`, { auto: opts.auto, interrupt: false });
      } finally {
        setIsGenerating(false);
      }
    },
    [isIOS, speakText],
  );

  const speakSmartBriefing = useCallback(
    async (digest, opts = {}) => {
      if (!digest) return;
      if (isIOS && opts.auto) return;

      const text = [
        digest.title ? `${digest.title}.` : '',
        digest.message ? digest.message : '',
        digest.urgentCount > 0
          ? `You have ${digest.urgentCount} urgent item${digest.urgentCount === 1 ? '' : 's'} due now.`
          : '',
        digest.topGoals?.length > 0
          ? `Top goals: ${digest.topGoals.map((goal) => goal.title).join(', ')}.`
          : '',
        digest.aiPrompt ? digest.aiPrompt : '',
      ]
        .filter(Boolean)
        .join(' ');

      speakText(text, { auto: opts.auto });
    },
    [isIOS, speakText],
  );

  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      queuedSpeechRef.current = [];
      isSpeakingRef.current = false;
      synth?.cancel();
    };
  }, []);

  return {
    isSpeaking,
    isGenerating,
    isIOS,
    supportsSpeech,
    voices,
    selectedVoiceName,
    setSelectedVoiceName,
    speakReminder,
    speakSmartBriefing,
    speakText,
    stopSpeaking,
  };
};

export default useVoiceNotifications;
