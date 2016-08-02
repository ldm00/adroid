/**
 * 定义map view
 */
var map;
Ext.namespace("susemp");
Ext.namespace("susemp.ux");
susemp.ux.initGSMapPnl = Ext.extend(Ext.panel.Panel, {
	alias : 'widget.googlemap',
	//初始定位
	initialLocation : null,
	beijing : new google.maps.LatLng(39.90424, 116.40738),
	nanjing : new google.maps.LatLng(32.060257, 118.796872),
	newyork : new google.maps.LatLng(40.69847032728747, -73.9514422416687),
	//浏览器支持
	browserSupportFlag :  new Boolean(),
	//标记信息窗索引
	infWin_index : 0,
	initComponent : function() {
		var mapWidth = this.mapWidth;
		var mapHeight = this.mapHeight;
		Ext.apply(this, {
			html : "<div id='map_canvas' style='width: " + mapWidth + "px; height: " + mapHeight + "px'></div>",//map容器
			listeners : {
				afterrender : {
					fn : this.initGoogleMap
				}
			}
		});
		this.superclass.initComponent.apply(this, arguments);
	},
	//初始化map
	initGoogleMap : function() {
		google.maps.visualRefresh = true;
		var myOptions = {
			zoom: 12,
			scaleControl: true,
	    	mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
		
		this.initNJPosition(map);
		//this.initCurtPosition(navigator, google, map);
		
		var controlDiv = document.createElement('DIV');
		this.searchControl(controlDiv);
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(controlDiv);
		
		//获取地址信息并标记到地图(数据解析)
		this.loadOverLays(map);
    },
    //load自定义标记数据集
    loadOverLays: function(map){
		var markStore = new Ext.data.JsonStore({// 根据id,name动态读取
			fields : ['name', 'code', 'xpoint' , 'ypoint', 'flag', 'target', 'enlist'],
			proxy : {
				type : 'ajax',
				url : '../dc/Dc04Action!getPositDataDepend.action',
				method : 'post',
				reader : {
					root : 'data'
				}
			}
		});
		var markArr = [];
		markStore.load({
		    scope: this,
		    callback: function(records, operation, success) {
				markStore.each(function(record) {
					var name = record.get('name');
					var code = record.get('code');
					var latLng = new google.maps.LatLng(record.get('xpoint'), record.get('ypoint'));
					var flag = record.get('flag');
					var target = record.get('target');
					var enlist = record.get('enlist');
					markArr.push({name : name, code : code, latLng : latLng, flag : flag, target: target, enlist: enlist });
				});
				this.addOverLays(markArr, map);
		    }
		});
    },
    //添加自定义标记
    addOverLays: function(markArr, map){
    	//循环添加自定义标记
		for(var i = 0; i < markArr.length; i++) {
			//if(i == 0) {
			//	map.setCenter(markArr[i].latLng);
			//}
			this.configMarker(markArr[i].target, markArr[i].enlist, markArr[i].name, markArr[i].code, markArr[i].latLng, markArr[i].name, markArr[i].flag, map);
		}
    },
	//标记及其信息窗口配置
	configMarker: function(target, enlist, unitName, unitCode, dfLatLng, address, flag, map) {
		//自定义标记图片
		var iconUrl = '../images/mk_red.png';
		if(flag == '-1') {
			iconUrl = '../images/mk_green.png';
		} else if(flag == '0') {
			iconUrl = '../images/mk_orange.png';
		}
    	var image = {
    		url: iconUrl,
    		// This marker is 30 pixels wide by 43 pixels tall
		    size: new google.maps.Size(30, 43),
		    // The origin for this image is 0,0
		    origin: new google.maps.Point(0,0),
		    // The anchor for this image is the base of the flagpole at 0,32
		    anchor: new google.maps.Point(14,34)
    	};
    	var shadow = {
		    url: iconUrl,
		    // The shadow image is larger in the horizontal dimension
		    // while the position and offset are the same as for the main image
		    size: new google.maps.Size(55, 43),
		    origin: new google.maps.Point(0,0),
		    anchor: new google.maps.Point(14,34)
		  };
		// 形状定义的图标可点击的区域
	    // 该类型定义HTML<area>元素'poly'多边形描绘出一系列的X，Y点。通过连接到第一坐标中的最终坐标关闭聚
	    var shape = {
	        coord: [1, 1, 1, 32, 32, 32, 32 , 1],
	        type: 'poly'
	    };
		//标记
		var marker = new google.maps.Marker({
	        map: map,
			icon: image,
			shadow: shadow,
			shape: shape,
	        position: dfLatLng,
	        title: address
	    });
		//标记的信息窗口div_Id
		var div_Id = address + (this.infWin_index++);
	    //标记信息窗口
		var myInfowindow = new google.maps.InfoWindow({
			content: "<div id = '" + div_Id + "' style='width: 485px; height: 225px'></div>",
			size: new google.maps.Size(485, 225)
		});
		//单击标记打开信息窗口
	    google.maps.event.addListener(marker, 'click', function() {
			new susemp.ux.initGSMapPnl().addWinInfo(target, enlist, unitName, myInfowindow, marker, div_Id);
		});
	    
	},
	//给标记信息窗口中添加对应的组件内容
	addWinInfo: function(target, enlist, unitName, myInfowindow, marker, div_Id) {
		setTimeout(function() {
			var pieStore = Ext.create('Ext.data.JsonStore', {
				fields : ['name', 'data']
			});
			var gridStore = Ext.create('Ext.data.JsonStore', {
				fields : ['name', 'unit', 'nhval', 'zbval'] 
			});
			pieStore.loadData(enlist);
			gridStore.loadData(enlist);
			var pieChart = Ext.create('Ext.chart.Chart', {
				width : 160,
				height : 160,
				animate : false,
				store : pieStore,
				shadow : false,
				insetPadding : 0,
				gradients : [{
							'id' : 'sel-v-4',//blue
							'angle' : 0,
							stops : {
								20 : {
									color : '#88ba2a'
								},
								70 : {
									color : '#b7e268'
								}
							}
						}, {
							'id' : 'sel-v-2',//green
							'angle' : 0,
							stops : {
								20 : {
									color : '#1393d2'
								},
								70 : {
									color : '#58c5f1'
								}
							}
						}, {
							'id' : 'sel-v-1',//yellow
							'angle' : 0,
							stops : {
								20 : {
									color : '#f5bf01'
								},
								70 : {
									color : '#ffe888'
								}
							}
						}, {
							'id' : 'sel-v-3',//red
							'angle' : 0,
							stops : {
								20 : {
									color : '#e12b2b'
								},
								70 : {
									color : '#f65e5e'
								}
							}
						}],
				series : [{
					type : 'pie',
					field : 'data',
					showInLegend : false,
					label : {
						field : 'name',
						contrast : true,
						display : 'middle',
						font : '12px"Lucida Grande"',
						renderer : function(v) {
							return v;
						}
					},
					tips: {
			            trackMouse: true,
			            width: 140,
			            height: 28,
			            renderer: function(storeItem, item) {
			                this.setTitle( getDecimal_f(storeItem.get('data'), 4)  + ' 万吨标煤');
			            }
			        },
					renderer : function(sprite, record, attr, index, store) {
						var color = ['url(#sel-v-3)', 'url(#sel-v-4)',
								'url(#sel-v-2)', 'url(#sel-v-1)'][index];
						return Ext.apply(attr, {
									fill : color
								});
					}
				}]
			});
			
			var grid = Ext.create('Ext.grid.Panel', {
					store : gridStore,
					style : 'margin-top:20px; margin-left: 2px;',
					height : 120,
					width : 315,
					columns : [{
								text : '类别',
								width : 80,
								dataIndex : 'name'
							}, {
								text : '单位',
								width : 80,
								dataIndex : 'unit'
							}, {
								text : '能耗指标',
								flex : 1,
								dataIndex : 'zbval',
								renderer : decimal_fx
							}, {
								text : '实际能耗',
								flex : 1,
								dataIndex : 'nhval',
								renderer : decimal_f
							}]
				});
			// 保留0位有效数字
			function decimal_f(value, metaData, record  ) {
				var zbVal = record.data.zbval;
				if(value>=zbVal){
					return '<div align=right style="color:red">' + getDecimal_f(value, 0) + '</div>';
				}else if(value>=zbVal*0.95){
					return '<div align=right style="color:yellow">' + getDecimal_f(value, 0) + '</div>';
				}else {
					return '<div align=right>' + getDecimal_f(value, 0) + '</div>';
				}
			}
			function decimal_fx(v){
				if(v<=0){
					return '<div align=right style="color:blue">未设指标</div>';
				}
				return '<div align=right>' + getDecimal_f(v, 0) + '</div>';
			}
			var date = new Date();
			var year = date.getFullYear();
			var month = date.getMonth();
			var titleStr = unitName;
			if(target == 1){
				titleStr = titleStr+"<br/>指标周期：月<br/>查询时间："+month+"月";
			}else if(target == 2){
				month = month+1;
				if(month == 1){
					titleStr = titleStr+"<br/>指标周期：年<br/>查询时间："+month+"月";
				}else {
					titleStr = titleStr+"<br/>指标周期：年<br/>查询时间：1月至"+month+"月";
				}
			}else if(target == 3){
				var season = month/3+1;
				month = month+1;
				if(month == 1){
					titleStr = titleStr+"<br/>指标周期：季度<br/>查询时间:"+month+"月";
				}else {
					if((season*3-2)==month){
						titleStr = titleStr+"<br/>指标周期：季度<br/>查询时间:"+month+"月";
					}else {
						titleStr = titleStr+"<br/>指标周期：季度<br/>查询时间:"+(season*3-2)+"月至"+month+"月";
					}
				}
			}
			Ext.create('Ext.container.Container', {
			    width: 485,
			    height: 220,
			    layout: 'vbox',
			    items: [{
			    	xtype: 'container',
			    	height: 55,
			    	html: titleStr
			    }, {
			    	xtype: 'container',
			    	height: 200,
			    	layout: 'hbox',
			    	items: [pieChart, grid]
			    }],		    
			    renderTo: div_Id
			});
		}, 150);
		//打开信息窗口
		myInfowindow.open(map, marker);
		
	},
	//解析地址并创建标记
	codeAddress: function (isCenter, isSearch, address) {
	    //如果是在进行搜索
		if(isSearch == 1) {
			address = document.getElementById('address').value;
		}
		//如果传入地址无信息
		if(!address) {
			return false;
		}
		
		var geocoder = new google.maps.Geocoder();
		geocoder.geocode( { 'address': address}, function(results, status) {
		  if (status == google.maps.GeocoderStatus.OK) {
		    var nwLatLng = results[0].geometry.location; //results数组里有很多有用的信息，包括坐标和返回的标准位置信息
		    //设置地图中心点(当为初始预设或搜索时)
		    if(isCenter == 1) {
		 		map.setCenter(nwLatLng);
		    }
		    //标记配置(动态搜索时暂不标记)
		    if(isSearch != 1) {
		    	new susemp.ux.initGSMapPnl().configMarker(nwLatLng, address);
		    }
		  } else {
		    alert('Geocode was not successful for the following reason: ' + status);
		  }
		});
		
	},
	//自定义搜索控件
	searchControl: function (controlDiv) {
		// Set CSS styles for the DIV containing the control
		controlDiv.style.padding = '7px';
		var controlUI = document.createElement('DIV');
		controlUI.innerHTML = "<input id='address' type='text' onkeyup='javascript:if(event.keyCode == 13){new susemp.ux.initGSMapPnl().codeAddress(1, 1, null)}' /><input type='button' value='搜索' onclick='new susemp.ux.initGSMapPnl().codeAddress(1, 1, null)' />";
		controlUI.style.textAlign = 'center'; 
		controlDiv.appendChild(controlUI);
		
	},
	//初始化当前位置
	initNJPosition: function (map) {
		map.setCenter(this.nanjing);
	},
	initCurtPosition: function (navigator, google, map) {
		// Try W3C Geolocation (Preferred) 
		if(navigator.geolocation) { 
		  this.browserSupportFlag = true; 
		  navigator.geolocation.getCurrentPosition(function(position) { 
		    this.initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude); 
		    map.setCenter(this.initialLocation); 
		  }, function() { 
		    this.handleNoGeolocation(this.browserSupportFlag, map); 
		  }); 
		// Try Google Gears Geolocation 
		} else if (google.gears) { 
		  this.browserSupportFlag = true; 
		  var geo = google.gears.factory.create('beta.geolocation'); 
		  geo.getCurrentPosition(function(position) { 
		    this.initialLocation = new google.maps.LatLng(position.latitude,position.longitude); 
		    map.setCenter(this.initialLocation); 
		  }, function() { 
		    this.handleNoGeoLocation(this.browserSupportFlag, map); 
		  }); 
		// Browser doesn't support Geolocation 
		} else { 
		  this.browserSupportFlag = false; 
		  this.handleNoGeolocation(this.browserSupportFlag, map); 
		}
	},		 
	handleNoGeolocation: function (errorFlag, map) { 
	  if (errorFlag == true) { 
	    alert("Geolocation service failed."); 
	    this.initialLocation = this.beijing; 
	  } else { 
	    alert("Your browser doesn't support geolocation. We've placed you in newyork."); 
	    this.initialLocation = this.newyork; 
	  } 
	  map.setCenter(this.initialLocation); 
	}
	
});
