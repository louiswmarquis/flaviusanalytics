import React from 'react';
import { useParams } from "react-router-dom";

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
            .then((res) => res.json())
            .then((data) => {return this.setState(prevState => ({...prevState, loading : false, content : data}));});
        }
        fetch_data();
        setInterval(fetch_data, 1000);
    }

    render() {
        if (this.state.loading) {
            return <p>Loading...</p>
        }
        function format_with_percent(a, b) {
            return a + "\n(" + (a / b * 100).toFixed(2).toString() + "%)"
        }
        const candidates = this.state.content["candidates"]
        const results = this.state.content["results"]
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
        return <div id="table">
            <p>{"Source(s): " + this.state.content["sources"]}</p>
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
    }
}

const ResultswithRouter = props => {
    const { election_id } = useParams();
    return <Results election_id={election_id} {...props} />;
}

export default ResultswithRouter