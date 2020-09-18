import TestDriver, { createTestDriver } from "./TestDriver";

const electronPath = require("electron");

// https://github.com/erwinheitzman/jest-webdriverio-standalone-boilerplate

// send an IPC message to the app
describe("test", () => {
  let app: TestDriver;

  beforeAll(async () => {
    app = await createTestDriver({
      path: electronPath as any,
      args: [process.cwd()],
    });
    const { result: ready } = await app.isReady;
    expect(ready).toBe(true);
  });

  afterAll(async () => {
    console.log("stopping app");
    await app.stop();
    console.log("done with test cleanup");
  });

  test("sends command", async () => {
    const { result } = await app.sendToMainProcess({ type: "sayHi" });
    expect(result).toEqual("hi there");
  });

  test("sends command with arguments", async () => {
    const doubledNumber = await app.sendToMainProcess(
      { type: "double", args: [2] },
    );
    expect(doubledNumber.result).toEqual(4);
  });

  test("chromedriver start", async () => {
    expect(await (await app.isReady).result).toBe(true);
    expect(await app.client).toBeTruthy();

    const button = await app.client.waitUntil(async () => {
      return (await app.client.$$("button")).length == 1;
    });
    expect(await (await app.client.$("button")).getText()).toBe("Click me!");

    expect(1 + 1).toEqual(2);
  });
});
