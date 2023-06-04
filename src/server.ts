import express from 'express';
import { Request, Response } from 'express';
import wordsCounter from 'word-counting'
import cors from 'cors';
import { SourceTextModule } from 'vm';

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
  let count = await embeddedCheck(0, (req.query.page as string));

  if(count < 0)
  {
    res.status(404).send(`Error fetching page, or embedded page at ${req.query.page}`);
    return;
  }

  res.status(200).send(count.toString());
});

async function embeddedCheck(countIn : number, url : string) : Promise<number>
{
  let count = countIn;
  let body;
  // 1.  get word count for current page
  try {
    console.log(`fetch ${url}`);
    const response = await fetch(url);
    // Convert the response into text
    body = await response.text();
  } catch (error) {
    console.log(`Error fetching page ${url}`)
    console.log(error);
    // signal issue fetching the page
    return -1;
  }

  /* shorten url just to a directory
   take off anything after a /
   e.g. http://mysite.com/mydir/index.html -> http://mysite.com/mydir/
  */
  url = url.replace(/[^\/]*$/,'');

  count += wordsCounter(body, { isHtml: true }).wordsCount;
  console.log(count);

  // 2. get word count for all embedded html pages
  
  let iframes : RegExpMatchArray | null = body.match(/<[ ]*iframe[^>]*>/g);
  //extract data
  if(iframes !== null)
  {
    for(const iframe of iframes) {
      let temp = iframe.match(/src[ ]*=[ ]*["-][^'^"]*["']/);
        if(temp !== undefined && temp !== null)
        {
          count += await embeddedCheck(count,urlResolver(url,temp[0].replace(/src[ ]*=[ ]*/,'').replace(/"([^"]*)"/,"$1")))
        }
    }  
  }




    // iframes?.forEach((iframe) => {
    //   console.log(iframe);
      
    //   // a forEach is clunky seeing as we only need 1 value
    //   iframe.match(/src[ ]*=[ ]*["-][^'^"]*["']/)?.forEach((t)=>{
    //     // console.log(t.replace(/src[ ]*=[ ]*/,'').replace(/"([^"]*)"/,"$1"));
    //     embeddedCheck(count,urlResolver(url,t.replace(/src[ ]*=[ ]*/,'').replace(/"([^"]*)"/,"$1")))
    //   })

    //   // embeddedCheck(count,urlResolver(url,"placeholder"));
    // });


  // let embeds : RegExpMatchArray | null = body.match(/<[ ]*embed[^>]*>/g);
  // // extract source if correct type. Will need to filter, as not always a site.
  // console.log(embeds);


  // let objects : RegExpMatchArray | null = body.match(/<[ ]*object[^>]*>/g);
  // // extract data if .htm(l) file
  // console.log(objects);


  return count;
}

/*
 Convert a partial url, e.g. 'about.html', './about.html', './me/about.html' etc
 if needed.
 e.g.
 ./about.html -> http://www.mysite.com/about.html
 http://example.com/dir1/dir2/noChange.html
 */
function urlResolver(originalUrl : string, newUrl : string) : string {

  // if its a full URL i.e. has a http:// or https:// then use this url as the full url
  if(newUrl.substring(0,7).toLowerCase() === 'http://' || newUrl.substring(0,8).toLowerCase() === 'https://') {
    return newUrl;
  }

  // otherwise you will have to append this onto the end of the "base" url
  return `${originalUrl}${newUrl.replace(/^[.]/,'').replace(/\//,'')}`;

}


app.listen(4000, () => {
  console.log('Application started on port 4000!');
});




/*
 SANDBOX
*/
/*
regex for matching a short url
e.g.
^(.\/|\/)?[a-zA-Z0-9-_ ]*.[x]?htm[l]?$
let bool = /^(.\/|\/)?[a-zA-Z0-9-_ ]*.[x]?htm[l]?$/.test('./mysite.html');
*/ 