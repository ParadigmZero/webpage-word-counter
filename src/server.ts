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
  let count = await wordCount((req.query.page as string));

  if(count < 0)
  {
    res.status(404).send(`Error fetching page, or embedded page at ${req.query.page}`);
    return;
  }

  res.status(200).send(count.toString());
});

async function wordCount(url : string) : Promise<number>
{
  let count = 0;
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
    // signal issue fetching the page (in progress)
    return -1;
  }

  /* shorten url just to a directory
   take off anything after a /
   e.g. http://mysite.com/mydir/index.html -> http://mysite.com/mydir/
  */
  url = url.replace(/[^\/]*$/,'');

  // count the words of this page
  count += wordsCounter(body, { isHtml: true }).wordsCount;
  console.log(count);

  // 2. get word count for all embedded html pages
  let temp : any[];


  let iframes : RegExpMatchArray | null = body.match(/<[ ]*iframe[^>]*>/g);
  //extract data
  if(iframes !== null)
  {
    // convert to lower case for ease of processing
    temp = iframes.map((iframe)=>{ 
      console.log(iframe);
      return iframe.toLowerCase();
    });
    // filter those out that don't have a src
    temp = temp.filter((iframe)=>{
      return /src[ ]*=[ ]*["'][^'^"]+["']/.test(iframe);
    });
    // extract the urls
    temp = temp.map((iframe)=>{
      console.log("value OK?");
      // return /src[ ]*=[ ]*["'][^'"]+["']/.exec(embed)![0].replace(/src[ ]*=[ ]*["']([^'"]+)["']/,'$1');
      console.log(/src[ ]*=[ ]*["'][^'^"]*["']/.exec(iframe)![0]);
      console.log(/src[ ]*=[ ]*["'][^'^"]*["']/.exec(iframe)![0].replace(/["']([^"']+)["']/,'$1'));
      return /src[ ]*=[ ]*["'][^'^"]*["']/.exec(iframe)![0].replace(/src[ ]*=[ ]*["']([^'^"]*)["']/,'$1');

    });
    // iterate through the iframe urls doing a word count on each
    for(const iframeUrl of temp) {
          count += await wordCount(urlResolver(url,iframeUrl));
    }  
  }

  let embeds : RegExpMatchArray | null = body.match(/<[ ]*embed[^>]*>/g);
    //extract data
    if(embeds !== null)
    {
      // convert to lowercase
      temp = embeds.map((embed)=>{ return embed.toLowerCase()});
      // filter out those not of type "text/html" ( must have a source too)
      temp = temp.filter((embed)=>{
        return /type[ ]*=[ ]*["']text\/html["']/.test(embed)
        &&
        /src[ ]*=[ ]*["'][^'"]+["']/.test(embed);
      });

      // get the urls
      temp = temp.map((embed)=>{
        return /src[ ]*=[ ]*["'][^'"]+["']/.exec(embed)![0].replace(/src[ ]*=[ ]*["']([^'"]+)["']/,'$1');
      })

      for(const embedUrl of temp) {
        count += await wordCount(urlResolver(url,embedUrl));
      }  
    }

  let objects : RegExpMatchArray | null = body.match(/<[ ]*object[^>]*>/g);
  if(objects !== null)
  {
    // convert to lowercase
    temp = objects.map((object)=>{
      return object.toLowerCase();
    }
      );
    // filter out objects without a HTML data tag
    temp = temp.filter((object)=>{
        // looking for something like the following: data="./index.html"
        return /data[ ]*=[ ]*["'][^'^"]*htm[l]["']/.test(object);
      }
    );
    // get the urls for all the object tags
    temp = temp.map((obj)=>{
      // 1. for example: match data="./index.html", we already know it exists from before
      // 2. for example:  get ./index.html from data="./index.html"
      return /data[ ]*=[ ]*["'][^'^"]*htm[l]["']/.exec(obj)![0].replace(/data[ ]*=[ ]*["']([^'^"]*)["']/,'$1');
    })
      
    for(const objectTagUrl of temp) {
      count += await wordCount(urlResolver(url,objectTagUrl));
    } 

  }


  // // extract source if correct type. Will need to filter, as not always a site.
  // console.log(embeds);


  // let objects : RegExpMatchArray | null = body.match(/<[ ]*object[^>]*>/g);
  // // extract data if .htm(l) file
  // console.log(objects);



    // iframes?.forEach((iframe) => {
    //   console.log(iframe);
      
    //   // a forEach is clunky seeing as we only need 1 value
    //   iframe.match(/src[ ]*=[ ]*["-][^'^"]*["']/)?.forEach((t)=>{
    //     // console.log(t.replace(/src[ ]*=[ ]*/,'').replace(/"([^"]*)"/,"$1"));
    //     embeddedCheck(count,urlResolver(url,t.replace(/src[ ]*=[ ]*/,'').replace(/"([^"]*)"/,"$1")))
    //   })

    //   // embeddedCheck(count,urlResolver(url,"placeholder"));
    // });





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