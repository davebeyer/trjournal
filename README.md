# Trade Journal (trjournal)

Webapp brainchild of Dude1 & Dude2

## Build instructions

To clone and build, do:

```
git clone  https://github.com/davebeyer/trjournal
cd trjournal
npm install
```

## Development tools that may be needed

```
sudo npm install -g http-server
sudo npm install -g gulp
sudo npm install -g tsc    # However, currently using tsify plugin as part of the browserify process
sudo npm install -g firebase-tools
```


## Development

To build, start an http-server on localhost, and kickoff watchify/browserify to watch for & compile any changes, do:

```
./bin/start-dev
```

Then you should be able to visit:

```
http://localhost:8097
```

## Technologies Employed

* Angular2-Alpha 
* .. plus some jquery
* Typescript
* Firebase
* Bootstrap-CSS
* node, npm, browserify, tsify, watchify, gulp
