/**
 * @author Joseph Alton
 */
import express from 'express';
import { Request, Response, Express } from 'express';
import wordsCounter from 'word-counting'
import cors from 'cors';
const app : Express = express();

app.use(cors());

// Take in the page, we are going to count the words on, in a query parameter named 'page'
app.get('/', async (req : Request, res : Response) => {
  // If no query parameter named page is passed in, return a 400 indicating Bad Request
  if(req.query.page === undefined)
  {
    res.status(400).send('A query parameter named \'page\' must be included in the HTTP GET request, e.g. <API-URL>/?page=http://www.foo.com/bar.html');
    return;
  }

  let count : number = 0;
  let successfulUrls : string[] = [];
  let failedUrls : string[] = [];
  let responseBody : {message:string,wordCount?:number,countedPages?:string[],uncountedPages?:string[]} = 
  {message:"",
  wordCount:count,
  countedPages:successfulUrls,
  uncountedPages:failedUrls};

  // Add a http:// to the entered url, if it is missing.
  if((req.query.page as string).substring(0,7).toLowerCase() !== 'http://'
    &&
    (req.query.page as string).substring(0,8).toLowerCase() !== 'https://'
  )
  {

    req.query.page = 'http://' + req.query.page;
  }

  // Try fetching the webpage from the URL
  count = await wordCount((req.query.page as string), successfulUrls, failedUrls);

  responseBody.wordCount = count;

  if(failedUrls.length > 0)
  {
    responseBody.message=`Failed to fetch ${failedUrls.length} (embedded) page(s) for word count.`;
    /*
     A "404 Not Found" is used in case, because some/all pages could not be found for the word count.
    */
    res.status(404).send(responseBody);
    return;
  }

  responseBody.message=`Success fetching ${successfulUrls.length} page(s) to word count.`

  res.status(200).send(responseBody);
});

/**
 * Count the words of a HTML page, as well as any embedded HTML pages on that page.
 * @function
 * @param url - the URL of the page to be word counted
 * @param successfulUrls - An array of the pages successful counted, shared amongst the whole application
 * @param failedUrls - An array of the URLs that resulted in an error when fetching (not contributing to final word count)
 * @returns the count as a number ( must be awaited )
 */
export async function wordCount(url : string, successfulUrls : string[], failedUrls : string[]) : Promise<number>
{
  let count : number = 0;
  let body : string;
  // 1.  get word count for current page
  try {
    console.log(`fetch ${url}`);
    const response = await fetch(url);
    successfulUrls.push(url);
    // Convert the response into text
    body = await response.text();
  } catch (error) {
    console.log(`Error fetching page ${url}`)
    console.log(error);
    failedUrls.push(url);
    return 0;
  }

  /* shorten url just to a directory
   take off anything after a /
   e.g. http://mysite.com/mydir/index.html -> http://mysite.com/mydir/
  */
  url = url.replace(/[^\/]*$/,'');

  // count the words of this page
  count += wordsCounter(body, { isHtml: true }).wordsCount;

  // 2. get word count for all embedded html pages
  let temp : string[] = getEmbeddedPageUrls(body);

  for(const embeddedUrl of temp)
  {
    count += await wordCount(urlResolver(url, embeddedUrl), successfulUrls, failedUrls);
  }  
  
  return count;
}

/**
 * A helper function to extract page URLS from embedded HTML elements, within a HTML string
 * @function
 * @param body a string of HTML that is to be scanned for embedded HTML
 * @returns an array of strings, of all the (relative/absolute) urls, of embedded HTML elements
 */
export function getEmbeddedPageUrls(body : string) : string[] {
  let temp : string[];
  let embeddedPageUrls : string[] = [];

  let iframes : RegExpMatchArray | null = body.match(/<[ ]*iframe[^>]*>/g);
  //extract data
  if(iframes !== null)
  {
    // convert to lower case for ease of processing
    temp = iframes.map((iframe)=>{ 
      return iframe.toLowerCase();
    });
    // filter those out that don't have a src
    temp = temp.filter((iframe)=>{
      return /src[ ]*=[ ]*["'][^'^"]+["']/.test(iframe);
    });
    // extract the urls
    temp = temp.map((iframe)=>{
      return /src[ ]*=[ ]*["'][^'^"]+["']/.exec(iframe)![0].replace(/src[ ]*=[ ]*["']([^'^"]+)["']/,'$1');
    });
    // iterate through the iframe urls doing a word count on each
    for(const iframeUrl of temp) {
      embeddedPageUrls.push(iframeUrl);
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
        embeddedPageUrls.push(embedUrl);
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
      embeddedPageUrls.push(objectTagUrl);
    }
  }

  return embeddedPageUrls;
}

/**
 * A helper function to convert a partial url if needed:
 * ./change.html -> http://www.mysite.com/change.html
 * http://example.com/dir1/dir2/noChange.html
 * @function
 * @param originalUrl - the base site, in the following format: e.g. http://www.domain.com/ or http://www.domain.com/dir/
 * @param newUrl - the url to be resolved, it may be relative, e.g. './site.html' or 'site.html'
 * or complete such as http://www.domain.com/dir/site.html
 * @returns a full URL that can be fetched, e.g. http://www.domain.com/site.html
 */
export function urlResolver(originalUrl : string, newUrl : string) : string {
  // if its a full URL i.e. has a http:// or https:// then use this url as the full url
  if(newUrl.substring(0,7).toLowerCase() === 'http://' || newUrl.substring(0,8).toLowerCase() === 'https://') {
    return newUrl;
  }
  // otherwise you will have to append this onto the end of the "base" url
  return `${originalUrl}${newUrl.replace(/^[.]/,'').replace(/\//,'')}`;
}

module.exports = {app, wordCount, getEmbeddedPageUrls, urlResolver};