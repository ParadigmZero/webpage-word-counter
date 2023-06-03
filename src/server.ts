import express from 'express';
import { Request, Response } from 'express';
import bodyParser from 'body-parser';

const app = express();

// Middleware
// parse JSON in request bodies
// app.use(bodyParser.json());

// Take in the page, we are going to count the words on, in a query parameter named 'site'
app.get('/', (req: Request, res: Response) => {
  if(req.query.site === undefined)
  {
    res.statusCode = 400;
    res.send('a query parameter named \'site\' to be included in the HTTP GET request, e.g. <API-URL>/?site=http://www.foo.com/bar.html');
  }
  res.send(req.query.site);
});


app.listen(3000, () => {
  console.log('Application started on port 3000!');
});
