# hook-build
Listens for github webhook, validates secret and runs a script

## Requires
[nodejs and npm](https://nodejs.org/)

## Setup
```
npm install
```
Create a script to perform an action on each added file when a it sees a push to master with a particular message.
See [sample_script.sh](https://github.com/Duke-GCB/github-webhook-listener/blob/master/sample_script.sh) 

## Run
```
sudo KEYPATH=<PATH_TO_SSL_KEY> CERTPATH=<PATH_TO_SSL_CERT> MESSAGE_REGEX='<commit pattern> GITHUB_KEY=<SOMEKEY> ON_RELEASE_CMD=<SCRIPTTORUN> node index.js 
```
