const { error } = require("console");
const moment = require("moment")

async function fetch_data() {
    console.log("Starting fetch sequence!")
    const fs = require("fs");
    const election_list_ids = ["2024-pres-elections", "2024-sen-elections", "2024-house-elections"]
    const wait = {"nyt" : 1, "cnn" : 1, "ddhq" : 1, "ap" : 1, "sos" : 1}
    for (const election_list_id of election_list_ids) {
        const election_list = JSON.parse(fs.readFileSync(__dirname + "/metadata/" + election_list_id + ".json"));
        for (const election_id of Object.keys(election_list)) {

            const election_metadata = election_list[election_id]
            const time = Number(election_metadata["time"])
            const hour = Math.floor(Number(election_metadata["time"]))
            const closing = moment("202411051200", "YYYYMMDDhhmm").add(hour, "hours").add(hour == time ? 0 : 30, "minutes")
            const now = moment()
            const until = closing.diff(now, "minutes")
            if (election_metadata["importance"] !== undefined && Math.floor(Math.random() * election_metadata["importance"]) !== 0 || until > 0) {
                console.log("Not querying " + election_id + ". There are " + until + " more minutes.")
                continue
            }
            if (!election_metadata["fetch"]) {
                continue
            }
            console.log("Querying " + election_id)
            const source_fetchers = {"nyt" : fetch_nyt, "cnn" : fetch_cnn, "ddhq" : fetch_ddhq, "ap" : fetch_ap}
            let results = {}
            let get_out = false
            for (const [source, url] of Object.entries(election_metadata["sources"])) {
                try {
                    if (Math.floor(Math.random() * wait[source]) === 0 && source_fetchers[source] !== undefined) {
                        let result = await source_fetchers[source](url)
                        if (result != null) {
                            results[source] = result
                            wait[source] = 1
                        }
                    }
                }
                catch (error) {
                    if (error instanceof SyntaxError || error.message === "The server can not find the requested resource.") {
                        console.log("Failed to fetch from " + source + " for " + election_id + ".")
                    }
                    else if (error.message === "429") {
                        console.log("429 in " + source + " for " + election_id + ".")
                        send_text("429 in " + source + " for " + election_id + ".")
                        wait[source] = 100
                        get_out = true
                    }
                    else {
                        send_text("FETCH ERROR in " + election_id)
                        throw error
                    }
                }
            }
            if (get_out || Object.keys(results).length === 0) {
                continue
            }
            try {
                const aggregate_results = aggregate_sources(election_id, election_metadata, results)
                update_storage(election_id, election_metadata, aggregate_results)
            } catch (error) {
                send_text("AGGREGATION ERROR in " + election_id)
            }
        }
    }
}

function standardize_name(name) {
    return name.replace(" Jr.", "")
}

function fetch_nyt(url) {
    return fetch(url)
        .then((res) => {
            if (res.ok) {
                return res.json()
            } else if (res.status === 429) {
                throw new Error("429")
            } else {
                throw new Error("Bad Response")
            }
        })
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
            if (data.message !== undefined && data.message === "The server can not find the requested resource.") {
                throw Error("The server can not find the requested resource.")
            }
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
    return fetch(url)
        .then((res) => {
            if (res.ok) {
                return res.json()
            } else if (res.status === 429) {
                throw new Error("429")
            } else {
                throw new Error("Bad Response")
            }
        })
        .then((data) => {
            const candidates = {}
            for (const candidate_metadata of data["candidates"]) {
                candidates[candidate_metadata["cand_id"]] = standardize_name(candidate_metadata["last_name"])
            }
            let results = {}
            for (const county_data of data["vcus"]) {
                let fips = county_data["fips"]
                if (fips === "02") {
                    fips = "02000"
                }
                results[fips] = {}
                for (const candidate_data of county_data["candidates"]) {
                    results[fips][candidates[candidate_data["cand_id"]]] = candidate_data["votes"]
                }
                results[fips]["total"] = county_data["total_votes"]
                results[fips]["turnout"] = county_data["estimated_votes"]["estimated_votes_mid"]
            }
            return results
        })
}

function fetch_ap(url) {
    return fetch(url[0])
        .then((res) => {
            if (res.ok) {
                return res.json()
            } else if (res.status === 429) {
                throw new Error("429")
            } else {
                throw new Error("Bad Response")
            }
        })
        .then((data) => {
            const results = {}
            for (const county_data of Object.values(data)){
                const fips = county_data["fipsCode"]
                results[fips] = {}
                
                try {
                for (const candidate_data of county_data["candidates"]) {
                    results[fips][url[1][candidate_data["candidateID"]]] = candidate_data["voteCount"]
                }
            } catch (error) {
                    console.log(county_data)
                    console.log(county_data["candidates"])
                    throw error
                }
                results[fips]["total"] = county_data["parameters"]["vote"]["total"]
                results[fips]["turnout"] = county_data["parameters"]["vote"]["expected"]["actual"]
            }
            return results
        })
}

function fetch_sos(url) {
    return null
}

function aggregate_sources(election_id, election_metadata, results) {
    const sources = Object.keys(results)
    const aggregate_results = {"name" : election_metadata["name"], "candidates" : election_metadata["candidates"], "sources" : Object.keys(results), "kalshi" : election_metadata?.["kalshi"], "kalshi_margin" : election_metadata?.["kalshi_margin"]}
    const fs = require("fs");
    const counties_list = JSON.parse(fs.readFileSync(__dirname + "/metadata/fips/fips_" + election_id.split('-')[1] + ".json"))
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
    for (const fips of Object.keys(counties_list)) {
        if (Object.values(results).map((result) => result[fips] === undefined).every(Boolean)) {
            delete aggregate_results["results"][fips]
            continue
        }
        main_source = sources.reduce((a, b) => results[a][fips]["total"] > results[b][fips]["total"] ? a : b)
        aggregate_results["results"][fips]["main_source"] = main_source
        min_source = sources.reduce((a, b) => results[a][fips]["turnout"] < results[b][fips]["turnout"] ? a : b)
        aggregate_results["results"][fips]["min_source"] = min_source
        max_source = sources.reduce((a, b) => results[a][fips]["turnout"] > results[b][fips]["turnout"] ? a : b)
        aggregate_results["results"][fips]["max_source"] = max_source
        if (results[max_source][fips]["turnout"] === NaN) {
            console.log(max_source, fips)
            max_source = min_source
        }
        
        for (const candidate of election_metadata["candidates"]) {
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
        const prev_aggregate_results = JSON.parse(fs.readFileSync(__dirname + "/results/" + election_metadata["prev"].substring(0, 4) + "/" + election_metadata["prev"] + ".json"))
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
    })
}

function update_storage(election_id, election_metadata, aggregate_results) {
    
    const fs = require("fs")
    let prev_aggregate_results = {}
    try {
        prev_aggregate_results = JSON.parse(fs.readFileSync(__dirname + "/results/" + election_id.substring(0, 4) + "/" + election_id + ".json"))
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
        results_history = JSON.parse(fs.readFileSync(__dirname + "/results/" + election_id.substring(0, 4) + "/" + election_id + "-history.json"))
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
    const counties = []
    for (let i = 0; i < aggregate_results["results"].length; i++) {
        const new_results_row = {}

        for (const candidate of election_metadata["candidates"]) {
            new_results_row[candidate] = aggregate_results["results"][i][candidate] - prev_aggregate_results["results"][i][candidate]
        }
        new_results_row["total"] = aggregate_results["results"][i]["total"] - prev_aggregate_results["results"][i]["total"]
        if (aggregate_results["results"][i]["total"] < prev_aggregate_results["results"][i]["total"] && !(prev_aggregate_results["results"][i]["main_source"] in aggregate_results["sources"])) {
            aggregate_results["results"][i] = prev_aggregate_results["results"][i]
            continue
        }

        if (!Object.values(new_results_row).every(item => item === 0) || results_history["margin_history"].length === 0) {
            diffs[String(i)] = new_results_row
            counties.push(aggregate_results["results"][i]["county"])
        }
    }
    if (Object.keys(diffs).length !== 1) {
        console.log("Update for " + election_id + "!")
        if (election_metadata["notify"] === "true" && process.env.NODE_ENV !== 'production'){
            send_text(election_metadata["name"] + "\n" + counties.toString())
        }
        results_history["diffs"].push(diffs)
        results_history["margin_history"].push({"time" : current_time, "margin" : aggregate_results["results"][0]["margin"], "total" : aggregate_results["results"][0]["total"]})
        fs.writeFileSync(__dirname + "/results/" + election_id.substring(0, 4) + "/" + election_id + "-history.json", JSON.stringify(results_history, null, 4));
    }
    fs.writeFileSync(__dirname + "/results/" + election_id.substring(0, 4) + "/" + election_id + ".json", JSON.stringify(aggregate_results, null, 4));
}

module.exports = {fetch : fetch_data, text : send_text}