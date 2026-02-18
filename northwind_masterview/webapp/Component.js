sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/core/util/MockServer",
    "northwindmasterview/model/models"
], function (UIComponent, MockServer, models) {
    "use strict";

    return UIComponent.extend("northwindmasterview.Component", {

        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init: function () {

            // 🔹 Create Mock Server
            var oMockServer = new MockServer({
                rootUri: "/northwind/"
            });

            // 🔹 Simulate using metadata.xml
            oMockServer.simulate("localService/metadata.xml", {
                sMockdataBaseUrl: "localService/mockdata",
                bGenerateMissingMockData: true
            });

            oMockServer.start();

            // 🔹 Call base init
            UIComponent.prototype.init.apply(this, arguments);

            // 🔹 Set device model
            this.setModel(models.createDeviceModel(), "device");

            // 🔹 Initialize router
            this.getRouter().initialize();
        },
        onInit: function () {
    var oModel = this.getOwnerComponent().getModel("northwind");
    console.log("Model:", oModel);

    oModel.attachRequestCompleted(function(oEvent){
        console.log("Request Completed:", oEvent.getParameter("url"));
    });

    oModel.attachRequestFailed(function(oEvent){
        console.error("Request Failed:", oEvent);
    });
}

    });
});