// Copyright (C) Masaaki Murakami
class ParameterManager {
	constructor() {
		this.database = {
			"vratio": "40",
			"tsize": "20",
//			"pause": "0.2",
		};
		const argLine = location.search.substring(1);
		if (argLine != "") {
			const args = argLine.split("&");
			for (let arg of args) {
				const pair = arg.split("=");
				this.database[pair[0]] = pair[1];
			}
		}
	}
	get(key) {
		if (key in this.database) {
			return this.database[key];
		} else {
			return "";
		}
	}
	set(key, value) {
		this.database[key] = value;
	}
}
