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
            .then((data) => {this.setState(prevState => ({...prevState, loading : false, content : data}));});
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
        let total = ["Total"].concat(new Array(candidates.length + 6).fill(0))
        let rows = []
        for (const county_data of results) {
            let margin = county_data[candidates[0]] - county_data[candidates[1]]
            let row = [<td class={county_data["main_source"]} style={{textAlign : "left"}}><p>{county_data["county"]}</p></td>]
            for (let i = 0; i < candidates.length; i++) {
                row.push(<td class={county_data["main_source"]} style={{backgroundColor : county_data[candidates[i]] > county_data[candidates[1 - i]] ? "#00ff00" : "white"}}><p>{format_with_percent(county_data[candidates[i]], county_data["total"])}</p></td>)
                total[1 + i] += county_data[candidates[i]]
            }
            row.push(<td class={county_data["main_source"]}><p>{county_data["total"]}</p></td>)
            row.push(<td class={county_data["main_source"]}><p>{format_with_percent(margin, county_data["total"])}</p></td>)
            row.push(<td class={county_data["min_source"]}><p>{county_data["min_turnout"]}</p></td>)
            row.push(<td class={county_data["max_source"]}><p>{county_data["max_turnout"]}</p></td>)
            const min_turnout_margin = Math.round(margin * county_data["min_turnout"] / Math.max(1, county_data["total"]))
            const max_turnout_margin = Math.round(margin * county_data["max_turnout"] / Math.max(1, county_data["total"]))
            row.push(<td class={county_data["min_source"]}><p>{format_with_percent(min_turnout_margin, county_data["min_turnout"])}</p></td>)
            row.push(<td class={county_data["max_source"]}><p>{format_with_percent(max_turnout_margin, county_data["min_turnout"])}</p></td>)
            total[1 + candidates.length] += county_data["total"]
            total[2 + candidates.length] += margin
            total[3 + candidates.length] += county_data["min_turnout"]
            total[4 + candidates.length] += county_data["max_turnout"]
            total[5 + candidates.length] += min_turnout_margin
            total[6 + candidates.length] += max_turnout_margin
            rows.push(<tr style={{}}>{row}</tr>)
        }
        let total_html = [<td class="nyt" style={{textAlign : "left"}}>{total[0]}</td>]
        for (let i = 0; i < candidates.length; i++) {
            total_html.push(<td class="nyt" style={{backgroundColor : (total[1 + i] > total[2 - i] ? "#00ff00" : "white")}}>{format_with_percent(total[1 + i], total[1 + candidates.length])}</td>)
        }
        total_html.push(<td class="nyt"><p>{total[1 + candidates.length]}</p></td>)
        total_html.push(<td class="nyt"><p>{format_with_percent(total[2 + candidates.length], total[1 + candidates.length])}</p></td>)
        total_html.push(<td class="nyt"><p>{total[3 + candidates.length]}</p></td>)
        total_html.push(<td class="nyt"><p>{total[4 + candidates.length]}</p></td>)
        total_html.push(<td class="nyt"><p>{format_with_percent(total[5 + candidates.length], total[3 + candidates.length])}</p></td>)
        total_html.push(<td class="nyt"><p>{format_with_percent(total[6 + candidates.length], total[4 + candidates.length])}</p></td>)
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
                    <tr style={{fontWeight : "bolder"}}>
                        {total_html}
                    </tr>
                    <tr>
                        <td class="blank"></td>
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