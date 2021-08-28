var fs = require("fs");
var path = require("path");
export class Utils {
  static scanDir(
    dir: string,
    done: (err: string | null, result: string[]) => void
  ) {
    let results: any[] = [];
    fs.readdir(dir, function (err: string, list: any[]) {
      if (err) return done(err, []);
      let i = 0;
      (function next() {
        let file = list[i++];
        if (!file) return done(null, results);
        file = path.resolve(dir, file);
        fs.stat(file, function (err: any, stat: { isDirectory: () => any }) {
          if (stat && stat.isDirectory()) {
            Utils.scanDir(file, function (err, res) {
              results = results.concat(res);
              next();
            });
          } else {
            results.push(file);
            next();
          }
        });
      })();
    });
  }
}
