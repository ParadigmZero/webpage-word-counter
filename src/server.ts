const port : number = 4000;
const {app} = require("./index");
const {openapiSpecification} = require('./index');
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';

app.use(cors());

app.use('/', swaggerUI.serve, swaggerUI.setup(openapiSpecification));


app.listen(port, () => {
  console.log(`Application started on port ${port}!`);
  console.log(`Visit the API docs at <API-URL>/docs`)
});