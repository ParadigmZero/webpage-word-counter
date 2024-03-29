const port: number = 4000;
import https from "https";
import fs from "fs";
import app, { openapiSpecification } from "./index";
import cors from "cors";
import swaggerUI from "swagger-ui-express";

app.use(cors());

app.use("/", swaggerUI.serve, swaggerUI.setup(openapiSpecification));

if (process.env.HTTPS === undefined) {
  console.log("no https");
  app.listen(port, () => {
    console.log(`Application started on port ${port}!`);
    console.log(`Visit the API docs at the base API url`);
  });
} else {
  https
    .createServer(
      {
        key: fs.readFileSync("./ssl/key.pem"),
        cert: fs.readFileSync("./ssl/cert.pem"),
      },
      app
    )
    .listen(port, () => {
      console.log(`Application started with HTTPS on port ${port}!`);
      console.log(`Visit the API docs at the base API url`);
    });
}
