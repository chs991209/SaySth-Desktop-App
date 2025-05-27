const {spawn} = require('child_process');

function runPythonCode(code) {
    return new Promise((resolve, reject) => {
      const py = spawn('python', ['-c', code]);
      let out = '', err = '';
  
      py.stdout.on('data', data => out += data);
      py.stderr.on('data', data => err += data);
      py.on('close', code => {
        if (err) reject(err);
        else resolve(out);
      });
    });
  }
  
module.exports = {
  runPythonCode
};