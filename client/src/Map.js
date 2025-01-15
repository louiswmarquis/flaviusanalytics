import React from 'react';
import map_usa from "./static/map.json";

class Map extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            "year" : props.year,
            "type" : props.type,
            "map_data" : {},
            "totals" : undefined,
            "d": "none",
            "info": [],
            "x": 0,
            "y": 0
        };
    }

    componentDidMount() {
        fetch("/api/get_map_data/" + this.state.year + "-" + this.state.type + "-elections")
            .then((res) => res.status === 500 ? {} : res.json())
            .then((data) => {console.log("MAP", data); return this.setState(prevState => ({...prevState, "map_data" : data}));});
        const fetch_totals = () => {
            fetch("/api/get_map_totals?election_list_id=" + this.state.year + "-" + this.state.type + "-elections")
                .then((res) => res.status === 500 ? {} : res.json())
                .then((data) => {
                    this.setState(prevState => ({...prevState, "totals" : data}))
                });
        }
        fetch_totals()
        setInterval(fetch_totals, 10000)
    }
  
    onMouseEnterHandler(info) {
        this.setState(prevState => ({
            ...prevState,
            "d": "block",
            "info": info,
        }));
    }
  
    onMouseExitHandler() {
        this.setState(prevState => ({
            ...prevState,
            "d": "none",
            "info": [],
        }));
    }

    onMouseMoveHandler = (event) => {
        this.setState(prevState => ({
            ...prevState,
            "x": event.clientX,
            "y": event.clientY
        }));
    }
  
    render() {
        if (Object.keys(this.state.map_data).length === 0) {
            return <div/>
        }
        const colors = { "dark-d" : "#244999", "medium-d" : "#577CCC", "light-d" : "#8AAFFF", "i" : "#9932CC", "light-r" : "#FF8B98", "medium-r" : "#FF5865", "dark-r" : "#D22532", "none" : "#D3D3D3" }
        return (
            <div>
                <p>States with green borders are ones that are being tracked (click on/hover over them!)</p>
                <div id="info-box" style={{display: this.state.d, left: this.state.x + 10, top: this.state.y - 30}}>
                    {this.state.info.map((line) => <div>{line}</div>)}
                </div>
                <svg x="0px" y="0px" width="959px" height="593px" viewBox="174 100 959 593" enable-background="new 174 100 959 593" onMouseMove={this.onMouseMoveHandler}>
                    <g id="g5">
                    {Object.keys(map_usa).map(
                        (state) => {
                            const election_id = this.state.year + "-" + state + "-" + this.state.type + "-election"
                            const election_metadata = this.state.map_data["main"][state]
                            console.log(this.state.totals)
                            const infobox = [map_usa[state]["name"]]
                            if (state in this.state.map_data["main"] && this.state.map_data["main"][state]["color"] !== undefined){
                                if (this.state.totals !== undefined) {
                                    for (const candidate of election_metadata["candidates"]) {
                                        infobox.push(candidate + ": " + Math.round(100 * this.state.totals[election_id]["total"][candidate] / Math.max(this.state.totals[election_id]["total"]["total"], 1)) + "%")
                                    }
                                }
                                return (
                                    <a href={"results/" + this.state.year + "-" + state + "-" + this.state.type + "-election"}>
                                        <path class="map" id={state} fill={colors[this.state.map_data["main"][state]["color"]]} stroke="#00FF00" stroke-width="2px" d={map_usa[state]["shape"]} onMouseEnter={(e) => this.onMouseEnterHandler(infobox)} onMouseLeave={(e) => this.onMouseExitHandler()}/>
                                    </a>
                                )
                            } else if (state in this.state.map_data["other"]){
                                infobox.push(this.state.map_data["other"][state]["info"])
                                return (
                                    <path class="map" id={state} fill={colors[this.state.map_data["other"][state]["color"]]} stroke="#000000" stroke-width="2px" d={map_usa[state]["shape"]} onMouseEnter={(e) => this.onMouseEnterHandler(infobox)} onMouseLeave={(e) => this.onMouseExitHandler()}/>
                                )
                            } else {
                                return (
                                    <path class="map" id={state} fill="#D3D3D3" stroke="#000000" stroke-width="2px" d={map_usa[state]["shape"]} onMouseEnter={(e) => this.onMouseEnterHandler(infobox)} onMouseLeave={(e) => this.onMouseExitHandler()}/>
                                )
                            }
                        }
                    )}
                    <g id="DC">
                    <path class="map" id="path58" fill="#D3D3D3" d="M975.8,353.8l-1.1-1.6l-1-0.8l1.1-1.6l2.2,1.5L975.8,353.8z"/>
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