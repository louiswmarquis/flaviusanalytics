import React from 'react';

class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            election_list_ids : props.election_list_ids,
            content : ""
        }
    }

    componentDidMount() {
        const fetch_data = () => {
            fetch("/get_totals?" + this.state.election_list_ids.map((election_list_id) => ("election_list_ids[]=" + election_list_id)).join('&'))
            .then((res) => res.status === 500 ? {} : res.json())
            .then((data) => {return this.setState(prevState => ({...prevState, content : data}));});
        }
        fetch_data();
        setInterval(fetch_data, 1000);
    }

    render() {
        if (this.state.content === "") {
            return <p>Loading...</p>
        }
        console.log(this.state.content)
        const rows = Object.keys(this.state.content).map((time) => (Number(time))).toSorted((a, b) => a - b).map((time) => {
            const hour = Math.floor(time)
            const minute = time - Math.floor(time)
            const heading = String(hour) + (minute !== 0 ? ":30" : "") + " " + (hour === 12 ? "AM" : "PM") + " Poll Closings:"
            return <div>
                <p>{heading}</p>
                <table>
                    {Object.entries(this.state.content[String(time)]).map(([election_list_id, results_type_list]) => 
                    <tr>
                        {results_type_list.map((results) => (
                            <td class={"summary-cell-" + election_list_id.split("-").at(1)}>
                                <p><a href={"results/".concat(results["election_id"])} style={{color : "#000000", textDecoration : "none", fontWeight : "bold"}}>{results["name"].slice(5, -9)}</a></p>
                                {[...Array(results["candidates"].length).keys().map((c) =>
                                    (<p style={{backgroundColor : results["candidates"][c] === results["winner"] ? "#00ff00" : "#ffffff", color : c === 0 ? "#244999" : "#D22532"}}>{results["candidates"][c]}<span style={{float:"right"}}>
                                        {results["total"]["total"] === 0 ? "0%" : (results["candidates"][c] === results["winner"] ? ("(+" + String((100 * Math.abs(results["total"]["margin"]) / results["total"]["total"]).toFixed(1).toString()) + "%) ") : "") + String((100 * Math.abs(results["total"][results["candidates"][c]] / results["total"]["total"], 1)).toFixed(1).toString()) + "%"}
                                    </span></p>)
                                )]}
                                <p>{(results["total"]["min_turnout"] === 0 ? "0" : (String(Math.round(100 * results["total"]["total"] / results["total"]["max_turnout"])) + (results["total"]["min_turnout"] !== results["total"]["max_turnout"] ? ("-" + String(Math.round(100 * results["total"]["total"] / results["total"]["min_turnout"]))) : ""))) + "% in"}</p>
                            </td>
                        ))}
                    </tr>)}
                </table>
            </div>
        })
        return (
            <section class="content">
                <header>
                <h1>2024 Elections Grand Dashboard</h1>
                </header>
                <p><b>Click races for detailed results</b></p>
                <p class="blank"></p>
                {rows}
            </section>
        )
    }
}

export default Dashboard