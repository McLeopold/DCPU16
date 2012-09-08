var PEG = require('pegjs')
  , fs = require('fs')
  , input_file = 'assm.peg'
  , output_file = 'assm_parser.js'
;

task('default', ['build']);

task('build', [], function () {
  fs.readFile(input_file, function (err, data) {
    if (err) throw err;
    fs.writeFile(output_file,
               'var Assm = Assm || {};\nAssm.parser = '
               + PEG.buildParser(String(data), {}).toSource()
               + ';\nif (typeof module !== "undefined") { module.exports = Assm.parser; }',
               function (err) {
      if (err) throw err;
      complete();
    });
  });
})