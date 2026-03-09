/**
 * RingtonePlayer.js
 * Low-level Web Audio API engine for Noxa.
 * Handles loading, caching, playing, looping, fading, and volume control.
 *
 * CHANGES
 * -------
 * [FIX] ensureReady() now returns a boolean indicating whether the AudioContext
 *       is actually running. play() checks this and bails early when the context
 *       is still suspended (e.g. browser blocked autoplay before a user gesture).
 *       Previously the error was swallowed and playback silently did nothing.
 */

export class RingtonePlayer {
  constructor() {
    this.audioContext   = null;
    this.gainNode       = null;
    this.currentSource  = null;
    this.bufferCache    = {};   // name → AudioBuffer
    this.isPlaying      = false;
    this.playToken      = 0;
  }

  // ─── Must be called after a user gesture ─────────────────────────────────
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode     = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  /**
   * Attempt to resume a suspended AudioContext.
   *
   * Returns true  → context is running and audio will play.
   * Returns false → context is still suspended (browser blocking autoplay).
   *                 Callers should abort playback rather than queue silently.
   */
  async ensureReady() {
    this.init();
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // resume() can throw when called outside a user-gesture stack frame.
        // Return false so callers know playback cannot proceed right now.
        return false;
      }
    }
    return this.audioContext?.state === 'running';
  }

  // ─── Load and cache an audio file by name + URL ──────────────────────────
  async load(name, url) {
    // ensureReady resolves false when suspended, but we still want to allow
    // pre-loading to succeed so the buffer is ready for the next gesture.
    await this.ensureReady();
    if (this.bufferCache[name]) return this.bufferCache[name];

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
      const arrayBuffer  = await response.arrayBuffer();
      const audioBuffer  = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache[name] = audioBuffer;
      return audioBuffer;
    } catch (err) {
      console.warn(`[RingtonePlayer] Could not load "${name}" from ${url}:`, err);
      return null;
    }
  }

  // ─── Play a named ringtone (load on demand if not cached) ────────────────
  async play(name, url, { loop = false, volume = 1.0 } = {}) {
    this.stop();
    const token = ++this.playToken;

    // Guard: if the AudioContext is still suspended we cannot play anything.
    // Return false so callers can react (e.g. show a "tap to enable sound" hint).
    const ready = await this.ensureReady();
    if (!ready) {
      console.warn('[RingtonePlayer] AudioContext suspended — skipping playback. A user gesture is required.');
      return false;
    }

    const buffer = await this.load(name, url);

    // A newer play() call may have started while we were loading — abort.
    if (!buffer || token !== this.playToken) return false;

    const source    = this.audioContext.createBufferSource();
    source.buffer   = buffer;
    source.loop     = loop;

    this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(
      Math.min(1, Math.max(0, volume)),
      this.audioContext.currentTime
    );

    source.connect(this.gainNode);
    source.start(0);
    this.currentSource = source;
    this.isPlaying     = true;

    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
        this.isPlaying     = false;
      }
    };

    return true;
  }

  // ─── Stop immediately ─────────────────────────────────────────────────────
  stop() {
    this.playToken += 1;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (_) { /* already stopped */ }
    }
    this.currentSource = null;
    this.isPlaying     = false;
  }

  // ─── Smooth fade-out then stop ────────────────────────────────────────────
  fadeOut(durationSeconds = 0.6) {
    if (!this.gainNode || !this.isPlaying || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);
    setTimeout(() => this.stop(), durationSeconds * 1000);
  }

  // ─── Volume 0.0–1.0 ───────────────────────────────────────────────────────
  setVolume(value) {
    if (!this.gainNode) return;
    this.gainNode.gain.setValueAtTime(
      Math.min(1, Math.max(0, value)),
      this.audioContext?.currentTime ?? 0
    );
  }
}