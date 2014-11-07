jQuery.sap.declare("view.formatter");

view.formatter = {

	Number:  function (number) {
		try {
			return number.toLocaleString();
		} catch (err) {
			return number;
		}
	},

	DState:  function (state) {
		try {
			if (state === "P") {
				return "Success";
			} else {
				return "None";
			}
		} catch (err) {
			return "None";
		}
	}

};
