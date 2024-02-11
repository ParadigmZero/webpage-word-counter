import {
  urlResolver,
  addHTTPtoUrl,
  getEmbeddedPageUrls,
  wordCount,
  dynamicWordCount,
} from "../src/index";

test("urls are properly resolved (with base url) in the urlResolver method", () => {
  expect(urlResolver("http://www.mydomain.com/", "./dir/mypage.html")).toEqual(
    "http://www.mydomain.com/dir/mypage.html"
  );
  expect(urlResolver("http://www.mydomain.com/", "mypage.html")).toEqual(
    "http://www.mydomain.com/mypage.html"
  );
  expect(
    urlResolver("http://www.mydomain.com/", "http://www.adifferentsite.com")
  ).toEqual("http://www.adifferentsite.com");
});

test("Add http:// to urls where appropriate in addHTTPtoUrl method", () => {
  expect(addHTTPtoUrl("google.com" as string)).toEqual("http://google.com");
  expect(addHTTPtoUrl("http://google.com" as string)).toEqual(
    "http://google.com"
  );
  expect(addHTTPtoUrl("https://google.com" as string)).toEqual(
    "https://google.com"
  );
});

test("The getEmbeddedPageUrls function should extract the url from embedded content tags", () => {
  expect(
    getEmbeddedPageUrls(`
    <html>

<!-- 
    Embedding HTML in HTML to a depth of 1,
    using the three possible methods:
    iframe, embed and object tags

    example, 6 embedded elements:
    - 3 iframes
    - 2 objects
    - 1 embed
-->

<body>

    <div>
        <object data="./index.html"></object>
    </div>
    <div>
        <iframe src="./index.html" title="embeddedItem1">
        </iframe>
    </div>
    <div>
        <iframe src="./index.html">
        </iframe>
    </div>

    <div>
        <embed type="text/html" src="./index.html">
    </div>


    <div>
        <iframe src="./index.html">
        </iframe>
    </div>

    <div>
        <object data="./index.html"></object>
    </div>


</body>

</html>`)
  ).toEqual([
    "./index.html",
    "./index.html",
    "./index.html",
    "./index.html",
    "./index.html",
    "./index.html",
  ]);
});

test("Ignore non-HTML embedded elements", () => {
  expect(
    getEmbeddedPageUrls(`
    <html>
<!-- 
    TEST
-->

<body>
    <div>
        <embed type="image/jpg" src="./index.html">
    </div>
    <div>
    <embed type="image/jpg" src="image.jpeg">
</div>
    <div>
        <embed type="video/webm" src="./index.html">
    </div>

    <div>
    <embed type="video/webm" src="./vid.avi">
</div>

    <div>
        <object data="./index.mp4"></object>
    </div>
    <div>
        <object data="http://www.mydomain.com/image.jpg"></object>
    </div>
</body>

</html>`)
  ).toEqual([]);
});

test("The wordCount function should return the correct word count for a given page", () => {
  expect(
    wordCount(
      "http://paradigmzero.github.io/webpagewordcounter/index.html",
      [],
      []
    )
  ).toEqual(20);
  expect(
    wordCount(
      "http://paradigmzero.github.io/webpagewordcounter/depth1embedded.html",
      [],
      []
    )
  ).toEqual(120);
  expect(
    wordCount(
      "http://paradigmzero.github.io/webpagewordcounter/depth2embedded.html",
      [],
      []
    )
  ).toEqual(140);
});

test(`dynamicWordCount method which will accurately count words on a page that changes the content with JavaScript.`, async () => {
  // pages where JavaScript significantly changes the text
  expect(
    await dynamicWordCount(
      "https://paradigmzero.github.io/webpagewordcounter/scriptText.html"
    )
  ).toEqual(7);
  expect(
    await dynamicWordCount(
      "https://paradigmzero.github.io/webpagewordcounter/scriptTextComplex.html"
    )
  ).toEqual(20);
});

test(`dynamicWordCount method with accurately count the text on a standard HTML page.`, async () => {
  expect(
    await dynamicWordCount(
      "http://paradigmzero.github.io/webpagewordcounter/index.html"
    )
  ).toEqual(20);
});

test(`dynamicWordCount method does not effectively count words with embedded HTML.`, async () => {
  expect(
    await dynamicWordCount(
      "http://paradigmzero.github.io/webpagewordcounter/depth1embedded.html"
    )
  ).not.toEqual(120);
  expect(
    await dynamicWordCount(
      "http://paradigmzero.github.io/webpagewordcounter/depth2embedded.html"
    )
  ).not.toEqual(140);
});

test("test to fail CI to check GitHub actions", async () => {
  expect(false).toBe(true);
});
