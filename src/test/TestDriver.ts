import childProcess, { ChildProcess, ProcessEnvOptions } from 'child_process'

type Message = {
  msgId: number,
  resolve?: any,
  reject?: any
}

export default class TestDriver {
  rpcCalls: ({ resolve: Function, reject: Function } | null)[]
  process: ChildProcess
  isReady: Promise<boolean>

  constructor ({ path, args, env: givenEnv }: { path: string, args: string[], env?: NodeJS.ProcessEnv}) {
    const env = {
      NODE_ENV: 'test',
      REACT_APP_TEST_DRIVER: 'true',
      PATH: process.env.PATH,
      ...givenEnv,
    } as NodeJS.ProcessEnv
    console.log('trying to start app with env:', { path, args, env})

    this.rpcCalls = []

    // start child process
    // let the app know it should listen for messages
    this.process = childProcess.spawn(path, args, {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      env
    })

    // handle rpc responses
    this.process.on('message', (message: Message) => {
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
  }

  // simple RPC call
  // to use: driver.rpc('method', 1, 2, 3).then(...)
  async rpc (cmd: string, ...args: any[]): Promise<any> {
    // send rpc request
    const msgId = this.rpcCalls.length
    console.log('Sending message!', { cmd, args, msgId })
    this.process.send({ msgId, cmd, args })
    return new Promise((resolve, reject) => this.rpcCalls.push({ resolve, reject }))
  }

  stop () {
    this.process.kill()
  }
}