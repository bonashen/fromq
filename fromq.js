define(null, [], function () {
    //"use strict";

    //isString,isFunction,isArray implement code is come from dojo library.
    var isString = function (it) {
            // summary:
            //		Return true if it is a String
            // it: anything
            //		Item to test.
            return (typeof it == "string" || it instanceof String); // Boolean
        },
        isNumber = function (str) {
            return /^[0-9]+$/.exec(str) ? true : false;
        },
        isFloat = function (str) {
            return /^(\+|-)?\d+($|\.\d+$)/.exec(str) ? true : false;
        },
        isArray = function (it) {
            return it && (it instanceof Array || (typeof it) == "array");
        },
        isFunction = function (it) {
            return (it) && (it instanceof Function);
        },
        err = function (msg) {
            throw new Error("fromq/method error," + msg);
        },
        getFunctionArgumentList = function (fn) {
            if (fn instanceof Function) {
                var reg = /^\s*function(?:\s+[^(\s]+)?\s*\(\s*([^)]*)\s*\)/;
                var ret = reg.exec(fn);
                return ret[1].split(",");
            } else return null;
        },
        getCallerExtValue = function (args) {
            //console.log(args.callee.toString());
            var fn = args.callee;
            var defNames = getFunctionArgumentList(fn);
            //console.log("defNames:",defNames);
            var callParams = Array.prototype.slice.call(args);
            //console.log("callParams:",callParams);
            var extCount = callParams.length - defNames.length;
            var extValues = [];
            if (extCount) {
                extValues = Array.prototype.slice.call(args, extCount);
            }
            //console.log(extValues);
            return extValues;
        },
        extValueCallClause = function (/*Function*/fnCallee, /*Function*/clause, /*Array*/params, _self) {
            //console.log(arguments);
            var extValues = getCallerExtValue(fnCallee.arguments, clause);
            return clause.apply(_self, params.concat(extValues));
        },
        lambda = function (/*String*/condition, /*Boolean*/isClosure) {
            var cStr = (condition || this.condition).split('=>');

            isClosure = isClosure || this.isClosed || false;

            if (cStr.length < 2)return null;
            var fnCreate = function (body) {
                return Function.apply(null, body);
            };
            var fnBody = [];
            if (cStr[0].indexOf('(') === -1) {
                fnBody = [cStr[0]];
            }
            else {
                fnBody = cStr[0].replace(/\(/g, '').replace(/\)/g, '').split(',');
            }
            var codeBody = cStr.slice(1, cStr.length).join("=>");

            if (isClosure) {//true,insert closed function code.
                var names = fnBody.join(",");
                codeBody = " (function(" + names + "){" + codeBody + "}).call(this," + names + ")";
            }
            fnBody.push("return " + codeBody + " ;");
            return fnCreate(fnBody);
        },

        _lambdaUtils = {
            isLambda: function (it) {
                return isString(it) && it.split('=>').length >= 2;// lambda("o=>o.split('=>').length>=2")(it);
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
            }
        };
    //example
    // |   paraConvert(clause,function(fieldsq){return ""},function(){return;});
    // |   paraConvert(clause,null,function(){return;});
    // |   fieldsProcesser=function(/*fromq*/ fieldsq){return "o=>o"}//return lambda;
    var paramConvert = function (clause, fieldsProcesser, defaultFunction) {
        clause = _lambdaUtils.convert(clause);
        if (isString(clause) && fieldsProcesser !== null) {
            var value = fieldsProcesser(fromq(clause));
            clause = isString(value) ? _lambdaUtils.convert(value) : value;
        }
        if (!isFunction(clause))clause = defaultFunction;
        return clause;
    };

    var fromq = function (/*Array|String|Lambda*/it, /*String*/splitChar) {
        //for lambda
        if (_lambdaUtils.isLambda(it))
            return _lambdaUtils.compile(it);
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
        },

        toArray: function () {
            return this.items;
        },
        //example1:
        // where(function(item,index){ });
        // example2:
        // where("(a,i)=>a")
        // | where("(a,i,n)=>a<n",n);
        where: function (/*Function|Lambda*/clause) {
            //where: function (clause) {
            clause = paramConvert(clause, null, function () {
                return true
            });
            var newArray = [], it,callee = arguments.callee;
            // The clause was passed in as a Method that return a Boolean
            for (var i = 0; i < this.items.length; i++) {
                //it = clause(this.items[index], index);
                it = extValueCallClause(callee, clause, [this.items[i], i], null);
                if (it === undefined) {
                    err("where clause function must return  value!");
                }
                if (it) {
                    newArray[newArray.length] = this.items[i];
                }
            }
            return new fromq(newArray);
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
                    var f = new fromq(fields);
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
                item = extValueCallClause(callee, clause, [item, index]);//clause(item,index);
                if (item)newArray.push(item);//newArray[newArray.length] = item;
            });
            return new fromq(newArray);
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
            return new fromq(
                tempArray.sort(customCompare == false ? function (a, b) {
                    var x = extValueCallClause(callee, clause, [a]);//clause(a);
                    var y = extValueCallClause(callee, clause, [b]);//clause(b);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                } : function (a, b) {
                    return extValueCallClause(callee, clause, [a, b]);
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
            return new fromq(
                tempArray.sort(customCompare == false ? function (a, b) {
                    var x = extValueCallClause(callee, clause, [b]);//clause(b);
                    var y = extValueCallClause(callee, clause, [a]);//clause(a);
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                } : function (a, b) {
                    return extValueCallClause(callee, clause, [a, b])
                })//clause)
            );
        },
        //example:
        // selectMany(function(item,index){return {name:item.name}});
        // selectMany("(o,i)=>{name:o.name}");
        // selectMany("name,age");

        selectMany: function (/*Function|Lambda|String feilds*/clause) {
            //clause = _lambdaUtils.convert(clause);

            clause = paramConvert(clause, function (fieldsq) {
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
            //clause = (function (clause) {
            //    if (isString(clause)) {
            //        clause = function (item) {
            //            var ret = {};
            //            var f = new fromq(fields, ",");
            //            //console.log(fields);
            //            f.each(function (field) {
            //                if (f.count() > 1) {
            //                    ret[field] = item[field];
            //                } else ret = item[field];
            //            });
            //            return ret;
            //        };
            //    }
            //    return clause;
            //})(clause);

            var r = [],callee = arguments.callee;
            this.each(function (item, index) {
                r = r.concat(extValueCallClause(callee, clause, [item, index]));//clause(item, index));
            });
            return new fromq(r);

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
            //return this.where.apply(null,[clause].concat(getCallerExtValue(this.count))).items.length;
                return extValueCallClause(arguments.callee, this.where, [clause], this).items.length;
        },
        //example:
        // distinct(function(item){return item});
        // distinct(function(item){return item},true);
        // distinct("o=>o");
        // distinct("o=>o",true);
        // distinct("field");
        // distinct("field",true);
        distinct: function (/*Function|Lambda|String field*/clause, /*boolean*/distinctValue) {
            //clause = _lambdaUtils.convert(clause);
            clause = paramConvert(clause, function (fieldsq) {
                return "o=>o['" + fieldsq.first() + "']";
            }, function (item) {//no clause,then return item value.
                return item;
            });
            //console.log(clause);
            distinctValue = distinctValue || false;
            var item;
            var dict = {};
            var retVal = [];
            for (var i = 0; i < this.items.length; i++) {
                item = extValueCallClause(this.distinct, clause, [this.items[i], i]);//clause(this.items[i], i);
                if (dict[item] == null) {
                    dict[item] = true;
                    retVal[retVal.length] = distinctValue ? item : this.items[i];
                }
            }
            dict = null;
            return new fromq(retVal);
        },
        //example:
        // like where
        // any(function(item){return true});
        // any("o=>o");

        any: function (/*Function|Lambda*/clause) {
            return extValueCallClause(arguments.callee, this.where, [clause], this).count > 0;
            //return this.where.apply(null,[clause].concat(getCallerExtValue(this.any))).count() > 0;
        },
        //example:
        // like where
        // all(function(item){return true});
        // all("o=>o");

        all: function (/*Function|Lambda*/clause) {
            //return this.where(clause).count() !== this.count();
            //return this.where.apply(null,[clause].concat(getCallerExtValue(this.any))).count() !=this.count();
            return extValueCallClause(arguments.callee, this.where, [clause], this) !== this.count();
        },
        reverse: function () {
            var retVal = [];
            for (var index = this.items.length - 1; index > -1; index--)
                retVal[retVal.length] = this.items[index];
            return new fromq(retVal);
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
                return extValueCallClause(callee, this.where, [clause], this).first();
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
                return extValueCallClause(arguments.callee, this.where, [clause], this).last();
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
            return new fromq(this.items.concat(arr));
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
            return extValueCallClause(this.union, ret.distinct, [clause], ret);
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

            var leftq = extValueCallClause(this.intersect, this.distinct, [clause], this);
            //var leftq = this.distinct(clause);
            var result = [], map = {};

            //fromq(second).
            //    distinct(clause, true).each(function (item) {
            //        map[item] = true;
            //    });

            var secq = fromq(second);
            extValueCallClause(this.intersect, this.distinct, [clause], secq).each(function (item) {
                map[item] = true;
            });

            leftq.each(
                function (item) {
                    //if (map[clause(item)])result.push(item);
                    if (map[extValueCallClause(this.intersect, clause, [item])])result.push(item);
                }
            );
            delete map;
            return new fromq(result);
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

            //var _union = this.union(second, clause),
            //    _intersect = this.intersect(second, clause);
            var _union = extValueCallClause(this.except, this.union, [second, clause], this),
                _intersect = extValueCallClause(this.except, this.intersect, [second, clause], this);

            var result = [], map = {};

            extValueCallClause(this.except, this.distinct, [clause, true], this).
                //_intersect.distinct(clause, true).
                each(function (item) {
                    map[item] = true;
                });
            _union.each(
                function (item) {
                    if (map[clause(item)] !== true)result.push(item);
                }
            );
            delete map;
            return new fromq(result);
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
                if (extValueCallClause(callee, callback, [this.items[i], i]))break;
                //callback(this.items[i], i);
            }
            return new fromq(this.items);
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
        // var _=_from;
        // _(data).takeRange(3,4,_("a=>a.name.indexOf('e')")).toArray().join(",");
        takeRange: function (/*int*/start, /*int*/ end, /*function|Lambda*/clause) {
            clause = _lambdaUtils.convert(clause);

            var result;
            clause = clause || function () {
                return true;
            };
            end = end || this.items.length;
            start = start || 0;

            result = this.items.slice(start, end);

            return extValueCallClause(this.takeRange, this.where, [clause], fromq(result));

            //return new fromq(result).where(clause);
        },
        take: function (/*number*/top, /*function|Lambda*/clause) {

            return extValueCallClause(this.take, this.takeRange, [0, top, clause], this);

            //return this.takeRange(0, top, clause);
        },
        skip: function (/*number*/count, /*function|Lambda*/clause) {
            return extValueCallClause(this.skip, this.takeRange, [count, this.count(), clause], this);
            //return this.takeRange(count, this.count(), clause);
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
         *   gData:{
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

            if (this.items.length == 0)return grouper;
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

            var grouper = {}, itemsLabel = "_items";

            var self = this;

            this.each(
                function (item, index) {
                    //var gLabel = clause(item, index);
                    var gLabel = extValueCallClause(self.groupBy, clause, [item, index]);
                    var root = grouper, _prior;
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
                    root[itemsLabel].push(item);
                }
            );

            var _process = function (/*Array*/names, /*object*/data, clause) {
                var ret;
                //console.log(arguments);
                names = names.concat();
                for (var name in data) {
                    var groups = names.concat(name);
                    if (isArray(data[name])) {
                        ret = extValueCallClause(grouper.each, clause, [fromq(name == itemsLabel ? names : groups), fromq(data[name])]);
                        if (ret)break;
                    } else {
                        //_process(groups, data[name], clause);
                        extValueCallClause(grouper.each, _process, [groups, data[name], clause]);
                    }
                }
                return ret;
            };

            var grouper = {
                gData: grouper,
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
                    var self = this;
                    this.each(
                        function (groups, items) {
                            //var item = clause(groups, items);
                            var item = extValueCallClause(self.select, clause, [groups, items]);
                            if (item) ret.push(item);
                        });
                    return new fromq(ret);
                },
                //example:
                // |  each(function(/*_from*/group,/*_from*/items){});
                // |  each("(g,i)=>i.each('o=>console.log(o)')");
                // |  each("(g,i,n)=>i.each('o=>console.log(o*n)')",n);
                each: function (/*Function|Lambda*/clause) {
                    clause = _lambdaUtils.convert(clause, true);
                    extValueCallClause(this.each, _process, [[], this.gData, clause]);
                    //_process([], this.gData, clause);
                    return this;
                },
                getData: function () {
                    return this.gData;
                }
            };
            return grouper;
        },
        max: function (/*Function|Lambda|String field*/clause) {
            clause = clause || function (item) {
                if (isString(value) && isFloat(item))//process string value is float.
                    return parseFloat(item);
            };
            return extValueCallClause(this.max, this.orderBy, [clause], this).last();
            //return this.orderBy(clause).last();
        }
        ,
        min: function (/*Function|Lambda|String field*/clause) {
            clause = clause || function (item) {
                if (isString(value) && isFloat(item))//process string value is float.
                    return parseFloat(item);
            };
            return extValueCallClause(this.min, this.orderBy, [clause], this).first();
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
                    ret += extValueCallClause(callee, clause, [item, index]);//support sum function extend args
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
            extValueCallClause(arguments.callee, this.sum, [clause], this) / this.count();//this.sum(clause) / this.count();
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
            return extValueCallClause(callee, this.indexOf, [clause], this) !== -1;
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
                if (extValueCallClause(callee, clause, [item, index])) {
                    ret = index;
                    return true;
                }
            });
            return ret;
        },
        toString: function (separator) {
            return this.toArray().join(separator || '');
        },
        //example:
        // |  fromq("1,2,3,4").join(fromq("2,3"),"(a,b)=>a-b==0","(a,b)=>{a:a,b:b}");
        leftJoin: function (/*Array|fromq*/second, /*Function|lambda|String fields*/comparer, /*Function|Lambda*/selector) {
            var leftq = fromq(this), rightq = fromq(second);

            selector = paramConvert(selector, null, function (a, b) {
                return {"left": a, "right": b};
            });

            comparer = paramConvert(comparer, function (fieldsq) {
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
                        return extValueCallClause(callee, comparer, [leftItem, rightItem]);
                        //return comparer(leftItem, rightItem);
                    });
                    //if (value) {
                    //return selector(leftItem, value||{});
                    return extValueCallClause(callee, selector, [leftItem, value || {}]);
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
            return new fromq(ret);
        },
        //example:
        // |  range(10).echo("o=>console.log(o)");
        // |  range(0,10).echo("o=>console.log(o)");
        // |  range(0,10,2).echo("o=>console.log(o)");
        range: function (start, end, step) {
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
                ret.push(i);
                //ret[ret.length]=i;
            }
            return new fromq(ret);
        }
    }
    ;

//alias:
    fromq.fn.filter = fromq.fn.where;
    fromq.fn.some = fromq.fn.any;
    fromq.fn.every = fromq.fn.all;
    fromq.fn.forEach = fromq.fn.each;
    fromq.fn.head = fromq.fn.first;
    fromq.fn.tail = fromq.fn.last;
    fromq.fn.aggregate = fromq.fn.sum;
    fromq.fn.average = fromq.fn.avg;
    fromq.fn.join = fromq.fn.leftJoin;
    fromq.fn.map = fromq.fn.select;


//static function:
    fromq.isNumber = isNumber;
    fromq.isFloat = isFloat;
    fromq.isFunction = isFunction;
    fromq.isArray = isArray;
    fromq.isString = isString;
    fromq._ = fromq.lambda = lambda;

    fromq.fn.init.prototype = fromq.fn;
    return fromq;
})
;
