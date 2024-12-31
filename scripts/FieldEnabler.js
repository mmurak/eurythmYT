class FieldEnabler {
	constructor(fieldNameArray) {
		this.fieldNameArray = fieldNameArray;
		this.fieldNameArray.forEach((fName) => {
			document.getElementById(fName).disabled = true;
		});
	}
	setEnable(fields) {
		this.fieldNameArray.forEach((fName) => {
			document.getElementById(fName).disabled = !fields.includes(fName);
		});
	}
}

