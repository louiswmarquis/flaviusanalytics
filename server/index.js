const express = require("express");

const PORT = process.env.PORT || 3001;

const app = express();

app.get("/results/:election_id", (req, res) => {
  const fs = require("fs");
  data = JSON.parse(fs.readFileSync("server\\results\\" + req.params.election_id + ".json"));
  res.json(data);
});

election_list = ["2022-az-gov-election"]

fetch_data = require("./fetch")

fetch_data();
setInterval(() => {
  fetch_data();
}, 2000);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

