import { ChildProcess, spawn } from "child_process";
import { BrowserObject, Options, remote } from "webdriverio";
import Chromedriver from "./Chromedriver";
// @ts-ignore
import { launcher as ChromedriveLauncher } from "wdio-chromedriver-service";
import request from "request";

type Message = {
  msgId: number;
  resolve?: any;
  reject?: any;
};

function isRunning(statusUrl: string, callback: Function) {
  const cb = false;
  const requestOptions = {
    uri: statusUrl,
    json: true,
    followAllRedirects: true,
  };
  request(requestOptions, function (error, response, body) {
    if (error) return callback(cb);
    if (response.statusCode !== 200) return callback(cb);
    callback(body && body.value.ready);
  });
}

function waitForChromeDriver(statusUrl: string, startTimeout: number) {
  return new Promise<boolean>(function (resolve, reject) {
    const startTime = Date.now();
    const checkIfRunning = function () {
      isRunning(statusUrl, (running: any) => {
        if (!self.process) {
          return reject(Error("ChromeDriver has been stopped"));
        }

        if (running) {
          return resolve(true);
        }

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > startTimeout) {
          return reject(
            Error(
              "ChromeDriver did not start within " + startTimeout + "ms",
            ),
          );
        }

        global.setTimeout(checkIfRunning, 100);
      });
    };
    checkIfRunning();
  });
}
function waitForChromeDriverToStop(statusUrl: string, stopTimeout: number) {
  return new Promise<boolean>(function (resolve, reject) {
    const startTime = Date.now();
    const checkIfRunning = function () {
      isRunning(statusUrl, (running: any) => {
        if (!self.process) {
          return resolve(true);
        }

        const elapsedTime = Date.now() - startTime;
        if (running && elapsedTime > stopTimeout) {
          return reject(
            Error(
              "ChromeDriver did not start within " + stopTimeout + "ms",
            ),
          );
        } else {
          global.setTimeout(checkIfRunning, 100);
        }
      });
    };
    checkIfRunning();
  });
}

export async function createTestDriver(
  { path, args, env: givenEnv, logLevel = "silent" }: {
    path: string;
    args: string[];
    env?: NodeJS.ProcessEnv;
    logLevel?: string;
  },
) {
  const env = {
    NODE_ENV: "test",
    REACT_APP_TEST_DRIVER: "true",
    ELECTRON_START_URL: "http://localhost:3000",
    PATH: process.env.PATH,
    ...givenEnv,
  } as NodeJS.ProcessEnv;

  // const {chromeDriverProcess: driverProcess, stop: stopChromeDriver }  = runChromeDriver([], env);
  const driver = new Chromedriver([], env)
  await waitForChromeDriver("http://localhost:9515/status", 7000);

  // await chromedriverLauncher

  const browser: BrowserObject = await remote({
    hostname: "localhost", // Use localhost as chrome driver server
    port: 9515, // "9515" is the port opened by chrome driver.
    capabilities: {
      browserName: "chrome",
      "goog:chromeOptions": {
        binary: path,
        args: ["app=" + process.cwd()],
      },
    },
    logLevel: (logLevel || "silent") as
      | "silent"
      | "trace"
      | "debug"
      | "info"
      | "warn"
      | "error"
      | undefined,
  });

  return new TestDriver({
    path,
    args,
    env,
    browser,
    driver
  });
}

export default class TestDriver {
  rpcCalls: ({ resolve: Function; reject: Function } | null)[];
  isReady: Promise<boolean>;
  browser: BrowserObject;
  _driver: Chromedriver

  constructor(
    { path, args, driver, browser, env: givenEnv }: {
      path: string;
      args: string[];
      driver: Chromedriver;
      browser: BrowserObject;
      env?: NodeJS.ProcessEnv;
    },
  ) {
    this.browser = browser;
    this._driver = driver

    this.rpcCalls = [];

    // // handle rpc responses
    // this.chromedriverProcess.on('message', (message: Message) => {
    //   console.log('Received message!', message)
    //   // pop the handler
    //   const rpcCall = this.rpcCalls[message.msgId]
    //   if (!rpcCall) return
    //   this.rpcCalls[message.msgId] = null
    //   // reject/resolve
    //   if (message.reject) rpcCall.reject(message.reject)
    //   else rpcCall.resolve(message.resolve)
    // })

    // wait for ready
    // this.isReady = this.rpc('isReady').catch((err) => {
    //   console.error('Application failed to start', err)
    //   this.stop()
    //   process.exit(1)
    // })
    this.isReady = Promise.resolve(true);
  }

  // simple RPC call
  // to use: driver.rpc('method', 1, 2, 3).then(...)
  async rpc(cmd: string, ...args: any[]): Promise<any> {
    // // send rpc request
    // const msgId = this.rpcCalls.length
    // console.log('Sending message!', { cmd, args, msgId })
    // this.browser.execute(() => {
    //   console.log('boop!')
    //   require('electron').ipcRenderer.send('message', )
    // }, [cmd, args, msgId])
    // this.chromedriverProcess.send({ msgId, cmd, args })
    // return new Promise((resolve, reject) => this.rpcCalls.push({ resolve, reject }))
  }

  async stop() {
    console.log("closing window");
    // await this.closeWindow()
    await this.browser.closeWindow()
    console.log("running?");
    const isRunningNow = () => new Promise((res, rej) => {
      try {
        isRunning("http://localhost:9515/status", (running: any) => {
          if (running) res(true);
          else res(false);
        });
      } catch (err) {
        return res(false);
      }
    });
    console.log("running?", { isRunningNow: await isRunningNow() });
    if (await isRunningNow()) {
      // this.chromedriverProcess.send('complete')
      console.log('trying to stop chromedriver process')
    // const killed = this.chromedriverProcess.kill(
    //   'SIGTERM'
    //   );
    const killed = this.stopChromeDriver()
    if (!killed) throw new Error('Could not kill chromedriver process')  
    // this.chromedriverProcess.send('exit')
      // await waitForChromeDriverToStop("http://localhost:9515/status", 7000)

    }
    console.log('done stopping app')
    console.log("running still?", { isRunningNow: await isRunningNow() });
    // await (this.chromedriverProcess as any).close()
    // await this.browser.closeWindow()
    // this.chromedriverProcess.kill(0)

    // const done = new Promise((res, rej) => {
    //   this.chromedriverProcess.on('exit', () => {
    //     res()
    //   })
    // })
    // await done

    //     // await this.browser.closeApp()
    // console.log("closing window");
    // await this.closeWindow()
    // // await browser.closeWindow();
    // // console.log("deleting session");
    // // await browser.deleteSession();

  }

  stopChromeDriver() {
    return this._driver.stop()
  }

  async closeWindow() {
    await this.browser.execute(() => {
      console.log('trying to close')
      return require('electron').ipcRenderer.invoke('close')
    }, [])
  }
}
