// github webhook listener
// Runs a script when it receives a message with the valid key
// Requires webhook to be setup with Content type:application/json
// Github Webhook event docs: https://developer.github.com/v3/activity/events/types/

const childProcess = require('child_process');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

const githubKey = process.env.GITHUB_KEY;
const onReleaseCmd = process.env.ON_RELEASE_CMD;
const cryptAlgorithm = 'sha1';
const digestFormat = 'hex';
const app = express();

// save rawBody so we can verify the signature
var rawBodySaver = function (req, res, buf, encoding) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}
// convert payload into json
app.use(bodyParser.json({verify: rawBodySaver}));

// creates hmac digest based on the request raw body
function createDigest(req) {
  const hmac = crypto.createHmac(cryptAlgorithm, githubKey);
  hmac.update(req.rawBody);
  return hmac.digest(digestFormat);
}

// returns true if the github signature matches our calculated digest
function signatureIsValid(req) {
  const githubSignature = req.get('X-Hub-Signature');
  const parts = githubSignature.split("=");
  const githubAlg = parts[0];
  const githubDigest = parts[1];
  if (githubAlg !== cryptAlgorithm) {
      return false;
  }
  const digest = createDigest(req);
  return githubDigest === digest;
}

// called when we receive a request with a valid signature
function onValidRequest(req) {
   const action = req.body.action;
   const repo = req.body.repository.name;
   const login = req.body.sender.login;
   let tag = null;
   if (req.body.release) {
       tag = req.body.release.tag_name;
   }
   console.log(`Received action ${action} for ${repo} tag ${tag} by ${login}`);
   runReleaseCmd(action, tag, repo);
}

// runs background process that does some processing based on the webhook data
function runReleaseCmd(action, repo, tag) {
    const childProc = childProcess.spawn(onReleaseCmd, [action, repo, tag]);
    childProc.stdout.on('data', (data) => {
        console.log(`${onReleaseCmd} stdout: ${data}`);
    });
    childProc.stderr.on('data', (data) => {
        console.log(`${onReleaseCmd} stderr: ${data}`);
    });
    childProc.on('close', (code) => {
        console.log(`${onReleaseCmd} child process exited with code ${code}`);
    });
}


// receive post request from github
app.post('/', function (req, res) {
  if (signatureIsValid(req)) {
      res.send('OK');
      onValidRequest(req);
  } else {
      res.status(403).send('Invalid key received');
  }
})

// start server
app.listen(80, function () {
  console.log('Webhook release watcher: listening on port 80');
  console.log(`Runs ${onReleaseCmd} when receives valid webhook POST`);
})

