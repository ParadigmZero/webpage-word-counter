# Web page word counter

A simple API that counts the visible words on a web page (i.e. what the user sees).

Simply perform a HTTP GET request, passing in a query parameter named `page` with the url to the page. See [testing](#testing).

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

A test site has been setup, which hopefully should remain active throughout this repositories lifecycle:

<http://paradigmzero.github.io/webpagewordcounter/index.html>

## Manual testing (browser)

`localhost:4000/?page=<URL to page>`

e.g.

<http://localhost:4000/?page=http://paradigmzero.github.io/webpagewordcounter/index.html>


## Postman

Options:

1. Import the collection file `WebpageWordCounter.postman_collection.json` into Postman GUI, run whole collection or request(s)

2. Run a collection with the Newman ( a Postman CLI )

This requires Node.JS/npm to be installed, and then Newman to be installed ( i.e. `npm install -g newman` )

Run as follows:

`newman run WebpageWordCounter.postman_collection.json`



