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

  const mediaRecorderRef = useRef<MediaRecorder|null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [audioURLs, setAudioURLs] = useState<string[]>([])

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
    const url = URL.createObjectURL(blob)
    setAudioURLs((prev) => [...prev, url])
  }

  const handleStart = () => {
    if (stream === null) {
      return
    }
    if (mediaRecorderRef.current === null) {
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.addEventListener('dataavailable', dataavailableListener)
      mediaRecorderRef.current.addEventListener('stop', stopListener)
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
    <main>
      <div>
        {stream === null ? (
          <button onClick={handleGetMicPermission}>Get Mic Permission</button>
        ) : (
          <>
            <button onClick={handleStart}>Start</button>
            <button onClick={handleStop}>Stop</button>
          </>
        )}
      </div>
      <div>
        {audioURLs.map((url, i) => (
          <div key={i}>
            <audio src={url} controls />
          </div>
        ))}
      </div>
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
