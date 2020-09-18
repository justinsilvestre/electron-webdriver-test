import React, { useState } from 'react';
import './App.css';
import { ipcRenderer } from 'electron'

function closeWindow() {
  ipcRenderer.invoke('close')
}

function App() {
  const [clicked, setClicked] = useState(false)

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => setClicked(clicked => !clicked)}>
          Click me!
        </button>
        {clicked && <span id="hello">Hello!</span>}
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>

        <p>
          <a href="#" onClick={e => { e.preventDefault(); closeWindow() }}>
            close window
          </a>
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
