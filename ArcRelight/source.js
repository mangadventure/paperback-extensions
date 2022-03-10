(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*! (c) Andrea Giammarchi - ISC */
var self = {};
try {
  (function (URLSearchParams, plus) {
    if (
      new URLSearchParams('q=%2B').get('q') !== plus ||
      new URLSearchParams({q: plus}).get('q') !== plus ||
      new URLSearchParams([['q', plus]]).get('q') !== plus ||
      new URLSearchParams('q=\n').toString() !== 'q=%0A' ||
      new URLSearchParams({q: ' &'}).toString() !== 'q=+%26' ||
      new URLSearchParams({q: '%zx'}).toString() !== 'q=%25zx'
    )
      throw URLSearchParams;
    self.URLSearchParams = URLSearchParams;
  }(URLSearchParams, '+'));
} catch(URLSearchParams) {
  (function (Object, String, isArray) {'use strict';
    var create = Object.create;
    var defineProperty = Object.defineProperty;
    var find = /[!'\(\)~]|%20|%00/g;
    var findPercentSign = /%(?![0-9a-fA-F]{2})/g;
    var plus = /\+/g;
    var replace = {
      '!': '%21',
      "'": '%27',
      '(': '%28',
      ')': '%29',
      '~': '%7E',
      '%20': '+',
      '%00': '\x00'
    };
    var proto = {
      append: function (key, value) {
        appendTo(this._ungap, key, value);
      },
      delete: function (key) {
        delete this._ungap[key];
      },
      get: function (key) {
        return this.has(key) ? this._ungap[key][0] : null;
      },
      getAll: function (key) {
        return this.has(key) ? this._ungap[key].slice(0) : [];
      },
      has: function (key) {
        return key in this._ungap;
      },
      set: function (key, value) {
        this._ungap[key] = [String(value)];
      },
      forEach: function (callback, thisArg) {
        var self = this;
        for (var key in self._ungap)
          self._ungap[key].forEach(invoke, key);
        function invoke(value) {
          callback.call(thisArg, value, String(key), self);
        }
      },
      toJSON: function () {
        return {};
      },
      toString: function () {
        var query = [];
        for (var key in this._ungap) {
          var encoded = encode(key);
          for (var
            i = 0,
            value = this._ungap[key];
            i < value.length; i++
          ) {
            query.push(encoded + '=' + encode(value[i]));
          }
        }
        return query.join('&');
      }
    };
    for (var key in proto)
      defineProperty(URLSearchParams.prototype, key, {
        configurable: true,
        writable: true,
        value: proto[key]
      });
    self.URLSearchParams = URLSearchParams;
    function URLSearchParams(query) {
      var dict = create(null);
      defineProperty(this, '_ungap', {value: dict});
      switch (true) {
        case !query:
          break;
        case typeof query === 'string':
          if (query.charAt(0) === '?') {
            query = query.slice(1);
          }
          for (var
            pairs = query.split('&'),
            i = 0,
            length = pairs.length; i < length; i++
          ) {
            var value = pairs[i];
            var index = value.indexOf('=');
            if (-1 < index) {
              appendTo(
                dict,
                decode(value.slice(0, index)),
                decode(value.slice(index + 1))
              );
            } else if (value.length){
              appendTo(
                dict,
                decode(value),
                ''
              );
            }
          }
          break;
        case isArray(query):
          for (var
            i = 0,
            length = query.length; i < length; i++
          ) {
            var value = query[i];
            appendTo(dict, value[0], value[1]);
          }
          break;
        case 'forEach' in query:
          query.forEach(addEach, dict);
          break;
        default:
          for (var key in query)
            appendTo(dict, key, query[key]);
      }
    }

    function addEach(value, key) {
      appendTo(this, key, value);
    }

    function appendTo(dict, key, value) {
      var res = isArray(value) ? value.join(',') : value;
      if (key in dict)
        dict[key].push(res);
      else
        dict[key] = [res];
    }

    function decode(str) {
      return decodeURIComponent(str.replace(findPercentSign, '%25').replace(plus, ' '));
    }

    function encode(str) {
      return encodeURIComponent(str).replace(find, replacer);
    }

    function replacer(match) {
      return replace[match];
    }

  }(Object, String, Array.isArray));
}

(function (URLSearchParamsProto) {

  var iterable = false;
  try { iterable = !!Symbol.iterator; } catch (o_O) {}

  /* istanbul ignore else */
  if (!('forEach' in URLSearchParamsProto)) {
    URLSearchParamsProto.forEach = function forEach(callback, thisArg) {
      var self = this;
      var names = Object.create(null);
      this.toString()
          .replace(/=[\s\S]*?(?:&|$)/g, '=')
          .split('=')
          .forEach(function (name) {
            if (!name.length || name in names)
              return;
            (names[name] = self.getAll(name)).forEach(function(value) {
              callback.call(thisArg, value, name, self);
            });
          });
    };
  }

  /* istanbul ignore else */
  if (!('keys' in URLSearchParamsProto)) {
    URLSearchParamsProto.keys = function keys() {
      return iterator(this, function(value, key) { this.push(key); });
    };
  }

   /* istanbul ignore else */
  if (!('values' in URLSearchParamsProto)) {
    URLSearchParamsProto.values = function values() {
      return iterator(this, function(value, key) { this.push(value); });
    };
  }

  /* istanbul ignore else */
  if (!('entries' in URLSearchParamsProto)) {
    URLSearchParamsProto.entries = function entries() {
      return iterator(this, function(value, key) { this.push([key, value]); });
    };
  }

  /* istanbul ignore else */
  if (iterable && !(Symbol.iterator in URLSearchParamsProto)) {
    URLSearchParamsProto[Symbol.iterator] = URLSearchParamsProto.entries;
  }

  /* istanbul ignore else */
  if (!('sort' in URLSearchParamsProto)) {
    URLSearchParamsProto.sort = function sort() {
      var
        entries = this.entries(),
        entry = entries.next(),
        done = entry.done,
        keys = [],
        values = Object.create(null),
        i, key, value
      ;
      while (!done) {
        value = entry.value;
        key = value[0];
        keys.push(key);
        if (!(key in values)) {
          values[key] = [];
        }
        values[key].push(value[1]);
        entry = entries.next();
        done = entry.done;
      }
      // not the champion in efficiency
      // but these two bits just do the job
      keys.sort();
      for (i = 0; i < keys.length; i++) {
        this.delete(keys[i]);
      }
      for (i = 0; i < keys.length; i++) {
        key = keys[i];
        this.append(key, values[key].shift());
      }
    };
  }

  function iterator(self, callback) {
    var items = [];
    self.forEach(callback, items);
    /* istanbul ignore next */
    return iterable ?
      items[Symbol.iterator]() :
      {
        next: function() {
          var value = items.shift();
          return {done: value === void 0, value: value};
        }
      };
  }

  /* istanbul ignore next */
  (function (Object) {
    var
      dP = Object.defineProperty,
      gOPD = Object.getOwnPropertyDescriptor,
      createSearchParamsPollute = function (search) {
        function append(name, value) {
          URLSearchParamsProto.append.call(this, name, value);
          name = this.toString();
          search.set.call(this._usp, name ? ('?' + name) : '');
        }
        function del(name) {
          URLSearchParamsProto.delete.call(this, name);
          name = this.toString();
          search.set.call(this._usp, name ? ('?' + name) : '');
        }
        function set(name, value) {
          URLSearchParamsProto.set.call(this, name, value);
          name = this.toString();
          search.set.call(this._usp, name ? ('?' + name) : '');
        }
        return function (sp, value) {
          sp.append = append;
          sp.delete = del;
          sp.set = set;
          return dP(sp, '_usp', {
            configurable: true,
            writable: true,
            value: value
          });
        };
      },
      createSearchParamsCreate = function (polluteSearchParams) {
        return function (obj, sp) {
          dP(
            obj, '_searchParams', {
              configurable: true,
              writable: true,
              value: polluteSearchParams(sp, obj)
            }
          );
          return sp;
        };
      },
      updateSearchParams = function (sp) {
        var append = sp.append;
        sp.append = URLSearchParamsProto.append;
        URLSearchParams.call(sp, sp._usp.search.slice(1));
        sp.append = append;
      },
      verifySearchParams = function (obj, Class) {
        if (!(obj instanceof Class)) throw new TypeError(
          "'searchParams' accessed on an object that " +
          "does not implement interface " + Class.name
        );
      },
      upgradeClass = function (Class) {
        var
          ClassProto = Class.prototype,
          searchParams = gOPD(ClassProto, 'searchParams'),
          href = gOPD(ClassProto, 'href'),
          search = gOPD(ClassProto, 'search'),
          createSearchParams
        ;
        if (!searchParams && search && search.set) {
          createSearchParams = createSearchParamsCreate(
            createSearchParamsPollute(search)
          );
          Object.defineProperties(
            ClassProto,
            {
              href: {
                get: function () {
                  return href.get.call(this);
                },
                set: function (value) {
                  var sp = this._searchParams;
                  href.set.call(this, value);
                  if (sp) updateSearchParams(sp);
                }
              },
              search: {
                get: function () {
                  return search.get.call(this);
                },
                set: function (value) {
                  var sp = this._searchParams;
                  search.set.call(this, value);
                  if (sp) updateSearchParams(sp);
                }
              },
              searchParams: {
                get: function () {
                  verifySearchParams(this, Class);
                  return this._searchParams || createSearchParams(
                    this,
                    new URLSearchParams(this.search.slice(1))
                  );
                },
                set: function (sp) {
                  verifySearchParams(this, Class);
                  createSearchParams(this, sp);
                }
              }
            }
          );
        }
      }
    ;
    try {
      upgradeClass(HTMLAnchorElement);
      if (/^function|object$/.test(typeof URL) && URL.prototype)
        upgradeClass(URL);
    } catch (meh) {}
  }(Object));

}(self.URLSearchParams.prototype, Object));
module.exports = self.URLSearchParams;

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.urlEncodeObject = exports.convertTime = exports.Source = void 0;
class Source {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
    /**
     * @deprecated use {@link Source.getSearchResults getSearchResults} instead
     */
    searchRequest(query, metadata) {
        return this.getSearchResults(query, metadata);
    }
    /**
     * @deprecated use {@link Source.getSearchTags} instead
     */
    getTags() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            return (_a = this.getSearchTags) === null || _a === void 0 ? void 0 : _a.call(this);
        });
    }
}
exports.Source = Source;
// Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
function convertTime(timeAgo) {
    var _a;
    let time;
    let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
    trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
    if (timeAgo.includes('minutes')) {
        time = new Date(Date.now() - trimmed * 60000);
    }
    else if (timeAgo.includes('hours')) {
        time = new Date(Date.now() - trimmed * 3600000);
    }
    else if (timeAgo.includes('days')) {
        time = new Date(Date.now() - trimmed * 86400000);
    }
    else if (timeAgo.includes('year') || timeAgo.includes('years')) {
        time = new Date(Date.now() - trimmed * 31556952000);
    }
    else {
        time = new Date(Date.now());
    }
    return time;
}
exports.convertTime = convertTime;
/**
 * When a function requires a POST body, it always should be defined as a JsonObject
 * and then passed through this function to ensure that it's encoded properly.
 * @param obj
 */
function urlEncodeObject(obj) {
    let ret = {};
    for (const entry of Object.entries(obj)) {
        ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
    }
    return ret;
}
exports.urlEncodeObject = urlEncodeObject;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tracker = void 0;
class Tracker {
    constructor(cheerio) {
        this.cheerio = cheerio;
    }
}
exports.Tracker = Tracker;

},{}],5:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);
__exportStar(require("./Tracker"), exports);

},{"./Source":3,"./Tracker":4}],6:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":2,"./base":5,"./models":48}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],8:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],9:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],10:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],11:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],12:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],13:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],14:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],15:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],16:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],17:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],18:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],19:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],20:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],21:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],22:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],23:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],24:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Button"), exports);
__exportStar(require("./Form"), exports);
__exportStar(require("./Header"), exports);
__exportStar(require("./InputField"), exports);
__exportStar(require("./Label"), exports);
__exportStar(require("./Link"), exports);
__exportStar(require("./MultilineLabel"), exports);
__exportStar(require("./NavigationButton"), exports);
__exportStar(require("./OAuthButton"), exports);
__exportStar(require("./Section"), exports);
__exportStar(require("./Select"), exports);
__exportStar(require("./Switch"), exports);
__exportStar(require("./WebViewButton"), exports);
__exportStar(require("./FormRow"), exports);
__exportStar(require("./Stepper"), exports);

},{"./Button":10,"./Form":11,"./FormRow":12,"./Header":13,"./InputField":14,"./Label":15,"./Link":16,"./MultilineLabel":17,"./NavigationButton":18,"./OAuthButton":19,"./Section":20,"./Select":21,"./Stepper":22,"./Switch":23,"./WebViewButton":24}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomeSectionType = void 0;
var HomeSectionType;
(function (HomeSectionType) {
    HomeSectionType["singleRowNormal"] = "singleRowNormal";
    HomeSectionType["singleRowLarge"] = "singleRowLarge";
    HomeSectionType["doubleRow"] = "doubleRow";
    HomeSectionType["featured"] = "featured";
})(HomeSectionType = exports.HomeSectionType || (exports.HomeSectionType = {}));

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
    MangaStatus[MangaStatus["UNKNOWN"] = 2] = "UNKNOWN";
    MangaStatus[MangaStatus["ABANDONED"] = 3] = "ABANDONED";
    MangaStatus[MangaStatus["HIATUS"] = 4] = "HIATUS";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],29:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],30:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],31:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],32:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],33:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],34:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],35:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],36:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],37:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],38:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],39:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchOperator = void 0;
var SearchOperator;
(function (SearchOperator) {
    SearchOperator["AND"] = "AND";
    SearchOperator["OR"] = "OR";
})(SearchOperator = exports.SearchOperator || (exports.SearchOperator = {}));

},{}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentRating = void 0;
/**
 * A content rating to be attributed to each source.
 */
var ContentRating;
(function (ContentRating) {
    ContentRating["EVERYONE"] = "EVERYONE";
    ContentRating["MATURE"] = "MATURE";
    ContentRating["ADULT"] = "ADULT";
})(ContentRating = exports.ContentRating || (exports.ContentRating = {}));

},{}],41:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],42:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],44:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],45:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],46:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],47:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],48:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./SourceStateManager"), exports);
__exportStar(require("./RequestInterceptor"), exports);
__exportStar(require("./DynamicUI"), exports);
__exportStar(require("./TrackedManga"), exports);
__exportStar(require("./SourceManga"), exports);
__exportStar(require("./TrackedMangaChapterReadAction"), exports);
__exportStar(require("./TrackerActionQueue"), exports);
__exportStar(require("./SearchField"), exports);
__exportStar(require("./RawData"), exports);

},{"./Chapter":7,"./ChapterDetails":8,"./Constants":9,"./DynamicUI":25,"./HomeSection":26,"./Languages":27,"./Manga":28,"./MangaTile":29,"./MangaUpdate":30,"./PagedResults":31,"./RawData":32,"./RequestHeaders":33,"./RequestInterceptor":34,"./RequestManager":35,"./RequestObject":36,"./ResponseObject":37,"./SearchField":38,"./SearchRequest":39,"./SourceInfo":40,"./SourceManga":41,"./SourceStateManager":42,"./SourceTag":43,"./TagSection":44,"./TrackedManga":45,"./TrackedMangaChapterReadAction":46,"./TrackerActionQueue":47}],49:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcRelight = exports.ArcRelightInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MangAdventure_1 = require("../MangAdventure");
/** Arc-Relight metadata. */
exports.ArcRelightInfo = {
    name: 'Arc-Relight',
    icon: 'icon.png',
    version: '0.3.0',
    description: 'Extension for arc-relight.com',
    websiteBaseURL: 'https://arc-relight.com',
    contentRating: paperback_extensions_common_1.ContentRating.EVERYONE,
    author: 'MangAdventure',
    authorWebsite: 'https://github.com/mangadventure',
    sourceTags: [{ text: 'Notifications', type: paperback_extensions_common_1.TagType.GREEN }]
};
/** Arc-Relight source class. */
class ArcRelight extends MangAdventure_1.MangAdventure {
    constructor() {
        super(...arguments);
        /** @inheritDoc */
        this.baseUrl = exports.ArcRelightInfo.websiteBaseURL;
        /** @inheritDoc */
        this.version = exports.ArcRelightInfo.version;
        /** @inheritDoc */
        this.isHentai = (_series) => false;
    }
}
exports.ArcRelight = ArcRelight;

},{"../MangAdventure":50,"paperback-extensions-common":6}],50:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangAdventure = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const url_search_params_1 = __importDefault(require("@ungap/url-search-params"));
/** The HTTP method used in the API. */
const method = 'GET';
/** Base class for the MangAdventure framework. */
class MangAdventure extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        /** The language code of the website. */
        this.languageCode = paperback_extensions_common_1.LanguageCode.ENGLISH;
        /** A list of `mangaIds` that correspond to long-strip series. */
        this.longStripIds = [];
        /** @inheritDoc */
        this.requestManager = createRequestManager({ requestsPerSecond: 6 });
        /**
         * Determines whether the given series is a Hentai.
         *
         * @param series The series to be checked.
         */
        this.isHentai = (series) => { var _a, _b; return (_b = (_a = series.categories) === null || _a === void 0 ? void 0 : _a.includes('Hentai')) !== null && _b !== void 0 ? _b : false; };
        /** @inheritDoc */
        this.getMangaShareUrl = (mangaId) => `${this.baseUrl}/reader/${mangaId}/`;
        /** @inheritDoc */
        this.supportsSearchOperators = async () => false;
        /** @inheritDoc */
        this.supportsTagExclusion = async () => true;
        /** Returns the status of the given series. */
        this.getStatus = (series) => series.licensed ? paperback_extensions_common_1.MangaStatus.ABANDONED : // closest status to licensed
            series.completed ? paperback_extensions_common_1.MangaStatus.COMPLETED : paperback_extensions_common_1.MangaStatus.ONGOING;
        /** Converts the given series to a tile. */
        this.toTile = (series) => {
            var _a;
            return createMangaTile({
                id: series.slug,
                image: series.cover,
                badge: (_a = series.chapters) !== null && _a !== void 0 ? _a : undefined,
                title: createIconText({ text: series.title }),
                secondaryText: series.chapters === null ?
                    createIconText({ text: '[LICENSED]' }) : undefined,
            });
        };
    }
    /** The URL of the website's API. */
    get apiUrl() { return `${this.baseUrl}/api/v2`; }
    /** The headers used in the requests. */
    get headers() {
        return { 'user-agent': `Mozilla 5.0 (Paperback-iOS ${this.version}; Mobile)` };
    }
    /** @inheritDoc */
    async getChapterDetails(mangaId, chapterId) {
        const [slug, vol, num] = chapterId.split('/').slice(2, 5);
        const params = new url_search_params_1.default({ series: slug, volume: vol, number: num, track: 'true' });
        const request = createRequestObject({
            url: `${this.apiUrl}/pages?${params}`,
            headers: this.headers, method
        });
        const res = await this.requestManager.schedule(request, 1);
        const data = this.parseResponse(res);
        return createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            longStrip: this.longStripIds.includes(mangaId),
            pages: data.results.map(page => page.image)
        });
    }
    /** @inheritDoc */
    async getChapters(mangaId) {
        const request = createRequestObject({
            url: `${this.apiUrl}/chapters?series=${mangaId}`,
            headers: this.headers, method
        });
        const res = await this.requestManager.schedule(request, 1);
        const data = this.parseResponse(res);
        return data.results.map(chapter => createChapter({
            id: chapter.url,
            mangaId: chapter.series,
            chapNum: chapter.number,
            volume: chapter.volume || undefined,
            name: chapter.full_title + (chapter.final ? ' [END]' : ''),
            time: new Date(chapter.published),
            group: chapter.groups.join(', '),
            langCode: this.languageCode
        }));
    }
    /** @inheritDoc */
    async getMangaDetails(mangaId) {
        var _a, _b;
        const request = createRequestObject({
            url: `${this.apiUrl}/series/${mangaId}`,
            headers: this.headers, method
        });
        const res = await this.requestManager.schedule(request, 1);
        const data = this.parseResponse(res);
        return createManga({
            id: data.slug,
            image: data.cover,
            titles: [data.title, ...data.aliases],
            desc: data.description,
            artist: (_a = data.artists) === null || _a === void 0 ? void 0 : _a.join(', '),
            author: (_b = data.authors) === null || _b === void 0 ? void 0 : _b.join(', '),
            hentai: this.isHentai(data),
            status: this.getStatus(data),
            lastUpdate: new Date(data.updated),
            tags: data.categories ? [createTagSection({
                    id: 'categories',
                    label: 'Categories',
                    tags: data.categories.map(id => createTag({ id, label: id }))
                })] : [],
            views: data.views,
            rating: 0
        });
    }
    /** @inheritDoc */
    getSearchResults(query, metadata) {
        var _a, _b, _c;
        const search = { title: (_a = query.title) !== null && _a !== void 0 ? _a : '', categories: [] };
        (_b = query.includedTags) === null || _b === void 0 ? void 0 : _b.forEach(t => search.categories.push(t.id));
        (_c = query.excludedTags) === null || _c === void 0 ? void 0 : _c.forEach(t => search.categories.push('-' + t.id));
        return this.getWebsiteMangaDirectory({ ...metadata, search });
    }
    /** @inheritDoc */
    async filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        const request = createRequestObject({
            url: `${this.apiUrl}/series`,
            headers: this.headers, method
        });
        await this.requestManager.schedule(request, 1)
            .then(res => this.parseResponse(res))
            .then(data => mangaUpdatesFoundCallback(createMangaUpdates({
            ids: data.results.filter(s => new Date(s.updated) >= time && ids.includes(s.slug)).map(s => s.slug)
        })));
    }
    /** @inheritDoc */
    async getHomePageSections(sectionCallback) {
        const sections = [
            createHomeSection({
                id: 'title',
                title: 'All Series',
                view_more: true
            }),
            createHomeSection({
                id: '-views',
                title: 'Most Viewed',
                view_more: true
            }),
            createHomeSection({
                id: '-latest_upload',
                title: 'Latest Updates',
                view_more: true
            })
        ];
        const promises = sections.map(async (section) => {
            sectionCallback(section);
            const request = createRequestObject({
                url: `${this.apiUrl}/series?sort=${section.id}`,
                headers: this.headers, method
            });
            const res = await this.requestManager.schedule(request, 1);
            const data = this.parseResponse(res);
            section.items = data.results.map(this.toTile);
            return sectionCallback(section);
        });
        await Promise.all(promises);
    }
    /** @inheritDoc */
    getViewMoreItems(homepageSectionId, metadata) {
        return this.getWebsiteMangaDirectory({ ...metadata, sort: homepageSectionId });
    }
    /** @inheritDoc */
    async getWebsiteMangaDirectory(metadata) {
        var _a, _b;
        if ((metadata === null || metadata === void 0 ? void 0 : metadata.last) === true)
            return Promise.resolve(createPagedResults({ results: [] }));
        const page = ((_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 0) + 1;
        const params = new url_search_params_1.default({
            ...metadata === null || metadata === void 0 ? void 0 : metadata.search,
            page: page.toString(),
            sort: (_b = metadata === null || metadata === void 0 ? void 0 : metadata.sort) !== null && _b !== void 0 ? _b : 'title',
        });
        const request = createRequestObject({
            url: `${this.apiUrl}/series?${params}`,
            headers: this.headers, method
        });
        const res = await this.requestManager.schedule(request, 1);
        const data = this.parseResponse(res);
        return createPagedResults({
            results: data.results.map(this.toTile),
            metadata: { page, last: data.last }
        });
    }
    /** @inheritDoc */
    async getSearchTags() {
        if (this.categories)
            return [this.categories];
        const request = createRequestObject({
            url: `${this.apiUrl}/categories`,
            headers: this.headers, method
        });
        const res = await this.requestManager.schedule(request, 1);
        const data = this.parseResponse(res);
        this.categories = createTagSection({
            id: 'categories',
            label: 'Categories',
            tags: data.results.map(c => createTag({
                id: c.name, label: c.name
            }))
        });
        return [this.categories];
    }
    /**
     * Parses the given response into an object of type `T`.
     *
     * @template T - The type of the response data.
     * @param response - The response to be parsed.
     * @throws `Error` if the response cannot be parsed.
     */
    parseResponse(response) {
        if (response.status !== 200)
            throw new Error(`HTTP error ${response.status}: ${response.data}`);
        return JSON.parse(response.data);
    }
}
exports.MangAdventure = MangAdventure;

},{"@ungap/url-search-params":1,"paperback-extensions-common":6}]},{},[49])(49)
});
