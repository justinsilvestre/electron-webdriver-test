const ChildProcess = require('child_process')
const path = require('path')

const command = path.join(__dirname, 'node_modules', '.bin', 'chromedriver')

function runChromeDriver(args, env) {
  const options = {
    cwd: process.cwd(),
    env: {
      ...env
    },
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  }
  
  const chromeDriverProcess = ChildProcess.spawn(command, args, options)  
  
  chromeDriverProcess.on('close', code => {
    if (code !== 0) {
      throw new Error(`Chromedriver exited with error code: ${code}`)
    }
  })
  
  chromeDriverProcess.on('error', error => { throw new Error(error) })
  
  const killChromeDriver = () => {
    try {
      chromeDriverProcess.kill()
    } catch (ignored) {}
  }
  
  process.on('exit', killChromeDriver)
  process.on('SIGTERM', killChromeDriver)

  return chromeDriverProcess
}

module.exports.runChromeDriver = runChromeDriver
