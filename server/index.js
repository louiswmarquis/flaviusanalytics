const express = require("express");
const moment = require("moment");

const PORT = process.env.PORT || 3001;

const app = express();

app.get("/api/get_map_data/:election_list_id", (req, res) => {
  const fs = require("fs");
  const election_list = JSON.parse(fs.readFileSync(__dirname + "/metadata/" + req.params.election_list_id + ".json"));
  const election_list_other = JSON.parse(fs.readFileSync(__dirname + "/metadata/" + req.params.election_list_id + "-other.json"));
  const map_data = {"other" : election_list_other, "main" : Object.fromEntries(Object.entries(election_list).map(([election_id, election_metadata]) => [election_id.substring(5, 7), election_metadata]))}
  res.json(map_data)
});

app.get("/api/get_map_totals", (req, res) => {
  const fs = require("fs");
  const election_list_id = req.query.election_list_id
  const content = {}
  const election_list = JSON.parse(fs.readFileSync(__dirname + "/metadata/" + election_list_id + ".json"))
  for (const election_id of Object.keys(election_list)) {
    content[election_id] = {}
    try {
      const results = JSON.parse(fs.readFileSync(__dirname + "/results/" + election_id.substring(0, 4) + "/" + election_id + ".json"))
      content[election_id]["total"] = results["results"][0]
      content[election_id]["winner"] = results["results"][0]["margin"] >= 0 ? results["candidates"][0] : results["candidates"][1]
    } catch (error) {
      if (error.code === "ENOENT") {
        content[election_id]["total"] = {"total" : 0, "margin" : 0, "min_turnout" : 0, "max_turnout" : 0}
        for (const candidate of election_list[election_id]["candidates"]) {
          content[election_id]["total"][candidate] = 0
        }
        content[election_id]["winner"] = ""
      }
      else {
        throw error
      }
    }
  }
  res.json(content)
});

app.get("/api/get_results/:election_id", (req, res) => {
  const fs = require("fs");
  let aggregate_data = {}
  try {
    aggregate_data = JSON.parse(fs.readFileSync(__dirname + "/results/" + req.params.election_id.substring(0, 4) + "/" + req.params.election_id + ".json"));
  }
  catch (error) {
    if (error.code === "ENOENT") {
        res.sendStatus(403)
        return
    }
    else {
        throw error
    }
  }

  const results_history = JSON.parse(fs.readFileSync(__dirname + "/results/" + req.params.election_id.substring(0, 4) + "/" + req.params.election_id + "-history.json"));
  const history_table = []
  for (let i = 0; i < Math.min(100, results_history["diffs"].length); i++) {
    const row = results_history["diffs"][results_history["diffs"].length - 1 - i]
    if (row["0"] === undefined || row["0"]["total"] === 0) {
      continue
    }
    const table_row = [moment(row["time"]).format("MM/DD HH:mm")]
    for (const candidate of aggregate_data["candidates"]) {
      table_row.push(String(row["0"][candidate]))
    }
    table_row.push(String(row["0"]["total"]))
    table_row.push(String(row["0"][aggregate_data["candidates"][0]] - row["0"][aggregate_data["candidates"][1]]))
    table_row.push((100 * (row["0"][aggregate_data["candidates"][0]] - row["0"][aggregate_data["candidates"][1]]) / row["0"]["total"]).toFixed(2) + "%")
    history_table.push(table_row)
  }
  res.json({"aggregate_data" : aggregate_data, "margin_history" : results_history["margin_history"], "history_table" : history_table});
});

app.get("/api/get_totals", (req, res) => {
  const fs = require("fs");
  const election_list_ids = req.query.election_list_ids
  const content = {}
  for (const election_list_id of election_list_ids){
    const election_list = JSON.parse(fs.readFileSync(__dirname + "/metadata/" + election_list_id + ".json"))
    for (const election_id of Object.keys(election_list)) {
      const time = election_list[election_id]["time"]
      if (time === undefined) {
        continue
      }
      if (content[time] === undefined) {
        content[time] = {}
      }
      if (content[time][election_list_id] === undefined) {
        content[time][election_list_id] = []
      }
      const box_content = {"election_id" : election_id, "name" : election_list[election_id]["name"], "candidates" : election_list[election_id]["candidates"], "kalshi" : election_list[election_id]["kalshi"], "kalshi_margin" : election_list[election_id]["kalshi_margin"]}
      try {
        const results = JSON.parse(fs.readFileSync(__dirname + "/results/" + election_id.substring(0, 4) + "/" + election_id + ".json"))
        box_content["total"] = results["results"][0]
        box_content["winner"] = results["results"][0]["margin"] > 0 ? results["candidates"][0] : (results["results"][0]["margin"] < 0 ? results["candidates"][1] : undefined)
      } catch (error) {
        if (error.code === "ENOENT") {
          box_content["total"] = {"total" : 0, "margin" : 0, "min_turnout" : 0, "max_turnout" : 0}
          for (const candidate of election_list[election_id]["candidates"]) {
            box_content["total"][candidate] = 0
          }
          box_content["winner"] = ""
        }
        else {
          throw error
        }
      }
      content[time][election_list_id].push(box_content)
    }
  }
  res.json(content)
});

send_text = require("./fetch").text
send_text("Starting server!")
const fetch_data = require("./fetch").fetch
fetch_data();
setInterval(() => {
  fetch_data();
}, 10000);

app.listen(process.env.PORT || PORT || 5000, () => {
  console.log(`Server listening on ${PORT}`);
});

if (process.env.NODE_ENV === 'production') {
  // Exprees will serve up production assets
  app.use(express.static(__dirname.slice(0, -7) + '/client/build'));

  // Express serve up index.html file if it doesn't recognize route
  app.get('*', (req, res) => {
    res.sendFile(__dirname.slice(0, -7) + "/client/build/index.html")
  })
}
