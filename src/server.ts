import express from 'express';
import { Request, Response } from 'express';
import wordsCounter from 'word-counting'
import cors from 'cors';

const app = express();

app.use(cors());

// Take in the page, we are going to count the words on, in a query parameter named 'page'
app.get('/', async (req : Request, res : Response) => {
  // If no query parameter named page is passed in, return a 400 indicating Bad Request
  if(req.query.page === undefined)
  {
    res.status(400).send('A query parameter named \'page\' must be included in the HTTP GET request, e.g. <API-URL>/?page=http://www.foo.com/bar.html');
    return;
  }

  let body : string;

  // // Add a http:// to the entered url, if it is missing.
  if((req.query.page as string).substring(0,7).toLowerCase() !== 'http://'
    &&
    (req.query.page as string).substring(0,8).toLowerCase() !== 'https://'
  )
  {

    req.query.page = 'http://' + req.query.page;
  }

  // Try fetching the webpage from the URL
  try {
    const response = await fetch(`${req.query.page}`);
    // Convert the response into text
    body = await response.text();

  } catch (error) {
    console.log("Error fetching page:")
    console.log(error);
    res.status(404).send(`Error retrieving page from URL:\n${req.query.page}\ncheck this is a valid url.`);
    return;
  }
  
  res.status(200).send(wordsCounter(body, { isHtml: true }).wordsCount.toString());
});


app.listen(4000, () => {
  console.log('Application started on port 4000!');
});
