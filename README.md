# Web page word counter

A simple API that counts the visible words on a web page (i.e. what the user sees).

There are two endpoints that can be used to count the words of a webpage, `wordcount` which just counts the words in HTML. `dynamicwordcount` will count the words on a page, as if it is rendered in a users browser, thus taking into account heavily scripted pages, which significantly what is shown to a user via the DOM.

Simply perform a HTTP GET request on either endpoint, passing in a query parameter named `page` with the url to the page. See [testing](#testing).

# Details/limitations API

## /wordcount

This performs a word count on HTML elements, using the [word-counting library](https://www.npmjs.com/package/word-counting/).

Tags, comments, script text .etc are ignored, and all rendered HTML text is counted.

This can also count words in embedded HTML elements (using iframe, embed or body HTML tags)

JavaScript rendered text, however will not be counted, so JavaScript heavy sites, cannot get an accurate word count.

Text within `<noscript>` tags is counted as well in the word count, even though in the majority of situations, this will not be displayed to a user.

## /dynamicwordcount

This will count words for a HTML page that heavily modifies the DOM with scripts (for instance). It can count standard HTML pages and those HTML pages with JavaScript rendered text.

Unlike the `/wordcount` endpoint however it is not presently effective on counting HTML pages that are in embedded elements also.

# Running

Options:

## 1. Docker ( containerized )

Spin up the container

`docker-compose up`

Take down the container

`docker-compose down`

## 2. Node.js

( Node.js must be installed on your machine)

## Initializing

`npm init`

## Running ( interactive with Nodemon )

`npm start` ( interactive mode with Nodemon )
`npm run prod` ( running without Nodemon )

# Testing

View the API docs at the root directory i.e. `<API-URL>/` for further documentation and the ability to test manually

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

Options:

1. Import the collection file `WebpageWordCounter.postman_collection.json` into Postman GUI, run whole collection or request(s). Change the `base_url` variable if you have it deployed elsewhere.

2. Run a collection with the Newman ( a Postman CLI )

This requires Node.JS/npm to be installed, and then Newman to be installed ( i.e. `npm install -g newman` )

Run as follows:

`newman run WebpageWordCounter.postman_collection.json`

You can also test the endpoints individually as so:

`newman run WebpageWordCounter.postman_collection.json --folder wordcount`
`newman run WebpageWordCounter.postman_collection.json --folder dynamicwordcount`

# Development related

Unit tests (JUnit) can be run with `npm test`.






