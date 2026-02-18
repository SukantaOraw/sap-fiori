sap.ui.define([
    "sap/ui/mdc/TableDelegate"
], function (TableDelegate) {
    "use strict";

    const CustomerTableDelegate = Object.assign({}, TableDelegate);

    CustomerTableDelegate.fetchProperties = async function () {
        return [
            { key: "CustomerID", label: "Customer ID", path: "CustomerID", dataType: "Edm.String" },
            { key: "CompanyName", label: "Company Name", path: "CompanyName", dataType: "Edm.String" },
            { key: "City", label: "City", path: "City", dataType: "Edm.String" },
            { key: "Country", label: "Country", path: "Country", dataType: "Edm.String" }
        ];
    };

    CustomerTableDelegate.updateBindingInfo = function (oTable, oBindingInfo) {
        TableDelegate.updateBindingInfo.call(this, oTable, oBindingInfo);
        oBindingInfo.path = oTable.getPayload().bindingPath;
    };

    return CustomerTableDelegate;
});
