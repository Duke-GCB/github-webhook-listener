# hook-build
Listens for github webhook, validates secret and runs a script

## Requires
[nodejs and npm](https://nodejs.org/)

## Setup
```
npm install
```
Create a script to perform an action when a valid a webhook message is received.
It will be passed ACTION, REPO, and TAG positional parameters.
See [sample_script.sh](https://github.com/Duke-GCB/github-webhook-listener/blob/master/sample_script.sh) 

## Run
```
sudo GITHUB_KEY=<SOMEKEY> ON_RELEASE_CMD=<SCRIPTTORUN> node index.js`
```
