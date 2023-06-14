/**
 * @author Joseph Alton
 */
import express from 'express';
import { Request, Response, Express } from 'express';
import wordsCounter from 'word-counting'
import swaggerJsDoc from 'swagger-jsdoc';
import puppeteer from 'puppeteer';
const app : Express = express();
const fetch = require('sync-fetch');

const options = {
    failOnErrors: true,
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Webpage word counter API',
            version: (process.env.npm_package_version as string),
        },
    },
    apis: ["src/index.ts"]
};

export const openapiSpecification = swaggerJsDoc(options);

/**
 * @openapi
 * /wordcount:
 *   get:
 *     description: Get word count from HTML source. Also counts embedded HTML elements in the same way.
 *     summary: Webpage (HTML) word count with HTML source.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         description: Page (HTML) URL, which to perform word count
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success - word count retrieved for HTML page, and embedded HTML pages
 *       400:
 *         description: Bad Request - need to include query parameter 'page' with a valid webpage URL
 *       404:
 *         description: Unsuccessful / partially successful word count, (embedded) webpage(s) not counted
 *          
 */
app.get('/wordcount', (req : Request, res : Response) => {
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
  req.query.page = addHTTPtoUrl(req.query.page as string);

  // Try fetching the webpage from the URL
  count = wordCount((req.query.page as string), successfulUrls, failedUrls);

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

app.get('/test', async (req : Request, res : Response) => {
  // If no query parameter named page is passed in, return a 400 indicating Bad Request
  if(req.query.page === undefined)
  {
    res.status(400).send('A query parameter named \'page\' must be included in the HTTP GET request, e.g. <API-URL>/htmljs?page=http://www.foo.com/bar.html');
    return;
  }
  
  // Add a http:// to the entered url, if it is missing.
  req.query.page = addHTTPtoUrl(req.query.page as string);

  scrapeLogic(res, req.query.page);
});

/**
 * @openapi
 * /dynamicwordcount:
 *   get:
 *     description: Words counted via the page rendered with a headless browser.
 *     summary: Webpage word count via rendered content
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         description: Page (HTML) URL, which to perform word count
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success - word count retrieved HTML page
 *       400:
 *         description: Bad Request - need to include query parameter 'page' with a valid webpage URL
 *       404:
 *         description: Unsuccessful word count, check URL
 *          
 */
app.get('/dynamicwordcount', async (req : Request, res : Response) => {
    // If no query parameter named page is passed in, return a 400 indicating Bad Request
    if(req.query.page === undefined)
    {
      res.status(400).send('A query parameter named \'page\' must be included in the HTTP GET request, e.g. <API-URL>/htmljs?page=http://www.foo.com/bar.html');
      return;
    }

    // Add a http:// to the entered url, if it is missing.
    req.query.page = addHTTPtoUrl(req.query.page as string);

    let count = await dynamicWordCount(req.query.page as string)

    if(count < 0)
    {
      /*
       A "404 Not Found", the web page could not be retrieved
      */
      res.status(404).send(`Failed word count at URL: ${req.query.page}, check url/page.`);
      return;
    }

    res.status(200).send(`${count}`);
  
});

/**
 * Count the words of a HTML page, as well as any embedded HTML pages on that page.
 * This method is not for content dynamically rendered through JavaScript, for that @see dynamicWordCount
 * @function
 * @param url - the URL of the page to be word counted
 * @param successfulUrls - An array of the pages successful counted, shared amongst the whole application
 * @param failedUrls - An array of the URLs that resulted in an error when fetching (not contributing to final word count)
 * @returns the count as a number
 */
export function wordCount(url : string, successfulUrls : string[], failedUrls : string[]) : number
{
  let count : number = 0;
  let body : string;
  // 1.  get word count for current page
  try {
    console.log(`fetch ${url}`);
    const response = fetch(url);
    successfulUrls.push(url);
    // Convert the response into text
    body = response.text();
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
    count += wordCount(urlResolver(url, embeddedUrl), successfulUrls, failedUrls);
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

function addHTTPtoUrl(url : string) : string
{
  if(url.substring(0,7).toLowerCase() !== 'http://'
    &&
    url.substring(0,8).toLowerCase() !== 'https://'
  )
  {

    return 'http://'+url;
  }

  return url;
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

/**
 * Count the words of a HTML page as it would be rendered dynamically from a users browser
 * For a simple word count that does a simple parse of the HTML source, @see wordCount
 * @function
 * @param url - the URL of the page to be word counted
 * @returns the count as a number ( must be awaited )
 */
export async function dynamicWordCount(url : string) : Promise<number>
{
  try {
  // Launch the browser
  const browser = await puppeteer.launch({
    // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    // args: ['--no-sandbox', '--disable-setuid-sandbox','--single-process','--no-zygote'],
  headless: "new"}); // new headless implementation

  // Create a page
  const page = await browser.newPage();

  // Go to your site
  await page.goto(url);

  // extract all innerText from HTML elements rendered in headless browser
  const extractedText = await page.$eval('*', (el : any) => el.innerText);
  await browser.close();

  // split the text on full stop, comma, space, and newline
  return extractedText.split(/[\s\n\.,\r]+/).length;

  } catch (error) {
    console.log(error);
  }

  // Error code
  return -1;
}



const scrapeLogic = async (res : any, url : string) => {
  // headless new gives the error: "Something went wrong while running Puppeteer: Error: Requesting main frame too early!" in Docker"
  // headful ( default ) - works
  // headless true?
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
    const page = await browser.newPage();

    await page.goto(url);
    const logStatement = await page.$eval('*', (el : any) => el.innerText);
    res.send(logStatement);
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};


module.exports = {app, openapiSpecification, wordCount, getEmbeddedPageUrls, urlResolver, dynamicWordCount};