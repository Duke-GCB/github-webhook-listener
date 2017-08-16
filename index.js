// github webhook listener
// Runs a script when it receives a message with the valid key
// Requires webhook to be setup with Content type:application/json
// Github Webhook event docs: https://developer.github.com/v3/activity/events/types/

const childProcess = require('child_process');
const crypto = require('crypto');
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

var PORT = process.env.PORT || 443;
var KEYPATH = process.env.KEYPATH || 'ssl/key.pem';
var CERTPATH = process.env.CERTPATH || 'ssl/cert.pem';
const messageRegex = process.env.MESSAGE_REGEX;
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
   const ref = req.body.ref;
   if (ref === 'refs/heads/master') {
      const message = req.body.head_commit.message;
      if (message.match(messageRegex)) {
          console.log("Processing files for message " + message);
          const added = req.body.head_commit.added;
          for (var i = 0; i < added.length; i++) {
               addedFile = added[i];
               console.log("build " + addedFile + " msg:" + message);
               const parts = path.basename(addedFile).replace(/\.spec$/,'').split('-');
               runReleaseCmd(message, parts[0], parts[1], parts[2]);
          }
      } else {
          console.log("Ignoring message " + message);
      }
   } else {
      console.log("Ignoring ref " + ref);
   }
}

// runs background process that does some processing based on the webhook data
function runReleaseCmd(message, name, version, release) {
    const childProc = childProcess.spawn(onReleaseCmd, [message, name, version, release]);
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

var options = {
    key  : fs.readFileSync('ssl/key.pem'),
    cert : fs.readFileSync('ssl/cert.pem')
}


// start server
https.createServer(options, app).listen(PORT, function () {
  console.log('Webhook release watcher: listening on port ' + PORT);
  console.log(`Runs ${onReleaseCmd} when receives valid webhook POST`);
})

