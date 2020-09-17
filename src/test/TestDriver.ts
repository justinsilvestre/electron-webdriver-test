import { ChildProcess } from 'child_process'
import { BrowserObject, remote } from 'webdriverio'
import { runChromeDriver } from '../../electron-chrome-driver'
import request from 'request'

type Message = {
  msgId: number,
  resolve?: any,
  reject?: any
}

function isRunning(statusUrl: string, callback: Function) {
  const cb = false;
  const requestOptions = {
    uri: statusUrl,
    json: true,
    followAllRedirects: true
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
          return reject(Error('ChromeDriver has been stopped'));
        }

        if (running) {
          return resolve(true);
        }

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > startTimeout) {
          return reject(
            Error(
              'ChromeDriver did not start within ' + startTimeout + 'ms'
            )
          );
        }

        global.setTimeout(checkIfRunning, 100);
      });
    };
    checkIfRunning();
  });
};

export async function createTestDriver({ path, args, env: givenEnv }: { path: string, args: string[], env?: NodeJS.ProcessEnv}) {
  const env = {
    NODE_ENV: 'test',
    REACT_APP_TEST_DRIVER: 'true',
    ELECTRON_START_URL: 'http://localhost:3000',
    PATH: process.env.PATH,
    ...givenEnv,
  } as NodeJS.ProcessEnv

  
  const driverProcess: ChildProcess = runChromeDriver(args, env)
  await waitForChromeDriver('http://localhost:9515/status', 7000)

  const browser: BrowserObject = await remote({
    hostname: 'localhost', // Use localhost as chrome driver server
    port: 9515, // "9515" is the port opened by chrome driver.
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        binary: path,
        args: ['app=' + process.cwd()]
      }
    }
  })

  return new TestDriver({
    path,
    args,
    env,
    browser,
    chromedriverProcess: driverProcess,
  })
}

export default class TestDriver {
  rpcCalls: ({ resolve: Function, reject: Function } | null)[]
  chromedriverProcess: ChildProcess
  isReady: Promise<boolean>
  browser: BrowserObject

  constructor ({ path, args, chromedriverProcess, browser, env: givenEnv }: { path: string, args: string[], chromedriverProcess: ChildProcess, browser: BrowserObject, env?: NodeJS.ProcessEnv}) {    
    this.browser = browser
    this.chromedriverProcess = chromedriverProcess
    
    this.rpcCalls = []

    // handle rpc responses
    this.chromedriverProcess.on('message', (message: Message) => {
      console.log('Received message!', message)
      // pop the handler
      const rpcCall = this.rpcCalls[message.msgId]
      if (!rpcCall) return
      this.rpcCalls[message.msgId] = null
      // reject/resolve
      if (message.reject) rpcCall.reject(message.reject)
      else rpcCall.resolve(message.resolve)
    })

    // wait for ready
    this.isReady = this.rpc('isReady').catch((err) => {
      console.error('Application failed to start', err)
      this.stop()
      process.exit(1)
    })
    this.isReady = Promise.resolve(true)
    

  }

  // simple RPC call
  // to use: driver.rpc('method', 1, 2, 3).then(...)
  async rpc (cmd: string, ...args: any[]): Promise<any> {
    // send rpc request
    const msgId = this.rpcCalls.length
    console.log('Sending message!', { cmd, args, msgId })
    this.chromedriverProcess.send({ msgId, cmd, args })
    return new Promise((resolve, reject) => this.rpcCalls.push({ resolve, reject }))
  }

  async stop () {
    await this.browser.closeWindow()
    
    // const done = new Promise((res, rej) => {
    //   this.chromedriverProcess.on('exit', () => {
    //     res()
    //   })
    // })
    // await done
  }
}