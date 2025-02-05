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
          <a href="/2022-senate" style={{textDecoration:"none", display:"flex"}}>
            <div style={{color: "black", fontWeight: "bold"}}>
              <p>2022 Senate Map (Past)</p>
            </div>
          </a>
        </li>
      </ul>
    </nav>
  )
}

class App extends React.Component {

  render() {
    return (
      <Router>
        <Navigator/>
        <Routes>
          <Route exact path="/" element={<Dashboard election_list_ids={["2024-pres-elections", "2024-sen-elections", "2024-house-elections"]}/>}/>
          <Route path="/2024-president" element={<Map year="2024" type="pres"/>}/>
          <Route path="/2024-senate" element={<Map year="2024" type="sen"/>}/>
          <Route path="/2022-senate" element={<Map year="2022" type="sen"/>}/>
          <Route path="/results/:election_id" element={<Results/>}/>
        </Routes>
        <p>Built by Louis Marquis (MIT 2025) in the last two weeks before Election 2024.</p>
        <p>Contact: flavius (at) mit (dot) edu</p>
      </Router>

    );
  }
}

export default App;
