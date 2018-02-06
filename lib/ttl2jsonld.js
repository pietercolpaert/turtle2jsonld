const {Transform} = require('stream');
var N3Util = require('n3').Util;

class TTL2JSONLD extends Transform {
  constructor (options) {
    if (options)
      options.objectMode = true;
    else
      options = {objectMode: true};
    
    super (options);
  }

  _triple2Object (triple) {
    var obj = {
      "@id": triple.subject
    };
    
    if (N3Util.isLiteral(triple.object)) {
      obj[triple.predicate] = {
        "@value" : N3Util.getLiteralValue(triple.object)
      };
      if (N3Util.getLiteralType(triple.object)) {
        obj[triple.predicate]["@type"] = N3Util.getLiteralType(triple.object);
      }
      if (N3Util.getLiteralLanguage(triple.object)) {
        obj[triple.predicate]["@language"] = N3Util.getLiteralLanguage(triple.object);
      }
    } else {
      if (triple.predicate !== 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        obj[triple.predicate] = { "@id": triple.object};
      } else {
        obj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = triple.object;
      }
    }
    return obj;
  }
  
  _transform (triple, encoding, done) {
    var obj = this._triple2Object(triple);
    if (!this._currentObj) {
      this._currentObj = obj;
    } else {
      if (this._currentObj["@id"] !== obj["@id"]) {
        this._currentObj['@type'] = this._currentObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'];
        delete(this._currentObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']);
        this.push(this._currentObj);
        this._currentObj = obj;
      } else {
        //combine objects
        if (this._currentObj[triple.predicate]) {
          if (Array.isArray(this._currentObj[triple.predicate]) && !this._currentObj[triple.predicate].includes(obj[triple.predicate])) {
            this._currentObj[triple.predicate].push(obj[triple.predicate]);
          } else if (!Array.isArray(this._currentObj[triple.predicate])) {
            this._currentObj[triple.predicate] = [this._currentObj[triple.predicate], obj[triple.predicate]];
          }
        } else {
          this._currentObj[triple.predicate] = obj[triple.predicate];
        }
      }
    }
    done();
  }

  _flush (done) {
    this._currentObj['@type'] = this._currentObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'];
    delete(this._currentObj['http://www.w3.org/1999/02/22-rdf-syntax-ns#type']);
    this.push(this._currentObj);
    done();
  }
}
module.exports = TTL2JSONLD;
