import TestDriver, { createTestDriver } from "./TestDriver";

const electronPath = require("electron");

// https://github.com/erwinheitzman/jest-webdriverio-standalone-boilerplate


// send an IPC message to the app
describe("test", () => {
  let app: TestDriver

  beforeAll(async () => {
    app = await createTestDriver({
      path: electronPath as any,
      args: [process.cwd()],
    })
    const ready = await app.isReady;
    expect(ready).toBe(true)
    // browser = await remote(config);
    await app.browser
    // console.log({ browser: app.browser })
  });

  afterAll(async () => {
    console.log('stopping app')
    await app.stop();
    console.log('done with test cleanup')
  });

  // test("sends command", async () => {
  //   const result = await new Promise((res: any, rej: any) => {
  //     app.rpc("sayHi");

  //     app.chromedriverProcess.on("message", (msg) => {
  //       res(msg.resolve);
  //     });
  //   });
  //   expect(result).toEqual("hi there");
  // });

  // test("sends command with arguments", async () => {
  //   const result = await new Promise((res: any, rej: any) => {
  //     app.rpc("double", 2);

  //     app.chromedriverProcess.on("message", (msg) => {
  //       res(msg.resolve);
  //     });
  //   });
  //   expect(result).toEqual(4);
  // });

  test('chromedriver start', async () => {
    expect(await app.isReady).toBe(true)
    expect(await app.browser).toBeTruthy()

    await app.browser.execute(() => {
      console.log('logging works')
      // return require('electron').ipcRenderer.invoke('close')
    }, [])

    const button = await app.browser.waitUntil(async () => {
      return (await app.browser.$$('button')).length == 1
    })
    expect(await (await app.browser.$('button')).getText()).toBe('Click me!')

    expect(1 + 1).toEqual(2)
  })
});
