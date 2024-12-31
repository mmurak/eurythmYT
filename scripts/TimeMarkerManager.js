// Copyright (C) Masaaki Murakami
class TimeMarkerManager {
	constructor(clickCallback) {
		this.dataPool = [];
		this.clickCallback = clickCallback;
	}
	addData(sectionStart, sectionEnd, note) {
		this.dataPool.push([sectionStart, sectionEnd, note]);
	}
	modifyData(sectionStart, sectionEnd, node, note) {
		let idx = Number(node.id.replace("r", "")) - 1;
		this.dataPool[idx][2] = note;
	}
	deleteData(node) {
		let idx = Number(node.id.replace("r", "")) - 1;
		this.dataPool.splice(idx, 1);
	}
	buildTable(tableObj) {
		tableObj.innerHTML = "";
		let tNo = 1;
		for (let elem of this.dataPool) {
			let newRow = tableObj.insertRow(-1);
			newRow.id = "r" + tNo;

			// Play button cell
			let playCell = newRow.insertCell(0);
			let playCellA = document.createElement("input");
			playCellA.style = "vertical-align: text-top;";
			playCellA.type = "button";
			playCellA.value = "PLAY";
			playCellA.addEventListener("click", () => { this.clickCallback("ps", newRow); });
			playCell.appendChild(playCellA);

			// Start cell
			let cellZero = newRow.insertCell(1);
			cellZero.style.color = "blue";
			let startTime = document.createTextNode(convertTimeRep(elem[0]));
			cellZero.appendChild(startTime);

			// Dummy cell
			let cellDummy = newRow.insertCell(2);
			cellDummy.style.color = "blue";
			cellDummy.appendChild(document.createTextNode("〜"));

			// Stop cell
			let cellOne = newRow.insertCell(3);
			cellOne.style.color = "blue";
			let endTime = document.createTextNode(convertTimeRep(elem[1]));
			cellOne.appendChild(endTime);

			// Comment cell
			let cellTwo = newRow.insertCell(4);
			cellTwo.style = "width: 100em; padding: 0 0 0 10px;";
			let commentText = document.createElement("span");
			commentText.innerHTML = escaper(elem[2]);
			cellTwo.appendChild(commentText);

			// Edit button
			let editButton = newRow.insertCell(5);
			let editButtonAnchor = document.createElement("a");
			editButtonAnchor.addEventListener("click", () => { this.clickCallback("edit", newRow); });
			editButtonAnchor.innerHTML = "✍️";
			editButton.appendChild(editButtonAnchor);

			// Waste bin 🗑️
			let cellWaste = newRow.insertCell(6);
			let cellWasteAnchor = document.createElement("a");
			cellWasteAnchor.addEventListener("click", () => { this.clickCallback("del", newRow); });
			cellWasteAnchor.innerHTML = "🗑️";
			cellWaste.appendChild(cellWasteAnchor);

			tNo++;
		}
	}
	buttonDisabler(tableObj, flag) {
		for (let row of tableObj.rows) {
			row.cells[0].children[0].disabled = flag;
		}
	}
	eraseAllData(tableObj) {
		tableObj.innerHTML = "";
		this.dataPool = [];
	}
}
