import express from 'express';
import { Request, Response } from 'express';

const app = express();

// Take in the page, we are going to count the words on, in a query parameter named 'site'
app.get('/', async (req: Request, res: Response) => {
  if(req.query.page === undefined)
  {
    res.statusCode = 400; // Bad Request
    res.send('A query parameter named \'page\' must be included in the HTTP GET request, e.g. <API-URL>/?page=http://www.foo.com/bar.html');
    return;
  }

  try {
    const response = await fetch(`${req.query.page}`);
    // Convert the response into text
    const body = await response.text();
    console.log(body);

    /*
    Word counting happens here.
    */
  } catch (error) {
    console.log("Error fetching page:")
    console.log(error);
    res.statusCode = 404;
  }

  if(res.statusCode == 404)
  {
    res.send(`Error retrieving page from URL:\n${req.query.page}\ncheck this is a valid url.`);
    return;
  }

  res.send(req.query.page);
});


app.listen(3000, () => {
  console.log('Application started on port 3000!');
});
