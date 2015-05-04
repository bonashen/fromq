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

相关的使用方法，请关注[我的博客,http://www.bonashen.com](http://www.bonashen.com)。

---

### 1.字符串分隔
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
---

### 2.数组操作
#### 2.1 常用操作
##### let
调用格式：`let(/*Object*/value);`
功能描述：提供fromq后缀方法中的访问外部的引用。详见 [fromq.let功能使用](http://www.bonashen.com/post/develop/ria-develop/2015-04-28-fromq.letgong-neng-shi-yong)。
返回结果：fromq
调用样例:
```javascript
fromq("1,2,3").let(2).where("(o,i,v)=>o>=v");//[2,3]

fromq("1,2,3").let({value:2}).where("(o,i,v)=>o>=v.value");//[2,3]

fromq("1,2,3").let(2).where("(o,i,v)=>o>v").select("(o,i,v)=>o*v"); //[6]
```

##### each | forEach
调用格式：`each(/*function|Lambda*/callback=function(/*object*/item,/*Number*/index){return true;})`
功能描述：遍历所有的数组元素，直到callback返回值非null | undefined终止.
返回结果：fromq
调用样例:
```javascript
fromq([1, 2, 3]).each(function (item, index) {
        console.log('index at:', index, '\tvalue is:', item);
});
fromq([1, 2, 3]).each("(item, index) =>console.log('index at:', index, '\tvalue is:', item)");
fromq([1, 2, 3]).let({value:3,log:console.log}).each("(o, i,n) =>n.log('index at:', i, '\tvalue is:', o,'\t'+o+'*'+n.value+'=',n.value*o)");
```
---

##### select | map
调用格式：`select(/*Function|Lambda|String fields*/clause=function(/*Object*/item,/*Number*/index){return {};})`
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
---

##### where | filter
调用格式：`where(/*Function|Lambda*/clause=function(/*Object*/item,/*Number*/index){})`
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
    .let(5)
    .where("(o,i,n)=>o<n")
    let(console.log)
    .each("(o,i,log)=>log(o)");
```
---

##### concat
调用格式：`concat(/*Array|formq*/it)`
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
---

##### toArray
调用格式：`toArray(/*Array*/it,/*boolean*/overwrite)`
功能描述：若it是数组时，默认清空it数组，并将当前数组数据追加至it数组中，并返回fromq内部数组引用.
- 若overwrite为false,不清空it数组，直接将当前数组数据追加至it数组中。

返回结果：Array|null
调用样例:
```javascript
    fromq([1,2,3]).concat([2,3,4]).toArray();    
```
---

##### distinct
调用格式：`distinct(/*Function|Lambda|String field*/clause=function(item,index){}, /*boolean*/distinctValue)`
功能描述：遍历数组，依据clause()返回值作为数组元素唯一性判断，过滤重复项元素，重新组织并返回fromq.
- 若clause为空时，以数组元素作为唯一性判断依据。
- 若distinctValue为true时，clause()返回值作为新fromq的数组元素。

返回结果：fromq
调用样例:
```javascript
    fromq([1,2,3,4,2,3]).distinct();    
    fromq([1,2,3,4,2,3]).distinct(function(item){return item;});
    fromq([1,2,3,4,2,3]).distinct("o=>o");
    fromq([1,2,3,4,2,3]).distinct("o=>o*2",true);
```
---

#### 2.2 数组及元素检测
##### isEmpty
调用格式：`isEmpty();`
功能描述：检测数组是否为空，若空为true。
返回结果：false|true
调用样例:
```javascript
    if(fromq([1,2,3]).isEmpty()){
        console.log('The array is empty.');
        }
```
---

##### all|every
调用格式：`all(clause=function(/*Object*/item,/*Number*/index){});`
功能描述：检测数组所有元素是否满足clause条件，都满足为true。
返回结果：false|true
调用样例:
```javascript
    fromq([1,2,3]).all(function(item,index){return item<=3});    
```
---

##### any|some
调用格式：`all(clause=function(/*Object*/item,/*Number*/index){});`
功能描述：检测数组是否有满足clause条件的元素，有为true。
返回结果：false|true
调用样例:
```javascript
    fromq([1,2,3]).all(function(item,index){return item<=3});    
```
---

##### contains
调用格式：`contains(/*Function|Lambda|value*/clause=function(/*Object*/item,/*Number*/index){});`
功能描述：检测数组是否有满足clause的元素，有为true
返回结果：false|true
调用样例:
```javascript
    fromq([1,2,3]).contains(function(item,index){return item<=3});    
```
---

#### 2.3 定位数组元素
##### indexOf
调用格式：`indexOf(/*Function|Lambda|value*/clause=function(/*Object*/item,/*Number*/index){});`
功能描述：检索数组满足clause条件第一个元素的位置，没有则返回-1.
返回结果：Number
调用样例:
```javascript
    fromq([1,2,3]).indexOf(function(item,index){return item<=3});    
    fromq([1,2,3]).indexOf(3);
    fromq([1,2,3]).indexOf("o=>o==3"); 
    fromq([1,2,3]).let(3).indexOf("(o,i,n)=>o==n");    
```
---

##### first | head
调用格式：`first(/*Function|Lambda*/clause=function(/*Object*/item,/*Number*/index){});`
功能描述：检索数组满足clause条件第一位元素，没有则返回null.
- 若clause为空时，则返回数组第一位元素。

返回结果：object|null

调用样例:
```javascript
    fromq([1,2,3]).first();  
    fromq([1,2,3]).first(function(item,index){return item<=3});    
    fromq([1,2,3]).first("o=>o<=3");  
    fromq([1,2,3]).let({value:3}).first("(o,i,n)=>o<=n.value");
```
---

##### firstOrDefault | headOrDefault
调用格式：`firstOrDefault(/*Function|Lambda*/clause=function(/*Object*/item,/*Number*/index){},defaultValue);`
功能描述：检索数组满足clause条件第一位元素，没有则返回defaultValue.
返回结果：object|defaultValue
调用样例:
```javascript
    fromq([1,2,3]).firstOrDefault(function(item,index){return item>4},4);    
    fromq([1,2,3]).firstOrDefault("o=>o>4",4);    
    fromq([1,2,3]).let({value:4}).firstOrDefault("(o,i,n)=>o>n.value",4);
```
---

##### last | tail
调用格式：`last(/*Function|Lambda*/clause=function(/*Object*/item,/*Number*/index){});`
功能描述：检索数组满足clause条件末位元素，没有则返回null.
返回结果：object|null
调用样例:
```javascript
    fromq([1,2,3]).last(function(item,index){return item<=3});    
    fromq([1,2,3]).last("o=>o<=3");  
    fromq([1,2,3]).let({value:3}).last("(o,i,n)=>o<=n.value");
```
---

##### lastOrDefault | tailOrDefault
调用格式：`lastOrDefault(/*Function|Lambda*/clause=function(/*Object*/item,/*Number*/index){},defaultValue);`
功能描述：检索数组满足clause条件末位元素，没有则返回defaultValue.
返回结果：object|defaultValue
调用样例:
```javascript
fromq([1,2,3]).lastOrDefault(function(item,index){return item>4},4);    
fromq([1,2,3]).lastOrDefault("o=>o>4",4);    
fromq([1,2,3]).let({value:4}).lastOrDefault("(o,i,n)=>o>n.value",4);
```
---

##### elementAt
调用格式：`elementAt(/*Number*/index);`
功能描述：取位于index处的数组元素.
返回结果：object
调用样例:
```javascript
fromq([1,2,3]).elementAt(2);
```
---

##### elementAtOrDefault
调用格式：`elementAtOrDefault(/*Number*/index,defaultValue);`
功能描述：取位于index处的数组元素,如果index越界返回defaultValue.
返回结果：object|defaultValue
调用样例:
```javascript
fromq([1,2,3]).elementAtOrDefault(3,4);
```
---

##### take
调用格式：`take(/*number*/top, /*function|Lambda*/clause=function(item,index){});`
功能描述：依据clause()返回值过滤后,取前top数量的元素,重新组织并返回fromq.
返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).take(2);
fromq([1,2,3]).take(2,function(item){return item<4});
fromq([1,2,3]).take(2,"o=>o<4");
fromq([1,2,3]).let({value:4}).take(2,"(o,i,n)=>o<n.value");
```
---

##### skip
调用格式：`skip(/*number*/count, /*function|Lambda*/clause=function(item,index){});`
功能描述：依据clause()返回值过滤后,从count处开始取剩余的元素，重新组织并返回fromq.
返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).skip(2);
fromq([1,2,3]).skip(2,function(item){return item<4});
fromq([1,2,3]).skip(2,"o=>o<4");
fromq([1,2,3]).let({value:4}).skip(2,"(o,i,n)=>o<n.value");
```
---

##### takeRange
调用格式：`takeRange(/*number*/start,/*number*/end, /*function|Lambda*/clause=function(item,index){});`
功能描述：依据clause()返回值过滤后，取start至end处的数组元素，并重新组织并返回fromq.
返回结果：fromq
调用样例:
```javascript
fromq([1,2,3]).takeRange();//获得同样数组元素的新fromq对象
fromq([1,2,3]).takeRange(2);//获得从2开始后剩余数组元素组成的fromq对象
fromq([1,2,3]).takeRange(2,3);
fromq([1,2,3]).takeRange(2,function(item){return item<4});
fromq([1,2,3]).takeRange(2,"o=>o<4");
fromq([1,2,3]).let({value:4}).takeRange(2,"(o,i,n)=>o<n.value");
```
---

##### random
调用格式：`random(/*number*/count);`
功能描述：随机从数组中选择count数量的元素，并重新组织并返回fromq.
返回结果：fromq
调用样例:
```javascript
var s = fromq([1,3,6,9]).random(5).toString(",");
console.log(s);
/* out:
1,3,9,9,6
*/
```
---

#### 2.4 数组统计
##### size
调用格式：`size();`
功能描述：统计数组元素的数量.
返回结果：Number
调用样例:
```javascript
fromq.utils.random(100,null,1000)
    .let(2)
    .where("(o,i,v)=>o%v==0")
    .size();
```
---

##### max
调用格式：`max(/*Function|Lambda|String field*/clause=function(item){});`
功能描述：指定列或clause()返回值的最大数的数组元素.
返回结果：object
调用样例:
```javascript
fromq([1,2,3]).max();//3

fromq([1,2,3]).max(function(item){return item;});//3
fromq([1,2,3]).max("o=>o");//3

console.log("max:\t",fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .max("value"));//3
```

  ![Image Title](https://geekpics.net/images/2015/04/29/f5wi18.png)

---

##### min
调用格式：`min(/*Function|Lambda|String field*/clause=function(item){});`
功能描述：指定列或clause()返回值的最小数的数组元素.
返回结果：object
调用样例:
```javascript
fromq([1,2,3]).min();//1

fromq([1,2,3]).min(function(item){return item;});//1
fromq([1,2,3]).min("o=>o");//1

console.log("min:\t",fromq([1,2,3])
    .select("(o,i)=>{index:i,value:o}")
    .each("o=>console.log(o)")
    .min("value"));//1
```
---

##### sum | aggregate
调用格式：`sum(/*Function|Lambda|String fields*/clause=function(item,/*Number*/index));`
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
---

##### avg | average
调用格式：`avg(/*Function|Lambda|String fields*/clause=function(item,/*Number*/index));`
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
---

#### 2.5 排序分页与分组
##### orderBy | sort
调用格式：`orderBy(/*Function|Lambda|String fields*/clause=function(item){},customCompar=false);`
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
---

##### orderByDescending | orderByDesc
调用格式：`orderByDescending(/*Function|Lambda|String fields*/clause=function(item){},customCompare=false);`
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
---

##### paging
调用格式：`paging(/*Number*/nextCount,/*Function|Lambda*/clause=function(item,/*Number*/index){return true});`
功能描述：依据各数组元素的clause(item,index)返回值对数组元素进行过滤后生成fromq，并缓存至paginger中。
返回结果：paginger
调用样例:
```javascript
var paginger = fromq.utils.range(100).paging(4,"o=>o%21==0");
paginger
    .each("(o,i,log)=>log('page number:',i);o.each('(a,i,log)=>log(a)',log)",console.log)
    .gotoPage(3).each("o=>console.log(o)");
console.log("Current Page No:",paginger.getPageNo());
```
---

##### groupBy
调用格式：`groupBy(/*Function|Lambda|String fields*/clause=function(item,/*Number*/index){});`
功能描述：依据各数组元素的clause(item,index)返回值对数组元素进行分组。clause(item,index)返回值可以是任何值，若为数组，则进行多层分组。
返回结果：grouped
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
    .let({value:2})
    .groupBy(function(item,index,n){ 
      return   item.value>n.value?"value>"+n.value:"value<="+n.value;
    })
    .select("(g,i)=>{group:g,sum:i.sum('value'),count:i.count()}")
                              //select group object,total each group item value.
    .each('o=>console.log(o)');
    
```
---
##### count|countBy
调用格式：`count(/*Function|Lambda|String fields*/clause=function(item,/*Number*/index){});`
功能描述：依据各数组元素的clause(item,index)返回值对数组元素进行分组计数。clause(item,index)返回值可以是任何值。
返回结果：fromq
调用样例:
```javascript
fromq([1,2,3,2,3,3])
    .select("(o,i)=>{index:i,value:o}")
    .let({value:2})
    .countBy(function(item,index,n){ 
      return   item.value>n.value?"value>"+n.value:"value<="+n.value;
    })
    .each('o=>console.log(o)');

```

![Image Title](https://geekpics.net/images/2015/04/29/OYt8.png)

---

#### 2.6 集合运算
##### union
调用格式：`union(/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause=function(item,index){return distinct});`
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
---

##### intersect
调用格式：`intersect(/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause=function(item,index){return distinct});`
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
---

##### except
调用格式：`except(/*Array|fromq*/second, /*Function|lambda|String FieldName*/clause=function(item,index){return distinct});`
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
---

##### innerJoin
调用格式：`innerJoin(/*Array|fromq*/second, /*Function|lambda|String fields*/comparer=function(a,b){return true}, /*Function|Lambda*/selector=function(a,b){return {};});`
功能描述：依赖comparer(a,b)返回值判断second集合中是否存在元素a，若存在则将selector(a,b)的返回值作为数组元素,若不存在则不调用selector(a,b)，并将selector(a,b)的值重新组织为fromq。
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
    .innerJoin(People2, "(a,b)=>a.ID==b.ID",
        "(a,b)=>{id:a.ID,name:a.FirstName+'  '+a.LastName,age:b.Age}")
    .orderBy("age")    
    .each("o=>console.log(o)");
```
---

##### leftJoin
调用格式：`leftJoin(/*Array|fromq*/second, /*Function|lambda|String fields*/comparer=function(a,b){return true}, /*Function|Lambda*/selector=function(a,b){return {};});`
功能描述：依赖comparer(a,b)返回值判断second集合中是否存在元素a，若不存在将b置为空对象`{}`，无论存在与否都将selector(a,b)的返回值作为数组元素重新组织为fromq。
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
    .leftJoin(People2,
    function (a,b) {
        return a.ID==b.ID;
    },function(a,b){
        return {id:a.ID,name:a.FirstName+"  "+a.LastName,age:b.Age};    
    }).each("o=>console.log(o)");
fromq(People1)
    .leftJoin(People2, "(a,b)=>a.ID==b.ID",
        "(a,b)=>{id:a.ID,name:a.FirstName+'  '+a.LastName,age:b.Age}")
    .each("o=>console.log(o)");
fromq(People1)
    .leftJoin(People2, "ID",
    "(a,b)=>{id:a.ID,name:a.FirstName+'  '+a.LastName,age:b.Age}")
    .orderBy("age")    
    .each("o=>console.log(o)");
```
---
##### in | within
调用格式：`in(/*Array|fromq*/second, /*Function|lambda|String field*/distinctClause=function(item,index){return {};});`
功能描述：先对second以distinctClause(item,index)返回值进行唯一选择，再对原数组元素以distinctClause(item,index)返回值作为唯一值判断second唯一集合中是否存在元素相同元素，若**存在**则将item作为数组元素重新组织为fromq。
详细用法请查看[fromq.in fromq.notIn功能用例](http://www.bonashen.com/post/develop/ria-develop/2015-04-24-fromq.in-fromq.notingong-neng)
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
       { ID: 2, FirstName: "Kerry", LastName: "Xue" },
        { ID: 3, FirstName: "Peter", LastName: "Shen" },
    ];
fromq(People1)
    .in(People2,"ID")
   .each("o=>console.log(o)");
fromq(People1)
    .in(People2, "o=>o.ID")
    .each("o=>console.log(o)");
fromq(People1)
    .in(People2, function(item){return item.ID;})
    .each("o=>console.log(o)");
```
---
##### notIn | without
调用格式：`notIn(/*Array|fromq*/second, /*Function|lambda|String field*/distinctClause=function(item,index){return {};});`
功能描述：先对second以distinctClause(item,index)返回值进行唯一选择，再对原数组元素以distinctClause(item,index)返回值作为唯一值判断second唯一集合中是否存在元素相同元素，若**不存在**则将item作为数组元素重新组织为fromq。
详细用法请查看[fromq.in fromq.notIn功能用例](http://www.bonashen.com/post/develop/ria-develop/2015-04-24-fromq.in-fromq.notingong-neng)
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
       { ID: 2, FirstName: "Kerry", LastName: "Xue" },
        { ID: 3, FirstName: "Peter", LastName: "Shen" },
    ];
fromq(People1)
    .notIn(People2,"ID")
   .each("o=>console.log(o)");
fromq(People1)
    .notIn(People2, "o=>o.ID")
    .each("o=>console.log(o)");
fromq(People1)
    .notIn(People2, function(item){return item.ID;})
    .each("o=>console.log(o)");
```
---
### 3.数组分组对象(grouped)
分组对象是fromq().groupBy函数的返回结果集。他提供了对分组后的对象进行数组元素的遍历、选择，通过选择功能select你可以实现分组的统计功能。
#### each
调用格式：`each(/*Function|Lambda*/clause=function(/*Object*/group,/*fromq*/items){});`
功能描述：遍历分组对象的数组元素，若clause()返回非null | undefined时结束遍历。
返回结果：grouped
调用样例:
```javascript
//example1
fromq([1,2,3,2,3,3]).
    groupBy("o=>o").
    each(function(group,items){
               console.log(group);   //print group value,also name 'group name'
    });
 });
 //example2
fromq([1,2,3,2,3,3])
    .select("(o,i)=>{index:i,value:o}")
    .let({value:2})
    .groupBy("(o,i,n)=>o.value>n.value?"value>"+n.value:"value<="+n.value;
    })
    .select("(g,i)=>{group:g,sum:i.sum('value'),count:i.count()}")
      //分组的统计
    .each('o=>console.log(o)');
```
---

#### select
调用格式：`select(/*Function|Lambda*/clause=function(/*fromq*/group,/*fromq*/items){});`
功能描述：遍历分组对象的数组元素，重新组织clause()返回值为fromq对象。
返回结果：fromq
调用样例:
```javascript
fromq([1, 2, 3, 2, 3, 3])
    .select('(o,i)=>{index:i,value:o}')
    .let({value:2})    
    .groupBy('(o,i,n)=>o.value>n.value? "value>" + n.value: "value<="+ n.value')
    .select('(g,i)=>{group:g,sum:i.sum(\'value\'),count:i.count(),items:i.toArray()}')
    .each('o=>console.log(o)');   
```
---
#### count
调用格式：`count();`
功能描述：对各分组的元素数量进行统计,集合分组名为新值对象，重新生成数组，并返回fromq。
值对象的格式如下：
```javascript
{key:'group name' ,value: size}
```
返回结果：fromq
调用样例:
```javascript
fromq([1, 2, 3, 2, 3, 3])
    .select('(o,i)=>{index:i,value:o}')
    .let({value:2})    
    .groupBy('(o,i,n)=>o.value>n.value? "value>" + n.value: "value<="+ n.value')
    .count()
    .each('o=>console.log(o)');   
```
---

#### getCache
调用格式：`getCache();`
功能描述：获取分组对象的数据。
返回结果：object
调用样例:
```javascript
console.log(
    fromq([1, 2, 3, 2, 3, 3]).
    groupBy("o=>o").getCache());

```
---

### 4.数组分页对象(paginger)
分页对象是fromq().paging函数的返回结果集。他提供对数组元素按页的遍历、选择等fromq功能。
####each
调用格式：`each(/*Function|Lambda*/clause=function(/*fromq\*rdsq,/*Number*/pageNo){return false});`
功能描述：遍历每一页，若clause()返回非null | undefined时结束遍历。
返回结果：paginger
调用样例:
```javascript
var log=console.log;
var paginger = fromq([1,2,3,4,5,6]).paging(3);
paginger.each(function(rdsq,pageNo){
    log("Page No:",pageNo);    
    rdsq.each(function(item,index){
        log(item);
    });
});

//for lambda
paginger.each("(rdsq,i,log)=>log('Page No:',i);rdsq.each('(o,i,log)=>log(o)',log)",log);
```
---

#### select
调用格式：`select(/*Function|Lambda*/clause=function(/*fromq*/rdsq,/*Number*/pageNo){});`
功能描述：遍历每一页，按页重新组织clause()返回值为fromq对象。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(5);
paginger.select(function(rdsq,pageNo){
    return {pageNo:pageNo,count:rdsq.count(),sum:rdsq.sum(),avg:rdsq.avg()};
}).each(function(item){
    console.log(item);
});
//for lambda
paginger
    .select("(rdsq,pageNo)=>{pageNo:pageNo,count:rdsq.count(),sum:rdsq.sum(),avg:rdsq.avg()}")
    .each("o=> console.log(o)");
```
---

#### setNextCount
调用格式：`setNextCount(/*Number*/count);`
功能描述：设置每页的记录数量。
返回结果：null
调用样例:
```javascript
paginger.setNextCount(10);
```
---

#### pageCount
调用格式：`pageCount();`
功能描述：依据每一页的记录数量与缓存的记录数计算总页数。
返回结果：Number>=0
调用样例:
```javascript
var pageCount = fromq.range(100).paging(6).pageCount();
console.log("page count:",pageCount);
```
---

#### getPageNo
调用格式：`getPageNo(/*object*/item);`
功能描述：返回item所处页的页码，若item=null | undefined,则返回当前页的页码。
返回结果：Number
调用样例:
```javascript
var paginger = fromq.range(100).paging(6);
paginger.last();
console.log("Current Page No:",paginger.getPageNo());
```
---

#### isEmpty
调用格式：`isEmpty();`
功能描述：判断Paginger的缓存数据是否为空。
返回结果：true|false
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o>100");
console.log("Paginger is empty:",paginger.isEmpty());
```
---

#### getCache
调用格式：`getCache();`
功能描述：获取Paginger的缓存数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%15==0");
console.log("Paginger cache records number:",paginger.getCache().count());
```
---

#### getCacheCount
调用格式：`getCacheCount();`
功能描述：获取Paginger的缓存数据的数组长度。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%15==0");
console.log("Paginger cache records number:",paginger.getCacheCount());
```
---

#### gotoPage
调用格式：`gotoPage(/*Number*/pageNumber);`
功能描述：跳转到pageNumber，并获取PageNumber的数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger.
    gotoPage(2)
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });

```
---

#### first
调用格式：`first();`
功能描述：跳转到第一页，并获取该页的数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger
    .first()
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });
```
---

#### last
调用格式：`last();`
功能描述：跳转到末页，并获取该页的数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger
    .last()
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });
```
---

#### next
调用格式：`next();`
功能描述：移到下一页，并获取该页的数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger
    .next()
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });
```
---

#### prior
调用格式：`prior();`
功能描述：移到上一页，并获取该页的数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger
    .prior()
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });
```
---

#### current
调用格式：`current();`
功能描述：获取当前页的数据。
返回结果：fromq
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger
    .current()
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });
```
---

#### indexOf
调用格式：`indexOf(/*Object*/item);`
功能描述：获取item在Cache中的索引值。
返回结果：Number
- 若返回结果为`-1`，表示item不在Cache中。

调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger
    .last()
    .each(function(item){
        console.log("record no.",paginger.indexOf(item),"\tvalue:",item);
    });
```
---

#### isTail
调用格式：`isTail();`
功能描述：判断当前页是否是末尾页。
返回结果：true|false
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger.next();
console.
    log("Current Page is tail:",paginger.isTail());
   
```
---

#### isTop
调用格式：`isTop();`
功能描述：判断当前页是否是顶页。
返回结果：true|false
调用样例:
```javascript
var paginger = fromq.range(100).paging(6,"o=>o%3==0");
paginger.first();
console.
    log("Current Page is top:",paginger.isTop());
   
```
---
### 5.正则表达式操作
fromq可以进行正则表达式的匹配操作，主要有两个函数，fromq(RegExp)和match(str)。具体使用详细如下说明。
#### fromq
调用格式：`fromq(/*RegExp*/it,/*String*/str);`
功能描述：使用it对str进行正则表达式匹配，组织匹配结果为fromq对象。
返回结果：fromq
调用样例:
```javascript
fromq(/ab*/g,"abb switch,i like abb").
    each("o=>console.log('value:'+o,'\t index:'+o.index)");
```
#### match
调用格式：`match(/*String*/str);`
功能描述：使用fromq对象创建时的it值对str进行正则表达式匹配，组织匹配结果为fromq对象。
返回结果：fromq
调用样例:
```javascript
fromq(/ab*/g).match("abb switch,i like abb").
    each("o=>console.log('value:'+o,'\t index:'+o.index)");
```
---
### 6.Lambda使用
#### fromq | fromq.lambda
调用格式：`fromq(/*String*/it,/*Boolean*/isClosure);`
功能描述：fromq可以将符合Lambda规范的字符串编译为匿名函数。
返回结果：Function
调用样例:
```javascript
fromq("o=>console.log(o)");
fromq.lambda("o=>console.log(o)");
fromq("o=>console.log(o)",true); //带有闭包函数体
fromq.lambda("o=>console.log(o)",true);
```
```javascript

fromq("o=>console.log(o)").toString();
/*
function anonymous(o) {
'use strict';
return console.log(o);
}
*/

fromq("o=>console.log(o)",true).toString();
/*
function anonymous(o) {
'use strict';
return  (function(o){console.log(o)}).apply(this,arguments);
}
*/
```
---
### 7.其他静态功能(utils)
其他静态功能是指fromq.utils包中的静态方法，可以通过fromq.utils直接引用。

#### random
调用格式：`random(/*Number*/minValue,/*Number*/maxValue,/*Number*/count);`
功能描述：随机产生minValue-maxValue范围内的count数量的数组，并返回fromq。

- maxValue为null时，产生0-minValue之间的数值;
- count缺省时，默认为1;

返回结果：fromq
调用样例:
```javascript
var s = fromq.utils.random(100,null,5).toString(",");
console.log(s);
/*out:
43,64,23,32,86
*/
```
#### range
调用格式：`range(/*Number*/start, /*Number*/end, /*Number*/step);`
功能描述：按setp步长生成从start到end的数组元素并返回fromq。
- 若仅有start，则生成0-start个数组元素
- 若仅缺step,则以1为步长

返回结果：fromq
功能已经有所修缮，详见[【新增fromq.equal,into功能，修缮了range功能】](http://www.bonashen.com/post/develop/ria-develop/2015-04-25-xin-zeng-fromq.equalgong-neng-xiu-shan-liao-rangegong-neng)

调用样例:
```javascript
fromq
        .utils.range(10)
        .select("o=>o*2")
        .each('o=>console.log(o)');
fromq
        .utils.range(5,10)
        .select("o=>o*2")
        .each('o=>console.log(o)');
fromq
        .utils.range(1,10,2)
        .select("o=>o*2")
        .each('o=>console.log(o)');
```
#### repeat
调用格式：`repeat(/*String*/it, /*Number*/count);`
功能描述：重复生成count数量的it数组元素并返回fromq。
返回结果：fromq
调用样例:
```javascript
fromq
        .utils.repeat("a",4)
        .each('o=>console.log(o)');
/*out:
    aaaa
*/
```
#### trim
调用格式：`trim(/*String*/it);`
功能描述：删除it字符串的前尾空白字符并返回。
返回结果：String
调用样例:
```javascript
var src = " a ";
console.log(src.length);//3
console.log(fromq.utils.trim(src).length);//1
```
#### initialToUpperCase
调用格式：`initialToUpperCase(/*String*/it);`
功能描述：将字符串中首个单词的首字母转为大写字母。
返回结果：String
调用样例:
```javascript
var src = " hello world ";
console.log("'",src,"',  length:",src.length);
var dsrc = fromq.utils.initialToUpperCase(src);
console.log("'",dsrc,"',  length:",dsrc.length);
/*out:
' hello world ', length:13
' Hello world ', length:13
*/
```
#### initialsToUpperCase
调用格式：`initialsToUpperCase(/*String*/it);`
功能描述：将字符串中每个单词的首字母转为大写字母。
返回结果：String
调用样例:
```javascript
var src = " hello world ";
console.log("'",src,"',  length:",src.length);
var dsrc = fromq.utils.initialsToUpperCase(src);
console.log("'",dsrc,"',  length:",dsrc.length);
/*out:
' hello world ', length:13
' Hello World ', length:13
*/
```
#### isArray
调用格式：`isArray(/*array*/it);`
功能描述：判断it是否是数组。
返回结果：true|false
调用样例:
```javascript
console.log(fromq.utils.isArray([]));  //true
```
#### isFunction
调用格式：`isFunction(/*Function*/it);`
功能描述：判断it是否是函数。
返回结果：true|false
调用样例:
```javascript
console.log(fromq.utils.isFunction(function(){}));  //true
```
#### isString
调用格式：`isString(/*String*/it);`
功能描述：判断it是否是字符串。
返回结果：true|false
调用样例:
```javascript
console.log(fromq.utils.isString(" ab "));  //true
console.log(fromq.utils.isString(""));  //true
```
#### isNumber
调用格式：`isNumber(/*String|Number*/it);`
功能描述：判断it是否是整数。
返回结果：true|false
调用样例:
```javascript
console.log(fromq.utils.isNumber("123"));  //true
console.log(fromq.utils.isNumber(123));  //true
console.log(fromq.utils.isNumber("12.3"));  //false
console.log(fromq.utils.isNumber(12.3));  //false
```
#### isFloat
调用格式：`isFloat(/*String|Number*/it);`
功能描述：判断it是否是实数。
返回结果：true|false
调用样例:
```javascript
console.log(fromq.utils.isFloat("123"));  //true
console.log(fromq.utils.isFloat(12.3));  //true
console.log(fromq.utils.isFloat("-12.3"));  //true
console.log(fromq.utils.isFloat("+12.3"));  //true
```
---