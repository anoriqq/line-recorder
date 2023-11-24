import {
  Links,
  Meta,
  Scripts,
  LiveReload,
  MetaFunction,
} from "@remix-run/react";
import {
  useRef,
  useState,
} from "react";

import { create } from 'zustand'

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

interface State {
  clips: Set<clip>
  selectedClipID: string|undefined
  status: Status
}

interface Action {
  addClip: (clips: clip) => void
  setSelectClipID: (clipID: string|undefined) => void
  setStatus: (status: Status) => void
  play: () => void
  pause: () => void
  getNextClipID: (clipID: string|undefined) => string|undefined
  getPrevClipID: (clipID: string|undefined) => string|undefined
}

const useStore = create<State&Action>((set, get) => ({
  clips: new Set(),
  selectedClipID: undefined,
  status: 'ready',
  addClip: (clip: clip) => set((prev) => ({
    clips: new Set(prev.clips).add(clip)
  })),
  setSelectClipID: (clipID: string|undefined) => set((_) => ({
    selectedClipID: clipID
  })),
  setStatus: (status: Status) => set((_) => ({
    status: status
  })),
  play: () => {
    let selectedClipID = get().selectedClipID
    if (selectedClipID === undefined) {
      selectedClipID = get().getNextClipID(undefined)
    }
    const clip = Array.from(get().clips).find(c => c.id === selectedClipID)
    if (clip === undefined) {
      console.error('clip not found')
      return
    }
    get().setSelectClipID(clip.id)
    clip.audio.addEventListener('ended', () => {
      const nextClipID = get().getNextClipID(clip.id)
      if (nextClipID === undefined) {
        get().setStatus('ready')
        return
      }
      get().setSelectClipID(nextClipID)
      get().play()
    })
    clip.audio.play()
    get().setStatus('playing')
  },
  pause: () => {
    const selectedClipID = get().selectedClipID
    if (selectedClipID === undefined) {
      return
    }
    const clip = Array.from(get().clips).find(c => c.id === selectedClipID)
    if (clip === undefined) {
      console.error('clip not found')
      return
    }
    clip.audio.pause()
    get().setStatus('ready')
  },
  getNextClipID: (clipID: string|undefined) => {
    const prev = Array.from(get().clips)

    if (clipID === undefined) {
      if (prev.length === 0) {
        return undefined;
      }
      return prev[0].id;
    }

    const idx = prev.findIndex(c => c.id === clipID);
    if (idx < 0) {
      return undefined;
    }
    if (idx === prev.length - 1) {
      return undefined;
    }
    const nextClip = prev[idx + 1];
    return nextClip.id;
  },
  getPrevClipID: (clipID: string|undefined) => {
    const prev = Array.from(get().clips)

    if (clipID === undefined) {
      return prev[prev.length - 1].id;
    }

    const idx = prev.findIndex(c => c.id === clipID);
    if (idx < 0) {
      return undefined;
    }
    if (idx === 0) {
      return undefined;
    }
    const prevClip = prev[idx - 1];
    return prevClip.id;
  },
}))

export const meta: MetaFunction = () => {
  return [
    { title: "Line Recorder" },
    {
      property: "og:title",
      content: "Line Recorder",
    },
    {
      name: "description",
      content: "This app is line recorder",
    },
  ];
};

const constraints = {
  audio: true,
  video: false,
}

function Welcome({onClick}: {onClick: () => void}) {
  return (
    <div>
      <h1>Line Recorder</h1>
      <p>This app is record your voice.</p>
      <p>Click the button below to get mic permission.</p>
      <button type="button" onClick={onClick}>Get Mic Permission</button>
    </div>
  )
}

const dummyChars: char[] = [
  { id: '1', idx: 0, name: 'brown', color: '#A52A2A' },
  { id: '2', idx: 1, name: 'cony', color: '#FFD700' },
  { id: '3', idx: 2, name: 'sally', color: '#FF8C00' },
  { id: '4', idx: 3, name: 'choco', color: '#8B4513' },
  { id: '5', idx: 4, name: 'moon', color: '#0000CD' },
  { id: '6', idx: 5, name: 'james', color: '#006400' },
]

function Clip({clip, handleSelectClip}: {clip: clip, handleSelectClip: (clip: clip) => void}) {
  return (
    <div onClick={()=>{handleSelectClip(clip)}}>
      <div style={{color: clip.char.color}} >
        <span>{clip.char.name} {clip.durationS}s {clip.caption}</span>
      </div>
    </div>
  )
}

function Timeline() {
  const clips = useStore((state) => Array.from(state.clips))
  const selectedClipID = useStore((state) => state.selectedClipID)
  const setSelectClipID = useStore((state) => state.setSelectClipID)

  return (
    <div>
      {clips.map((clip) => (
        <div key={clip.id}  style={{display: 'flex'}}>
          <span>{selectedClipID === clip.id ? '●' : ''}</span>
          <Clip clip={clip} handleSelectClip={(_: clip)=>{setSelectClipID(clip.id)}}/>
        </div>
      ))}
    </div>
  )
}

type CharProps = {
  char: char
  stream: MediaStream
  recordingCharID: string
  setRecordingCharID: (recordingCarID: string) => void
}

function Char({char, stream, recordingCharID, setRecordingCharID}: CharProps) {
  const mediaRecorderRef = useRef<MediaRecorder|null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const addClip = useStore(state => state.addClip)

  // HTMLAudioElement.duration から値が取れないケースがあるので自前で計算する
  const recordStartTimestampRef = useRef<number>(0) 

  const startListener = () => {
    recordStartTimestampRef.current = Date.now()
  }

  const dataavailableListener = (event: BlobEvent) => {
      if (typeof event.data === 'undefined') {
        return
      }
      if (event.data.size === 0) {
        return
      }
      audioChunksRef.current.push(event.data)
  }

  const stopListener = () => {
    const blob = new Blob(audioChunksRef.current)
    audioChunksRef.current = []

    const audio = new Audio(URL.createObjectURL(blob))

    const duration = Math.floor((Date.now() - recordStartTimestampRef.current ) / 1000)
    recordStartTimestampRef.current = 0

    const id = crypto.randomUUID()

    const clip: clip = {
      id: id,
      char: char,
      audio: audio,
      durationS: duration,
      caption: 'Hello',
    }
    addClip(clip)
  }

  const handleClick = () => {
    if (recordingCharID === char.id) {
      handleStop()
      setRecordingCharID('')
    } else if (recordingCharID === '') {
      handleStart()
      setRecordingCharID(char.id)
    }
  }

  const handleStart = () => {
    if (stream === null) {
      return
    }
    if (mediaRecorderRef.current === null) {
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.addEventListener('dataavailable', dataavailableListener)
      mediaRecorderRef.current.addEventListener('stop', stopListener)
      mediaRecorderRef.current.addEventListener('start', startListener)
    }
    if (mediaRecorderRef.current.state === 'recording') {
      return
    }
    mediaRecorderRef.current.start()
  }

  const handleStop = () => {
    if (mediaRecorderRef.current === null) {
      return
    }
    if (mediaRecorderRef.current.state === 'inactive') {
      return
    }
    mediaRecorderRef.current.stop()
  }

  return (
    <div onClick={handleClick}>
      <span style={{color: char.color}}>{char.name}</span>
      <span>{recordingCharID === char.id ? ' RECORDING...' : ''}</span>
    </div>
  )
}

type CharPadProps = {
  chars: char[]
  stream: MediaStream
}

function CharPad({chars, stream}: CharPadProps) {
  const [recordingCharID, setRecordingCharID] = useState<string>('')

  return (
    <div style={{backgroundColor:"#EEE"}}>
      {chars.map((char) => (
        <Char
          key={char.id}
          char={char}
          stream={stream}
          recordingCharID={recordingCharID}
          setRecordingCharID={setRecordingCharID}
        />
      ))}
    </div>
  )
}

function ControlPad() {
  const selectedClipID = useStore((state) => state.selectedClipID)
  const setSelectClipID = useStore((state) => state.setSelectClipID)
  const status = useStore((state) => state.status)
  const play = useStore((state) => state.play)
  const pause = useStore((state) => state.pause)
  const getNextClipID = useStore((state) => state.getNextClipID)
  const getPrevClipID = useStore((state) => state.getPrevClipID)

  const handlePlayPause = async () => {
    if (status === 'ready') {
      play()
    } else if (status === 'playing') {
      pause()
    }
  }

  const handleNext = () => {
    if (selectedClipID === undefined) {
      return
    }
    const nextClipID = getNextClipID(selectedClipID)
    if (nextClipID === undefined) {
      return
    }
    setSelectClipID(nextClipID)
  }

  const handlePrev = () => {
    if (selectedClipID === undefined) {
      return
    }
    const prevClipID = getPrevClipID(selectedClipID)
    if (prevClipID === undefined) {
      return
    }
    setSelectClipID(prevClipID)
  }

  return (
    <div>
      <button type="button" onClick={handleNext}>◁</button>
      <button type="button" onClick={handlePlayPause}>{status === 'playing' ? '■' : '▶' }</button>
      <button type="button" onClick={handlePrev}>▷</button>
    </div>
  )
}

type Status = 'ready' | 'recording' | 'playing'

function Recorder({stream}: {stream: MediaStream}) {
  return (
    <div>
      <Timeline />
      <CharPad
        chars={dummyChars}
        stream={stream}
      />
      <ControlPad />
    </div>
  )
}

function Main() {
  const [stream, setStream] = useState<MediaStream|null>(null)

  const handleGetMicPermission = async () => {
    navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      setStream(stream)
    })
    .catch((err) => {
      console.error(err)
    })
  }

  return (
    <main>
      {stream === null ? (
        <Welcome onClick={handleGetMicPermission} />
      ) : (
        <Recorder stream={stream} />
      )}
    </main>
  );
}

export default function App() {
  return (
    <html>
      <head>
        <link
          rel="icon"
          href="data:image/x-icon;base64,AA"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Main />

        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
