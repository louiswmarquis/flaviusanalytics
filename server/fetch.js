async function fetch_data() {
    console.log("Starting fetch sequence!")
    const fs = require("fs");
    const election_list_ids = ["2022-house-elections", "2022-gov-elections", "2022-sen-elections"]
    for (const election_list_id of election_list_ids) {
        const election_list = JSON.parse(fs.readFileSync("server\\metadata\\" + election_list_id + ".json"));
        for (const election_id of Object.keys(election_list)) {
            console.log("Querying " + election_id)

            const election_metadata = election_list[election_id]
            const source_fetchers = {"nyt" : fetch_nyt, "cnn" : fetch_cnn, "ddhq" : fetch_ddhq, "sos" : fetch_sos}
            let results = {}
            for (const [source, url] of Object.entries(election_metadata["sources"])) {
                try {
                    let result = await source_fetchers[source](url)
                    if (result != null) {
                        results[source] = result
                        if (election_id === "2022-mo-sen-election") {
                            console.log(result)
                        }
                    }
                }
                catch (e) {
                    if (e instanceof SyntaxError) {
                        console.log("Failed to fetch from " + source + " for " + election_id + ".")
                    }
                }
            }
            if (Object.keys(results).length === 0) {
                continue
            }
            const aggregate_results = aggregate_sources(election_id, election_metadata, results)
            update_storage(election_id, election_metadata, aggregate_results)
        }
    }
}

function fetch_nyt(url) {
    return fetch(url[0])
        .then((response) => response.json())
        .then((data) => data["races"][0])
        .then((data) => {
            const results = {}
            for (const county_data of data["reporting_units"]) {
                if (county_data["level"] !== "state") {
                    const fips = county_data["fips_state"] + county_data["fips_county"]
                    results[fips] = {}
                    for (const candidate_data of county_data["candidates"]) {
                        results[fips][data["candidate_metadata"][candidate_data["nyt_id"]]["last_name"]] = candidate_data["votes"]["total"]
                    }
                    results[fips]["total"] = county_data["total_votes"]
                    results[fips]["turnout"] = county_data["total_expected_vote"]
                }
            }
            return results
        })
}

function fetch_cnn(url) {
    return fetch(url)
        .then((response) => response.json())
        .then((data) => {
            const results = {}
            for (const county_data of data){
                const fips = county_data["countyFipsCode"]
                if (fips.substring(0, 2) == "02") {
                    if (results["02000"] === undefined) {
                        results["02000"] = {}
                        for (const candidate_data of county_data["candidates"]) {
                            results["02000"][candidate_data["lastName"]] = 0
                        }
                        results["02000"]["total"] = 0
                        results["02000"]["turnout"] = 0
                    }
                    for (const candidate_data of county_data["candidates"]) {
                        results["02000"][candidate_data["lastName"]] += candidate_data["voteNum"]
                    }
                    results["02000"]["total"] += county_data["totalVote"]
                    results["02000"]["turnout"] += Math.round(county_data["totalVote"] / county_data["percentReporting"] * 100.0)
                    continue
                }
                results[fips] = {}
                for (const candidate_data of county_data["candidates"]) {
                    results[fips][candidate_data["lastName"]] = candidate_data["voteNum"]
                }
                results[fips]["total"] = county_data["totalVote"]
                results[fips]["turnout"] = Math.round(county_data["totalVote"] / county_data["percentReporting"] * 100.0)
            }
            return results
        })
}

function fetch_ddhq(url) {
    return fetch(url[0])
        .then((response) => response.json())
        .then((data) => {
            let results = {}
            for (county_data of data["countyResults"]["counties"]) {
                let fips = county_data["fips"]
                if (fips === "2") {
                    fips = "02000"
                }
                results[fips] = {}
                for (const [candidate, ddhqid] of Object.entries(url[1])) {
                    results[fips][candidate] = county_data["votes"][ddhqid]
                }
                results[fips]["total"] = Object.values(county_data["votes"]).reduce((a, b) => a + b, 0)
                results[fips]["turnout"] = county_data["estimated_votes"]["estimated_votes_mid"]
            }
            return results
        })
}

function fetch_sos(url) {
    return null
}

function aggregate_sources(election_id, election_metadata, results) {
    const sources = Object.keys(results)
    const aggregate_results = {"name" : election_metadata["name"], "candidates" : election_metadata["candidates"], "sources" : Object.keys(results)}
    const fs = require("fs");
    const counties_list = JSON.parse(fs.readFileSync("server\\metadata\\fips\\fips_" + election_id.split('-')[1] + ".json"))
    aggregate_results["results"] = Object.fromEntries(Object.entries(counties_list).concat([["00000", "Total"]]).map(([fips, county]) => ([fips, {
        "county" : county,
        ...Object.fromEntries(election_metadata["candidates"].map((candidate) => ([candidate, 0]))),
        "total" : 0,
        "margin" : 0,
        "min_turnout" : 100000000,
        "max_turnout" : 0,
        "main_source" : "nyt",
        "min_source" : "nyt",
        "max_source" : "nyt",
        "min_turnout_margin" : 0,
        "max_turnout_margin" : 0
    }])))
    aggregate_results["results"]["00000"]["min_turnout"] = 0
    for (fips of Object.keys(counties_list)) {
        if (Object.values(results).map((result) => result[fips] === undefined).every(Boolean)) {
            delete aggregate_results["results"][fips]
            continue
        }
        main_source = sources.reduce((a, b) => results[a][fips]["total"] > results[b][fips]["total"] ? a : b)
        aggregate_results["results"][fips]["main_source"] = main_source
        min_source = sources.reduce((a, b) => results[a][fips]["turnout"] < results[b][fips]["turnout"] ? a : b)
        aggregate_results["results"][fips]["min_source"] = min_source
        max_source  = sources.reduce((a, b) => results[a][fips]["turnout"] > results[b][fips]["turnout"] ? a : b)
        aggregate_results["results"][fips]["max_source"] = max_source
        
        for (candidate of election_metadata["candidates"]) {
            aggregate_results["results"][fips][candidate] = results[main_source][fips][candidate]
            aggregate_results["results"]["00000"][candidate] += results[main_source][fips][candidate]
        }
        aggregate_results["results"][fips]["total"] = results[main_source][fips]["total"]
        aggregate_results["results"]["00000"]["total"] += results[main_source][fips]["total"]

        let margin = results[main_source][fips][election_metadata["candidates"][0]] - results[main_source][fips][election_metadata["candidates"][1]]
        aggregate_results["results"][fips]["margin"] = margin
        aggregate_results["results"]["00000"]["margin"] += margin

        aggregate_results["results"][fips]["min_turnout"] = results[min_source][fips]["turnout"]
        aggregate_results["results"]["00000"]["min_turnout"] += results[min_source][fips]["turnout"]

        aggregate_results["results"][fips]["max_turnout"] = results[max_source][fips]["turnout"]
        aggregate_results["results"]["00000"]["max_turnout"] += results[max_source][fips]["turnout"]
        
        let min_turnout_margin = Math.round(margin * results[min_source][fips]["turnout"] / Math.max(1, results[main_source][fips]["total"]))
        aggregate_results["results"][fips]["min_turnout_margin"] = min_turnout_margin
        aggregate_results["results"]["00000"]["min_turnout_margin"] += min_turnout_margin
        
        let max_turnout_margin = Math.round(margin * results[max_source][fips]["turnout"] / Math.max(1, results[main_source][fips]["total"]))
        aggregate_results["results"][fips]["max_turnout_margin"] = max_turnout_margin
        aggregate_results["results"]["00000"]["max_turnout_margin"] += max_turnout_margin
    }
    aggregate_results["results"] = Object.keys(aggregate_results["results"]).toSorted().map((fips) => aggregate_results["results"][fips])
    if (election_metadata["prev"] !== undefined) {
      try {
        const prev_aggregate_results = JSON.parse(fs.readFileSync("server\\results\\" + election_metadata["prev"] + ".json"))
        for (let i = 0; i < aggregate_results["results"].length; i++) {
            aggregate_results["results"][i]["prev_margin"] = prev_aggregate_results["results"][i]["margin"]
            aggregate_results["results"][i]["prev_total"] = prev_aggregate_results["results"][i]["total"]
        }
      }
      catch (error) {
        if (error.code !== "ENOENT") {
          throw error
        }
      }
    }
    return aggregate_results
}

async function send_text(election_name) {
    fetch('https://api.mynotifier.app', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // To let the server know that we're sending JSON data
        },
        body: JSON.stringify({
            apiKey: 'cb9a0051-65cb-4a3a-99a9-eaddc5fc272d', // A unique key you get when signing up
            message: "New Update!", // The message you want to send to yourself/team
            description: election_name, // A more descriptive message. It's optional
            type: "success", // info, error, warning or success
        })
    }).then((res) => console.log(res))
}

function update_storage(election_id, election_metadata, aggregate_results) {
    
    const fs = require("fs")
    let prev_aggregate_results = {}
    try {
        prev_aggregate_results = JSON.parse(fs.readFileSync("server\\results\\" + election_id + ".json"))
    } catch (error) {
        if (error.code === "ENOENT") {
            prev_aggregate_results = {"results" : Object.fromEntries(Object.keys(aggregate_results["results"]).map((i) => [i, {...Object.fromEntries(election_metadata["candidates"].map((candidate) => ([candidate, 0]))), "total" : 0}]))}
        }
        else {
            throw error
        }
    }
    let results_history = {}
    try {
        results_history = JSON.parse(fs.readFileSync("server\\results\\" + election_id + "-history.json"))
    } catch (error) {
        if (error.code === "ENOENT") {
            results_history = {"margin_history" : [], "diffs" : []}
        }
        else {
            throw error
        }
    }
    const current_time = (new Date()).toISOString()
    const diffs = {"time" : current_time}
    for (let i = 0; i < aggregate_results["results"].length; i++) {
        const new_results_row = {}

        for (const candidate of election_metadata["candidates"]) {
            if (aggregate_results["results"][i][candidate] !== prev_aggregate_results["results"][i][candidate]) {
                new_results_row[candidate] = aggregate_results["results"][i][candidate] - prev_aggregate_results["results"][i][candidate]
            }
        }
        if (aggregate_results["results"][i]["total"] !== prev_aggregate_results["results"][i]["total"]) {
            new_results_row["total"] = aggregate_results["results"][i]["total"] - prev_aggregate_results["results"][i]["total"]
        }
        if (Object.keys(new_results_row).length !== 0) {
            diffs[String(i)] = new_results_row
        }
    }
    if (Object.keys(diffs).length !== 1) {
        console.log("Update for " + election_id + "!")
        send_text(election_metadata["name"])
        results_history["diffs"].push(diffs)
        results_history["margin_history"].push({"time" : current_time, "margin" : aggregate_results["results"][0]["margin"], "total" : aggregate_results["results"][0]["total"]})
        fs.writeFileSync("server\\results\\" + election_id + "-history.json", JSON.stringify(results_history, null, 4));
    }
    fs.writeFileSync("server\\results\\" + election_id + ".json", JSON.stringify(aggregate_results, null, 4));
}

module.exports = fetch_data