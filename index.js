import express from "express";
const app = express();
const port = 2537;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
