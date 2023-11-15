import {
  Links,
  Meta,
  Scripts,
  LiveReload,
  MetaFunction,
} from "@remix-run/react";
import { useState } from "react";

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

function Main() {
  const [isRecording, setIsRecording] = useState(false);

  const onClick = () => {
    setIsRecording(!isRecording)
  }

  return (
    <main>
      <button className="rec" onClick={onClick}> {isRecording ? 'Stop' : 'Rec'} </button>
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
