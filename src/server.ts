const port : number = 4000;
const {app} = require("./index");

app.listen(port, () => {
  console.log(`Application started on port ${port}!`);
});