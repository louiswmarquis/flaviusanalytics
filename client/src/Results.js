import React from 'react';
import { useParams } from "react-router-dom";
import Graph from "./Graph.js"

class Results extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            election_id : props.election_id,
            loading : true,
            content : ""
        }
    }

    componentDidMount() {
        const fetch_data = () => {
            fetch("/results/" + this.state.election_id)
            .then((res) => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw new Error("No sources out yet")
                }
            })
            .then((data) => {
                this.setState(prevState => ({...prevState, loading : false, content : data}))
            })
            .catch((error) => {
                if (error.message === "No sources out yet") {
                    this.setState(prevState => ({...prevState, loading : false}))
                }
                else {
                    throw error
                }
            })
        }
        fetch_data();
        setInterval(fetch_data, 1000);
    }

    render() {
        if (this.state.loading) {
            return <p>Loading...</p>
        }
        if (this.state.content === "") {
            return <p>Either this is not a valid link or no sources are out yet! Patience, my friend!</p>
        }
        function format_with_percent(a, b) {
            return a + "\n(" + (a / b * 100).toFixed(2).toString() + "%)"
        }
        const margin_history = this.state.content["margin_history"]
        const history_table = this.state.content["history_table"]
        const aggregate_data = this.state.content["aggregate_data"]
        const candidates = aggregate_data["candidates"]
        const results = aggregate_data["results"]
        let rows = []
        for (const county_data of results) {
            let row = [<td class={county_data["main_source"]} style={{textAlign : "left"}}><p>{county_data["county"]}</p></td>]
            for (let i = 0; i < candidates.length; i++) {
                row.push(<td class={county_data["main_source"]} style={{backgroundColor : county_data[candidates[i]] > county_data[candidates[1 - i]] ? "#00ff00" : "white"}}><p>{format_with_percent(county_data[candidates[i]], county_data["total"])}</p></td>)
            }
            row.push(<td class={county_data["main_source"]}><p>{county_data["total"]}</p></td>)
            row.push(<td class={county_data["main_source"]}><p>{format_with_percent(county_data["margin"], county_data["total"])}</p></td>)
            row.push(<td class={county_data["min_source"]}><p>{county_data["min_turnout"]}</p></td>)
            row.push(<td class={county_data["max_source"]}><p>{county_data["max_turnout"]}</p></td>)
            row.push(<td class={county_data["min_source"]}><p>{format_with_percent(county_data["min_turnout_margin"], county_data["min_turnout"])}</p></td>)
            row.push(<td class={county_data["max_source"]}><p>{format_with_percent(county_data["max_turnout_margin"], county_data["min_turnout"])}</p></td>)
            rows.push(<tr style={{fontWeight : county_data["county"] === "Total" ? "bolder" : "normal"}}>{row}</tr>)
            if (county_data["county"] === "Total") {
                rows.push(<tr><td class="blank"></td></tr>)
            }
        }
        return <section class="content">
            <header><h1>{aggregate_data["name"] + " Results"}</h1></header>
            <div class="graphics">
                <div class="graph">
                    <Graph margin_history={margin_history} min_turnout={aggregate_data["results"]["0"]["min_turnout"]} max_turnout={aggregate_data["results"]["0"]["max_turnout"]}/>
                </div>
                <div class="history">
                    <div class="scroller">
                        <table>
                            <tbody>
                                <tr>
                                    <th class="history-cell" style={{textAlign: "left"}}>Time</th>
                                    {candidates.map((candidate) => <th class="history-cell">{candidate}</th>)}
                                    <th class="history-cell">Total</th>
                                    <th class="history-cell">Margin</th>
                                    <th class="history-cell">Percent</th>
                                </tr>
                                {history_table.map((row) => (
                                    <tr>
                                        {row.map((element) => <td class="history-cell"><p style={{margin:"4px"}}>{element}</p></td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div id="table">
                <p>{"Source(s): " + aggregate_data["sources"]}</p>
                <table>
                    <tbody>
                        <tr>
                            <th class="results-table" style={{textAlign : "left"}}>County</th>
                            {candidates.map((candidate) => <th>{candidate}</th>)}
                            <th>Total</th>
                            <th>Current Margin</th>
                            <th>Min. Turnout</th>
                            <th>Max. Turnout</th>
                            <th>Min. Turnout Margin</th>
                            <th>Max. Turnout Margin</th>
                        </tr>
                        {rows}
                    </tbody>
                </table>
            </div>
        </section>
    }
}

const ResultswithRouter = props => {
    const { election_id } = useParams();
    return <Results election_id={election_id} {...props} />;
}

export default ResultswithRouter