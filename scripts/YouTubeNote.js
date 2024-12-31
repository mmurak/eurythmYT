// Copyright (C) Masaaki Murakami
/*
 * Globals
 */
class GlobalManager {
	constructor() {
		this.inputIdButton = document.getElementById("InputIdButton");	// Input ID button
		this.idArea = document.getElementById("IdArea");				// Content id area (span)
		this.leftSection = document.getElementById("LeftSection");
		this.monitorArea = document.getElementById("MonitorArea");
		this.outerFrame = document.getElementById("OuterFrame");
		this.player = document.getElementById("Player");		// A place holder for YTPlayer
		this.mask = document.getElementById("Mask");
		this.progress = document.getElementById('Progress');
		this.progressBar = document.getElementById('Progress-bar');
		this.speedControl = document.getElementById("SpeedControl");
		this.speedResetButton = document.getElementById("SpeedResetButton");
		this.leftArrowButton = document.getElementById("LeftArrowButton");
		this.jumpSelector = document.getElementById("JumpSelector");
		this.rightArrowButton = document.getElementById("RightArrowButton");
		this.fontSize = document.getElementById("FontSize");

		this.playPauseButton = document.getElementById("PlayPauseButton");		// Play/Pause Button
		this.pressPlayButton = document.getElementById("PressPlayButton");		// Press play Button
		this.aButton = document.getElementById("AButton");
		this.bButton = document.getElementById("BButton");
		this.loopCheckBox = document.getElementById("LoopCheckBox");
		this.oneTouchButton  = document.getElementById("OneTouchButton");		// 1 touch AB reg.
		this.wholeArea = document.getElementById("wholeArea");	// A-B data area wrapper
		this.dataArea = document.getElementById("dataArea");		// A-B data area

		this.inPartialPlay = false;

		this.descDialog = document.getElementById("DescDialog");
		this.descArea = document.getElementById("DescArea");
		this.descOkButton = document.getElementById("DescOkButton");

		this.YTPlayer = null;		// YouTube iFrame player instance
		this.vid = null;

		this.timer = null;
		this.duration = 0;		// Duration holder

		this.markedTime = 0.0;		// Start point marker for the Press play function
		this.markedEndTime = 0.0;		// End point marker for the One-touch AB reg. function

		this.waitTimerForPressPlay = null;

		this.backingSpeed = 1;
		this.speedList = [ "1" ];
		this.speedListDefaultPtr = 0;
		this.speedListCurrentPtr = 0;
		this.storedSpeedListPtr = 0;

		this.timeMarkerManager = new TimeMarkerManager(abControl);
		this.sectionStart = 0;
		this.sectionEnd = 0;
		this.playStartMark = 0;
		this.playEndMark = 0;

		this.parameterMgr = new ParameterManager();
		this.fieldEnabler = new FieldEnabler(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox", "OneTouchButton"]);
	}
}

let G = new GlobalManager();
G.fieldEnabler.setEnable(["JumpSelector", "FontSize"]);
loadAPI();
G.dataArea.style = "font-size:" + G.fontSize.value + "px";


// Invoked when ID button is clicked
G.inputIdButton.addEventListener("click", (e) => {
	loadVideoButton();
}, false);

// Invoked when "Tap to Play" button is clicked
G.playPauseButton.addEventListener("click", (e) => {
	playPause();
}, false);

// Invoked when "Press to Play" button is pressed
G.pressPlayButton.addEventListener("mousedown", (e) => {
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) return;		// ignore if already playing
	G.waitTimerForPressPlay = setTimeout(() => {		// to prevent simple click confusion
		pressPlayDown();
	}, 200);
});
////////// PressPlay function - mouse down    Mark the start time to G.markedTime//////////
function pressPlayDown() {
	G.waitTimerForPressPlay = null;
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) return;		// Is it necessary?
	G.markedTime = G.YTPlayer.getCurrentTime();
	G.playEndMark = 999999.99;
	G.YTPlayer.loadVideoById(	{'videoId': G.vid, 'startSeconds': G.markedTime});
	surePlay();
	G.pressPlayButton.style = "background-color: red;";
	G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PressPlayButton", ]);
	G.waitTimerForPressPlay = null;
}

// Invoked when Press play button is released
G.pressPlayButton.addEventListener("mouseup", (e) => {
	if (G.waitTimerForPressPlay != null) {
		clearTimeout(G.waitTimerForPressPlay);
		G.waitTimerForPressPlay = null;
	}
	pressPlayUp();
});
////////// PressPlay function - mouse up //////////
function pressPlayUp() {
	G.YTPlayer.pauseVideo();
	if (G.markedTime == G.YTPlayer.getCurrentTime())  return;	// It's the answer for the mouse-up and then blur problem
	G.markedEndTime = G.YTPlayer.getCurrentTime();
	G.pressPlayButton.innerHTML = "Press to Play<br>"
		+ convertTimeRep(G.markedTime) 
		+ " → " 
		+ convertTimeRep(G.markedEndTime);
	G.pressPlayButton.style = "background-color: #668ad8;";
	G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox", "OneTouchButton"]);	
	G.YTPlayer.cueVideoById({'videoId': G.vid, 'startSeconds': G.markedTime});
}

// Invoked when Press play button is blurred
G.pressPlayButton.addEventListener("blur", (e) => {
	pressPlayUp();
});

G.oneTouchButton.addEventListener("click", (e) => {
	if (G.markedTime >= G.markedEndTime)  return;
	G.sectionStart = G.markedTime;
	G.sectionEnd = G.markedEndTime;
	if (e.shiftKey) {
		G.descArea.value = "";
		G.editMode = false;
		G.descDialog.style = "display: block;";
		G.descArea.focus();
	} else {
		G.timeMarkerManager.addData(G.markedTime, G.markedEndTime, "");
		G.timeMarkerManager.buildTable(G.dataArea);
		if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
			G.timeMarkerManager.buttonDisabler(G.dataArea, true);
		}
	}
	G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox"]);	
});

// Invoked when the event masking has happened
G.mask.addEventListener("click", (e) => {
	if (G.vid == null)  return;
	playPause();
	e.stopPropagation();
},  true);

// Invoked when something bad has happened
G.player.addEventListener("click", (e) => {
}, false);

// Invoked when the progress bar is clicked
G.progress.addEventListener('click', (e) => {
	if (G.vid == null)  return;
	let pos = (e.pageX  - (G.progress.offsetLeft + G.progress.offsetParent.offsetLeft)) / G.progress.offsetWidth;
	const sPoint = pos * G.duration;
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
		G.YTPlayer.seekTo(sPoint);
	} else {
		G.YTPlayer.cueVideoById({'videoId': G.vid, 'startSeconds': sPoint});
	}
	const crTime = convertTimeRep(sPoint);
	G.playPauseButton.innerHTML = "Tap to Play<br>" + crTime + " → ";
	G.pressPlayButton.innerHTML = "Press to Play<br>" + crTime 	+ " → " + crTime;
	G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox"]);
	monitor();
});

// Invoked when speed dropdown is operated
G.speedControl.addEventListener("input", (e) => {
	const sp = Number(G.speedControl.value);
	G.backingSpeed = sp;
	G.YTPlayer.setPlaybackRate(sp);
});

// Invoked when speed reset button is clicked
G.speedResetButton.addEventListener("click", (e) => {
	speedReset();
});
////////// Speed Reset function //////////
function speedReset() {
	const speed = G.YTPlayer.getPlaybackRate();
	if (speed != 1) {
		G.speedResetButton.value = G.backingSpeed + "x Speed";
		G.YTPlayer.setPlaybackRate(1);
	} else {
		G.speedResetButton.value = "1x Speed";
		G.YTPlayer.setPlaybackRate(G.backingSpeed);
	}
}

// Invoked when the widget got the focus
G.speedControl.addEventListener("focus", (e) => {
	G.speedControl.blur();
});

// Invoked when the widget got the focus
G.jumpSelector.addEventListener("focus", (e) => {
	G.jumpSelector.blur();
});

// Invoked when Left-Arrow button is clicked
G.leftArrowButton.addEventListener("click", (e) => {
	pointMover(-Number(G.jumpSelector[G.jumpSelector.selectedIndex].value));
});

// Invoked when Right-Arrow button is clicked
G.rightArrowButton.addEventListener("click", (e) => {
	pointMover(Number(G.jumpSelector[G.jumpSelector.selectedIndex].value));
});

// Invoked when the A-button is clicked
G.aButton.addEventListener("click", (e) => {
	markSectionStart();
});

// Invoked when the B-button is clicked
G.bButton.addEventListener("click", (e) => {
	if (e.shiftKey) {
		markSectionEndWithText();
	} else {
		markSectionEndWithoutText();
	}
});

// Invoked when the OK button (dialog box) is clicked
G.descOkButton.addEventListener("click", () => { processDescOk(); });

// Invoked when the window has resized
window.addEventListener("resize", (e) => {
	resizeWindow();
}, false);

G.fontSize.addEventListener("focus", (evt) => {
	G.fontSize.value = "";
});

G.fontSize.addEventListener("change", (evt) => {
	G.dataArea.style = "font-size:" + G.fontSize.value + "px";
	G.fontSize.blur();
});


// Keyboard input events
document.addEventListener("keydown", (e) => {
	if ((G.descDialog.style.display == "block") || (G.vid == null)) return;
	switch (e.key) {
		case " " :
			playPause();
			e.preventDefault();
			break;
		case "Meta" :
			pressPlayDown();
			break;
		case "ArrowUp" :
			const upIndex = G.speedControl.selectedIndex - 1;
			if (upIndex < 0)  return;
			const upSpeed = Number(G.speedControl[upIndex].value);
			G.YTPlayer.setPlaybackRate(upSpeed);
			G.backingSpeed = upSpeed;
			G.speedResetButton.value = "1x Speed";
			break;
		case "ArrowDown" :
			const downIndex = G.speedControl.selectedIndex + 1;
			if (downIndex >= G.speedControl.length)  return;
//			G.speedControl[upIndex].selected = true;
			const downSpeed = Number(G.speedControl[downIndex].value);
			G.YTPlayer.setPlaybackRate(downSpeed);
			G.backingSpeed = downSpeed;
			G.speedResetButton.value = "1x Speed";
			break;
		case "ArrowLeft" :
			pointMover(-Number(G.jumpSelector[G.jumpSelector.selectedIndex].value));
			break;
		case "ArrowRight" :
			pointMover(Number(G.jumpSelector[G.jumpSelector.selectedIndex].value));
			break;
		case "d" :
		case "D" :
			speedReset();
			break;
		case "v" :
		case "V" :
			changeLRbalance();
			break;
		case "a" :
		case "A" :
			markSectionStart();
			break;
		case "b" :
			markSectionEndWithoutText();
			break;
		case "B" :
			markSectionEndWithText();
			break;
	}
	e.stopPropagation();
	e.preventDefault();
}, true);

//
document.addEventListener("keyup", (e) => {
	if (e.key == "Meta") {
		pressPlayUp();
	}
});


/*
 * YouTube iFrame API fiunctions
 */
function loadAPI() {
// Load API
	let scriptElement = document.createElement('script');
	scriptElement.id = "YouTubeIframeAPI";
	scriptElement.src = "https://www.youtube.com/iframe_api";
	let firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(scriptElement, firstScriptTag);
}

// Setup player (This function would be called by YouTube iFrame API)
function onYouTubeIframeAPIReady() {
	let dimension = Math.trunc(document.documentElement.clientWidth * G.parameterMgr.get("vratio") / 100);
	G.YTPlayer = new YT.Player('Player', {
		height: dimension,
		width: dimension,
		playerVars: { 
			'autoplay': 0,
			'cc_lang_pref': 'eng',
			'controls': 1,
			'disablekb': 1,
			'enablejsapi': 1,
		},
		events: {
			"onStateChange": onPlayerStateChange,
			"onPlaybackRateChange": onPlaybackRateChange,
		},
	});
	resizeWindow();
}

function clearMonitor() {
	if (G.timer != null) {
		clearInterval(G.timer);
		G.timer = null;
	}
}

function onPlayerStateChange(e) {
	if (e.data == YT.PlayerState.PAUSED) {
		playerPaused();
	} else if (e.data == YT.PlayerState.ENDED) {
		playerPaused();
		G.YTPlayer.cueVideoById({'videoId': G.vid, 'startSeconds': 0});
	} else if (e.data == YT.PlayerState.PLAYING) {
		clearMonitor();		// Just an insurance
		G.timer = setInterval(monitor, 100);
		G.timeMarkerManager.buttonDisabler(G.dataArea, true);
	} else if (e.data == YT.PlayerState.CUED) {
		buildUpSpeedControl();
		monitor();
	}
}

function playerPaused() {
	clearMonitor();
	G.timeMarkerManager.buttonDisabler(G.dataArea, false);
}

function buildUpSpeedControl() {
	G.speedControl.innerHTML = "";
	G.speedList = G.YTPlayer.getAvailablePlaybackRates();
	let defaultPtr = 0;
	for (let it of G.speedList.reverse()) {
		let obj = document.createElement("option");
		obj.value = it;
		obj.textContent = it;
		if (it == 1) {
			obj.selected = true;
			G.speedListDefaultPtr = defaultPtr;
			G.speedListCurrentPtr = defaultPtr;
			G.storedSpeedListPtr = defaultPtr;
		}
		defaultPtr++;
		G.speedControl.appendChild(obj);
	}
}

// Functions
function resizeWindow() {
	let dimension = Math.trunc(document.documentElement.clientWidth * G.parameterMgr.get("vratio") / 100);
//	G.outerFrame.style = "width: " + dimension + "px;";
	G.YTPlayer.setSize(dimension, dimension);
	G.player.style = "width:" + dimension + "px;height:" + dimension + "px;";
	G.player.style.zIndex = 100;
	G.progress.style = "width:" + dimension + "px;";
	G.mask.style = "width:" + dimension + "px;height:" + dimension + "px;";
	G.mask.style.zIndex = 200;
}

function pointMover(sec) {
	let newTime = G.YTPlayer.getCurrentTime() + sec;
	if (newTime < 0) newTime = 0;
	if (newTime > G.duration)  newTime = G.duration;
	const crTime = convertTimeRep(newTime);
	G.playPauseButton.innerHTML = "Tap to Play<br>" + crTime + " → ";
	G.pressPlayButton.innerHTML = "Press to Play<br>" + crTime 	+ " → " + crTime;
//	G.YTPlayer.cueVideoById({'videoId': G.vid, 'startSeconds': newTime});
//	G.YTPlayer.seekTo(newTime);
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
		G.YTPlayer.seekTo(newTime);
	} else {
		G.YTPlayer.cueVideoById({'videoId': G.vid, 'startSeconds': newTime});
	}
	G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox"]);
}


function youtubeParser(url){  
// This regex was described on https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
	let regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
	let match = url.match(regExp);
	return (match&&match[7].length==11)? match[7] : false;
}

/*
 * User Interface functions
 */
function loadVideoButton() {
	let vid = prompt("Enter YouTube video identifier", "TKQ2K04E4SA");
	if (vid == null) return;
	if (vid.length != 11) {
		vid = youtubeParser(vid);
	}
	if (vid.length != 11) {
		alert("Video ID parse error. '" + vid + "'");
		return;
	}
	G.idArea.innerHTML = vid;
	G.vid = vid;

	G.YTPlayer.cueVideoById({'videoId': G.vid, 'startSeconds': 0});
	sureGetDuration();		// This function sets G.duration
	G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox"]);
	G.timeMarkerManager.eraseAllData(G.dataArea);
}

function playPause() { // from constructor of GlobalManager event setting
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {		// means Pause command
		G.YTPlayer.pauseVideo();
		const crTime = convertTimeRep(G.YTPlayer.getCurrentTime());
		G.playPauseButton.innerHTML = "Tap to Play<br>" + crTime + " → ";
		G.pressPlayButton.innerHTML = "Press to Play<br>" + crTime 	+ " → " + crTime;
		G.playPauseButton.style = "background-color: #339270;";
		G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox"]);
	} else {					// means Play command
		G.playEndMark = 999999.99;
		const cTime = G.YTPlayer.getCurrentTime();
		G.YTPlayer.loadVideoById(	{'videoId': G.vid, 'startSeconds': cTime});
		surePlay();
		G.playPauseButton.innerHTML = "Tap to Pause<br>" + convertTimeRep(cTime) + " → ";
		G.playPauseButton.style = "background-color: red;";
		G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "AButton", "BButton", "LoopCheckBox"]);
	}
}


function convertTimeRep(time) {
	let formattedTime = [
		Math.floor(time / 60), // minutes
		Math.floor(time % 60), // seconds
	].map((v) => (v < 10 ? '0' + v : v)).join(':');
	formattedTime += "." + ("" + Math.trunc(time * 10) % 10).padStart(1, "0");
	return formattedTime;
}

function monitor() {
	if ((G.YTPlayer == null) || (G.YTPlayer.getCurrentTime == void 0)) return;
	let cTime = G.YTPlayer.getCurrentTime();
	if (cTime == void 0) {
		cTime = 0;
	}
//	G.duration = G.YTPlayer.getDuration();
	if ((cTime != void 0) && (G.duration != void 0)) {
		G.monitorArea.innerHTML = convertTimeRep(cTime) + " / " + convertTimeRep(G.duration);

		G.progress.setAttribute('max', G.duration);
		G.progress.value = cTime;
		G.progressBar.style.width = Math.floor((cTime / G.duration) * 100) + '%';
	}
	if (cTime > G.playEndMark) {
		G.YTPlayer.pauseVideo();
		if (G.inPartialPlay && G.loopCheckBox.checked == true) {
			G.YTPlayer.seekTo(G.playStartMark);
			surePlay();
		} else {
			G.inPartialPlay = false;
		G.playPauseButton.style = "background-color: #339270;";
		G.fieldEnabler.setEnable(["Progress-bar", "SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "PressPlayButton", "AButton", "BButton", "LoopCheckBox"]);
		}
	}
}

function onPlaybackRateChange() {
	const newRate = G.YTPlayer.getPlaybackRate();
	if (newRate != 1) {
//		G.backingSpeed = newRate;
///		G.speedResetButton.value = "1x Speed";
	} else {
///		G.speedResetButton.value = newRate + "x Speed";
	}
	let i = 0;
	while (i < G.speedList.length) {
		if (G.speedList[i] == newRate) {
			break;
		}
		i++;
	}
	if (i < G.speedList.length) {
		G.speedControl[i].selected = true;
	}
}

function changeLRbalance() {
	let inp = prompt("Enter left ratio (10〜90)", G.parameterMgr.get("vratio"));
	if (inp.match(/^\d+$/) && ((inp >= 10) && (inp <= 90))) {
		G.parameterMgr.set("vratio", inp);
		resizeWindow();
	}
}



function markSectionStart() {
	G.sectionStart = G.YTPlayer.getCurrentTime();
	G.aButton.value = convertTimeRep(G.sectionStart) + " →";
}

function markSectionEndWithoutText() {
	const currentTime = G.YTPlayer.getCurrentTime();
	if (currentTime <= G.sectionStart)  return;
	G.aButton.value = "A";
	G.sectionEnd = currentTime;
	G.timeMarkerManager.addData(G.sectionStart, G.sectionEnd, "");
	G.timeMarkerManager.buildTable(G.dataArea);
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
		G.timeMarkerManager.buttonDisabler(G.dataArea, true);
	}
}

function markSectionEndWithText() {
	const currentTime = G.YTPlayer.getCurrentTime();
	if (currentTime <= G.sectionStart)  return;
	G.aButton.value = "A";
	G.sectionEnd = currentTime;
	G.descArea.value = "";
	G.editMode = false;
	G.descDialog.style = "display: block;";
	G.descArea.focus();
}

function processDescOk() {
	if (G.editMode) {
		G.timeMarkerManager.modifyData(G.sectionStart, G.sectionEnd, G.edittingNode, G.descArea.value);
	} else {
		G.timeMarkerManager.addData(G.sectionStart, G.sectionEnd, G.descArea.value);
	}
	G.timeMarkerManager.buildTable(G.dataArea);
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING) {
		G.timeMarkerManager.buttonDisabler(G.dataArea, true);
	}
	G.descDialog.style = "display: none;";
	G.aButton.value = "A";
}

function timeRepToSec(str) {
	const seg = str.split(":");
	return Number(seg[0]) * 60 + Number(seg[1]);
}

function escaper(str) {
	return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
}

function abControl(command, node) {
	if (G.YTPlayer.getPlayerState() == YT.PlayerState.PLAYING)  return;
	if (command == "del") {
		G.timeMarkerManager.deleteData(node);
		G.timeMarkerManager.buildTable(G.dataArea);
	} else if (command == "edit") {
		G.sectionStart = node.cells[1];
		G.sectionEnd = node.cells[3];
		let text = recoverer(node.cells[4].firstChild.innerHTML);
		G.descArea.value = text;
		G.editMode = true;
		G.edittingNode = node;
		G.descDialog.style = "display: block;";
		G.descArea.focus();
	} else {		// Partial Play
		G.playStartMark = Number(timeRepToSec(node.cells[1].innerHTML));
		G.YTPlayer.seekTo(G.playStartMark);
		G.playEndMark =  Number(timeRepToSec(node.cells[3].innerHTML));
		G.inPartialPlay = true;
		G.timeMarkerManager.buttonDisabler(G.dataArea, true);
		surePlay();
		G.playPauseButton.style = "background-color: red;";
		G.fieldEnabler.setEnable(["SpeedControl", "SpeedResetButton", "LeftArrowButton", "JumpSelector", "RightArrowButton", "FontSize", "PlayPauseButton", "LoopCheckBox"]);
	}
}

function escaper(str) {
	return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>");
}

function recoverer(str) {
	return str.replaceAll("<br>", "\n").replaceAll("&gt;", ">").replaceAll("&lt;", "<").replaceAll("&amp;", "&");
}

async function sureGetDuration() {
	let duration;
	while(true) {
		duration = G.YTPlayer.getDuration();
		if ((duration !== void 0) && Number(duration)) {
			break;
		}
		await wait(100);
	}
	G.duration = duration;
	G.monitorArea.innerHTML = convertTimeRep(0) + " / " + convertTimeRep(G.duration);
}

function surePlay() {
	waitTillPrepared();
	G.YTPlayer.playVideo();
}

async function waitTillPrepared() {
	while(true) {
		let status = G.YTPlayer.getPlayerState();
		if ((status !== void 0) && status != YT.PlayerState.BUFFERING) {
			break;
		}
		await wait(100);
	}
}

async function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
