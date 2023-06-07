"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../src/index");
test("urls are properly resolved (with base url) in the urlResolver method", () => {
    expect((0, index_1.urlResolver)("http://www.mydomain.com/", "./dir/mypage.html")).toEqual("http://www.mydomain.com/dir/mypage.html");
    expect((0, index_1.urlResolver)("http://www.mydomain.com/", "mypage.html")).toEqual("http://www.mydomain.com/mypage.html");
    expect((0, index_1.urlResolver)("http://www.mydomain.com/", "http://www.adifferentsite.com")).toEqual("http://www.adifferentsite.com");
});
test("The getEmbeddedPageUrls function should extract the url from embedded content tags", async () => {
    expect((0, index_1.getEmbeddedPageUrls)(`
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

</html>`)).toEqual(["./index.html", "./index.html", "./index.html", "./index.html",
        "./index.html", "./index.html"]);
});
test("Ignore non-HTML embedded elements", async () => {
    expect((0, index_1.getEmbeddedPageUrls)(`
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

</html>`)).toEqual([]);
});
test("The wordCount function should return the correct word count for a given page", async () => {
    expect(await (0, index_1.wordCount)("http://paradigmzero.github.io/webpagewordcounter/index.html", [], [])).toEqual(20);
    expect(await (0, index_1.wordCount)("http://paradigmzero.github.io/webpagewordcounter/depth1embedded.html", [], [])).toEqual(120);
    expect(await (0, index_1.wordCount)("http://paradigmzero.github.io/webpagewordcounter/depth2embedded.html", [], [])).toEqual(140);
});
