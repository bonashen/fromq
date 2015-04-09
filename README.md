# fromq
fromq.js 是实现javascript环境中linq方法的一种实现。对数组内的对象进行each,where,select,orderby, groupby,count,max,min,sum,avg等操作，同时适用则表达式的匹配操作。
该项目是在[JSLINQ](http://jslinq.codeplex.com/)基础上扩展而来，代码已经重新修改，使[JSLINQ](http://jslinq.codeplex.com/)支持Lambda,正则表达式,字符串的操作，增加了集合的操作except、intersect、union、join、all、any、some、indexOf、contains、sum、avg.
除统计功能函数外，其他的函数都支持链式调用。即如下面代码：
```javascript
require(["your path/fromq.js"],function(fromq){
    console.log(fromq("1,2,3,4,5").each(function(item){
        console.log(item);
    }).sum());
});
```
下面的样例代码一般省略require部分，除非有其他引用时，会增加require部分，以求代码的可读性。
如果想了解lambda相关的知识，请移步这里:
      [JavaScript Lambda 编译器实现](http://www.bonashen.com/post/develop/ria-develop/2015-04-08-javascript-lambda-bian-yi-qi-shi-xian)
      [JavaScript与Lambda](http://www.bonashen.com/post/develop/ria-develop/2015-04-08-javascriptyu-lambda)
      
本篇只是对fromq.js的各功能调用进行说明与举例。fromq.js源代码已经放置在github上，需要fromq.js源代码请[移步这里](https://github.com/bonashen/fromq).

###1.字符串分隔
fromq的字符串的默认分隔符为"**,**".
```javascript
    fromq("1,2,3,4,5").each(function(item){
        console.log(item);
    });
```
```javascript
	fromq("1,2,3,4,5",",").each(function(item){   //指定分隔符,
        console.log(item);
    });
```

###2.数组操作
####2.1 常用操作
#####each | forEach
调用格式：each(/\*function|Lambda\*/callback=function(**item,/\*Number\*/index**){return true;})

功能描述：遍历所有的数组元素，直到callback返回值非null | undefined终止.

返回结果：fromq

调用样例:
```javascript
fromq([1, 2, 3]).each(function (item, index) {
        console.log('index at:', index, '\tvalue is:', item);
});
fromq([1, 2, 3]).each("(item, index) =>console.log('index at:', index, '\tvalue is:', item)");
fromq([1, 2, 3]).each("(o, i,n,log) =>log('index at:', i, '\tvalue is:', o,'\t'+o+'*'+n+'=',n*o)",3,console.log);
```
#####select | map
调用格式：select(/\*Function|Lambda|String fields\*/clause=function(**item,/\*Number\*/index**){return {};})

功能描述：遍历所有的数组元素，将clause()返回值作为数组元素重新组织为新数组并返回新的fromq.

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3,4,5,6])
    .select(function(item,index){
        return {index:index,value:item};
        });
        
fromq([1,2,3,4,5,6])
    .select("(o,i)=>{index:i,value:o}");
```
```javascript
//many feilds select example
var log=fromq("o=>console.log(o)",true);
fromq([1,2,3,4,5,6])
    .select("(o,i)=>{index:i,value:o}")
    .each(log)
    .select("index,value")
    .each(log)
    .select("value")
    .each(log);
```
#####where | filter
调用格式：where(/\*Function|Lambda\*/clause=function(**item,/\*Number\*/index**){})

功能描述：遍历所有的数据元素，将clause()返回值为true的数组元素重新组织为新数组并返回新的fromq.

返回结果：fromq
调用样例:
```javascript
 fromq([1,2,3,4,5,6])
    .where(function(item){
        return item<5
        })
     .each(function(item){  
            console.log(item);
    });
fromq([1,2,3,4,5,6])
    .where("o=>o<5")
    .each("o=>console.log(o)");
fromq([1,2,3,4,5,6])
    .where("(o,i,n)=>o<n",5)
    .each("(o,i,log)=>log(o)",console.log);
```
#####concat
调用格式：concat(/\*Array|formq\*/it)

功能描述：将原数组元素与需连接数组**it**或者**it.toArray()**进行数组连接操作并返回新的fromq，对原数组没有影响.

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3])
    .concat([2,3,4])
    .each(function(item){  
        console.log(item);
    });
    
fromq([1,2,3])
    .concat(fromq([2,3,4]))
    .each(function(item){  
        console.log(item);
    });    
```
#####toArray
调用格式：toArray()

功能描述：返回fromq内部数组引用.

返回结果：Array|null
调用样例:
```javascript
    fromq([1,2,3]).concat([2,3,4]).toArray();    
```
####distinct
调用格式：distinct(/\*Function|Lambda|String field\*/clause=function(item,index){}, /\*boolean\*/distinctValue)

功能描述：遍历数组，依据clause()返回值作为数组元素唯一性判断，过滤重复项元素，重新组织并返回fromq.

- 若clause为空时，以数组元素仩作为唯一性判断依据。
- 若distinctValue为true时，clause()返回值作为新fromq的数组元素。

返回结果：fromq
调用样例:
```javascript
    fromq([1,2,3,4,2,3]).distinct();    
    fromq([1,2,3,4,2,3]).distinct(function(item){return item;});
    fromq([1,2,3,4,2,3]).distinct("o=>o");
    fromq([1,2,3,4,2,3]).distinct("o=>o*2",true);
```
####2.2 数组及元素检测
#####isEmpty
调用格式：isEmpty();

功能描述：检测数组是否为空，若空为true。

返回结果：false|true
调用样例:
```javascript
    if(fromq([1,2,3]).isEmpty()){
        console.log('The array is empty.');
        }
```
#####all
调用格式：all(clause=function(**item,/\*Number\*/index**){});

功能描述：检测数组所有元素是否满足clause条件，都满足为true。

返回结果：false|true
调用样例:
```javascript
    fromq([1,2,3]).all(function(item,index){return item<=3});    
```
#####any
调用格式：all(clause=function(**item,/\*Number\*/index**){});

功能描述：检测数组是否有满足clause条件的元素，有为true。

返回结果：false|true
调用样例:
```javascript
    fromq([1,2,3]).all(function(item,index){return item<=3});    
```
#####contains
调用格式：contains(/\*Function|Lambda|value\*/clause=function(**item,/\*Number\*/index**){});

功能描述：检测数组是否有满足clause的元素，有为true

返回结果：false|true
调用样例:
```javascript
    fromq([1,2,3]).contains(function(item,index){return item<=3});    
```
####2.3 定位数组元素
#####indexOf
调用格式：indexOf(/\*Function|Lambda|value\*/clause=function(**item,/\*Number\*/index**){});

功能描述：检索数组满足clause条件元素的位置，没有则返回-1.

返回结果：Number
调用样例:
```javascript
    fromq([1,2,3]).indexOf(function(item,index){return item<=3});    
    fromq([1,2,3]).indexOf(3);
    fromq([1,2,3]).indexOf("o=>o==3"); 
    fromq([1,2,3]).indexOf("(o,i,n)=>o==n",3);    
```
#####first | head
调用格式：first(/\*Function|Lambda\*/clause=function(**item,/\*Number\*/index**){});

功能描述：检索数组满足clause条件第一位元素，没有则返回null.

返回结果：object|null
调用样例:
```javascript
    fromq([1,2,3]).first(function(item,index){return item<=3});    
    fromq([1,2,3]).first("o=>o<=3");  
    fromq([1,2,3]).first("(o,i,n)=>o<=n.value",{value:3});
```
#####firstOrDefault
调用格式：firstOrDefault(/\*Function|Lambda\*/clause=function(**item,/\*Number\*/index**){},defaultValue);

功能描述：检索数组满足clause条件第一位元素，没有则返回defaultValue.

返回结果：object|defaultValue
调用样例:
```javascript
    fromq([1,2,3]).firstOrDefault(function(item,index){return item>4},4);    
    fromq([1,2,3]).firstOrDefault("o=>o>4",4);    
    fromq([1,2,3]).firstOrDefault("(o,i,n)=>o>n.value",4,{value:4});
```
#####last | tail
调用格式：last(/\*Function|Lambda\*/clause=function(**item,/\*Number\*/index**){});

功能描述：检索数组满足clause条件末位元素，没有则返回null.

返回结果：object|null
调用样例:
```javascript
    fromq([1,2,3]).last(function(item,index){return item<=3});    
    fromq([1,2,3]).last("o=>o<=3");  
    fromq([1,2,3]).last("(o,i,n)=>o<=n.value",{value:3});
```
#####lastOrDefault
调用格式：lastOrDefault(/\*Function|Lambda\*/clause=function(**item,/\*Number\*/index**){},defaultValue);

功能描述：检索数组满足clause条件末位元素，没有则返回defaultValue.

返回结果：object|defaultValue
调用样例:
```javascript
fromq([1,2,3]).lastOrDefault(function(item,index){return item>4},4);    
fromq([1,2,3]).lastOrDefault("o=>o>4",4);    
fromq([1,2,3]).lastOrDefault("(o,i,n)=>o>n.value",4,{value:4});
```
#####elementAt
调用格式：elementAt(/\*Number\*/index);

功能描述：取位于index处的数组元素.

返回结果：object
调用样例:
```javascript
fromq([1,2,3]).elementAt(2);
```
#####elementAtOrDefault
调用格式：elementAtOrDefault(/\*Number\*/index,defaultValue);

功能描述：取位于index处的数组元素,如果index越界返回defaultValue.

返回结果：object|defaultValue
调用样例:
```javascript
fromq([1,2,3]).elementAtOrDefault(3,4);
```
#####take
调用格式：take(/\*number\*/top, /\*function|Lambda\*/clause=function(item,index){});

功能描述：取前top数量的元素,并依据clause()返回值过滤后，重新组织并返回fromq.

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).take(2);
fromq([1,2,3]).take(2,function(item){return item<4});
fromq([1,2,3]).take(2,"o=>o<4");
fromq([1,2,3]).take(2,"(o,i,n)=>o<n.value",{value:4});
```
#####skip
调用格式：skip(/\*number\*/count, /\*function|Lambda\*/clause=function(item,index){});

功能描述：从count处开始取剩余的元素，并依据clause()返回值过滤后，重新组织并返回fromq.

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).skip(2);
fromq([1,2,3]).skip(2,function(item){return item<4});
fromq([1,2,3]).skip(2,"o=>o<4");
fromq([1,2,3]).skip(2,"(o,i,n)=>o<n.value",{value:4});
```
#####takeRange
调用格式：takeRange(/\*number\*/start,/\*number\*/end, /\*function|Lambda\*/clause=function(item,index){});

功能描述：取start至end处的数组元素，并依据clause()返回值过滤后，重新组织并返回fromq.

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).takeRange();//获得同样数组元素的新fromq对象
fromq([1,2,3]).takeRange(2);//获得从2开始后剩余数组元素组成的fromq对象
fromq([1,2,3]).takeRange(2,3);
fromq([1,2,3]).takeRange(2,function(item){return item<4});
fromq([1,2,3]).takeRange(2,"o=>o<4");
fromq([1,2,3]).takeRange(2,"(o,i,n)=>o<n.value",{value:4});
```
####2.4 数组统计
#####max
调用格式：max(/\*Function|Lambda|String field\*/clause=function(item){});

功能描述：指定列或clause()返回值的最大数的数组元素.

返回结果：object
调用样例:
```javascript
fromq([1,2,3]).max();

fromq([1,2,3]).max(function(item){return item;});
fromq([1,2,3]).max("o=>o");

console.log("max:\t",fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .max("value"));
```
#####min
调用格式：min(/\*Function|Lambda|String field\*/clause=function(item){});

功能描述：指定列或clause()返回值的最小数的数组元素.

返回结果：object
调用样例:
```javascript
fromq([1,2,3]).min();

fromq([1,2,3]).min(function(item){return item;});
fromq([1,2,3]).min("o=>o");

console.log("min:\t",fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .min("value"));
```
#####sum | aggregate
调用格式：sum(/\*Function|Lambda|String fields\*/clause=function(item,/\*Number\*/index));

功能描述：统计指定列或clause()返回值的和.

返回结果：Number|Float|NaN
调用样例:
```javascript
fromq([1,2,3]).sum();

fromq([1,2,3]).sum(function(item){return item;});
fromq([1,2,3]).sum("o=>o");

console.log("sum:\t",fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .sum("value"));
```
#####avg | average
调用格式：avg(/\*Function|Lambda|String fields\*/clause=function(item,/\*Number\*/index));

功能描述：统计指定列或clause()返回值的平均数.

返回结果：Number|Float|NaN
调用样例:
```javascript
fromq([1,2,3]).avg();

fromq([1,2,3]).avg(function(item){return item;});
fromq([1,2,3]).avg("o=>o");

console.log("avg:\t",fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .avg("value"));
```
####2.5 排序与分组
#####orderBy
调用格式：orderBy(/\*Function|Lambda|String fields\*/clause=function(item){},customCompar=false);

功能描述：依据各数组元素的clause(item)返回值对数组元素进行升序排序。若customCompare为true,侧依据clause(a,b)返回值-1，0，1进行数组元素升序排序。

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).orderBy();
fromq([1,2,3]).orderBy("o=>o");  //order by value.
fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .orderBy("value,index");   // order by object property value.
fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .orderBy(function(a,b){    //custom comparer
        return a.value<b.value?-1:a.value>b.value?1:0;  
    },true);
```
#####orderByDescending
调用格式：orderByDescending(/\*Function|Lambda|String fields\*/clause=function(item){},customCompare=false);

功能描述：依据各数组元素的clause(item)返回值对数组元素进行降序排序。若customCompare为true,侧依据clause(a,b)返回值-1，0，1进行数组元素降序排序。

返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).orderByDescending();
fromq([1,2,3]).orderByDescending("o=>o");  //order by value.
fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .orderByDescending("value,index");   // order by object property value.
fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .orderByDescending(function(a,b){    //custom comparer
        return a.value<b.value?-1:a.value>b.value?1:0;  
    },true);
```
#####groupBy
调用格式：groupBy(/\*Function|Lambda|String fields\*/clause=function(item,/\*Number\*/index){});

功能描述：依据各数组元素的clause(item,index)返回值对数组元素进行分组。clause(item,index)返回值可以是任何值，若为数组，则进行多层分组。

返回结果：grouper
调用样例:
```javascript
fromq([1,2,3,2,3,3]).
    groupBy("o=>o");  //group by value.
fromq([1,2,3,2,3,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .groupBy("value");   // group by object property value.

 fromq([1,2,3,2,3,3])
    .select("(o,i)=>{index:i,value:o}")
    .groupBy(function(item,index,n){ 
      return   item.value>n.value?"value>"+n.value:"value<="+n.value;
    },{value:2})
    .select("(g,i)=>{group:g.toArray().join('-'),sum:i.sum('value'),count:i.count()}")
                              //select group object,total each group item value.
    .each('o=>console.log(o)');
    
```
####2.6 集合运算
####union
调用格式：union(/\*Array|fromq\*/second, /\*Function|lambda|String FieldName\*/clause=function(item,index){return distinct});

功能描述：依赖clause()返回值作为唯一值，合并两个数组并过滤相同项。

返回结果：fromq
调用样例:
```javascript
var People1 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 2, FirstName: "Kerry", LastName: "Xue" }
    ];
var People2 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 3, FirstName: "Peter", LastName: "Shen" }
    ];
fromq(People1)
    .union(People2,
    function (item) {
        return item.ID;
    }).each("o=>console.log(o)");
fromq(People1)
    .union(People2, "o=>o.ID")
    .each("o=>console.log(o)");
fromq(People1)
    .union(People2, "ID")
    .each("o=>console.log(o)");
```
####intersect
调用格式：intersect(/\*Array|fromq\*/second, /\*Function|lambda|String FieldName\*/clause=function(item,index){return distinct});

功能描述：依赖clause()返回值作为唯一值，过滤重复项后，检索两个数组相同项（相交），重新组织为fromq。

返回结果：fromq
调用样例:
```javascript
var People1 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 2, FirstName: "Kerry", LastName: "Xue" }
    ];
var People2 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 3, FirstName: "Peter", LastName: "Shen" }
    ];
fromq(People1)
    .intersect(People2,
    function (item) {
        return item.ID;
    }).each("o=>console.log(o)");
fromq(People1)
    .intersect(People2, "o=>o.ID")
    .each("o=>console.log(o)");
fromq(People1)
    .intersect(People2, "ID")
    .each("o=>console.log(o)");
```
####except
调用格式：except(/\*Array|fromq\*/second, /\*Function|lambda|String FieldName\*/clause=function(item,index){return distinct});

功能描述：依赖clause()返回值作为唯一值，过滤重复项后，检索两个数组不相同项（与非），重新组织为fromq。

返回结果：fromq
调用样例:
```javascript
var People1 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 2, FirstName: "Kerry", LastName: "Xue" }
    ];
var People2 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 3, FirstName: "Peter", LastName: "Shen" }
    ];
fromq(People1)
    .except(People2,
    function (item) {
        return item.ID;
    }).each("o=>console.log(o)");
fromq(People1)
    .except(People2, "o=>o.ID")
    .each("o=>console.log(o)");
fromq(People1)
    .except(People2, "ID")
    .each("o=>console.log(o)");
```
####join | leftJoin
调用格式：join(/\*Array|fromq\*/second, /\*Function|lambda|String fields\*/comparer=function(a,b){return true}, /\*Function|Lambda\*/selector=function(a,b){return {};});

功能描述：依赖comparer()返回值判断a,b是否相等，若相等则将selector()的返回值作为数组元素，重新组织为fromq。

返回结果：fromq
调用样例:
```javascript
var People1 =  
    [
        { ID: 1, FirstName: "Bona", LastName: "Shen" },
        { ID: 2, FirstName: "Kerry", LastName: "Xue" },
        { ID: 3, FirstName: "Peter", LastName: "Shen" },
        { ID: 4, FirstName: "YingChun", LastName: "Xue" }
    ];
var People2 =  
    [
        { ID: 1, Age:38 },
        { ID: 3, Age:11 },
        { ID: 2, Age:5 }
    ];
fromq(People1)
    .join(People2,
    function (a,b) {
        return a.ID==b.ID;
    },function(a,b){
        return {id:a.ID,name:a.FirstName+"  "+a.LastName,age:b.Age};    
    }).each("o=>console.log(o)");
fromq(People1)
    .join(People2, "(a,b)=>a.ID==b.ID",
        "(a,b)=>{id:a.ID,name:a.FirstName+'  '+a.LastName,age:b.Age}")
    .each("o=>console.log(o)");
fromq(People1)
    .join(People2, "ID",
    "(a,b)=>{id:a.ID,name:a.FirstName+'  '+a.LastName,age:b.Age}")
    .each("o=>console.log(o)");
```

###3.数组分组对象(grouper)
分组对象是fromq().groupBy函数的返回结果集。他提供了对分组后的对象进行数组元素的遍历、选择，通过选择功能select你可以实现分组的统计功能。
####each
调用格式：each(/\*Function|Lambda\*/clause=function(/\*fromq\*/group,/\*fromq\*/items){});

功能描述：遍历分组对象的数组元素，若clause()返回非null | undefined时结束遍历。

返回结果：grouper
调用样例:
```javascript
//example1
fromq([1,2,3,2,3,3]).
    groupBy("o=>o").
    each(function(group,items){
       group.each(function(g){   //print group value
            console.log(g);
    });
 });
 //example2
fromq([1,2,3,2,3,3])
    .select("(o,i)=>{index:i,value:o}")
    .groupBy("(o,i,n)=>o.value>n.value?"value>"+n.value:"value<="+n.value;
    },{value:2})
    .select("(g,i)=>{group:g.toArray().join('-'),sum:i.sum('value'),count:i.count()}")
      //分组的统计
    .each('o=>console.log(o)');
```
####select
调用格式：select(/\*Function|Lambda\*/clause=function(/\*fromq\*/group,/\*fromq\*/items){});

功能描述：遍历分组对象的数组元素，重新组织clause()返回值为fromq对象。

返回结果：fromq
调用样例:
```javascript
fromq([1, 2, 3, 2, 3, 3])
    .select('(o,i)=>{index:i,value:o}').
    groupBy('(o,i,n)=>o.value>n.value? "value>" + n.value: "value<="+ n.value',
    { value: 2})
    .select('(g,i)=>{group:g.toArray().join(\'-\'),sum:i.sum(\'value\'),count:i.count(),items:i.toArray()}')
    .each('o=>console.log(o)');   
```
####getData
调用格式：getData();

功能描述：获取分组对象的数据。

返回结果：object
调用样例:
```javascript
console.log(
    fromq([1, 2, 3, 2, 3, 3]).
    groupBy("o=>o").getData());

```
###4.正则表达式操作
fromq可以进行正则表达式的匹配操作，主要有两个函数，fromq(RegExp)和match(str)。具体使用详细如下说明。
####fromq
调用格式：fromq(/\*RegExp\*/it,/\*String\*/str);

功能描述：使用it对str进行正则表达式匹配，组织匹配结果为fromq对象。

返回结果：fromq
调用样例:
```javascript
fromq(/ab*/g,"abb switch,i like abb").
    each("o=>console.log('value:'+o,'\t index:'+o.index)");
```
####match
调用格式：match(/\*String\*/str);

功能描述：使用fromq对象创建时的it值对str进行正则表达式匹配，组织匹配结果为fromq对象。

返回结果：fromq
调用样例:
```javascript
fromq(/ab*/g).match("abb switch,i like abb").
    each("o=>console.log('value:'+o,'\t index:'+o.index)");
```
###5.Lambda使用
####fromq
调用格式：fromq(/\*String\*/it,/\*Boolean\*/isClosure);

功能描述：fromq可以将符合Lambda规范的字符串编译为匿名函数。

返回结果：Function
调用样例:
```javascript
fromq("o=>console.log('o')");
fromq("o=>console.log('o')",true); //带有闭包函数体
```
###5.其他功能
####range
调用格式：range(/\*Number\*/start, /\*Number\*/end, /\*Number\*/step);

功能描述：按setp步长生成从start到end的数组元素并返回fromq。

- 若仅有start，则生成0-start个数组元素
- 若仅缺step,则以1为步长

返回结果：fromq
调用样例:
```javascript
fromq
        .range(10)
        .select("o=>o*2")
        .each('o=>console.log(o)');
fromq
        .range(5,10)
        .select("o=>o*2")
        .each('o=>console.log(o)');
fromq
        .range(1,10,2)
        .select("o=>o*2")
        .each('o=>console.log(o)');
```

###6.调用参数压入
所谓调用参数压入（我自己的理解），是指当函数被调用时由javascript引擎根据实际参数压入参数堆栈。这是javascript的灵活特性之一。如何将这种灵活特性应用到lambda表达式？

例如：where语句调用时的例子
```javascript
fromq("a,b,c")
        .where("o=>o=='b'")
```
是否可以写成
```javascript
fromq("a,b,c")
        .where("(o,n)=>o==n",'b')
```
答案是困难，因为where调用callback/clause时压入参数是指定的，从where定义的规范中就可以看出，不过可以通过调用参数压入技术就可以解决这个问题，但是前提是lambda中的参数必须写全后，再定义扩展参数。
```javascript
fromq("a,b,c")
        .where("(o,i,n)=>o==n",'b');
```
上例中lambda表达式中(o,i)对应的clause标准参数是(item,index). n参数就是代表where函数定义规范之外的从左到右第一个调用参数。
这样的方式最直接的好处是，被调用clause函数中直接引用当前变量。
```javascript
var log=console.log;
var n= 'b';
fromq("a,b,c")
        .where("(o,i,n)=>o==n)",n)
        .each("(o,i,log)=>log(o)",log);
```
如果压入的变量过多，建议使用如下方法：
```javascript
var log=console.log;
var n = 'b';
fromq('a,b,c')
        .where('(o,i,n)=>o==n.value',
            {value:n})
        .each("(o,i,log)=>log(o)",log);
```


