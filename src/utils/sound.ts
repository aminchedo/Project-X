/**
 * Sound Effects Utility
 * Provides audio feedback for user actions and system events
 */

interface SoundConfig {
  soundEnabled: boolean;
  volume: number;
}

class SoundManager {
  private config: SoundConfig = {
    soundEnabled: true,
    volume: 0.5
  };

  private audioCache: Map<string, HTMLAudioElement> = new Map();

  /**
   * Initialize sound manager with settings
   */
  init(config: Partial<SoundConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Update sound settings
   */
  updateConfig(config: Partial<SoundConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate audio data for different sound types
   */
  private generateAudioData(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine'): string {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(numSamples * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * 0.5;
          break;
        case 'sawtooth':
          sample = 2 * ((t * frequency) % 1) - 1;
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * ((t * frequency) % 1) - 1) - 1;
          break;
      }
      
      const int16 = sample * 0x7fff;
      view.setInt16(i * 2, int16, true);
    }

    const wavHeader = this.createWavHeader(numSamples * 2, sampleRate);
    const blob = new Blob([wavHeader, buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  /**
   * Create WAV file header
   */
  private createWavHeader(length: number, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + length, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    
    // fmt sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    
    // data sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, length, true);
    
    return buffer;
  }

  /**
   * Play a sound from the cache or create it
   */
  private async playSound(name: string, audioUrl: string) {
    if (!this.config.soundEnabled) return;

    try {
      if (!this.audioCache.has(name)) {
        const audio = new Audio(audioUrl);
        audio.volume = this.config.volume;
        this.audioCache.set(name, audio);
      }

      const audio = this.audioCache.get(name)!;
      audio.currentTime = 0;
      audio.volume = this.config.volume;
      await audio.play();
    } catch (error) {
      console.log('Sound playback error (may be blocked by browser):', error);
    }
  }

  /**
   * Success sound - pleasant chime
   */
  async success() {
    const url = this.generateAudioData(440, 0.1, 'sine');
    await this.playSound('success', url);
  }

  /**
   * Error sound - sharp beep
   */
  async error() {
    const url = this.generateAudioData(220, 0.2, 'sawtooth');
    await this.playSound('error', url);
  }

  /**
   * Warning sound - medium tone
   */
  async warning() {
    const url = this.generateAudioData(330, 0.15, 'triangle');
    await this.playSound('warning', url);
  }

  /**
   * Info sound - soft tone
   */
  async info() {
    const url = this.generateAudioData(500, 0.1, 'sine');
    await this.playSound('info', url);
  }

  /**
   * Signal detected sound - ascending melody
   */
  async signalDetected() {
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    for (const freq of frequencies) {
      const url = this.generateAudioData(freq, 0.15, 'sine');
      await this.playSound(`signal_${freq}`, url);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  /**
   * Trade executed sound - satisfying ding
   */
  async tradeExecuted() {
    const url = this.generateAudioData(880, 0.2, 'sine');
    await this.playSound('trade', url);
  }

  /**
   * Notification sound - soft ping
   */
  async notification() {
    const url = this.generateAudioData(800, 0.12, 'sine');
    await this.playSound('notification', url);
  }

  /**
   * Alert sound - attention grabbing
   */
  async alert() {
    const url = this.generateAudioData(400, 0.3, 'square');
    await this.playSound('alert', url);
  }

  /**
   * Click sound - subtle feedback
   */
  async click() {
    const url = this.generateAudioData(1000, 0.05, 'square');
    await this.playSound('click', url);
  }

  /**
   * Hover sound - very subtle
   */
  async hover() {
    const url = this.generateAudioData(1200, 0.03, 'sine');
    await this.playSound('hover', url);
  }

  /**
   * Scan complete sound - series of beeps
   */
  async scanComplete() {
    const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
    for (const freq of frequencies) {
      const url = this.generateAudioData(freq, 0.1, 'sine');
      await this.playSound(`scan_${freq}`, url);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Risk alert sound - urgent tone
   */
  async riskAlert() {
    const url = this.generateAudioData(350, 0.25, 'sawtooth');
    await this.playSound('risk', url);
  }

  /**
   * Custom sound with specified frequency and duration
   */
  async playCustom(frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle' = 'sine') {
    const url = this.generateAudioData(frequency, duration, type);
    await this.playSound(`custom_${Date.now()}`, url);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export convenience functions
export const playSound = {
  success: () => soundManager.success(),
  error: () => soundManager.error(),
  warning: () => soundManager.warning(),
  info: () => soundManager.info(),
  signalDetected: () => soundManager.signalDetected(),
  tradeExecuted: () => soundManager.tradeExecuted(),
  notification: () => soundManager.notification(),
  alert: () => soundManager.alert(),
  click: () => soundManager.click(),
  hover: () => soundManager.hover(),
  scanComplete: () => soundManager.scanComplete(),
  riskAlert: () => soundManager.riskAlert(),
  custom: (freq: number, duration: number, type?: 'sine' | 'square' | 'sawtooth' | 'triangle') => 
    soundManager.playCustom(freq, duration, type)
};

export default soundManager;

