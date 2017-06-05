# github-webhook-listener
Listens for github webhook, validates secret and runs a script

## Requires
[nodejs and npm](https://nodejs.org/)

## Setup
```
npm install
```

## Run
```
sudo GITHUB_KEY=<SOMEKEY> ON_RELEASE_CMD=<SCRIPTTORUN> node index.js`
```
