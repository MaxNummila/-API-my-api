const app = require("./app");
const { PORT } = require("./config");

const start = async () => {
  await app.ready;
  app.listen(PORT, () => console.log("API running on port", PORT));
};

start();
