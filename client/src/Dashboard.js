import React from 'react';

class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            election_id : props.election_id,
            content : ""
        }
    }

    componentDidMount() {
        const fetch_data = () => {
            fetch("/get_totals")
            .then((res) => res.json())
            .then((data) => {return this.setState(prevState => ({...prevState, content : data}));});
        }
        fetch_data();
        setInterval(fetch_data, 1000);
    }

    render() {
        if (this.state.content === "") {
            return <p>Loading...</p>
        }
        const rows = Object.keys(this.state.content).map((time) => (Number(time))).toSorted((a, b) => a - b).map((time) => {
            const hour = Math.floor(time)
            const minute = time - Math.floor(time)
            const heading = String(hour) + (minute !== 0 ? ":30" : "") + " " + (hour === 12 ? "AM" : "PM") + " Poll Closings:"
            return <div>
                <p>{heading}</p>
                <table>
                    <tr>
                        {Object.keys(this.state.content[String(time)]).toSorted().map((election_id) => ([election_id, this.state.content[String(time)][election_id]])).map(([election_id, results]) => (
                            <td class="summary-cell">
                                <p><a href={"results/".concat(election_id)} style={{color : "#000000", textDecoration : "none", fontWeight : "bold"}}>{results["name"].substring(5, results["name"].length - 9)}</a></p>
                                {[...Array(results["candidates"].length).keys().map((c) =>
                                    (<p style={{backgroundColor : results["candidates"][c] === results["winner"] ? "#00ff00" : "#ffffff", color : c === 0 ? "#244999" : "#D22532"}}>{results["candidates"][c]}<span style={{float:"right"}}>
                                        {results["total"]["total"] === 0 ? "0%" : (results["candidates"][c] === results["winner"] ? ("(+" + String((100 * Math.abs(results["total"]["margin"]) / results["total"]["total"]).toFixed(1).toString()) + "%) ") : "") + String((100 * Math.abs(results["total"][results["candidates"][c]] / results["total"]["total"], 1)).toFixed(1).toString()) + "%"}
                                    </span></p>)
                                )]}
                                <p>{(results["total"]["min_turnout"] === 0 ? "0" : (String(Math.round(100 * results["total"]["total"] / results["total"]["max_turnout"])) + (results["total"]["min_turnout"] !== results["total"]["max_turnout"] ? ("-" + String(Math.round(100 * results["total"]["total"] / results["total"]["min_turnout"]))) : ""))) + "% in"}</p>
                            </td>
                        ))}
                    </tr>
                </table>
            </div>
        })
        return (
            <div class="content">
                <h1>2022 Midterm Elections Grand Dashboard</h1>
                <p><b>Click races for detailed results</b></p>
                <p class="blank"></p>
                {rows}
            </div>
        )
    }
}

export default Dashboard