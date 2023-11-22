/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals'
import { Clips, clip } from './clips.client'

window.HTMLMediaElement.prototype.load = () => { /* do nothing */ };
window.HTMLMediaElement.prototype.play = async () => { /* do nothing */ };
window.HTMLMediaElement.prototype.pause = () => { /* do nothing */ };

describe('Clips', () => {
  test('map', () => {
    const clips = new Clips();

    expect(clips.map(c => c.id)).toEqual([]);
  })

  test('add', () => {
    const clips = new Clips();

    const clip: clip = {
      id: '1',
      char: {
        id: '1',
        idx: 1,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    clips.add(clip);

    expect(clips.map(c => c.id)).toEqual(['1']);
  })

  test('getNextClipID', () => {
    const clips = new Clips();

    const clip: clip = {
      id: '1',
      char: {
        id: '1',
        idx: 1,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    clips.add(clip);

    expect(clips.getNextClipID('1')).toEqual(undefined);
  })

  test('getNextClipID multiple clips', () => {
    const clips = new Clips();

    const clip1: clip = {
      id: '1',
      char: {
        id: '1',
        idx: 1,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    const clip2: clip = {
      id: '2',
      char: {
        id: '2',
        idx: 2,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    clips.add(clip1);
    clips.add(clip2);

    expect(clips.getNextClipID('1')).toEqual('2');
  })

  test('getPrevClipID', () => {
    const clips = new Clips();

    const clip: clip = {
      id: '1',
      char: {
        id: '1',
        idx: 1,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    clips.add(clip);

    expect(clips.getPrevClipID('1')).toEqual(undefined);
  })

  test('getPrevClipID multiple clips', () => {
    const clips = new Clips();

    const clip1: clip = {
      id: '1',
      char: {
        id: '1',
        idx: 1,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    const clip2: clip = {
      id: '2',
      char: {
        id: '2',
        idx: 2,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    clips.add(clip1);
    clips.add(clip2);

    expect(clips.getPrevClipID('2')).toEqual('1');
  })

  test('play', async () => {
    const clips = new Clips();

    const clip: clip = {
      id: '1',
      char: {
        id: '1',
        idx: 1,
        name: 'name',
        color: 'color',
      },
      audio: new Audio(),
      durationS: 1,
      caption: 'caption',
    };
    clips.add(clip);

    const nextClip = await clips.start('1');

    expect(nextClip).toEqual(undefined);
  })
})
