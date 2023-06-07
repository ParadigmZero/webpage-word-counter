const port : number = 4000;
const {app} = require("./index");
const {openapiSpecification} = require('./index');
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';



// var path = require('path');
// var scriptName = path.basename(__filename);
// console.log(scriptName);
// let s = /src\/index.[tj]s/.exec(__filename.replaceAll(`\\`,'/'))![0];
// console.log(s);
// console.log("test!");
// console.log(__filename.replaceAll(`\\`,'/').);

// console.log(`${__dirname}/src/index.ts`.replace(`\\`,'/'));

// console.log(process.cwd());

app.use(cors());

app.use('/docs', swaggerUI.serve, swaggerUI.setup(openapiSpecification));


app.listen(port, () => {
  console.log(`Application started on port ${port}!`);
});