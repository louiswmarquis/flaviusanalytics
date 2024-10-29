const express = require("express");

const PORT = process.env.PORT || 3001;

const app = express();

app.get("/results/:election_id", (req, res) => {
  const fs = require("fs");
  data = JSON.parse(fs.readFileSync("server\\results\\" + req.params.election_id + ".json"));
  res.json(data);
});

app.get("/get_totals", (req, res) => {
  const fs = require("fs");
  const election_list_ids = ["2022-gov-elections", "2022-sen-elections"]
  const content = {}
  for (const election_list_id of election_list_ids){
    const election_list = JSON.parse(fs.readFileSync("server\\metadata\\" + election_list_id + ".json"))
    for (const election_id of Object.keys(election_list)) {
      const results = JSON.parse(fs.readFileSync("server\\results\\" + election_id + ".json"))
      const time = election_list[election_id]["time"]
      if (time === undefined) {
        continue
      }
      if (content[time] === undefined) {
        content[time] = {}
      }
      content[time][election_id] = {"name" : election_list[election_id]["name"], "candidates" : results["candidates"], "total" : results["results"][0], "winner" : results["results"][0]["margin"] >= 0 ? results["candidates"][0] : results["candidates"][1]}
    }
  }
  res.json(content)
});

const fetch_data = require("./fetch")
fetch_data();
setInterval(() => {
  fetch_data();
}, 10000);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

