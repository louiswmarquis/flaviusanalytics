async function fetch_data() {
    const fs = require("fs");
    elections = JSON.parse(fs.readFileSync("server\\metadata\\2022-gov-elections.json"));
    for (election_id of election_list) {
        election_metadata = elections[election_id]
        source_fetchers = {"nyt" : fetch_nyt, "cnn" : fetch_cnn, "ddhq" : fetch_ddhq, "sos" : fetch_sos}
        let results = {}
        for (const [source, url] of Object.entries(election_metadata["sources"])) {
            results[source] = source_fetchers[source](url)
        }
        let aggregate_results = await aggregate_sources(election_id, election_metadata, results)
        fs.writeFileSync("server\\results\\2022-az-gov-election.json", JSON.stringify(aggregate_results, null, 4));
    }

}

function fetch_nyt(url) {
    return fetch(url[0])
        .then((response) => response.json())
        .then((data) => data["races"][0])
        .then((data) => {
            let results = {}
            for (county_data of data["reporting_units"]) {
                if (county_data["level"] !== "state") {
                    let fips = county_data["fips_state"] + county_data["fips_county"]
                    results[fips] = {}
                    for (candidate_data of county_data["candidates"]) {
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
            let results = {}
            for (county_data of data){
                let fips = county_data["countyFipsCode"]
                results[fips] = {}
                for (candidate_data of county_data["candidates"]) {
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
                results[fips] = {}
                for ([candidate, ddhqid] of Object.entries(url[1])) {
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

async function aggregate_sources(election_id, election_metadata, results) {
    const aggregate_results = {"candidates" : election_metadata["candidates"], "results" : {}, "sources" : []}
    const fs = require("fs");
    const counties_list = JSON.parse(fs.readFileSync("server\\metadata\\fips\\fips_" + election_id.split('-')[1] + ".json"))
    for ([fips, county] of Object.entries(counties_list)) {
        const aggregate_county_results = {
            "county" : county,
            "total" : 0,
            "min_turnout" : 100000000,
            "max_turnout" : 0,
            "main_source" : "nyt",
            "min_source" : "nyt",
            "max_source" : "nyt"
        }
        for (candidate of election_metadata["candidates"]) {
            aggregate_county_results[candidate] = 0
        }
        aggregate_results["results"][fips] = aggregate_county_results
    }
    for (source of Object.keys(results)) {
        if (results[source] === null) {
            continue
        }
        aggregate_results["sources"].push(source)
        results[source] = await results[source]
        for ([fips, county_data] of Object.entries(results[source])) {
            if (results[source][fips]["total"] > aggregate_results["results"][fips]["total"]) {
                for (candidate of election_metadata["candidates"]) {
                    aggregate_results["results"][fips][candidate] = results[source][fips][candidate]
                }
                aggregate_results["results"][fips]["total"] = results[source][fips]["total"]
            }
            if (results[source][fips]["turnout"] < aggregate_results["results"][fips]["min_turnout"]) {
                aggregate_results["results"][fips]["min_source"] = source
                aggregate_results["results"][fips]["min_turnout"] = results[source][fips]["turnout"]
            }
            if (results[source][fips]["turnout"] > aggregate_results["results"][fips]["max_turnout"]) {
                aggregate_results["results"][fips]["max_source"] = source
                aggregate_results["results"][fips]["max_turnout"] = results[source][fips]["turnout"]
            }

        }
    }
    aggregate_results["results"] = Object.keys(aggregate_results["results"]).toSorted().map((fips) => aggregate_results["results"][fips])
    return aggregate_results
}

module.exports = fetch_data