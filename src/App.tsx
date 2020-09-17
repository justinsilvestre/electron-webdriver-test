import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [clicked, setClicked] = useState(false)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={() => setClicked(clicked => !clicked)}>
          Click me!
        </button>
        {clicked && <span id="hello">Hello!</span>}
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
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
