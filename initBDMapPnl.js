//定义map view
Ext.define('Ext.ux.baiduMap', {
	extend : 'Ext.panel.Panel',
	alias : 'widget.baidumap',
	width : 900,
	height : 600,
	id : 'map-canvas',
	// 添加搜索栏
	geocoder : null,
	// 定位到当前位置
	browserSupportFlag : false,
	initialLocation : null,
	searchInputId : "",
	//args
	map : null,
	markArr : null,
	initComponent : function() {
		Ext.apply(this, {

			listeners : {
				afterrender : {
					fn : this.initbaiduMap
				}
			}
		});
		this.superclass.initComponent.apply(this, arguments);
	},
	// 初始化一个Map
	setMap : function(map) {
		this.map = map;
	},
	getMap : function() {
		return this.map;
	},
	initbaiduMap : function() {
		var map = new BMap.Map("map-canvas"); // 创建地图实例
		var point = new BMap.Point(118.80297,32.064787); // 创建点坐标/南京
		map.centerAndZoom(point, 15); // 初始化地图，设置中心点坐标和地图级别
		map.enableScrollWheelZoom(); // 大小变化

		//var controlDiv = document.createElement('DIV');
		//this.searchControl(controlDiv);
		var searchbox = new SearchBox({anchor:BMAP_ANCHOR_TOP_RIGHT});
		map.addControl(searchbox);  // 将搜索控件添加到地图上

		this.setMap(map);
		
		//var mark = new BMap.Marker(new BMap.Point(118.802795,32.06458), {
		//	code : '210000',
		//	title : '中国南京',
		//	icon : new BMap.Icon('../images/mk_orange.png', new BMap.Size(23, 35), {
		//		offset : new BMap.Size(0, 0)
		//	})
		//});
		//map.addOverlay(mark);
		
		this.loadOverLays();
	},
    //载入自定义标记数据集
    loadOverLays: function(){
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
					markArr.push(record.data);
				});
				this.addOverLays(markArr);
		    }
		});
    },
    //添加自定义标记
	addOverLays : function(markArr) {
		var map = this.getMap();

		for (i = 0; i < markArr.length; i++) {
			this.configMark(markArr[i], i);
		}
	},
	// 此方法必须从for循环中独立出来
	configMark : function(markObj, index) {
		var map = this.getMap();
		var latLng = new BMap.Point(markObj.xpoint, markObj.ypoint);
		//if(index == 0) map.setCenter(latLng);
		//自定义标记覆盖物
		var iconUrl = '../images/mk_red.png';
		if(markObj.flag == '2') {
			iconUrl = '../images/mk_green.png';
		} else if(markObj.flag == '3') {
			iconUrl = '../images/mk_orange.png';
		}
		var imgIcon = new BMap.Icon(iconUrl, new BMap.Size(24, 34), {
			offset : new BMap.Size(12, 33),
			anchor : new BMap.Size(12, 33)
		});
		// 形状定义的图标可点击的区域
	    // 该类型定义HTML<area>元素'poly'多边形描绘出一系列的X，Y点。通过连接到第一坐标中的最终坐标关闭聚
	    var shape = {
	        coord: [1, 1, 1, 32, 32, 32, 32 , 1],
	        type: 'poly'
	    };
		var marker = new BMap.Marker(latLng, {
			code : markObj.code,
			title : markObj.name,
			icon : imgIcon
		});
		map.addOverlay(marker);

		//信息窗口div_Id
		var div_Id = markObj.code + (index++);
	    //信息窗口
		var divInfowindow;
		
		//单击标记操作信息窗口
		marker.addEventListener("click", function() {
			divInfowindow = new BMap.InfoWindow(
				"<div id = '" + div_Id + "' style='width: 485px; height: 225px'></div>", {
				offset: new BMap.Size(0, -33),
				width : 485,     // 信息窗口宽度
				height: 225     // 信息窗口高度
			});
			new Ext.ux.baiduMap().addWinInfo(divInfowindow, marker, div_Id, markObj.name, markObj.target, markObj.enlist);
		});
	},
	//给信息窗口中添加对应的组件内容并打开
	addWinInfo: function(divInfowindow, marker, div_Id, unitName, target, enlist) {
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
				month = month+1;
				titleStr = titleStr+"<br/>指标周期：月<br/>查询时间："+month+"月";
			}else if(target == 2){
				month = month+1;
				if(month == 1){
					titleStr = titleStr+"<br/>指标周期：年<br/>查询时间："+month+"月";
				}else {
					titleStr = titleStr+"<br/>指标周期：年<br/>查询时间：1月至"+month+"月";
				}
			}else if(target == 3){
				var season = Math.floor(month/3)+1;
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
			} else {
				titleStr = titleStr+"<br/>指标周期：未设指标周期";
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
		marker.openInfoWindow(divInfowindow);
		
	},
	// 添加搜索栏
	setGeocoder : function(geocoder) {
		this.geocoder = geocoder;
	},
	getGeocoder : function() {
		return this.geocoder;
	},
	//自定义搜索控件
	searchControl: function (controlDiv) {
		// Set CSS styles for the DIV containing the control
		controlDiv.style.padding = '7px';
		var controlUI = document.createElement('DIV');
		controlUI.innerHTML = "<input id='address' type='text' onkeyup='javascript:if(event.keyCode == 13){new susemp.ux.initGSMapPnl().codeAddress(1, 1, null)}' /><input type='button' value='搜索' onclick='new susemp.ux.initGSMapPnl().codeAddress(1, 1, null)' />";
		controlUI.style.textAlign = 'center'; 
		controlDiv.appendChild(controlUI);
	}
})
