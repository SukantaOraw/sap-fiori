/*global QUnit*/

sap.ui.define([
	"northwindmasterview/controller/NorthWind_MasterView.controller"
], function (Controller) {
	"use strict";

	QUnit.module("NorthWind_MasterView Controller");

	QUnit.test("I should test the NorthWind_MasterView controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
