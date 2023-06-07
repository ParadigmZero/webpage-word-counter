import {urlResolver, wordCount} from "../src/server";

test("urls are properly resolved (with base url) in the urlResolver method", () => {
    expect(urlResolver("http://www.mydomain.com/","./dir/mypage.html")).toEqual("http://www.mydomain.com/dir/mypage.html");
    expect(urlResolver("http://www.mydomain.com/","mypage.html")).toEqual("http://www.mydomain.com/mypage.html");
    expect(urlResolver("http://www.mydomain.com/","http://www.adifferentsite.com")).toEqual("http://www.adifferentsite.com");
});

test("test wordCount function in isolation", async() => {
    expect(await wordCount("http://paradigmzero.github.io/webpagewordcounter/index.html",[],[])).toEqual(20);
    expect(await wordCount("http://paradigmzero.github.io/webpagewordcounter/depth1embedded.html",[],[])).toEqual(120);
    expect(await wordCount("http://paradigmzero.github.io/webpagewordcounter/depth2embedded.html",[],[])).toEqual(140);
});