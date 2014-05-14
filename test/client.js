var expect = require("expect.js");
var superagent = require("superagent");
var Client = require("../lib/client");

describe("Client(base)", function () {
    it("should store a parsed URL object", function () {
        var client = new Client("http://example.com");
        expect(client.url.hostname).to.equal("example.com");
        expect(client.url.protocol).to.equal("http:");
    });

    it("should have a reasonable default (http://localhost:5984/)", function () {
        var client = new Client();
        expect(client.url.protocol).to.equal("http:");
        expect(client.url.hostname).to.equal("localhost");
        expect(client.url.port).to.equal("5984");
    });

    it("should store an agent object", function () {
        var client = new Client();
        expect(client.agent).to.be.a(superagent.agent);
    });

    it("should create a new unique agent object for each instance", function () {
        var client1 = new Client();
        var client2 = new Client();
        expect(client1.agent).to.not.equal(client2.agent);
    });
});

describe("Client#basicAuth(user, pass)", function () {
    it("should add auth information to stored URL object", function () {
        var client = new Client();
        expect(client.url.auth).to.not.be.ok();
        client.basicAuth("abc", "123");
        expect(client.url.auth).to.equal("abc:123");
    });

    it("should delete auth information", function () {
        var client = new Client();
        client.basicAuth("abc", "123");
        client.basicAuth(false);
        expect(client.url.auth).to.not.be.ok();
    });

    it("should be a chainable method", function () {
        var client = new Client();
        expect(client.basicAuth()).to.equal(client);
        expect(client.basicAuth("abc", "123")).to.equal(client);
    });
});

describe("Client#requestUrl(path)", function () {
    var client = new Client();

    it("should return the server's base URL", function () {
        expect(client.requestUrl()).to.equal("http://localhost:5984/");
    });

    it("should return a absolute URL (and resolve 'path' as relative to that)", function () {
        expect(client.requestUrl("favicon.ico")).to.equal("http://localhost:5984/favicon.ico");
        expect(client.requestUrl("/favicon.ico")).to.equal("http://localhost:5984/favicon.ico");
        expect(client.requestUrl("database")).to.equal("http://localhost:5984/database");
        expect(client.requestUrl("/database")).to.equal("http://localhost:5984/database");
        expect(client.requestUrl("database/document")).to.equal("http://localhost:5984/database/document");
        expect(client.requestUrl("/database/document")).to.equal("http://localhost:5984/database/document");
    });

    it("should allow an array to be used as path", function () {
        var url = client.requestUrl(["_config", "section", "key"]);
        expect(url).to.equal("http://localhost:5984/_config/section/key");
    });
});

describe("Client#request(method, path)", function () {
    var client = new Client();

    it("should return a superagent.Request object", function () {
        var req = client.request("get", "/");
        expect(req).to.be.a(superagent.Request);
    });

    it("should use a URL generated by Client#requestUrl()", function () {
        var req = client.request("get", "/");
        expect(req.url).to.equal(client.requestUrl("/"));
    });
});