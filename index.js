import express from "express";
import "dotenv/config";
import { Octokit } from "octokit";

const app = express();
const port = 2537;
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const queries = {
  "getStarred": `
    query {
      user(login: "Julek-Git") {
        pinnedItems(first: 6) {
          nodes {
            ... on Repository {
              name,
              description,
              url
            }
          }
        }
      }
    }
  `,
};


app.get("/", (req, res) => {
  res.send("Hello API!");
});

app.get("/get/:query", async (req, res) => {
  const query = queries[req.params.query];
  if (query === undefined) {
    res.json({"status": "Not found"});
    res.end();
  }
  
  const api_response = await octokit.graphql(query);
  res.json(api_response);
  res.end();
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
