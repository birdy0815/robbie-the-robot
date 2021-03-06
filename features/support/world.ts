const Zombie = require("zombie");

import { defineSupportCode } from "cucumber";

class Waitable {
    private maxWait = 6000;
    private interval = 500;

    public constructor(private element: Element) {
    }

    public waitFor(milliseconds: number) {
        this.maxWait = milliseconds;
        return this;
    }

    public is(assertValue: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if ((this.element as any).value !== assertValue) {
                this.maxWait -= this.interval;
                if (this.maxWait <= 0) { return reject(new Error("Element did not appeared in time")); }
                console.log(`Waiting for ${this.maxWait}ms for ${assertValue} to appear`);
                setTimeout(() => this.is(assertValue).catch(reject).then(resolve), this.interval);
            } else {
                return resolve();
            }
        });
    }

    public not(assertValue: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if ((this.element as any).value === assertValue) {
                this.maxWait -= this.interval;
                if (this.maxWait <= 0) { return reject(new Error("Element did not disappeared in time")); }
                console.log(`Waiting for ${this.maxWait}ms for ${assertValue} to disappear`);
                setTimeout(() => this.not(assertValue).then(resolve).catch(reject), 500);
            } else {
                resolve();
            }
        });
    }
}

class Workspace {
    private browser: any;

    public constructor() {
        const server = process.env.testServer || "http://localhost";
        const port = process.env.testPort || "3000";

        console.log("Initialize browser");

        Zombie.extend(function (browser: any) {
            browser.on("setTimeout", function (fun: any, ms: number) {
                return setTimeout(fun, ms);
            });
            browser.on("console", function () {
                // shut up
            });
        });

        this.browser = new Zombie({ site: server + ":" + port, debug: true });
    }

    public waitUntil(testAttribute: string) {
        return new Waitable(this.query(testAttribute, true));
    }

    public clickOn(testAttribute: string) {
        const element = this.query(testAttribute, true);
        element.click();
    }

    public isPresent(testAttribute: string) {
        return this.query(testAttribute) !== undefined;
    }

    public visit(url: string, callback: () => void) {
        this.browser.visit(url, (err: Error) => {
            if (err) { throw err; }
            this.browser.wait();
            callback();
        });
    }

    private query(testAttribute: string, assert: boolean = false) {
        const q = `[data-test="${testAttribute}"]`;
        const element = this.browser.query(q);
        if (assert && !element) { throw new Error(`Element for Query "${q}" was not found on page`); }
        return element;
    }
}

const workspaceConstructor = () => {
    return new Workspace();
};

defineSupportCode(function ({ setWorldConstructor }) {
    setWorldConstructor(Workspace);
});