"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
var fs = require('fs');
var path = require('path');
class Utils {
    static scanDir(dir, done) {
        var results = [];
        fs.readdir(dir, function (err, list) {
            if (err)
                return done(err);
            var i = 0;
            (function next() {
                var file = list[i++];
                if (!file)
                    return done(null, results);
                file = path.resolve(dir, file);
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        Utils.scanDir(file, function (err, res) {
                            results = results.concat(res);
                            next();
                        });
                    }
                    else {
                        results.push(file);
                        next();
                    }
                });
            })();
        });
    }
}
exports.Utils = Utils;
//# sourceMappingURL=utils.js.map