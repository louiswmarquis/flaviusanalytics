import React from 'react';
import map_usa from "./static/map.json";
import elections from "./static/2024-pres-elections.json"
import other_elections from "./static/2024-pres-elections-other.json"

class Map extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            "d": "none",
            "info": "",
            "x": 0,
            "y": 0
        };
    }
  
    onMouseEnterHandler(info) {
        console.log("ENTER")
        this.setState(prevState => ({
            ...prevState,
            "d": "block",
            "info": info,
        }));
        console.log("ENTER")
    }
  
    onMouseExitHandler() {
        console.log("EXIT")
        this.setState(prevState => ({
            ...prevState,
            "d": "none",
            "info": "",
        }));
    }

    onMouseMoveHandler = (event) => {
        console.log("MOVE", event.clientX, event.clientY)
        this.setState(prevState => ({
            ...prevState,
            "x": event.clientX,
            "y": event.clientY
        }));
    }
  
    render() {
        const colors = { "dark-d" : "#244999", "medium-d" : "#577CCC", "light-d" : "#8AAFFF", "i" : "#9932CC", "light-r" : "#FF8B98", "medium-r" : "#FF5865", "dark-r" : "#D22532", "none" : "#D3D3D3" }
        return (
            <div>
            <div id="info-box" style={{display: this.state.d, left: this.state.x, top: this.state.y - 30}}>
                {this.state.info}
            </div>
            <svg x="0px" y="0px" width="959px" height="593px" viewBox="174 100 959 593" enable-background="new 174 100 959 593" onMouseMove={this.onMouseMoveHandler}>
                <g id="g5">
                {Object.keys(map_usa).map(
                    (state) => {
                        if (state in other_elections){
                            return (
                                <path id={state} fill={colors[other_elections[state]["color"]]} stroke="#000000" stroke-width="1px" d={map_usa[state]["shape"]} onMouseEnter={(e) => this.onMouseEnterHandler(map_usa[state]["name"])} onMouseLeave={(e) => this.onMouseExitHandler()}/>
                            )
                        } else if ("2024-" + state + "-pres-election" in elections){
                            return (
                                <path id={state} fill={colors[elections["2024-" + state + "-pres-election"]["color"]]} stroke="#000000" stroke-width="1px" d={map_usa[state]["shape"]} onMouseEnter={(e) => this.onMouseEnterHandler(map_usa[state]["name"])} onMouseLeave={(e) => this.onMouseExitHandler()}/>
                            )
                        } else {
                            return (
                                <path id={state} fill="#D3D3D3" stroke="#000000" stroke-width="1px" d={map_usa[state]["shape"]} onMouseEnter={(e) => this.onMouseEnterHandler(map_usa[state]["name"])} onMouseLeave={(e) => this.onMouseExitHandler()}/>
                            )
                        }
                    }
                )}
                <g id="DC">
                <path id="path58" fill="#D3D3D3" d="M975.8,353.8l-1.1-1.6l-1-0.8l1.1-1.6l2.2,1.5L975.8,353.8z"/>
                <circle id="circle60"  fill="#D3D3D3" stroke="#FFFFFF" stroke-width="1.5" cx="975.3" cy="351.8" r="5"/>
                </g>
                </g>
                <path id="path67" fill="none" stroke="#A9A9A9" stroke-width="2" d="M385,593v55l36,45 M174,525h144l67,68h86l53,54v46"/>
            </svg>
            </div>
        )
    }
}

export default Map