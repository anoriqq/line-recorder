export type char = {
  id: string
  idx: number
  name: string
  color: string
}

export type clip = {
  id: string
  char: char
  audio: HTMLAudioElement
  durationS: number
  caption: string
}

export class Clips {
  private clips: clip[];

  constructor() {
    this.clips = [];
  }

  map<T>(f: (c: clip) => T):T[] {
    if (!this.clips) {
      return [];
    }
    return this.clips.map(f);
  }

  add(c: clip) {
    if (!this.clips) {
      this.clips = [];
    }
    this.clips.push(c);
  }

  getNextClipID(id: string): string|undefined {
    const idx = this.clips.findIndex(c => c.id === id);
    if (idx < 0) {
      return undefined;
    }
    if (idx === this.clips.length - 1) {
      return undefined;
    }
    const nextClip = this.clips[idx + 1];
    return nextClip.id;
  }

  getPrevClipID(id: string): string|undefined {
    const idx = this.clips.findIndex(c => c.id === id);
    if (idx < 0) {
      return undefined;
    }
    if (idx === 0) {
      return undefined;
    }
    const prevClip = this.clips[idx - 1];
    return prevClip.id;
  }

  async start(id: string): Promise<string|undefined> {
    const clip = this.clips.find(c => c.id === id);
    if (!clip) {
      return Promise.reject('clip not found');
    }

    await clip.audio.play();

    const nextClipID = this.getNextClipID(id);
    return Promise.resolve(nextClipID);
  }
}
