// src/hooks/useVoiceChat.js
/**
 * useVoiceChat — Browser Web Speech API Edition (iOS-fixed)
 *
 * STT: Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * TTS: Web Speech Synthesis API
 *
 * iOS Safari fixes:
 *  - continuous mode disabled
 *  - interimResults disabled on iOS
 *  - auto-speak blocked on iOS (requires direct user gesture)
 *  - voices loaded via onvoiceschanged (iOS loads async)
 *  - 100ms speak() timeout fixes silent playback bug on iOS
 *  - clean stop on silence — no restart attempts
 *
 * NOTE: When upgrading to Whisper, swap this file only.
 *       AIAssistantChat interface stays identical.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

// ── Platform detection ────────────────────────────────────────
const detectIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

const useVoiceChat = ({ onTranscript, onError } = {}) => {
  const [isListening, setIsListening]             = useState(false);
  const [isSpeaking, setIsSpeaking]               = useState(false);
  const [isSupported, setIsSupported]             = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voices, setVoices]                       = useState([]);

  const recognitionRef = useRef(null);
  const synthRef       = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const onIOSRef       = useRef(detectIOS());

  // ── Support check + voice loading ────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = !!SpeechRecognition && !!window.speechSynthesis;
    setIsSupported(supported);

    if (!supported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices; // required for iOS/Safari

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Speech-to-Text ───────────────────────────────────────────
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.('Speech recognition not supported. Try Chrome or Safari.');
      return;
    }

    synthRef.current?.cancel();
    setIsSpeaking(false);

    const recognition = new SpeechRecognition();
    recognition.lang            = 'en-US';
    recognition.continuous      = false; // iOS fix: continuous not supported
    recognition.interimResults  = !onIOSRef.current; // iOS fix: crashes on iOS
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final   = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (!onIOSRef.current && interim) setInterimTranscript(interim);

      if (final) {
        setInterimTranscript('');
        onTranscript?.(final.trim());
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript('');

      const msgs = {
        'no-speech':     onIOSRef.current
          ? 'Nothing heard. Tap mic and speak clearly.'
          : 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not found.',
        'not-allowed':   onIOSRef.current
          ? 'Mic denied. Go to Settings → Safari → Microphone and allow.'
          : 'Microphone access denied.',
        'network':       'Network error during speech recognition.',
        'aborted':       '',
      };

      const msg = msgs[event.error];
      if (msg) onError?.(msg);
    };

    recognition.onend = () => {
      // iOS fix: stop cleanly — never attempt to restart
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // ── Text-to-Speech ───────────────────────────────────────────
  /**
   * @param {string} text
   * @param {object} options
   * @param {boolean} options.auto  — true = auto-speak call (blocked on iOS)
   * @param {number}  options.rate
   * @param {number}  options.pitch
   * @param {number}  options.volume
   * @param {string}  options.voiceName
   */
  const speak = useCallback((text, options = {}) => {
    if (!synthRef.current) return;

    // iOS fix: auto-speak requires direct user gesture — skip silently
    if (onIOSRef.current && options.auto) return;

    synthRef.current.cancel();

    const clean = text
      .replace(/[#*_`~]/g, '')
      .replace(/\n+/g, '. ')
      .trim();

    const utterance        = new SpeechSynthesisUtterance(clean);
    utterance.lang         = 'en-US';
    utterance.rate         = options.rate   ?? (onIOSRef.current ? 0.95 : 1.0);
    utterance.pitch        = options.pitch  ?? 1.0;
    utterance.volume       = options.volume ?? 1.0;

    // Voice selection — use state array since iOS loads async
    const voiceList = voices.length > 0 ? voices : synthRef.current.getVoices();

    // If caller requested a specific voice by name
    let preferred = options.voiceName
      ? voiceList.find(v => v.name === options.voiceName)
      : null;

    // Fall back to best available English voice
    if (!preferred) {
      preferred = voiceList.find(v =>
        v.name === 'Samantha'               || // iOS
        v.name === 'Karen'                  || // iOS AU
        v.name === 'Moira'                  || // iOS IE
        v.name.includes('Google US English') ||
        v.name.includes('Google')           ||
        v.lang === 'en-US'
      );
    }
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') console.warn('TTS error:', e.error);
      setIsSpeaking(false);
    };

    // iOS fix: 100ms timeout fixes occasional silent playback
    if (onIOSRef.current) {
      setTimeout(() => synthRef.current?.speak(utterance), 100);
    } else {
      synthRef.current.speak(utterance);
    }
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      synthRef.current?.cancel();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    isProcessing: false,      // reserved for Whisper upgrade
    interimTranscript,
    voices,
    onIOS: onIOSRef.current,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};

export default useVoiceChat;