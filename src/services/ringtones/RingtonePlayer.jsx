/**
 * ringtonePlayer.js
 * Low-level Web Audio API engine for Noxa.
 * Handles loading, caching, playing, looping, fading, and volume control.
 */

export class RingtonePlayer {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.currentSource = null;
    this.bufferCache = {};   // name → AudioBuffer
    this.isPlaying = false;
    this.playToken = 0;
  }

  // ─── Must be called after a user gesture ────────────────────────────────────
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  async ensureReady() {
    this.init();
    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // ignore resume failures from restricted browser autoplay policies
      }
    }
  }

  // ─── Load and cache an audio file by name + URL ──────────────────────────────
  async load(name, url) {
    await this.ensureReady();
    if (this.bufferCache[name]) return this.bufferCache[name];

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} loading ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache[name] = audioBuffer;
      return audioBuffer;
    } catch (err) {
      console.warn(`[RingtonePlayer] Could not load "${name}" from ${url}:`, err);
      return null;
    }
  }

  // ─── Play a named ringtone (must be loaded first) ────────────────────────────
  async play(name, url, { loop = false, volume = 1.0 } = {}) {
    const token = ++this.playToken;
    this.stop();
    await this.ensureReady();

    const buffer = await this.load(name, url);
    if (!buffer || token !== this.playToken) return false;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(
      Math.min(1, Math.max(0, volume)),
      this.audioContext.currentTime
    );

    source.connect(this.gainNode);
    source.start(0);
    this.currentSource = source;
    this.isPlaying = true;

    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
        this.isPlaying = false;
      }
    };

    return true;
  }

  // ─── Stop immediately ────────────────────────────────────────────────────────
  stop() {
    this.playToken += 1;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (_) { /* already stopped */ }
    }
    this.currentSource = null;
    this.isPlaying = false;
  }

  // ─── Smooth fade-out then stop ───────────────────────────────────────────────
  fadeOut(durationSeconds = 0.6) {
    if (!this.gainNode || !this.isPlaying || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.linearRampToValueAtTime(0, now + durationSeconds);
    setTimeout(() => this.stop(), durationSeconds * 1000);
  }

  // ─── Volume 0.0–1.0 ──────────────────────────────────────────────────────────
  setVolume(value) {
    if (!this.gainNode) return;
    this.gainNode.gain.setValueAtTime(
      Math.min(1, Math.max(0, value)),
      this.audioContext?.currentTime ?? 0
    );
  }
}
