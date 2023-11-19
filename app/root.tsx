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
      <button onClick={onClick}>Get Mic Permission</button>
    </div>
  )
}

type char = {
  id: string
  idx: number
  name: string
  color: string
}

const dummyChars: char[] = [
  { id: '1', idx: 0, name: 'brown', color: '#A52A2A' },
  { id: '2', idx: 1, name: 'cony', color: '#FFD700' },
  { id: '3', idx: 2, name: 'sally', color: '#FF8C00' },
  { id: '4', idx: 3, name: 'choco', color: '#8B4513' },
  { id: '5', idx: 4, name: 'moon', color: '#0000CD' },
  { id: '6', idx: 5, name: 'james', color: '#006400' },
]

type clip = {
  id: string
  idx: number
  char: char
  audioURL: string
  durationS: number
  caption: string
}

function Clip({clip}: {clip: clip}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleOnClick = () => {
    if (audioRef.current === null) {
      return
    }
    if (audioRef.current.paused) {
      audioRef.current.play()
    } else {
      audioRef.current.pause()
    }
  }

  return (
    <div onClick={handleOnClick}>
      <audio src={clip.audioURL} ref={audioRef} />
      <div style={{color: clip.char.color}} >
        <span>{clip.char.name} {clip.durationS}s {clip.caption}</span>
      </div>
    </div>
  )
}

function Timeline({clips}: {clips: clip[]}) {
  return (
    <div>
      {clips.map((clip) => (
        <Clip key={clip.id} clip={clip} />
      ))}
    </div>
  )
}

type CharProps = {
  char: char
  stream: MediaStream
  handleAddClip: (clip: clip) => void
  recordingCharID: string
  setRecordingCharID: (recordingCarID: string) => void
}

function Char({char, stream, handleAddClip, recordingCharID, setRecordingCharID}: CharProps) {
  const mediaRecorderRef = useRef<MediaRecorder|null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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

    const duration = Math.floor((Date.now() - recordStartTimestampRef.current ) / 1000)
    recordStartTimestampRef.current = 0

    const clip: clip = {
      id: Math.random().toString(),
      idx: 0,
      char: char,
      audioURL: URL.createObjectURL(blob),
      durationS: duration,
      caption: 'Hello',
    }
    handleAddClip(clip)
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
  handleAddClip: (clip: clip) => void
}

function CharPad({chars, stream, handleAddClip}: CharPadProps) {
  const [recordingCharID, setRecordingCharID] = useState<string>('')

  return (
    <div style={{backgroundColor:"#EEE"}}>
      {chars.map((char) => (
        <Char
          key={char.id}
          char={char}
          stream={stream}
          handleAddClip={handleAddClip}
          recordingCharID={recordingCharID}
          setRecordingCharID={setRecordingCharID}
        />
      ))}
    </div>
  )
}

function ControlPad() {
  return (
    <div>
      <button>◀</button>
      <button>⏹</button>
      <button>▶</button>
    </div>
  )
}

function Recorder({stream}: {stream: MediaStream}) {
  const [clips, setClips] = useState<clip[]>([])

  function handleAddClip(clip: clip) {
    setClips((prev) => [...prev, clip])
  }

  return (
    <div>
      <Timeline clips={clips} />
      <CharPad chars={dummyChars} stream={stream} handleAddClip={handleAddClip} />
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
