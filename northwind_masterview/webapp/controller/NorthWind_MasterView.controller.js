sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog", // 🔹 Import BusyDialog
    "sap/ui/core/Theming", // ✅ Import Theming
    "sap/ui/core/Configuration", // ✅ Import this to handle languages
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  function (Controller, JSONModel, BusyDialog, Theming, Configuration, Filter, FilterOperator,) {
    "use strict";

    return Controller.extend(
      "northwindmasterview.controller.NorthWind_MasterView",
      {
        /* ===================== */
        /* INIT - LOAD CUSTOMERS */
        /* ===================== */
        onInit: function () {
          // 🔹 1. SHOW BUSY DIALOG IMMEDIATELY
          this._showBusyDialog();
          console.log("NorthWind_MasterView loaded");

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

        /* ================================================= */
        /* CHANGE LANGUAGE                                   */
        /* ================================================= */
        onChangeLanguage: function (oEvent) {
          // 1. Get the key of the selected item ('en' or 'hi')
          var sLanguage = oEvent.getParameter("selectedItem").getKey();

          // 2. Tell the UI5 framework to switch the language instantly
          Configuration.setLanguage(sLanguage);
        },

        /* ================================================= */
        /* TOGGLE DARK / LIGHT MODE                          */
        /* ================================================= */
        onThemeTogglePress: function (oEvent) {
          var oButton = oEvent.getSource();

          // Check current theme
          // (If you are on an older UI5 version < 1.100, use sap.ui.getCore().getConfiguration().getTheme())
          var sCurrentTheme = Theming.getTheme();

          if (sCurrentTheme === "sap_fiori_3_dark") {
            // Switch to Light
            Theming.setTheme("sap_fiori_3");
            oButton.setIcon("sap-icon://light-mode");
          } else {
            // Switch to Dark
            Theming.setTheme("sap_fiori_3_dark");
            oButton.setIcon("sap-icon://dark-mode"); // Change icon to moon/dark
          }
        },

        /* ================================================= */
        /* USER AVATAR PRESS (Toggle Menu)                   */
        /* ================================================= */
        onUserAvatarPress: function (oEvent) {
          var oAvatar = oEvent.getSource();

          // 1. Create the User Menu (ActionSheet) if it doesn't exist yet
          if (!this._oUserMenu) {
            this._oUserMenu = new ActionSheet({
              showCancelButton: false,
              placement: "Bottom",
              buttons: [
                new Button({
                  text: "User Profile",
                  icon: "sap-icon://person-placeholder",
                  press: function () {
                    MessageToast.show("Profile Clicked");
                  },
                }),
                new Button({
                  text: "App Settings",
                  icon: "sap-icon://action-settings",
                  press: function () {
                    MessageToast.show("Settings Clicked");
                  },
                }),
                new Button({
                  text: "Logout",
                  icon: "sap-icon://log",
                  type: "Reject",
                  press: function () {
                    MessageToast.show("Logged Out");
                  },
                }),
              ],
              // 🔹 Reset state when closed
              afterClose: function () {
                // Optional: If you had a custom "active" style, remove it here
              },
            });
            this.getView().addDependent(this._oUserMenu);
          }

          // 2. Open the menu by the Avatar
          this._oUserMenu.openBy(oAvatar);
        },

        // Toggle the Side Navigation (Open/Close)
        onCollapseExpandPress: function () {
          var oToolPage = this.byId("toolPage");
          var bSideExpanded = oToolPage.getSideExpanded();
          oToolPage.setSideExpanded(!bSideExpanded);
        },

        onSearchCustomers: function (oEvent) {
          // 1. Get the text the user typed
          var sQuery = oEvent.getSource().getValue();
          var aFilters = [];

          // 2. If the search box is NOT empty, create the filter
          if (sQuery && sQuery.length > 0) {
            // Create a filter: "Does the CompanyName contain the typed text?"
            // Note: FilterOperator.Contains is usually case-sensitive.
            var oFilter = new Filter(
              "CompanyName",
              FilterOperator.Contains,
              sQuery,
            );

            aFilters.push(oFilter);
            // console.log(oFilter);

            /* 💡 PRO-TIP: Want to search by Company Name OR Contact Name? Use this instead: */

            // var oFilterName = new Filter(
            //   "CompanyName",
            //   FilterOperator.Contains,
            //   sQuery,
            // );
            // var oFilterContact = new Filter(
            //   "ContactName",
            //   FilterOperator.Contains,
            //   sQuery,
            // );
            // var oCombinedFilter = new Filter({
            //   filters: [oFilterName, oFilterContact],
            //   and: false, // 'false' means OR. 'true' means AND.
            // });
            // aFilters.push(oCombinedFilter);
            // console.log(oCombinedFilter);
          }

          // 3. Find the List on the screen and apply the filter
          // ⚠️ IMPORTANT: Change "customersList" to the actual ID of your <List> in the XML View
          var oList = this.byId("customersList");

          // Get the data binding attached to the list
          var oBinding = oList.getBinding("items");

          // Apply the filter.
          // If aFilters is empty (user deleted the text), this automatically resets the list!
          oBinding.filter(aFilters);
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
          console.log(oItemsModel);

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
              title: "{i18n>loadingData}",
              text: "{i18n>loadingText}",
            });
          }
          this._pBusyDialog.open();
          // MAGIC TRICK: Connect the dialog to the view so it can read the i18n file
          this.getView().addDependent(this._pBusyDialog);
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
