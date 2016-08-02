// 添加事件
 function addEventHandler(tatget, eventName, handler) {
    if (tatget.addEventListener) {
        tatget.addEventListener(eventName, handler, false);
    } else if (tatget.attachEvent) {
        tatget.attachEvent("on" + eventName, handler);
    } else {
        tatget["on" + eventName] = handler;
    }
}

 // 移除事件
 function removeEventHandler(tatget, eventName, handler) {
    if (tatget.removeEventListener) {
        tatget.removeEventListener(eventName, handler, false);
    } else if (tatget.eventName) {
        tatget.detachEvent("on" + eventName, handler);
    } else {
        tatget["on" + eventName] = null;
    }
}

// 判断是否存在某className
function hasClass(target, name) {
    return target.className.match(new RegExp('(\\s|^)' + name + '(\\s|$)'));
}

// 添加class
function addClass(target, name) {
    if (!hasClass(target, name)) {
        target.className += " " + name;
    }
}

// 移除class
function removeClass(target, name) {
    if (hasClass(target, name)) {
        target.className = target.className.replace(new RegExp('(\\s|^)' + name + '(\\s|$)'), ' ');
    }
}

// 获取location
function locTarget(target, dire) {
    var i = 0;
    while (target) {
        i += target["offset" + dire];
        if (target.offsetParent) {
            if (target.offsetParent.style.position == "absolute") {
                return i;
            }
        }
        target = target.offsetParent;
    }
    return i;
}

String.prototype.trim = function() {
	return this.replace(/(^\s*)|(\s*$)/g, "");
}
String.prototype.format = function() {
	var txt = this;
	i = arguments[0].length;
	while (i--) {
		txt = txt.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[0][i]);
	}
	return txt;
}

// SearchBox控件
function SearchBox(options) {
    this.callback = null;//回调函数,在点击搜索时调用，需要我们去覆盖的
    this.pretender = document.createElement("ul");// 下拉列表的容器
    this.searchBox = document.createElement("input");// 搜索框
    this.searchBox.setAttribute("type", "text"); 
    this.searchButton = document.createElement("input");// 搜索按钮
    this.searchButton.setAttribute("type", "button");
    this.searchButton.setAttribute("value", "搜 索");
    this.map = null;// 地图对象
    
    if(options)
    {
        this.defaultAnchor = options.anchor || BMAP_ANCHOR_TOP_RIGHT;// 默认停靠在地图的右上方
        this.defaultOffset = options.offset || new BMap.Size(27, 38);// 默认与地图边界的margin
    }
    else
    {
        this.defaultAnchor = BMAP_ANCHOR_TOP_RIGHT;// 默认停靠在地图的右上方
        this.defaultOffset = new BMap.Size(27, 38);// 默认与地图边界的margin
    }
    this.city = "";// 在哪个城市搜索?
}

// 继承自百度地图控件类
SearchBox.prototype = new BMap.Control();

// 初始化
SearchBox.prototype.initialize = function(map) {
    this.map = map;
    var casing = document.createElement("div");
    casing.className = "searchbox_casing";

    var txt = this.searchBox;
    txt.className = "searchbox_box";

    var drop = this.pretender;

    var self = this;
    
    addEventHandler(txt, "mouseleave", function() {//鼠标离开
        window.setTimeout(function() { drop.style.display = "none"; }, 150);
    });
    addEventHandler(txt, "keydown", function(e) {
        var key = txt.value.trim();
        var code = e ? (e.charCode || e.keyCode) : 0;
        if (key != "" && (code == 38 || code == 40)) {
            var curr = null;
            var childs = drop.childNodes;
            for (var i = 0; i < childs.length; i++) {
                if (hasClass(childs[i], "curr")) {
                    removeClass(childs[i], "curr");
                    switch (code) {
                        case 38:
                            curr = childs[i].previousSibling;
                            break;
                        case 40:
                            curr = childs[i].nextSibling;
                            break;
                    }
                    break;
                }
            }
            if (!curr) {
                switch (code) {
                    case 38:
                        curr = drop.lastChild;
                        break;
                    case 40:
                        curr = drop.firstChild;
                        break;
                }
            }
            addClass(curr, "curr");
            txt.value = curr.innerHTML;
        }
        else if (code == 13) {
            self.search(map);
            return false;
        }
    });

    var timer = 0;
    var town = this.city;
    window.setInterval(function() {
        if (timer > 0) {
            timer -= 2;
        } else if (timer < 0) {
            timer = 0;
            var key = txt.value.trim();
            if (key != "") {
                var callback = function(result) {
                    if (result) {
                        var count = result.getCurrentNumPois();
                        if (count > 0) {
                            drop.innerHTML = "";
                            for (var i = 0; i < count; i++) {
                                var item = result.getPoi(i);
                                var item_box = document.createElement("li");
                                item_box.innerHTML = item.title;

                                addEventHandler(item_box, "mouseover", (function(item_box) { return function() { addClass(item_box, "hover"); } })(item_box));
                                addEventHandler(item_box, "mouseout", (function(item_box) { return function() { removeClass(item_box, "hover"); } })(item_box));
                                addEventHandler(item_box, "click", (function(item_box) { return function() { txt.value = item_box.innerHTML; } })(item_box));
                                drop.appendChild(item_box);
                            }

                            var size = map.getSize();
                            var map_container = map.getContainer();
                            var offs = self.getOffset();

                            var left = locTarget(map_container, "Left");
                            var top = locTarget(map_container, "Top");
                            switch (self.getAnchor()) {
                                case BMAP_ANCHOR_TOP_LEFT:
                                    top += offs.height + 30;
                                    left += offs.width + 25;
                                    break;
                                case BMAP_ANCHOR_TOP_RIGHT:
                                    top += offs.height + 30;
                                    left += size.width - offs.width - 382;
                                    break;
                                case BMAP_ANCHOR_BOTTOM_LEFT:
                                    top += size.height - offs.height;
                                    left += offs.width + 25;
                                    break;
                                case BMAP_ANCHOR_BOTTOM_RIGHT:
                                    top += size.height - offs.height;
                                    left += size.width - offs.width - 382;
                                    break;
                            }
                            drop.style.left = left + "px";
                            drop.style.top = top + "px";
                            drop.style.display = "block";
                        }
                    }
                };
                var options = { pageCapacity: 10, onSearchComplete: callback };
                new BMap.LocalSearch(town || map, options).search(key);
            } else {
                drop.style.display = "none";
            }
        }
    }, 50);

    addEventHandler(txt, "keyup", function(e) {
        e = e || window.event;
        var code = e ? (e.charCode || e.keyCode) : 0;
        if ((code < 37 || code > 40) && code != 13) {
            timer = 11;
        }
    });

    casing.appendChild(txt);
    this.pretender.className = "searchbox_pretender";

    map.getContainer().parentNode.appendChild(this.pretender);

    var btn = this.searchButton;
    btn.className = "searchbox_btn";

    addEventHandler(btn, "click", function() {
        self.pretender.style.display = "none";
        self.search(map);
    });

    casing.appendChild(btn);

    map.getContainer().appendChild(casing);
    return casing;
}

//搜索地址
SearchBox.prototype.search = function(map) {
    var key = this.searchBox.value;
    if (key == "") {
        alert("请输入您要搜索的地址！");
        return;
    }

    this.pretender.style.display = "none";

    var self = this;
    var geocoder = new BMap.Geocoder();
    geocoder.getPoint(key, function(point) {
    	if (point) {
		   map.centerAndZoom(point, 16);    
		   //map.addOverlay(new BMap.Marker(point));    
		 }
    }, this.city);
}