import TestDriver from './TestDriver'

const electronPath = require('electron')

// send an IPC message to the app
describe('test', () => {

  const app = new TestDriver({
    path: electronPath,
    args: [
     __dirname + '/../..'
    ],
  })

  beforeAll(async () => {
    await app.isReady
  })

  afterAll(async () => {
    await app.stop()
  })

  test('sends command', async () => {
    const result = await new Promise((res: any, rej: any) => {
      app.rpc('sayHi')

      app.process.on('message', (msg) => {
        res(msg.resolve)
      })
    })
    expect(result).toEqual('hi there')
  })

  test('sends command with arguments', async () => {
    const result = await new Promise((res: any, rej: any) => {
      app.rpc('double', 2)

      app.process.on('message', (msg) => {
        res(msg.resolve)
      })
    })
    expect(result).toEqual(4)
  })
})