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
                var extCount = this.getCallerExtCount(caller);
                var defNames = this.getFunctionArgumentList(caller);
                var extValues = [];
                if (extCount) {
                    extValues = Array.prototype.slice.call(caller.arguments, defNames.length);
                }
                return extValues;
            },
            getCallerExtCount: function (caller) {
                var fn = caller;
                //console.log(fn);
                var defNames = this.getFunctionArgumentList(fn);
                var callParamsLength = fn.arguments.length; //Array.prototype.slice.call(fn.arguments);
                return callParamsLength - defNames.length;
            },
            invoking: function (/*Function*/fnCaller, /*Function*/clause, /*Array*/params, _self) {
                var extValues = this.getCallerExtValues(fnCaller, clause);
                return clause.apply(_self, params.concat(extValues));
            }
        },
        lambda_Cache = {},
        lambda = function (/*String*/condition, /*Boolean*/isClosure) {
            var cStr = (condition || this.condition).split('=>');

            isClosure = isClosure || this.isClosed || false;

            if (cStr.length < 2)return null;
            var getCachefn = function (/**/codeBody) {
                    var ret = null, fnObj = lambda_Cache[codeBody];
                    if (fnObj) {
                        ret = fnObj.method;
                        fnObj.num += 1;
                    }
                    return ret;
                },
                buildfn = function (body, lambdaCode) {
                    var fn = getCachefn(lambdaCode);
                    if (!fn) {
                        fn = Function.apply(null, body);
                        lambda_Cache[lambdaCode] = {method: fn, num: 1};
                    }
                    return fn;
                    //return Function.apply(null, body);
                };
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
                //str.push("}).call(this");
                //if (names.length > 0)str.push(',');
                //str.push(names);
                //str.push(")");
                codeBody = str.join('');
                //codeBody = " (function(" + names + "){" + codeBody + "}).call(this" + (names.length> 0 ? +("," + names) : "") + ")";
                //console.log(codeBody);
            }
            //support lambda function cache
            var lambdaCode =
                []
                    .concat(["("])
                    .concat(fnBody.join(","))
                    .concat([")=>"])
                    .concat(codeBody)
                    .join("");

            fnBody.push(
                []
                    .concat("'use strict';\n")
                    .concat("return ")
                    .concat(codeBody)
                    .concat(";")
                    .join(""));

            //fnBody.push("\treturn " + codeBody + " ;");
            //console.log(fnBody);
            return buildfn(fnBody, lambdaCode);
        },

        _lambdaUtils = {
            isLambda: function (it) {
                reOneArg.lastIndex = 0;
                reManyArgs.lastIndex = 0;
                return isString(it) && ((reOneArg.exec(it) || reManyArgs.exec(it)) !== null);
                //return isString(it) && it.split('=>').length >= 2;// lambda("o=>o.split('=>').length>=2")(it);
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
        range = function (start, end, step) {
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
            if (step < 0) {
                var value = start;
                start = end;
                end = value;
            }
            var ret = [];
            for (var i = start; i < end; i += step) {
                //ret.push(i);
                ret[ret.length] = i;
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
        random = function (count, maxValue) {
            var i = 0, ret = [];
            for (; i < count; i++) {
                ret[i] = Math.round(Math.random() * maxValue);
            }
            return fromq(ret);
        };


    //example
    // |   clauseConverter(clause,function(fieldsq){return ""},function(){return;});
    // |   clauseConverter(clause,null,function(){return;});
    // |   fieldsProcesser=function(/*fromq*/ fieldsq){return "o=>o"}//return lambda;
    var clauseConverter = function (clause, fieldsProcesser, defaultFunction, isClosure) {
        clause = _lambdaUtils.convert(clause, isClosure);
        if (isString(clause) && fieldsProcesser !== null) {
            var value = fieldsProcesser(fromq(clause));
            clause = isString(value) ? _lambdaUtils.convert(value) : value;
        }
        if (!isFunction(clause))clause = defaultFunction;
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
        if (_lambdaUtils.isLambda(it))
            return _lambdaUtils.compile(it, arguments[1] || false);
        //for String :"1,2,3,4"
        if (isString(it))
            return new fromq.fn.init(it.split(splitChar || ","));
        //for fromq object
        if (it instanceof fromq)return new fromq.fn.init(it.toArray()/*.concat()*/);

        //for RegExp
        //example
        // |  fromq(/ab*/g,"abdfabhg").each("o=>console.log(o)");
        if (it instanceof RegExp) {
            var str = arguments[1];
            var ret = new fromq.fn.init(it);
            if (isString(str)) {
                ret = ret.match(str);
            }
            return ret;
        }
        //for array object
        return new fromq.fn.init(it);
    };

    fromq.fn = fromq.prototype = {
        init: function (/*Array|RegExp*/it) {
            this.items = it;
            this.regexp = it;
            this.utils = utils;
        },
        version: '20150416/01',
        vendor: "bonashen.com",
        toArray: function (/*Array*/arr) {
            if (isArray(arr)) {
                for (var i = 1, l = this.count(); i < l; i++) {
                    arr[arr.length] = this.items[i];
                }
            }
            return this.items;
        },
        //example1:
        // where(function(item,index){ });
        // example2:
        // where("(a,i)=>a")
        // | where("(a,i,n)=>a<n",n);
        where: function (/*Function|Lambda*/clause) {
            //where: function (clause) {
            clause = clauseConverter(clause, null, function () {
                return true
            });
            var newArray = [], it, callee = arguments.callee;
            // The clause was passed in as a Method that return a Boolean
            for (var i = 0; i < this.items.length; i++) {
                //it = clause(this.items[index], index);
                it = dppiUtils.invoking(callee, clause, [this.items[i], i], null);
                if (it === undefined) {
                    err("where clause function must return  value!");
                }
                if (it) {
                    newArray[newArray.length] = this.items[i];
                }
            }
            return fromq(newArray);
        },
        //example:
        // select(function(item,index){return {name:item.name,id:index};});
        // if return value is null,not be select.
        // lambda exp:
        // select('(o,i)=>{name:o.name,id:i}');

        select: function (/*Function|Lambda|String fields*/clause) {
            clause = _lambdaUtils.convert(clause);

            var fields = clause;
            clause = isString(clause) ?
                function (item) {
                    var ret = {};
                    var f = fromq(fields);
                    f.each(function (field) {
                        if (f.count() > 1) {
                            ret[field] = item[field];
                        } else ret = item[field];
                    });
                    return ret;
                } : clause;

            if (!isFunction(clause))
                err("select=>clause must be function.");

            var newArray = [];
            var callee = arguments.callee;
            this.each(function (item, index) {
                item = dppiUtils.invoking(callee, clause, [item, index]);//clause(item,index);
                if (item)
                //newArray.push(item);
                    newArray[newArray.length] = item;
            });
            return fromq(newArray);
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
            var tempArray = this.items.concat();

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

            var callee = arguments.callee;
            return fromq(
                tempArray.sort(customCompare == false ? function (a, b) {
                    var x = dppiUtils.invoking(callee, clause, [a]);//clause(a);
                    var y = dppiUtils.invoking(callee, clause, [b]);//clause(b);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                } : function (a, b) {
                    return dppiUtils.invoking(callee, clause, [a, b]);
                })//clause
            );
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
                        //console.log(x, y);
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
            var callee = arguments.callee;
            return fromq(
                tempArray.sort(customCompare == false ? function (a, b) {
                    var x = dppiUtils.invoking(callee, clause, [b]);//clause(b);
                    var y = dppiUtils.invoking(callee, clause, [a]);//clause(a);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                } : function (a, b) {
                    return dppiUtils.invoking(callee, clause, [a, b])
                })//clause)
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

            var r = [], callee = arguments.callee;
            this.each(function (item, index) {
                r = r.concat(dppiUtils.invoking(callee, clause, [item, index]));//clause(item, index));
            });
            return fromq(r);

        },

        //example:
        // count(function(item){return true;});
        // count('o=>o');
        // count();
        count: function (/*Function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);

            /*if (!isFunction(clause) && _lambdaUtils.isLambda(clause)) {
             clause = _lambdaUtils.compile(clause);
             }*/
            if (clause == null)
                return this.items.length;
            else
            //return this.where(clause).items.length;
                return dppiUtils.invoking(arguments.callee, this.where, [clause], this).items.length;
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
                return "o=>o['" + fieldsq.trim().select("o=>o").first() + "']";
            }, function (item) {//no clause,then return item value.
                return item;
            });
            distinctValue = distinctValue || false;
            var item;
            var dict = {};
            var retVal = [];
            for (var i = 0; i < this.items.length; i++) {
                item = dppiUtils.invoking(arguments.callee, clause, [this.items[i], i]);//clause(this.items[i], i);
                if (dict[item] == null) {
                    dict[item] = true;
                    retVal[retVal.length] = distinctValue ? item : this.items[i];
                    //retVal.push(distinctValue ? item : this.items[i]);
                }
            }
            dict = null;
            return fromq(retVal);
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
            var callee = arguments.callee, ret = false;
            if (clause)
                this.each(function (item, index) {
                    ret = dppiUtils.invoking(callee, clause, [item, index]);
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
            var callee = arguments.callee, ret = false;
            if (clause && !this.isEmpty())
                this.each(function (item, index) {
                    ret = !dppiUtils.invoking(callee, clause, [item, index]);
                    return ret;
                });
            else ret = this.isEmpty();
            return !ret;
        },
        reverse: function () {
            var retVal = [];
            for (var index = this.items.length - 1; index > -1; index--)
                retVal[retVal.length] = this.items[index];
            return fromq(retVal);
        },
        //example:
        // like where
        // first(function(item){return true});
        // first("o=>o");
        // first();

        first: function (/*Function|Lambda*/clause) {
            if (clause != null) {
                //return this.where(clause).first();
                var callee = arguments.callee;
                return dppiUtils.invoking(callee, this.where, [clause], this).first();
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
                //return this.where(clause).last();
                return dppiUtils.invoking(arguments.callee, this.where, [clause], this).last();
            }
            else {
                // If no clause was specified, then return the First element in the Array
                if (this.items.length > 0)
                    return this.elementAt(this.items.length - 1);
                //return this.items[this.items.length - 1];
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
            return fromq(this.items.concat(arr));
        },

        //description:
        //     合并,过滤相同项
        //     union is used to combine the result sets of 2 . It removes duplicate rows by clause function result.
        // example:
        // union(secondArray,function(item){return item});
        // union(secondArray,"o=>o");
        // union(secondArray,"fieldName");
        union: function (/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause) {
            //clause = _lambdaUtils.convert(clause);
            //return this.concat(second).distinct(clause);
            var ret = this.concat(second);
            return dppiUtils.invoking(arguments.callee, ret.distinct, [clause], ret);
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

            var callee = arguments.callee;

            var leftq = dppiUtils.invoking(callee, this.distinct, [clause], this);
            var result = [], map = {};
            var rightq = dppiUtils.invoking(callee, this.distinct, [clause, true], fromq(second));

            rightq.each(function (item) {
                map[item] = true;
            });

            leftq.each(
                function (item) {
                    if (map[dppiUtils.invoking(callee, clause, [item])])
                    //result.push(item);
                        result[result.length] = item;
                }
            );
            map = null;
            return fromq(result);
        },
        //description:
        //      与非,取两个数组不相交的值
        // example:
        // except(secondArray,function(item){return item});
        // except(secondArray,"field");
        // except(secondArray,"o=>o");

        except: function (/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause) {
            clause = _lambdaUtils.convert(clause);

            var callee = arguments.callee;

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

            var unionq = dppiUtils.invoking(callee, this.union, [second, clause], this),
                intersectq = dppiUtils.invoking(callee, this.intersect, [second, clause], this);

            var result = [], map = {};

            dppiUtils.invoking(callee, this.distinct, [clause, true], intersectq).
                //    intersectq.distinct(clause, true).
                each(function (item) {
                    map[item] = true;
                });
            unionq.each(
                function (item) {
                    if (map[dppiUtils.invoking(callee, clause, [item])] !== true)
                    //result.push(item);
                        result[result.length] = item;
                }
            );
            map = null;
            return fromq(result);
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

        each: function (/*function|Lambda*/callback) {
            callback = _lambdaUtils.convert(callback, true);

            var callee = arguments.callee;
            for (var i = 0; i < this.items.length; i++) {
                //if (callback(this.items[i], i))break;
                if (dppiUtils.invoking(callee, callback, [this.items[i], i]))break;
            }
            return fromq(this.items);
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

            var result = clause ? dppiUtils.invoking(arguments.callee, this.where, [clause], this) : this;

            end = end || result.items.length;
            end = end > result.items.length ? result.items.length : end;
            start = start || 0;

            return fromq(result.items.slice(start, end));

        },
        take: function (/*number*/top, /*function|Lambda*/clause) {

            return dppiUtils.invoking(arguments.callee, this.takeRange, [0, top, clause], this);

        },
        skip: function (/*number*/count, /*function|Lambda*/clause) {
            return dppiUtils.invoking(arguments.callee, this.takeRange, [count, this.count(), clause], this);
        },

        paging: function (/*Number*/nextCount, /*Function|Lambda*/clause) {

            clause = clauseConverter(clause, null, function () {
                return true;
            });
            var _self = this, callee = arguments.callee;

            var paginger = {
                cache: null,
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
                        if (dppiUtils.invoking(arguments.callee, callback, [this.gotoPage(i), i]))break;
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
                    var callee = arguments.callee;
                    this.each(
                        function (rdsq, pageNo) {
                            item = dppiUtils.invoking(callee, clause, [rdsq, pageNo]);
                            if (item)
                            //ret.push(item);
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

            paginger.setNextCount(nextCount);
            paginger.cache = dppiUtils.invoking(callee, _self.where, [clause], _self);

            return paginger;
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
            clause = _lambdaUtils.convert(clause);

            var cache, grouped, itemsLabel = "_items";
            cache = grouped = {};

            var callee = arguments.callee;

            if (this.items.length == 0)return cache;
            //process clause is string example:
            // var list=[{name:'bona'},{name:'peter'},{name:'kerry'}];
            // fromq(list).groupBy("name");
            var fields = clause;
            clause = isString(clause) ?
                function (item) {
                    var ret = [];
                    fromq(fields, ",").each(function (field) {
                        ret.push([item[field]]);
                    });
                    return ret;
                } : clause;

            this.each(
                function (item, index) {
                    //var gLabel = clause(item, index);
                    var gLabel = dppiUtils.invoking(callee, clause, [item, index]);
                    var root = cache, _prior;
                    if (isArray(gLabel)) {
                        fromq(gLabel).each(function (label) {
                            _prior = root;
                            root = root[label] = root[label] || {};
                        });
                        root = _prior;
                        gLabel = gLabel[gLabel.length - 1];
                    }
                    root = root[gLabel] = root[gLabel] || {};
                    root[itemsLabel] = root[itemsLabel] || [];
                    //root[itemsLabel].push(item);
                    root[itemsLabel][root[itemsLabel].length] = item;
                }
            );


            var _process = function (/*Array*/names, /*object*/data, clause) {
                var ret;
                names = names.concat();
                for (var name in data) {
                    var groups = names.concat(name);
                    if (isArray(data[name])) {
                        ret = dppiUtils.invoking(grouped.each, clause, [fromq(name == itemsLabel ? names : groups), fromq(data[name])]);
                    } else {
                        //_process(groups, data[name], clause);
                        ret = dppiUtils.invoking(grouped.each, _process, [groups, data[name], clause]);
                    }
                    if (ret)break;
                }
                return ret;
            };

            grouped = {
                cache: cache,
                //example:
                // select(function(/*_from*/g,/*_from*/i){
                //    f=i.select("o=>o.age");
                //    ret= { minAge:f.min(),maxAge:f.max(),count:f.count(),sum:f.sum(),items:i.toArray()};
                //    g.each(function(item,index){
                //       ret["group"+index]=item;
                //    });
                //    return ret;
                // });
                // select("(g,f)=>("+
                //      "function(g,items){"+
                //       +"var f=items.select('o=>o.age');"+
                //      " return {group:g.join('-'),minAge:f.min(),maxAge:f.max(),count:f.count(),sum:f.sum(),items:items}})(g,f)");
                select: function (/*Function|Lambda*/clause) {
                    clause = _lambdaUtils.convert(clause);
                    var ret = [];
                    var callee = arguments.callee;
                    this.each(
                        function (groups, items) {
                            //var item = clause(groups, items);
                            var item = dppiUtils.invoking(callee, clause, [groups, items]);
                            if (item)
                            //ret.push(item);
                                ret[ret.length] = item;
                        });
                    return fromq(ret);
                },
                //example:
                // |  each(function(/*_from*/group,/*_from*/items){});
                // |  each("(g,i)=>i.each('o=>console.log(o)')");
                // |  each("(g,i,n)=>i.each('o=>console.log(o*n)')",n);
                each: function (/*Function|Lambda*/clause) {
                    clause = _lambdaUtils.convert(clause, true);
                    dppiUtils.invoking(arguments.callee, _process, [[], this.cache, clause]);
                    //_process([], this.cache, clause);
                    return this;
                },
                getCache: function () {
                    return this.cache;
                }
            };
            return grouped;
        },
        max: function (/*Function|Lambda|String field*/clause) {
            clause = clause || function (item) {
                if (isString(value) && isFloat(item))//process string value is float.
                    return parseFloat(item);
            };
            return dppiUtils.invoking(this.max, this.orderBy, [clause], this).last();
            //return this.orderBy(clause).last();
        }
        ,
        min: function (/*Function|Lambda|String field*/clause) {
            clause = clause || function (item) {
                if (isString(value) && isFloat(item))//process string value is float.
                    return parseFloat(item);
            };
            return dppiUtils.invoking(this.min, this.orderBy, [clause], this).first();
            //return this.orderBy(clause).first();
        }
        ,
        //example1:
        // var list = [{name:'bona shen',age:38},{name:'kerry',age:5}];
        // fromq(list).sum(function(item){return item.age});
        // example2:
        // fromq(list).sum("o=>o.age");
        // example3:
        // fromq(list).sum("age");
        // | fromq().range(10).sum("(o,i,n)=>o<n?o*n:o",5);//extend args.

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
            var callee = arguments.callee;
            this.each(clause !== undefined ? function (item, index) {
                    //ret += clause(item);
                    ret += dppiUtils.invoking(callee, clause, [item, index]);//support sum function extend args
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
            //var callee = arguments.callee;
            return this.isEmpty() ? Number.NaN :
            dppiUtils.invoking(arguments.callee, this.sum, [clause], this) / this.count();//this.sum(clause) / this.count();
        }
        ,
        isEmpty: function () {
            var ret = isArray(this.items) && this.items.length > 0;
            return !ret;
        },
        //example:
        // |   fromq("1,2,3,4").contains("o=>parseInt(o)==3");
        // |   fromq("1,2,3,4").contains(function(item){return parserInt(item)==3;});
        // |   fromq("1,2,3,4").contains("5");
        // |   var n='3';fromq("1,2,3,4").contains("(o,i,n)=>o<n",n);
        contains: function (/*Function|Lambda|value*/clause) {
            //return this.indexOf(clause) !== -1;
            var callee = arguments.callee;
            return dppiUtils.invoking(callee, this.indexOf, [clause], this) !== -1;
        },
        //example:
        // |  fromq("1,2,3,4,5").indexOf("o=>o==='5'");
        // |  fromq("1,2,3,4,5").indexOf(function(item){return item==='5';});
        // |  fromq("1,2,3,4,5").indexOf("3");
        indexOf: function (/*Function|Lambda|value*/clause) {
            clause = _lambdaUtils.convert(clause);

            if (!isFunction(clause)) {
                var value = clause;
                clause = function (item) {
                    return item === value;
                }
            }
            var ret = -1;
            var callee = arguments.callee;
            this.each(function (item, index) {
                //if (clause(item, index)) {
                if (dppiUtils.invoking(callee, clause, [item, index])) {
                    ret = index;
                    return true;
                }
            });
            return ret;
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
            return fromq(ret);
        },
        //将数组中字符串所有单词的首字母转为大写字母
        initialsToUpperCase: function () {
            var ret = [];
            this.each(function (item) {
                if (isString(item)) {
                    ret[ret.length] = initialsToUpperCase(item);
                } else ret[ret.length] = item;
            });
            return fromq(ret);
        },
        //将数组中字符串第一个单词的首字母转为大写字母
        initialToUpperCase: function () {
            var ret = [];
            this.each(function (item) {
                if (isString(item)) {
                    ret[ret.length] = initialToUpperCase(item);
                } else ret[ret.length] = item;
            });
            return fromq(ret);
        },
        //随机从数组中选择count数量的元素
        // |example:fromq([1,3,6,9]).random(5).toString(",");
        // |out:
        // |   1,3,9,9,6
        random: function (/*Number*/count) {
            var i = 0, ret = [], maxValue = this.items.length - 1, item;
            for (; i < count; i++) {
                item = this.elementAt(Math.round(Math.random() * maxValue));
                if (item)ret[i] = item;
            }
            return fromq(ret);
        },
        //example:
        // |  fromq("1,2,3,4").join(fromq("2,3"),"(a,b)=>a-b==0","(a,b)=>{a:a,b:b}");
        leftJoin: function (/*Array|fromq*/second, /*Function|lambda|String fields*/comparer, /*Function|Lambda*/selector) {
            return dppiUtils.invoking(arguments.callee, this.join, ['left', second, comparer, selector], this);
        },
        innerJoin: function (/*Array|fromq*/second, /*Function|lambda|String fields*/comparer, /*Function|Lambda*/selector) {
            return dppiUtils.invoking(arguments.callee, this.join, ['inner', second, comparer, selector], this);
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
                //var ret = ["(a,b)=>(function(a,b){console.log(arguments);return "];
                var ret = ["(a,b)=>"];
                fieldsq.each(function (name) {
                    ret.push("a['" + name + "']==b['" + name + "']");
                    ret.push("&&");
                });
                ret.length = ret.length - 1;
                //ret.push("})(a,b)");
                return ret.join("");
            }, function (a, b) {
                return a.toString() === b.toString();
            });

            var callee = arguments.callee;
            return leftq.select(
                function (leftItem) {
                    var value = rightq.first(function (rightItem) {
                        //console.log(leftItem,rightItem);
                        return dppiUtils.invoking(callee, comparer, [leftItem, rightItem]);
                        //return comparer(leftItem, rightItem);
                    });
                    if (value || type.isLeft())
                    //if (value) {
                    //return selector(leftItem, value||{});
                        return dppiUtils.invoking(callee, selector, [leftItem, value || {}]);
                    //}
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
            return fromq(ret);
        }
    };

//alias:
    fromq.fn.filter = fromq.fn.where;
    fromq.fn.some = fromq.fn.any;
    fromq.fn.every = fromq.fn.all;
    fromq.fn.forEach = fromq.fn.each;
    fromq.fn.head = fromq.fn.first;
    fromq.fn.tail = fromq.fn.last;
    fromq.fn.aggregate = fromq.fn.sum;
    fromq.fn.average = fromq.fn.avg;
    fromq.fn.map = fromq.fn.select;
    fromq.fn.orderByDesc = fromq.fn.orderByDescending;
    fromq.fn.headOrDefault = fromq.fn.firstOrDefault;
    fromq.fn.tailOrDefault = fromq.fn.lastOrDefault;
    fromq.fn.sort = fromq.fn.orderBy;
    fromq.fn.sortBy = fromq.fn.orderBy;


    fromq.fn.init.prototype = fromq.fn;


//static function collection for fromq.utils:
    var utils = fromq.utils = {
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
        // |random(10,20).toString(",");//1,3,19,18,8,18,1,12,11,7
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
        invoking: dppiUtils.invoking.bind(dppiUtils)
    };

    fromq.lambda = lambda;

//static function for lambda
    lambda.getCache = _lambdaUtils.getCache;
    lambda.isLambda = _lambdaUtils.isLambda;
    lambda.resetCache = _lambdaUtils.resetCache;

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
