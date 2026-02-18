/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["northwindmasterview/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
