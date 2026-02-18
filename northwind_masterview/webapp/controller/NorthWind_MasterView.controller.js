sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog", // 🔹 Import BusyDialog
  ],
  function (Controller, JSONModel, BusyDialog) {
    "use strict";

    return Controller.extend(
      "northwindmasterview.controller.NorthWind_MasterView",
      {
        /* ===================== */
        /* INIT - LOAD CUSTOMERS */
        /* ===================== */
        onInit: function () {
          console.log("NorthWind_MasterView loaded");

          // 🔹 1. SHOW BUSY DIALOG IMMEDIATELY
          this._showBusyDialog();

          fetch("/northwind/Northwind.svc/Customers?$format=json")
            .then((response) => response.json())
            .then(
              function (data) {
                // console.log("Customers loaded:", data.value);

                var oCustomerModel = new JSONModel();
                oCustomerModel.setData(data.value);

                this.getView().setModel(oCustomerModel, "customersModel");

                // 🔹 2. HIDE BUSY DIALOG ON SUCCESS
                this._closeBusyDialog();
              }.bind(this),
            )
            .catch(function (err) {
              console.error("Customer fetch failed:", err);
              // 🔹 3. HIDE BUSY DIALOG ON ERROR
              this._closeBusyDialog();
            });
        },

        /* ========================= */
        /* ORDERS BUTTON IN MASTER  */
        /* ========================= */
        handleOrdersPress: function (oEvent) {
          var oButton = oEvent.getSource();
          var oContext = oButton.getBindingContext("customersModel");

          if (!oContext) {
            console.log("No binding context found");
            return;
          }

          var sCustomerID = oContext.getObject().CustomerID;

          console.log("Orders pressed for:", sCustomerID);

          // 🔹 Reset Layout: Show Orders, HIDE Items (clean slate)
            this.byId("ordersPage").setVisible(true);
            this.byId("itemsPage").setVisible(false);

          // 🔹 OPEN BUSY DIALOG HERE
          this._showBusyDialog();

          this._loadCustomerOrders(sCustomerID);
        },

        /* ===================== */
        /* LOAD ORDERS FUNCTION  */
        /* ===================== */
        _loadCustomerOrders: function (sCustomerID) {
          // Fetch Order -> Order_Details -> Product
          var sUrl =
            "/northwind/Northwind.svc/Customers('" +
            sCustomerID +
            "')?$expand=Orders/Order_Details/Product&$format=json";

          fetch(sUrl)
            .then((response) => response.json())
            .then(
              function (data) {
                // 1. Get the Customer object (Handle OData V2 'd' wrapper)
                var oCustomer = data.d || data;

                // 2. Handle Orders Array (Handle OData V2 'results' wrapper)
                var rawOrders = oCustomer.Orders
                  ? oCustomer.Orders.results || oCustomer.Orders
                  : [];

                var aProcessedOrders = [];

                if (Array.isArray(rawOrders)) {
                  rawOrders.forEach(function (oOrder) {
                    // 3. Handle Order_Details Array (Handle 'results' wrapper)
                    // We are NOT flattening. We are just ensuring it's a clean Array.
                    var rawDetails = oOrder.Order_Details
                      ? oOrder.Order_Details.results || oOrder.Order_Details
                      : [];

                    aProcessedOrders.push({
                      OrderID: oOrder.OrderID,
                      OrderDate: oOrder.OrderDate,
                      // 🔹 KEY CHANGE: We pass the raw 'Order_Details' array directly.
                      // We do NOT map it to a new structure.
                      Order_Details: rawDetails,
                    });
                  });
                }

                var oOrderModel = new JSONModel({
                  CustomerName: oCustomer.CompanyName,
                  Orders: aProcessedOrders,
                });

                this.getView().setModel(oOrderModel, "orderModel");

                // 🔹 CLOSE DIALOG ON SUCCESS
                this._closeBusyDialog();

                // 🔹 1. REVEAL THE SPLITTER (Make Orders Page Visible)
                var oOrdersPage = this.byId("ordersPage");

                // Check if it's already visible to avoid unnecessary layout calculations
                if (!oOrdersPage.getVisible()) {
                  oOrdersPage.setVisible(true);
                }
              }.bind(this),
            )
            .catch(function (err) {
              console.error("Order fetch failed:", err);

              // 🔹 CLOSE DIALOG ON SUCCESS
              this._closeBusyDialog();
            });
        },
        /* ========================== */
        /* SHOW PRODUCTS ON CLICK     */
        /* ========================== */
        onOrderPress: function (oEvent) {
          var oItem = oEvent.getSource();
          var oContext = oItem.getBindingContext("orderModel");

          // Get the products from the selected order
          // var aProducts = oContext.getProperty("Order_Details");

          if (!this._oPopover) {
            this._oPopover = new sap.m.ResponsivePopover({
              title: "Order Items",
              placement: "Right",
              // contentWidth: "300px",
              content: new sap.m.List({
                items: {
                  path: "orderModel>Order_Details",
                  template: new sap.m.StandardListItem({
                    title: "{orderModel>Product/ProductName}",
                    description: "Qty: {orderModel>Quantity}",
                    icon: "sap-icon://product",
                    info: "Price: {orderModel>UnitPrice}",
                    infoState: "Success",
                  }),
                },
              }),
            });
            this.getView().addDependent(this._oPopover);
          }

          // Bind the popover to the specific order clicked
          this._oPopover.bindElement({
            path: oContext.getPath(),
            model: "orderModel",
          });

          this._oPopover.openBy(oItem);
        },
        /* ========================== */
        /* SHOW ITEMS IN 3RD PAGE     */
        /* ========================== */
        onOrderPress: function (oEvent) {
          var oItem = oEvent.getSource();
          var oContext = oItem.getBindingContext("orderModel");

          // 1. Get Data from the selected row
          var sOrderID = oContext.getProperty("OrderID");
          var aOrderDetails = oContext.getProperty("Order_Details");

          // 2. Create a specific model for the Items Page
          var oItemsModel = new JSONModel({
            OrderID: sOrderID,
            Order_Details: aOrderDetails,
          });
          this.getView().setModel(oItemsModel, "itemsModel");

          // 3. Reveal the Items Page (if hidden)
          var oItemsPage = this.byId("itemsPage");
          if (!oItemsPage.getVisible()) {
            oItemsPage.setVisible(true);
          }
        },
        /* ========================== */
        /* HELPER: SHOW BUSY DIALOG   */
        /* ========================== */
        _showBusyDialog: function () {
          if (!this._pBusyDialog) {
            this._pBusyDialog = new BusyDialog({
              title: "Loading Data",
              text: "Please wait while we fetch the data...",
            });
          }
          this._pBusyDialog.open();
        },

        /* ========================== */
        /* HELPER: CLOSE BUSY DIALOG  */
        /* ========================== */
        _closeBusyDialog: function () {
          if (this._pBusyDialog) {
            this._pBusyDialog.close();
          }
        },
      },
    );
  },
);
