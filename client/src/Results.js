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
            fetch("/get_results/" + this.state.election_id)
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
            return a + "\n(" + (a / Math.max(1, b) * 100).toFixed(2).toString() + "%)"
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
                row.push(<td class={county_data["main_source"]} style={{backgroundColor : county_data[candidates[i]] > county_data[candidates[1 - i]] ? (i === 0 ? "#92BDE0" : "#EAA9A9") : "white"}}><p>{format_with_percent(county_data[candidates[i]], county_data["total"])}</p></td>)
            }
            row.push(<td class={county_data["main_source"]} style={{fontWeight : "bolder"}}><p>{format_with_percent(county_data["total"], county_data["min_turnout"])}</p></td>)
            row.push(<td class={county_data["main_source"]} /*style={{backgroundColor : county_data["margin"] > 0 ? "#92BDE0" : (county_data["margin"] < 0 ? "#EAA9A9" : "#FFFFFF")}}*/><p>{format_with_percent(county_data["margin"], county_data["total"])}</p></td>)
            row.push(<td class={county_data["min_source"]}><p>{county_data["min_turnout"]}</p></td>)
            row.push(<td class={county_data["max_source"]}><p>{county_data["max_turnout"]}</p></td>)
            row.push(<td class={county_data["min_source"]}><p>{format_with_percent(county_data["min_turnout_margin"], county_data["min_turnout"])}</p></td>)
            row.push(<td class={county_data["max_source"]}><p>{format_with_percent(county_data["max_turnout_margin"], county_data["max_turnout"])}</p></td>)
            row.push(<td class="nyt" style={{backgroundColor : county_data["prev_margin"] > 0 ? "#92BDE0" : (county_data["prev_margin"] < 0 ? "#EAA9A9" : "#FFFFFF")}}><p>{county_data["prev_total"] === undefined ? null : format_with_percent(county_data["prev_margin"], county_data["prev_total"])}</p></td>)
            const percent_overperformance = county_data["margin"] / Math.max(1, county_data["total"]) * 100 - county_data["prev_margin"] / Math.max(1, county_data["prev_total"]) * 100
            row.push(<td class="nyt" style={{backgroundColor : percent_overperformance === 0 || county_data["prev_total"] === undefined || county_data["total"] === 0 ? "#FFFFFF" : percent_overperformance > 0 ? "#92BDE0" : "#EAA9A9"}}>
                <p>{county_data["prev_total"] === undefined || county_data["total"] === 0 ? null : (percent_overperformance).toFixed(2).toString() + "%"}</p>
                </td>)
            rows.push(<tr style={{fontWeight : county_data["county"] === "Total" ? "bolder" : "normal"}}>{row}</tr>)
            if (county_data["county"] === "Total") {
                rows.push(<tr><td class="blank"></td></tr>)
            }
        }
        return <section class="content">
            <header style={{width: "1200px", height: "100px"}}>
                <h1 style={{display: "inline-block"}}>{aggregate_data["name"] + " Results"}</h1>
                <span style={{float : "right"}}>
                    <h1 style={{display: "inline-block", textDecoration : "none", fontWeight : "bold", fontFamily : "Courier New", margin: "0px"}}>
                        {aggregate_data["kalshi"] === undefined ? null : <a href={aggregate_data["kalshi"]} target="_blank" style={{display: "inline-block", backgroundColor : "#00d991", color : "black", textDecoration : "none", fontWeight : "bold", padding : "20px"}}><div>K</div></a>}
                        {aggregate_data["kalshi_margin"] === undefined ? null : <a href={aggregate_data["kalshi_margin"]} target="_blank" style={{display: "inline-block", backgroundColor : "#00d991", color : "black", textDecoration : "none", fontWeight : "bold", padding : "20px"}}><div>M</div></a>}
                    </h1>
                </span>
            </header>
            <div class="graphics">
                <div class="graph">
                    <Graph margin_history={margin_history} min_turnout={aggregate_data["results"]["0"]["min_turnout"]} max_turnout={aggregate_data["results"]["0"]["min_turnout"]}/>
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
                <div>
                </div>
                <p>{"Source(s): " + aggregate_data["sources"]}</p>
                <p>Note: The "Compare Margin" column lists the margin from a different election. Pres. and house elections are compared with the previous cycle (2024 for pres, 2022 for house), and senate elections are compared with the concurrent 2024 pres one.</p>
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
                            <th>Compare Margin</th>
                            <th>Over-Performance</th>
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