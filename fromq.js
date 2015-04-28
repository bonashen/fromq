define(null, [], function () {
    //"use strict";

    var reNumber = /^[0-9]+$/,
        reFloat = /^(\+|-)?\d+($|\.\d+$)/,
        reTrim = /(^\s*)|(\s*$)/g;

    var reFunctionArgumentList = /^\s*function(?:\s+[^(\s]+)?\s*\(\s*([^)]*)\s*\)/;
    var reOneArg = /^\s*(\w+)\s*=>(.+)$/;
    var reManyArgs = /^\s*\(\s*([\w\s,]*)\s*\)\s*=>(.+)$/;

    //isString,isFunction,isArray implement code is come from dojo library.
    var isString = function (it) {
            // summary:
            //		Return true if it is a String
            // it: anything
            //		Item to test.
            return (typeof it == "string" || it instanceof String); // Boolean
        },
        isNumber = function (str) {
            reNumber.lastIndex = 0;
            return reNumber.exec(str) ? true : false;
        },
        isFloat = function (str) {
            reFloat.lastIndex = 0;
            return reFloat.exec(str) ? true : false;
        },
        isArray = function (it) {
            return it && (it instanceof Array || (typeof it) == "array");
        },
        isFunction = function (it) {
            return (it) && (it instanceof Function);
        },
        trim = function (str) {
            reTrim.lastIndex = 0;
            return str.replace(reTrim, '');
        },
        err = function (msg) {
            throw new Error("fromq/method error," + msg);
        },

        dppiUtils = {     //dppiUtils.invoking(callee,clause,[]);
            getFunctionArgumentList: function (fn) {
                if (isFunction(fn)) {
                    reFunctionArgumentList.lastIndex = 0;
                    var ret = reFunctionArgumentList.exec(fn);
                    return ret[1].split(",");
                } else return null;
            },
            getCallerExtValues: function (caller) {
                //var extCount = this.getCallerExtCount(caller);
                var defNames = this.getFunctionArgumentList(caller);
                //var extValues = [];
                //if (extCount) {
                //    extValues = Array.prototype.slice.call(caller.arguments, defNames.length);
                return Array.prototype.slice.call(caller.arguments, defNames.length);
                //}
                //return extValues;
            },
            getCallerExtCount: function (caller) {
                return caller.arguments.length - this.getFunctionArgumentList(caller).length;
            },
            invoking: function (/*Function*/fnCaller, /*Function|Lambda|String*/clause, /*Array*/params, _self) {
                var extValues = this.getCallerExtValues(fnCaller);
                clause = clauseConverter(clause, null, null);
                if (_self && isString(clause))clause = _self[clause];
                return clause.apply(_self, (params || []).concat(extValues));
            }
        },
        lambda_Cache = {},
        lambda = function (/*String*/condition, /*Boolean*/isClosure) {
            var getCachefn = function (/**/cacheName) {
                    var ret = null, fnObj = lambda_Cache[cacheName];
                    if (fnObj) {
                        ret = fnObj.method;
                        fnObj.num += 1;
                    }
                    return ret;
                },
                buildfn = function (body, cacheName) {
                    var fn = Function.apply(null, body);
                    lambda_Cache[cacheName] = {method: fn, num: 1};
                    return fn;
                    //return Function.apply(null, body);
                };

            isClosure = isClosure || false;
            var cacheName = condition + " |=| isClosure:" + isClosure;
            var fn = getCachefn(cacheName);
            if (fn) {
                return fn;
            }

            var cStr = condition.split('=>');
            if (cStr.length < 2)return null;

            var fnBody = [];
            if (cStr[0].indexOf('(') === -1) {
                fnBody = [cStr[0]];
            }
            else {
                fnBody = cStr[0].replace(/\(/g, '').replace(/\)/g, '').split(',');
            }
            //remove name leading and tail space char.
            for (var i = 0; i < fnBody.length; i++)fnBody[i] = trim(fnBody[i]);

            var codeBody = cStr.slice(1, cStr.length).join("=>");

            if (isClosure) {//true,insert closed function code.
                var names = trim(fnBody.join(",")), str = [];
                str.push(" (function(");
                str.push(names);
                str.push("){");
                str.push(codeBody);
                str.push("}).apply(this,arguments)");
                codeBody = str.join('');
            }

            fnBody.push(
                []
                    .concat("'use strict';\n")
                    .concat("return ")
                    .concat(codeBody)
                    .concat(";")
                    .join(""));
            return buildfn(fnBody, cacheName);
        },

        _lambdaUtils = {
            isLambda: function (it) {
                reOneArg.lastIndex = 0;
                reManyArgs.lastIndex = 0;
                return isString(it) && ((reOneArg.exec(it) || reManyArgs.exec(it)) !== null);
            },
            compile: function (it, isClosure) {
                return lambda(it, isClosure);
            },
            convert: function (it, isClosure) {
                var ret = null;
                if (this.isLambda(it))
                    ret = this.compile(it, isClosure);
                if (ret === null)ret = it;
                return ret;
            },
            getCache: function () {
                var ret = [], cache = lambda_Cache;
                for (var name in cache) {
                    ret.push({lambda: name, method: cache[name].method, num: cache[name].num});
                }
                return fromq(ret);
            },
            resetCache: function () {
                lambda_Cache = {};
            }
        },
        isLambda = _lambdaUtils.isLambda,
    //eg:
    // | range(10);
    // | range(1,10);
    // | range(0,26,1,"o=>String.fromCharCode(o+65)");
        range = function (start, end, step, valueClause) {
            switch (arguments.length) {
                case 1:
                    end = start;
                    start = 0;
                    step = 1;
                    break;
                case 2:
                    step = (end > start ? 1 : -1);
                    break;
            }
            if (step < 0 && end > start) {
                var value = start;
                start = end;
                end = value;
            }
            var ret = [];
            valueClause = clauseConverter(valueClause, null, function (num) {
                return num;
            });
            for (var i = start; i < end; i += step) {
                ret[ret.length] = dppiUtils.invoking(arguments.callee, valueClause, [i]);
            }
            return fromq(ret);
        },
        repeat = function (/*String*/it, /*number*/count) {
            var i = 0, ret = [];
            for (; i < count; i++) {
                ret[i] = it;
            }
            return fromq(ret);
        },
        random = function (maxValue, count) {
            var i = 0, ret = [];
            maxValue -= 1;
            count = count || 1;
            for (; i < count; i++) {
                ret[i] = Math.round(Math.random() * maxValue);
            }
            return fromq(ret);
        },
        fieldToLambda = function (field) {
            if (isString(field) && !_lambdaUtils.isLambda(field)) {
                field = ["o=>o['"].concat(trim(field)).concat("']").join("");
            }
            return field;
        },
    //转换单个唯一条件至值对象
    // |eg:
    // |keyValueClauseConverter("o=>o") //{left:"o=>o",right:"o=>o"}
    // |var distinct = function(item,index){return item};
    // |keyValueClauseConverter(distinct) //{left:distinct,right:distinct}
    // |keyValueClauseConverter("value") //{left:"o=>o['value']",right:"o=>o['value']"}
    // |keyValueClauseConverter("leftField,rightField") //{left:"o=>o['leftField']",right:"o=>o['rightField']"}
        keyValueClauseConverter = function (clause) {
            //default
            if (clause == null) {
                clause = {};
            }
            //is lambda
            clause = _lambdaUtils.convert(clause);

            if (isString(clause)) {
                var rdsq = fromq(clause).trim();
                clause = {
                    left: fieldToLambda(rdsq.first()),
                    right: fieldToLambda(rdsq.last())
                };
            }

            if (isFunction(clause)) {
                clause = {left: clause, right: clause};
            }

            if (clause) {
                var lm = "o=>o";
                var left = clause.left || lm;
                left = fieldToLambda(left);
                clause.left = _lambdaUtils.convert(left);
                var right = clause.right || lm;
                right = fieldToLambda(right);
                clause.right = _lambdaUtils.convert(right);
            }
            return clause;
        },
        inOrNotIn = function (notIn) {
            //eg:
            // | var distinct = function(item,index){return item;};
            // | var log = function(item){console.log(item)};
            // | fromq([1,2,3]).notIn([2,4]).each(log);
            // | fromq([1,2,3]).in([2,4],{left:distinct,right:distinct}).each(log);
            // | fromq([1,2,3]).in([2,4],{left:"o=>o",right:"o=>o"}).each(log);
            // | fromq([1,2,3]).notIn([2,4],"o=>o").each(log);
            return function (/*fromq|array*/it, /*lambda|function|string fields|{left:'',right:''}*/distinctClause) {
                var _this = this, dict = {};
                var ret = [];
                distinctClause = keyValueClauseConverter(distinctClause);
                fromq(it).let(dict).distinct(distinctClause.right, true)
                    .each("(o,i,v)=>v[o]=true");
                _this.each(
                    function (item, index, letvar) {
                        if (notIn ^ dict[distinctClause.left(item, index, letvar)]) {
                            ret[ret.length] = item;
                        }
                    }
                );
                dict = null;
                return fromq(this, ret);
            }
        },
        lastOrIndexOf = function (isLastIndexOf) {
            return function (/*Function|Lambda|value*/clause) {
                clause = _lambdaUtils.convert(clause);

                if (!isFunction(clause)) {
                    var value = clause;
                    clause = function (item) {
                        return item === value;
                    }
                }
                var ret = -1;
                this.each(function (item, index, letvar) {
                    if (clause(item, index, letvar)) {
                        ret = index;
                        return true;
                    }
                }, isLastIndexOf);
                return ret;
            }
        }
        ,
        extend = function (dest, source) {
            var _doExtend = function (dest, source) {
                for (var key in source) {
                    dest[key] = source[key];
                }
            };
            dest = dest || {};
            source = source || {};
            if (!isArray(source))source = [].concat(source);
            for (var i = 0, l = source.length; i < l; i++) {
                _doExtend(dest, source[i]);
            }
            return dest;
        };


    var grouped = {
        //cache: cache,
        //example:
        // select(function(/*object*/g,/*fromq*/i){
        //    f=i.select("o=>o.age");
        //    ret= {group:g minAge:f.min(),maxAge:f.max(),count:f.count(),sum:f.sum(),items:i.toArray()};
        //    return ret;
        // });
        select: function (/*Function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);
            var ret = [], item;
            this.each(
                function (group, items) {
                    item = clause(group, items);
                    if (item !== undefined)
                        ret[ret.length] = item;
                });
            return fromq(ret);
        },
        //example:
        // |  each(function(/*object*/group,/*fromq*/items){});
        // |  each("(g,i)=>i.each('o=>console.log(o)')");
        each: function (/*Function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause, true);
            for (var key in this.cache) {
                if (clause(key, fromq(this.cache[key])))break;
            }
            return this;
        },
        getCache: function () {
            return this.cache;
        }
    };

    var paginger = {
        //cache: null,
        pageNo: 0,
        nextCount: 15,
        getCache: function () {
            return this.cache;
        },
        first: function () {
            return this.gotoPage(1);
        },
        last: function () {
            return this.gotoPage(this.pageCount());
        },
        next: function () {
            this.pageNo += 1;
            return this.gotoPage(this.pageNo);
        },
        prior: function () {
            this.pageNo -= 1;
            return this.gotoPage(this.pageNo);
        },
        current: function () {
            return this.gotoPage(this.pageNo);
        },
        isTail: function () {
            return this.pageNo >= this.cache.count();
        },
        isTop: function () {
            return this.pageNo <= 1;
        },
        reset: function () {
            this.pageNo = 0;
        },
        pageCount: function () {
            return Math.ceil(this.getCacheCount() / this.getNextCount());
        },
        //currentPageNumber: function () {
        //    var postion = this.postion <= 0 ? 1 : this.postion;
        //    var ret = Math.ceil(this.postion / this.getNextCount());
        //    ret = ret > this.pageCount() ? this.pageCount() : ret;
        //    return ret;
        //},
        getPageNo: function (/*Object*/item) {
            var ret = -1, start;
            ret = this.pageCount();
            if (item && ret > 0) {
                start = this.indexOf(item) + 1;
                if (start > 0) {
                    ret = Math.ceil(start / this.getNextCount());
                    ret = ret > this.pageCount() ? this.pageCount() : ret;
                }
            } else {
                ret = ret > 0 ? this.pageNo : ret;
            }
            return ret;
        },
        gotoPage: function (/*Number*/pageNumber) {
            this.pageNo = pageNumber;
            var start = (pageNumber >= 1 ? pageNumber - 1 : 0) * this.getNextCount();
            return this.cache.takeRange(start, start + this.getNextCount());
        },
        setNextCount: function (/*Number*/count) {
            this.nextCount = count;
            this.nextCount = this.nextCount < 1 ? 15 : this.nextCount;
            //this.reset();
        },
        getNextCount: function () {
            return this.nextCount;
        },
        indexOf: function (it) {
            return this.cache.indexOf(it);
        },

        //| example:
        //| each(callback);
        //| callback = function(/*fromq*/rdsq,/*Number*/pageNumber){return false;};
        //| callback = "(rdsq,i)=>console.log('pageNumber:',i);rdsq.each('o=>console.log(o)')";
        //|
        each: function (/*Function|Lambda*/callback) {
            callback = clauseConverter(callback, null, null, true);
            var pageCount = this.pageCount();
            for (var i = 1; i <= pageCount; i++) {
                if (callback(this.gotoPage(i), i))break;
            }
            return this;
        },
        //example:
        // | select(clause);
        // | clause = function(/*fromq*/rdsq,/*Number*/pageNo){return {.....};};
        // | clause = "(rdsq,pageNo)=>{pageNo:pageNo,count:rdsq.count()....}";
        select: function (/*function|Lambda*/clause) {
            clause = clauseConverter(clause, null, function (rdsq, pageNo) {
                return {pageNo: pageNo, items: rdsq.toArray()};
            });
            if (!isFunction(clause))
                err("select=>clause must be function.");
            var item, ret = [];
            this.each(
                function (rdsq, pageNo) {
                    item = clause(rdsq, pageNo);
                    if (item!==undefined)
                        ret[ret.length] = item;
                }
            );
            return fromq(ret);
        },
        getCacheCount: function () {
            return this.cache.count();
        },
        isEmpty: function () {
            return this.cache.isEmpty();
        }
    };

    //example
    // |   clauseConverter(clause,function(fieldsq){return ""},function(){return;});
    // |   clauseConverter(clause,null,function(){return;});
    // |   fieldsProcesser=function(/*fromq*/ fieldsq){return "o=>o"}//return lambda;
    var clauseConverter = function (clause, fieldsProcesser, defaultFunction, isClosure) {
        if (isFunction(clause))return clause;
        if (isLambda(clause))return lambda(clause, isClosure);
        if (isString(clause) && fieldsProcesser !== null) {
            var value = fieldsProcesser(fromq(clause));
            clause = isString(value) ? lambda(value, isClosure) : value;
            return clause;
        }
        if (defaultFunction !== null) {
            if (isLambda(defaultFunction))return lambda(defaultFunction, isClosure);
            return defaultFunction;
        }
        return clause;
    };


    //将字符串中单词的首字母转换为大写字母
    var initialsToUpperCase = function (it) {
            var re = /([^A-z]*)([A-z]+)([^A-z]*)/g;
            var src = it;
            return fromq(re)
                //取出每个单词分组
                .match(src)
                //取出每个单词的首字母
                // |o[0]为分组的总字符串
                // |o[1]为前导非字母字符串
                // |o[2]为中间字母字符串
                .select(fromq(
                    //"(o,i,fn)=>[].concat(o[1]).concat(o[2].replace(/(\\w)/,fn)).concat(o[3]).join('')"
                    "(o,i,fn)=>o[0].replace(/(\\w)/,fn)"
                ),
                function (s) {
                    //转换首字母为大写并返回
                    return s.toUpperCase();
                }).toString("");
        },
    //将字符中首个单词的首字母转换为大写字母
        initialToUpperCase = function (it) {
            return it.replace(/(\w)/,
                function (s) {
                    return s.toUpperCase();                      //转换首字母为大写并返回
                });
        };

    var fromq = function (/*Array|String|Lambda|RegExp*/it, /*String|Boolean*/splitChar) {
        //for lambda
        if (isLambda(it))
            return lambda(it, arguments[1] || false);
        //for String :"1,2,3,4"
        if (isString(it))
            return new fromq.fn._init(it.split(splitChar || ","));
        //for fromq object
        // |fromq(fromq([1,2,3]))
        // |fromq(fromq([1,2,3]),[4,5,6])
        if (it instanceof fromq) {
            var arr = arguments[1];
            var ret = it;
            if (arr !== null) {
                ret = new fromq.fn._init(arr);
                ret.let(it.letvar);//set let variable
            }
            return ret;
        }

        //for RegExp
        //example
        // |  fromq(/ab*/g,"abdfabhg").each("o=>console.log(o)");
        if (it instanceof RegExp) {
            var str = arguments[1];
            var ret = new fromq.fn._init(it);
            if (isString(str)) {
                ret = ret.match(str);
            }
            return ret;
        }
        //for array object
        return new fromq.fn._init(it);
    };

    fromq.fn = fromq.prototype = {
        _init: function (/*Array|RegExp*/it) {
            this.items = it;
            this.regexp = it;
            this.utils = utils;
            this.letvar = {};
        },
        version: '20150428/01',
        vendor: "bonashen.com",
        toArray: function (/*Array*/arr, /*Boolean*/overwrite) {
            if (arr) {
                arr = arr.items || arr;
                overwrite = overwrite === undefined ? true : overwrite;
                if (isArray(arr)) {
                    if (overwrite)arr.length = 0;
                    this.each(function (item, index) {
                        arr[overwrite ? index : arr.length] = item;
                    });
                }
            }
            return this.items;
        },
        into: function (/*Array*/arr, /*Boolean*/overwrite) {
            this.toArray(arr, overwrite);
            return this;
        },
        //example1:
        // where(function(item,index){ });
        // example2:
        // where("(a,i)=>a")
        // | let(4).where("(a,i,n)=>a<n");
        where: function (/*Function|Lambda*/clause) {
            clause = clauseConverter(clause, null, function () {
                return true
            });
            var newArray = [], it;
            // The clause was passed in as a Method that return a Boolean
            this.each(function (item, index, letvar) {
                it = clause(item, index, letvar);
                if (it === true) {
                    newArray[newArray.length] = item;
                }
            });
            return fromq(this, newArray);
        },
        //example:
        // select(function(item,index){return {name:item.name,id:index};});
        // if return value is null,not be select.
        // lambda exp:
        // select('(o,i)=>{name:o.name,id:i}');

        select: function (/*Function|Lambda|String fields*/clause) {
            clause = clauseConverter(clause, function (rdsq) {
                var ret = ["o=>o{"];
                rdsq.each(function (field) {
                    ret.push(field);
                    ret.push(":['");
                    ret.push(field);
                    ret.push("']");
                    ret.push(",");
                });
                ret.length = ret.length - 1;
                ret.push("}");
                return ret.join("");
            }, "o=>o");

            var newArray = [];
            this.each(function (item, index, letvar) {
                item = clause(item, index, letvar);
                if (item !== null)
                    newArray[newArray.length] = item;
            });
            return fromq(this, newArray);
        },

        //example:
        // var list=[{name:'bona',age:38},{name:'peter',age:11}];
        // fromq(list).orderBy("age,name");
        // fromq(list).orderBy(function(item){return item.name});
        // fromq(list).orderBy(function(a,b){return a.age-b.age},customCompare=true);
        // fromq(list).orderBy('o=>o.name');
        // fromq(list).orderBy('(a,b)=>a-b',true);

        orderBy: function (/*Function|Lambda|String fields*/clause, /*Boolean*/customCompare) {
            clause = _lambdaUtils.convert(clause);
            var tempArray = this.items;//.concat();

            customCompare = customCompare || false;

            if (isString(clause) /*&& customCompare == false*/) {
                customCompare = true;
                var option = clause.split(",");

                clause = function (a, b) {
                    var ret = 0;
                    for (var i = 0; i < option.length; i++) {
                        var label = option[i], x = a[label], y = b[label];
                        if (ret == 0) {
                            ret = x < y ? -1 : x > y ? 1 : 0;
                        } else break;
                    }
                    return ret;
                };
            }
            clause = clause ? clause : function (item) {//clause is null,then order by item value;
                return item;
            };

            var letvar = this.letvar;
            var getComparefn = function (customCompare) {
                return customCompare == false ? function (a, b) {
                    var x = clause(a, letvar);
                    var y = clause(b, letvar);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                } : function (a, b) {
                    return clause(a, b, letvar);
                }
            };
            var myCompare = getComparefn(customCompare);

            return fromq(this, tempArray.sort(myCompare));
        },
        //example:
        // var list=[{name:'bona',age:38},{name:'peter',age:11}];
        // fromq(list).orderByDescending("age,name");
        // fromq(list).orderByDescending(function(item){return item.name});
        // fromq(list).orderByDescending(function(a,b){return a.age-b.age},customCompare=true);
        // fromq(list).orderByDescending('o=>o.name');
        // fromq(list).orderByDescending('(a,b)=>a-b',true);

        orderByDescending: function (/*Function|Lambda|String fields*/clause, /*Boolean*/customCompare) {
            clause = _lambdaUtils.convert(clause);
            var tempArray = this.items.concat();

            customCompare = customCompare || false;

            if (isString(clause) /*&& customCompare == false*/) {
                customCompare = true;
                var option = clause.split(",");
                //when clause is some fields. then order by item[field] value.
                clause = function (a, b) {
                    var ret = 0;
                    for (var i = 0; i < option.length; i++) {
                        var label = option[i], y = a[label], x = b[label];
                        if (ret == 0) {
                            ret = x < y ? -1 : x > y ? 1 : 0;
                        } else break;
                    }
                    return ret;
                };
            }
            //when clause is undefined.then order by item value;
            clause = clause ? clause : function (item) {
                return item;
            };
            var letvar = this.letvar;
            return fromq(this,
                tempArray.sort(customCompare == false ? function (a, b) {
                    var x = clause(b, letvar);
                    var y = clause(a, letvar);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                } : function (a, b) {
                    return clause(a, b, letvar);
                })
            );
        },
        //example:
        // selectMany(function(item,index){return {name:item.name}});
        // selectMany("(o,i)=>{name:o.name}");
        // selectMany("name,age");

        selectMany: function (/*Function|Lambda|String feilds*/clause) {
            clause = clauseConverter(clause, function (fieldsq) {
                var ret = "o=>o['" + fieldsq.first() + "']";
                if (fieldsq.count() == 1)return ret;
                ret = [].concat("o=>{");
                fieldsq.each(function (name) {
                    ret.push("'" + name + "':o['" + name + "']");
                    ret.push(",");
                });
                ret.length = ret.length - 1;
                ret.push("}");
                return ret.join("");
            }, null);

            var r = [];
            this.each(function (item, index, letvar) {
                r[r.length] = clause(item, index, letvar);
            });
            return fromq(this, r);
        },

        //example:
        // count(function(item){return true;});
        // count('o=>o');
        // count();
        count: function (/*Function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);

            if (clause == null)
                return this.items.length;
            else
                return this.where(clause).items.length;
        },
        //example:
        // distinct(function(item){return item});
        // distinct(function(item){return item},true);
        // distinct("o=>o");
        // distinct("o=>o",true);
        // distinct("field");
        // distinct("field",true);
        distinct: function (/*Function|Lambda|String field*/clause, /*boolean*/distinctValue) {
            clause = clauseConverter(clause, function (fieldsq) {
                return fieldToLambda(fieldsq.trim().first());
            }, function (item) {//no clause,then return item value.
                return item;
            });
            distinctValue = distinctValue || false;
            var d_item;
            var dict = {};
            var retVal = [];
            this.each(function (item, index, letvar) {
                d_item = clause(item, index, letvar);
                if (dict[d_item] == null) {
                    dict[d_item] = true;
                    retVal[retVal.length] = distinctValue ? d_item : item;
                }
            });
            dict = null;
            return fromq(this, retVal);
        },
        //example:
        // like where
        // any(function(item){return true});
        // any("o=>o");
        // |var str = 'Hello world!';
        // |console.log(fromq(/Bona/g, str).any());
        // |console.log(fromq(/Hello/g, str).any()); // true

        any: function (/*Function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);
            var
                ret = false;
            if (clause)
                this.each(function (item, index, letvar) {
                    ret = clause(item, index, letvar);
                    return ret;
                });
            else
                ret = !this.isEmpty();
            return ret;
        },
        //example:
        // like where
        // all(function(item){return true});
        // all("o=>o<2");
        // | var numbers=[1,2,3,4];
        // | console.log(fromq(numbers).all("o=>o>1")); //false
        // | console.log(fromq(numbers).all("o=>o>0")); //true
        // | numbers=[];
        // | console.log(fromq(numbers).all()); //false

        all: function (/*Function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);
            var ret = false;
            if (clause && !this.isEmpty())
                this.each(function (item, index, letvar) {
                    ret = !clause(item, index, letvar);
                    return ret;
                });
            else ret = this.isEmpty();
            return !ret;
        },
        reverse: function () {
            var retVal = [];
            for (var index = this.items.length - 1; index > -1; index--)
                retVal[retVal.length] = this.items[index];
            return fromq(this, retVal);
        },
        //example:
        // like where
        // first(function(item){return true});
        // first("o=>o");
        // first();

        first: function (/*Function|Lambda*/clause) {
            if (clause != null) {
                return this.where(clause).first();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.elementAt(0);
                else
                    return null;
            }
        },
        //example:
        // like where
        // last(function(item){return true});
        // last("o=>o");
        // last();

        last: function (/*Function|Lambda*/clause) {
            if (clause != null) {
                return this.where(clause).last();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.elementAt(this.items.length - 1);
                else
                    return null;
            }
        },
        elementAt: function (index) {
            return this.items[index];
        },
        //description:
        //      连接，不过滤相同项
        concat: function (/*Array|fromq*/second) {
            var arr = second.items || second;
            return fromq(this, this.items.concat(arr));
        },

        //description:
        //     合并,过滤相同项
        //     union is used to combine the result sets of 2 . It removes duplicate rows by clause function result.
        // example:
        // union(secondArray,function(item){return item});
        // union(secondArray,"o=>o");
        // union(secondArray,"fieldName");
        union: function (/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause) {
            return this.concat(second).distinct(clause);
        },
        //description:
        //      相交
        // example:
        // intersect(secondArray,function(item){return item});
        // intersect(secondArray,"field");
        // intersect(secondArray,"o=>o");
        intersect: function (/*Array|fromq*/second, /*Function|lambda|String field*/clause) {
            clause = _lambdaUtils.convert(clause);

            if (isString(clause)) {
                clause = (function (clause) {
                    var field = clause;
                    clause = function (item) {
                        return item[field];
                    };
                    return clause;
                })(clause);
            }

            var leftq = this.distinct(clause);
            var result = [], map = {};
            var rightq = fromq(this, second).distinct(clause, true);

            rightq.each(function (item) {
                map[item] = true;
            });

            leftq.each(
                function (item, index, letvar) {
                    if (map[clause(item, index, letvar)])
                        result[result.length] = item;
                }
            );
            map = null;
            return fromq(this, result);
        },
        //description:
        //      与非,取两个数组不相交的值
        // example:
        // except(secondArray,function(item){return item});
        // except(secondArray,"field");
        // except(secondArray,"o=>o");

        except: function (/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause) {
            clause = _lambdaUtils.convert(clause);

            if (isString(clause)) {
                clause = (function (clause) {
                    var field = clause;
                    clause = function (item) {
                        return item[field];
                    };
                    return clause;
                })(clause);
            }

            //下面代码是通过连接aq不在bq的数据与bq不在aq中的数据代码实现
            //var aq = fromq(this);
            //aq = dppiUtils.invoking(callee, this.distinct, [clause], aq);//去除重复项
            //aq = aq.select(function (item) {
            //    return {item: item, id: dppiUtils.invoking(callee, clause, [item])} //重织数据
            //});
            //
            //var bq = fromq(second);
            //bq = dppiUtils.invoking(callee, this.distinct, [clause], bq);//去除重复项
            //bq = bq.select(function (item) {
            //    return {item: item, id: dppiUtils.invoking(callee, clause, [item])} //重织数据
            //});
            //
            //var comparefn = fromq("(o,i,item)=>o.id !== item.id");                  //生成条件代码
            //
            //var selectfn = function (item,index,q) {
            //    if (q.where(comparefn, item).count() > 0)
            //        return item.item;
            //} ;
            //
            //var ab1 = aq.select(selectfn,bq);//取aq未出现在bq中的数据
            //
            //var ab2 = bq.select(selectfn,aq);//取bq未出现在aq中的数据
            //
            //return ab1.concat(ab2);

            //下面代码是通过排除交叉集的方法实现

            var unionq = this.union(second, clause),
                intersectq = this.intersect(second, clause);

            var result = [], map = {};
            intersectq.distinct(clause, true).
                each(function (item) {
                    map[item] = true;
                });
            unionq.each(
                function (item, index, letvar) {
                    if (map[clause(item, index, letvar)] !== true)
                        result[result.length] = item;
                }
            );
            map = null;
            return fromq(this, result);
        },
        defaultIfEmpty: function (defaultValue) {
            if (this.items.length == 0) {
                return defaultValue;
            }
            return this;
        },
        elementAtOrDefault: function (index, defaultValue) {
            if (index >= 0 && index < this.items.length) {
                return this.items[index];
            }
            return defaultValue;
        },
        firstOrDefault: function (defaultValue) {
            return this.first() || defaultValue;
        },
        lastOrDefault: function (defaultValue) {
            return this.last() || defaultValue;
        },

        //example:
        //each(function(item, idx){
        //	|			console.log(item, "at index:", idx);
        //	|		});
        // each("(o,i)=>(function(item,index){console.log(item,'\t',index);})(o,i) ");

        each: function (/*function|Lambda*/callback, /*boolean*/backwards) {
            callback = _lambdaUtils.convert(callback, true);
            var
                items = this.items;
            if (backwards) {
                for (var i = items.length; i >= 0; --i)if (callback(items[i], i, this.letvar))break;
            }
            else for (var i = 0, l = items.length; i < l; ++i) {
                if (callback(items[i], i, this.letvar))break;
            }
            return this;
        },

        //example1:
        //var data=[0,1,2,3,4,5];
        // var _=_from;
        //_(data).range(3,4,
        //          function(item,index){
        //              return item=3||index=4;
        //          }).toArray().join(",");
        //out:
        //3,4
        //example2:
        // var data =[{name:"bona shen",age:38},{name:"kerry",age:5},{name:"peter",age:11}];
        // var _=fromq;
        // _(data).takeRange(3,4,_("a=>a.name.indexOf('e')")).toArray().join(",");
        takeRange: function (/*int*/start, /*int*/ end, /*function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);

            var result = clause ? this.where(clause) : this;

            end = end || result.items.length;
            end = end > result.items.length ? result.items.length : end;
            start = start || 0;

            return fromq(this, result.items.slice(start, end));

        },
        take: function (/*number*/top, /*function|Lambda*/clause) {
            return this.takeRange(0, top, clause);
        },
        skip: function (/*number*/count, /*function|Lambda*/clause) {
            return this.takeRange(count, this.count(), clause);
        },

        paging: function (/*Number*/nextCount, /*Function|Lambda*/clause) {

            clause = clauseConverter(clause, null, function () {
                return true;
            });
            var _self = this;
            var ret = extend({}, [paginger,
                {cache: _self.where(clause)}]);
            ret.setNextCount(nextCount);
            return ret;
        },
        /*
         * group by clause function result
         * example:
         * groupBy(function(item,index){
         *    return item.value>10;
         * })
         * //or
         * groupBy("o=>o.value>10")
         * //or
         * groupBy("value,...")
         * =================================
         * result:
         * {
         *   cache:{
         *    true:{items:Array},
         *    false:{items:Array}
         *    },
         *    each:function(){},
         *    select:function(){},
         *    getData:function(){}
         * }
         *
         * */
        groupBy: function (/*function|Lambda|String fields*/clause) {
            var cache = {};
            var g = extend({}, [grouped, {cache: cache}]);
            if (this.items.length == 0) return g;
            clause = clauseConverter(clause, function (rdsq) {
                var ret = ["o=>[]"];
                ret.push(rdsq.select("o=>'.concat(o[\"'+o+'\"])'").toString());
                ret.push(".join(\",\")");
                return ret.join("");
            }, "o=>o");
            this.each(
                function (item, index, letvar) {
                    var gLabel = clause(item, index, letvar);
                    gLabel = cache[gLabel] = cache[gLabel] || [];
                    gLabel[gLabel.length] = item;
                }
            );
            return g;
        },
        max: function (/*Function|Lambda|String field*/clause) {
            clause = clauseConverter(clause, function (rdsq) {
                return "o=>o['" + rdsq.first() + "']";
            }, function (item) {
                if (isString(item) && isFloat(item))//process string value is float.
                    return parseFloat(item);
                return item;
            });
            return Math.max.apply(null, this.select(clause).toArray());
        }
        ,
        min: function (/*Function|Lambda|String field*/clause) {
            clause = clauseConverter(clause, function (rdsq) {
                return "o=>o['" + rdsq.first() + "']";
            }, function (item) {
                if (isString(item) && isFloat(item))//process string value is float.
                    return parseFloat(item);
                return item;
            });
            return Math.min.apply(null, this.select(clause).toArray());
        }
        ,
//example1:
// var list = [{name:'bona shen',age:38},{name:'kerry',age:5}];
// fromq(list).sum(function(item){return item.age});
// example2:
// fromq(list).sum("o=>o.age");
// example3:
// fromq(list).sum("age");
// | fromq().range(10).let(5).sum("(o,i,n)=>o<n?o*n:o");//extend args.

        sum: function (/*Function|Lambda|String field*/clause) {
            clause = _lambdaUtils.convert(clause);
            //var fields = clause;
            clause = (function (clause) {
                if (isString(clause)) {
                    var field = clause;
                    clause = function (item) {
                        var value = item[field];
                        if (isString(value) && isFloat(value))//process string value is float.
                            value = parseFloat(value);
                        return value;
                    };
                }
                return clause;
            })(clause);
            var ret = 0;
            this.each(clause !== undefined ? function (item, index, letvar) {
                    ret += clause(item, index, letvar);//support sum function extend args
                } :
                    function (item) {
                        if (isString(item) && isFloat(item))//process string value is float.
                            ret += parseFloat(item);
                        else
                            ret += item;
                    }
            );
            return ret;
        }
        ,
//like sum function.
        avg: function (/*Function|Lambda|String field*/clause) {
            return this.isEmpty() ? Number.NaN :
            this.sum(clause) / this.count();
        }
        ,
        isEmpty: function () {
            var ret = isArray(this.items) && this.items.length > 0;
            return !ret;
        }
        ,
//example:
// |   fromq("1,2,3,4").contains("o=>parseInt(o)==3");
// |   fromq("1,2,3,4").contains(function(item){return parserInt(item)==3;});
// |   fromq("1,2,3,4").contains("5");
// |   var n='3';fromq("1,2,3,4").let(n).contains("(o,i,n)=>o<n");
        contains: function (/*Function|Lambda|value*/clause) {
            return this.indexOf(clause) !== -1;
        }
        ,
//example:
// |  fromq("1,2,3,4,5").indexOf("o=>o==='5'");
// |  fromq("1,2,3,4,5").indexOf(function(item){return item==='5';});
// |  fromq("1,2,3,4,5").indexOf("3");
        indexOf: function (/*Function|Lambda|value*/clause) {
            return lastOrIndexOf(false).apply(this, arguments);
        },
        lastIndexOf: function (/*Function|Lambda|value*/clause) {
            return lastOrIndexOf(true).apply(this, arguments);
        },
        toString: function (separator) {
            return this.toArray().join(separator || '');
        },
//删除字符串首尾空格并重新组织fromq
        trim: function () {
            var ret = [];
            this.each(function (item) {
                if (isString(item)) {
                    ret[ret.length] = trim(item);
                    if (!ret[ret.length - 1]) //如果为空字符串时，过滤该字符串
                        ret.length = ret.length - 1;
                } else ret[ret.length] = item;
            });
            return fromq(this, ret);
        },
//将数组中字符串所有单词的首字母转为大写字母
        initialsToUpperCase: function () {
            var ret = [];
            this.each(function (item) {
                if (isString(item)) {
                    ret[ret.length] = initialsToUpperCase(item);
                } else ret[ret.length] = item;
            });
            return fromq(this, ret);
        },
//将数组中字符串第一个单词的首字母转为大写字母
        initialToUpperCase: function () {
            var ret = [];
            this.each(function (item) {
                if (isString(item)) {
                    ret[ret.length] = initialToUpperCase(item);
                } else ret[ret.length] = item;
            });
            return fromq(this, ret);
        },
//随机从数组中选择count数量的元素
// |example:fromq([1,3,6,9]).random(5).toString(",");
// |out:
// |   1,3,9,9,6
        random: function (/*Number*/count) {
            count = count || 1;
            var ret = [], maxValue = this.items.length - 1, item, index;
            for (var i = 0; i < count; i++) {
                index = Math.round(Math.random() * maxValue);
                item = this.elementAt(index);
                //if (item)
                ret[i] = item;
                //if(item===undefined){
                //    console.log("index:",index," array length:",this.count()," item:",item);
                //}
            }
            return fromq(this, ret);
        },
//example:
// |  fromq("1,2,3,4").join(fromq("2,3"),"(a,b)=>a-b==0","(a,b)=>{a:a,b:b}");
        leftJoin: function (/*Array|fromq*/second, /*Function|lambda|String fields*/comparer, /*Function|Lambda*/selector) {
            //return dppiUtils.invoking(arguments.callee, this.join, ['left', second, comparer, selector], this);
            return this.join('left', second, comparer, selector);
        },
        innerJoin: function (/*Array|fromq*/second, /*Function|lambda|String fields*/comparer, /*Function|Lambda*/selector) {
            //return dppiUtils.invoking(arguments.callee, this.join, ['inner', second, comparer, selector], this);
            return this.join('inner', second, comparer, selector);
        },
        join: function (/*String*/joinType, /*Array|fromq*/second, /*Function|lambda|String fields*/comparer, /*Function|Lambda*/selector) {
            var type = {
                left: false, inner: false, getType: function () {
                    for (var name in this) {
                        if (this[name])return name
                    }
                },
                isLeft: function () {
                    return this.left;
                },
                isInner: function () {
                    return this.inner;
                },
                isType: function (it) {
                    return it in this && typeof this[it] === 'boolean';
                }

            };
            if (!isString(joinType) || !(type.isType(joinType)))return fromq([]);
            type[joinType] = true;

            var leftq = fromq(this), rightq = fromq(second);

            selector = clauseConverter(selector, null, function (a, b) {
                return {"left": a, "right": b};
            });

            comparer = clauseConverter(comparer, function (fieldsq) {
                var ret = ["(a,b)=>"];
                fieldsq.each(function (name) {
                    ret.push("a['" + name + "']==b['" + name + "']");
                    ret.push("&&");
                });
                ret.length = ret.length - 1;
                return ret.join("");
            }, function (a, b) {
                return a.toString() === b.toString();
            });

            return leftq.select(
                function (leftItem, index, letvar) {
                    var value = rightq.first(function (rightItem) {
                        return comparer(leftItem, rightItem, letvar);
                    });
                    if (value || type.isLeft())
                        return selector(leftItem, value || {}, letvar);
                });
        },
//example:
//|  fromq(/ab*/g).match("abb switch,i like abb").each("o=>console.log(o)");
        match: function (/*String*/str) {
            var ret = [];
            if (this.regexp instanceof RegExp) {
                this.regexp.lastIndex = 0;
                var value;
                while ((value = this.regexp.exec(str)) !== null)
                    ret.push(value);
            }
            return fromq(this, ret);
        },
//eg1:
// |fromq([1,2,3]).notIn([3,4]).each("o=>console.log(o)");//out:1,2
//eg2:
// | var distinct = function(item,index){return item;};
// | var log = function(item){console.log(item)};
// | fromq([1,2,3]).notIn([2,4]).each(log); //out:1,3
// | fromq([1,2,3]).notIn([2,4],{left:distinct,right:distinct}).each(log); //out:1,3
// | fromq([1,2,3]).notIn([2,4],"o=>o").each(log); //out:1,3
// | fromq([1,2,3]).notIn([2,4],{left:"o=>o",right:"o=>o"}).each(log); //out:1,3
        notIn: function (/*fromq|array*/it, /*lambda|function|string fields|{left:'',right:''}*/distinctClause) {
            return inOrNotIn(true).apply(this, arguments);
        }
        ,
//eg:
// @see notIn
        in: function (/*fromq|array*/it, /*lambda|function|string fields|{left:'',right:''}*/distinctClause) {
            return inOrNotIn(false).apply(this, arguments);
        }
        ,
//eg:
// |fromq([1,2,3]).equal(fromq.utils.range(1,4))
        equal: function (/*fromq|array*/it, /*lambda|function*/compareClause) {
            var ret = false;//, callee = arguments.callee;
            it = fromq(it);
            if (this.items === it.items)return true;
            ret = this.items.length === it.items.length;
            if (ret) {
                compareClause = clauseConverter(compareClause, null, function (a, b) {
                    return a === b;
                });

                this.each(function (item, index, letvar) {
                    //ret = dppiUtils.invoking(callee, compareClause, [item, it.elementAt(index)]);
                    ret = compareClause(item, it.elementAt(index), letvar);
                    if (!ret) return true;
                });
            }
            return ret;
        }
        ,
//设定后继方法的扩展参数
        let: function (value) {
            this.letvar = value || {};
            return this;
        }
    }
    ;

//alias:
    extend(fromq.fn, {
        filter: fromq.fn.where,
        some: fromq.fn.any,
        every: fromq.fn.all,
        forEach: fromq.fn.each,
        head: fromq.fn.first,
        tail: fromq.fn.last,
        aggregate: fromq.fn.sum,
        average: fromq.fn.avg,
        map: fromq.fn.select,
        orderByDesc: fromq.fn.orderByDescending,
        headOrDefault: fromq.fn.firstOrDefault,
        tailOrDefault: fromq.fn.lastOrDefault,
        sort: fromq.fn.orderBy,
        sortBy: fromq.fn.orderBy
    });

    fromq.fn._init.prototype = fromq.fn;

//static function collection for fromq.utils:
    var utils = fromq.utils = extend({}, {
        isNumber: isNumber,
        isFloat: isFloat,
        isFunction: isFunction,
        isArray: isArray,
        isString: isString,
        //example:
        // |  range(10).echo("o=>console.log(o)");
        // |  range(0,10).echo("o=>console.log(o)");
        // |  range(0,10,2).echo("o=>console.log(o)");
        range: range,
        //example:
        // | repeat("a",4).toString() //aaaa
        repeat: repeat,
        //example:
        // |random(20,10).toString(",");//1,3,19,18,8,18,1,12,11,7
        random: random,
        trim: trim,
        lambda: lambda,
        initialsToUpperCase: initialsToUpperCase,
        initialToUpperCase: initialToUpperCase,
        //example:
        //var fn = function () { console.log(arguments); };
        //var caller = function (item, index) {
        //    fromq.utils.invoking(arguments.callee, fn, [1, 2]);
        //};
        //caller("test", 10, 45);
        // |out:
        // |    [1,2,45]
        invoking: dppiUtils.invoking.bind(dppiUtils),
        //example:
        //| extend({},{cache:[1,2,3]});
        //| extend({},[{name:'bona shen'},{age:38}]);
        extend: extend
    });

    extend(fromq, {
        lambda: lambda,
        extend: function (/*Object|Array*/source) {
            return extend(fromq.fn, source);
        }
    });

//export for pref test.
    extend(fromq.utils, {
        clauseConverter: clauseConverter,
        lambdaConverter: _lambdaUtils.convert.bind(_lambdaUtils)

    });

//static function for lambda
    extend(lambda, {
        getCache: _lambdaUtils.getCache,
        isLambda: _lambdaUtils.isLambda,
        resetCache: _lambdaUtils.resetCache
    });

//exports
    (function () {
        var platform,
            platformList = {
                'nodejs': function () {
                    return typeof module !== 'undefined' && module.exports;
                },
                'web': function () {
                    return true;
                }
            };
        for (var key in platformList) {
            if (platformList[key]()) {
                platform = key;
                break;
            }
        }
        if (platform == 'nodejs') {
            module.exports = fromq;
        } else {
            window.fromq = fromq;
        }
    })();
    return fromq;
})
;
