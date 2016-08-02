Ext.namespace("susemp");
Ext.namespace("susemp.ux");
susemp.ux.initWeatherWin = Ext.extend(Ext.window.Window, {
	initComponent: function(){
		var width = document.body.clientWidth-651;
		var height = 130;
		Ext.apply(this, {
			height:250,
			width: 651,
			x: width,
			y: height,
			showDelay: 0,
			closeAction: 'hide',
			layout: 'fit',
			border: false,
			bodyBorder: false,
			bodyStyle: 'background: #ffffff;',
			items: [{
				xtype: 'container',
				html: '<iframe name="weather_inc" src="http://www.tianqi.com/index.php?c=code&id=13" width="650" height="221"  frameborder="0" marginwidth="0" marginheight="0" scrolling="no"></iframe>'
			}]
		});
		susemp.ux.initWeatherWin.superclass.initComponent.apply(this, arguments);
	}
});