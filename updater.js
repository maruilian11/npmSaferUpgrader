#!/usr/bin/env node

var fs = require('fs');
var npm = require("npm");
var request = require('request');
var colors = require('colors');
var cmpVer = require('compare-version');
var spawn = require('child_process').spawn;

colors.setTheme({
  prompt: 'cyan',
  info: 'magenta',
  success: 'green',
  warn: 'yellow',
  error: 'red'
});

pkgReadIn = fs.readFileSync("package.json", {encoding:'utf8'});
pkg = JSON.parse(pkgReadIn);

depCount = Object.keys(pkg.dependencies).length;

msg = "Try to upgrade the dependencies of " + pkg.name + ' version ' + pkg.version + ' in safer method!\n'
console.log(msg.prompt);
msg = "Found " + depCount + (depCount ? ' dependencies :' : ' dependency')
console.log(msg.prompt);

deps = [];
depsVer = [];

//Should also handle devDependencies in future
if (depCount) {
  for (dep in pkg.dependencies) {
    console.log(colors.info(' - ' + dep + ': ') + colors.bold(pkg.dependencies[dep]));
    deps.push(dep);
    depsVer.push(pkg.dependencies[dep]);
    checkVer(dep, pkg.dependencies[dep]);
  }
}

function checkVer(lib, version) {
  version = pkg.dependencies[lib];
  request.get('http://registry.npmjs.org/' + lib, function (error, response, body) {
    msg = "\nChecking verion of " + lib + ", current: ";
    console.log(msg.prompt + colors.yellow(version));
    if (!error && response.statusCode == 200) {
      versions = [];
      temp = JSON.parse(body).versions;
      for (ver in temp) {
        versions.push(ver);
      }
      console.log("versions: ".prompt + colors.bold(versions));
      console.log("The latest version: ".prompt + colors.bold(versions[versions.length-1]));
      needUpdate = (cmpVer(versions[versions.length-1], version) > 0 ? true : false);
      console.log(colors.info((needUpdate ? colors.bold("Need") : "No need") + " to update!"));
      if (needUpdate) {
        newVer = updateLib(lib, version, versions);
        pkg.dependencies[lib] = newVer;
        /* bad implement ... for prototype only npm install start */
        npmInstall = spawn('npm', ['install', lib + '@' + newVer , '--save']);
        npmInstall.on('close', function (code) {
          if (!code) {
            npmUpdate = spawn('npm', ['update', lib]);
            npmUpdate.on('close', function (code2) {
              if (!code2) {
                msg = "Dependency - " + lib + " upgaded to v" + newVer + " successfully!";
              } else {
                msg = "Dependency - " + lib + " v" + newVer + " has been installed, but update process failed! " + code2;
              }
              console.log(colors.prompt(msg));
            })
          } else {
            console.log(colors.error("Dependency - " + lib + " upgrade failed! exit code: " + code));
            console.log(colors.error("This may not make sense 'cause this is just the final step, please open an issue on GitHub"));
          }
        });
        /* the dirty part above should be replced by the confirmed and fixed version below */
      /*npm.load(function() {
          //not sure if npm api support this usage like npm command, need to be confirmed
          npm.commands.install(lib + "@" + newVer, function(res){
            console.log(res);
          );
          npm.commands.update([lib], function(res){
            console.log(res);
          })
        })*/
      }
    }
  })
};


function updateLib(libName, currentVer, versions)
{
  while (isNaN(currentVer[0])) {
    currentVer = currentVer.substr(1);
  }
  currentIndexInVers = versions.lastIndexOf(currentVer);
  if (currentIndexInVers == -1) {
    console.log(colors.error("Can not recognize version: " + currentVer));
    return;
    //version not 100% match, should find the closest instead
    //currentIndexInVers = findRelatedVer(currentVer, versions);
  }
  start = currentIndexInVers;
  end = versions.length - 1;
  while (start != end) {
    start = end; //temporarily fake statement, should be replaced by the binary version search algorithm
  }
  newVer = versions[start];
  return newVer;

}

function findRelatedVer(currentVer, versions)
{
//  cmpVer(currentVer,)
}
