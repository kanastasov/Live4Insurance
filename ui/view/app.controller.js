jQuery.sap.require("view.formatter");

sap.ui.controller("view.app", {

	onInit: function () {

		this.byId("mapCanvas").addStyleClass("gMap");
		
		jQuery.sap.require("sap.m.MessageBox");

	},
	
	onAfterRendering: function () {

		var shape;
		var pos = new google.maps.LatLng(37.774934, -122.422837); // San Francisco
		var mapOptions = {  
            center: pos,  
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP  
		};
		map = new google.maps.Map(appView.byId("mapCanvas").getDomRef(), mapOptions);  

        var polyOptions = {
            strokeWeight: 1,
            fillOpacity: 0.35,
            draggable: true,
            clickable: true,
            geodesic: true,
            editable: true
        };
        var drawingManager = new google.maps.drawing.DrawingManager({
			drawingControl: true,
			drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [
                    google.maps.drawing.OverlayType.POLYGON,
                    google.maps.drawing.OverlayType.RECTANGLE
                ]
			},
			rectangleOptions: polyOptions,
			polygonOptions: polyOptions,
			map: map
        });
	
		var polygon;
        google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
			shape = e.overlay;
			polygon = '';
			if (e.type == google.maps.drawing.OverlayType.POLYGON) {
				var vertices = shape.getPath();
				var xy;
				for (var i = 0; i < vertices.getLength(); i++) {
					xy = vertices.getAt(i);
					if (i > 0) {
						polygon += ',';
					}
					polygon += xy.lng() + ' ' + xy.lat();
				}
				xy = vertices.getAt(0);
				polygon += ',' + xy.lng() + ' ' + xy.lat();
			} else if (e.type == google.maps.drawing.OverlayType.RECTANGLE) {
				var ne = shape.getBounds().getNorthEast();
				var sw = shape.getBounds().getSouthWest();
				polygon = ne.lng()+' '+ne.lat()+',' + ne.lng()+' '+sw.lat()+',' + sw.lng()+' '+sw.lat()+',' + sw.lng()+' '+ ne.lat()+',' + ne.lng()+' '+ne.lat();
			} else {
				shape.setMap(null);
			}
			appView.byId("polygon").setValue(polygon);
			appView.getController().doRefresh();
		});
        google.maps.event.addListener(drawingManager, 'drawingmode_changed', function(e) {
			if (shape) {
				shape.setMap(null);
				shape = null;
				polygon = '';
				appView.byId("polygon").setValue(polygon);
				appView.getController().doRefresh();
			}	
		});

		var oDataModel = new sap.ui.model.odata.ODataModel("/SHA_Insurance/services.xsodata",true);
		appView.byId("bp").setModel(oDataModel);
		appView.byId("lob").setModel(oDataModel);

	},

	doRefresh: function () {

		var url = "/SHA_Insurance/lossTriangle.xsjs?";
		if (appView.byId("bp").getSelectedKey() !== "") {
			url += "&bp=" + appView.byId("bp").getSelectedKey();
		}
		if (appView.byId("lob").getSelectedKey() !== "") {
			url += "&lob=" + appView.byId("lob").getSelectedKey();
		}
		if (appView.byId("polygon").getValue() !== "") {
			url += "&polygon=" + appView.byId("polygon").getValue();
		}
		if (appView.byId("predict").getState() === true) {
			url += "&predict=1";
		}
		$.ajax({
			url: url,
			type: 'get',
			error: function (results) {
				console.log(results);
				sap.m.MessageBox.show(results.responseText,sap.m.MessageBox.Icon.ERROR,"Error",sap.m.MessageBox.Action.CLOSE);
			}, 
			success: function (results) {
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData(results);
				appView.byId("lossTriangle").setModel(oModel);
				appView.byId("claimPaymentAmount").setText(results.claimPaymentAmount.toLocaleString());
				appView.byId("premiumBeforeTax").setText(results.premiumBeforeTax.toLocaleString());
			}
		});

	}

});
