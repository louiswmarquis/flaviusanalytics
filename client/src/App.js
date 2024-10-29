import logo from './byzantine.jpg';
import Map from "./Map.js";
import Dashboard from "./Dashboard.js";
import Results from "./Results.js";

import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function Navigator() {
  return (
    <nav>
      <ul>
        <li>
          <a href="/" style={{textDecoration:"none", display:"flex"}}>
            <div class="logo">
              <img style={{height:"100%"}} src={logo}/>
            </div>
            <div style={{color: "purple"}}>
              <h1>Flavius Analytics 2024</h1>
            </div>
          </a>
        </li>
        <li>
          <a href="/2024-president" style={{textDecoration:"none", display:"flex"}}>
            <div style={{color: "black", fontWeight: "bold"}}>
              <p>2024 Presidential Map</p>
            </div>
          </a>
        </li>
        <li>
          <a href="/2024-senate" style={{textDecoration:"none", display:"flex"}}>
            <div style={{color: "black", fontWeight: "bold"}}>
              <p>2024 Senate Map</p>
            </div>
          </a>
        </li>
        <li>
          <a href="/2022-house" style={{textDecoration:"none", display:"flex"}}>
            <div style={{color: "black", fontWeight: "bold"}}>
              <p>2024 House Elections</p>
            </div>
          </a>
        </li>
        <li>
          <a href="/past-elections" style={{textDecoration:"none", display:"flex"}}>
            <div style={{color: "black", fontWeight: "bold"}}>
              <p>Past Elections</p>
            </div>
          </a>
        </li>
      </ul>
    </nav>
  )
}

class App extends React.Component {

  constructor(){
    super();
  }

  render() {
    return (
      <Router>
        <Navigator/>
        <Routes>
          <Route exact path="/" element={<Dashboard/>}/>
          <Route path="/2024-president" element={<Map/>}/>
          <Route path="/results/:election_id" element={<Results/>}/>
        </Routes>
      </Router>

    );
  }
}

export default App;
