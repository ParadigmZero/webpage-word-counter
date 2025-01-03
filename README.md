# Web page word counter

A simple API that counts the visible words on a web page (i.e. what the user sees).

There are two endpoints that can be used to count the words of a webpage, `wordcount` which just counts the words in HTML. `dynamicwordcount` will count the words on a page, as if it is rendered in a users browser, thus taking into account heavily scripted pages, which may alter what is shown to the user significantly.

Simply perform a HTTP GET request on either endpoint, passing in a query parameter named `page` with the url to the page. See [testing](#testing).

# (optional for use with HTTPS) generating certificates

In the `./ssl/.` folder, provide your own private key, as `key.pem`, and public certificate as `cert.pem`. Or generate a simple example self-signed certificate with the following command:

`npm run gencerts`

You will need `openssl` installed. For Linux/WSL/MacOS it is most likely installed already, for Windows the Scoop package manager is a good source.

# Details/limitations API

## /wordcount

This performs a word count on HTML elements, using the [word-counting library](https://www.npmjs.com/package/word-counting/).

Tags, comments, script text .etc are ignored, and all rendered HTML text is counted.

This can also count words in embedded HTML elements (using iframe, embed or body HTML tags)

JavaScript rendered text, however will not be counted, so JavaScript heavy sites, cannot get an accurate word count.

Text within `<noscript>` tags is counted as well in the word count, even though in the majority of situations, this will not be displayed to a user.

## /dynamicwordcount

This will count words for a HTML page that heavily modifies the DOM with scripts (for instance). It can count standard HTML pages and those HTML pages with JavaScript rendered text based on what the user actually sees. It uses Puppeteer and headless browser (Chrome) to do this.

Unlike the `/wordcount` endpoint however it is not presently effective on counting HTML pages that are in embedded elements also.

# Running

Options:

## 1. Docker ( containerized )

Currently setup with HTTP option. Spin up the container

`docker-compose up -d`

Take down the container

`docker-compose down`

## 2. Node.js

### Node Version Manager (NVM) (optional but recommended)

Easily installable via package managers, for example:

- WSL2/MacOS/Linux: <https://formulae.brew.sh/formula/nvm>
- Windows: Scoop: <https://scoop.sh/#/apps?q=nvm&id=cddd14120f633460c971cb449895a6c78181652a>

In project root directory enter:

`nvm install`

to (install and) use the maintenance version of Node (which Puppeteer follows). 

### Install project dependencies

`npm i`

### Running ( interactive with Nodemon )

WSL users, may come across issues, see if you do.

### http

`npm start` ( interactive mode )
`npm run prod`

### https

`npm run start-https` ( interactive mode )
`npm run prod-https`

# Testing

View the API (OpenAI) docs (Swagger) at the root directory i.e. `<API-URL>/` for further documentation and the ability to test manually

## API

A test site has been setup, which hopefully should remain active throughout this repositories lifecycle:

Site (sample page):
<http://paradigmzero.github.io/webpagewordcounter/index.html>

Repository:
<https://github.com/ParadigmZero/paradigmzero.github.io>

### Manual testing (browser)

`localhost:4000/wordcount?page=<URL to page>`

<http://localhost:4000/wordcount?page=http://paradigmzero.github.io/webpagewordcounter/index.html>

`localhost:4000/dynamicwordcount?page=<URL to page>`

<http://localhost:4000/dynamicwordcount?page=http://paradigmzero.github.io/webpagewordcounter/scriptText.html>


### Postman

Get the app [running](#running) before testing.

Options:

1. Import the collection file `WebpageWordCounter.postman_collection.json` into Postman GUI, run whole collection or request(s). Change the `base_url` variable if you have it deployed elsewhere, and change to from `http://` to `https://` if you are using HTTPS.

2. Run a collection with the Newman ( a Postman CLI )

There are two standard options in the `package.json`:
- `npm run apitest`
- `npm run apitest-https` ( with https )

Further information and options with `newman` can be inferred from the `package.json`. To run your `newman` not in the `npm run` scripts, install it globally ( `npm install -g newman`) and follow the guide below.

Further options:

- change `base_url` (the default is <http://localhost:4000>). Example:

`--env-var "base_url=https://webpagewordcount.onrender.com"`

- test a single endpoint. Endpoints are organized in folders in the collection. Folder names correspond to endpoint names, and so you can specify which endpoint to test as follows:

`--folder dynamicwordcount`

For example, running just the `dynamicwordcount` where the endpoint is located <https://webpagewordcount.onrender.com> would be this command:

`newman run WebpageWordCounter.postman_collection.json --env-var "base_url=https://webpagewordcount.onrender.com" --folder wordcount`

# Deployment ( as of date of this README publication )

Dockerized application has a free-tier deployment with Render (<https://render.com/>) at the following URL.

<https://webpagewordcount.onrender.com>

The Master branch is automatically deployed there. Note: given this is a free service, if this has not been accessed for some time there may be an initial delay in responsiveness.

# Development related

Unit tests (Jest) can be run with `npm test`.

# Issues (with Puppeteer) on WSL

Check the official guide:

<https://pptr.dev/troubleshooting>

A consistent/straight-forward solution is to install Chrome on WSL, check:

https://learn.microsoft.com/en-us/windows/wsl/tutorials/gui-apps#install-google-chrome-for-linux

It fixed the authors issues (Ubuntu WSL 2).