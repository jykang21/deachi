let videoEnter; // 입장화면의 video태그
let videoSetting; // 세팅화면의 video태그
let earlySetting = true;

let audioOutputValue; // 설정 안거치고 입장했을때 default값을 담기위한 변수
let audioInputValue; // 설정 안거치고 입장했을때 default값을 담기위한 변수
let videoSourceValue; // 설정 안거치고 입장했을때 default값을 담기위한 변수

let commitRole = 'enter';


audioElement.src = "/live/wav/Alarm01.wav";
$(document).ready(function () {
	videoEnter = document.querySelector('#videoEnter'); // 입장런처 video태그
	videoSetting = document.querySelector('#videoSetting'); // 설정화면 video태그
	audioInputSelect = document.querySelector('select#audio-input'); // 마이크 select태그
	audioOutputSelect = document.querySelector('select#audio-output');// 스피커 select태그
	videoSelect = document.querySelector('select#video-source');// 비디오 select태그
	selectors = [audioInputSelect, audioOutputSelect, videoSelect];
	// 두 개의 비디오 태그 스타일 설정
	videoEnter.style.width = '100%';
	videoSetting.style.width = '100%';
	videoEnter.style.objectFit = 'cover';
	videoSetting.style.objectFit = 'cover';
	// 적용
	entStart();
	
	// 학생인경우 강의시작된 경우 타이머돌려 5분이상 지속된경우 경고발생
	if(userLevel == '2001'){
		
	}
	
	// 설정 버튼 클릭했을때 (이태우 ) _ 03/09 새로 작업
	document.getElementById('settingBtn').addEventListener('click',function(){
		// 입장런처 == none , 세팅화면 == block
		document.getElementById('playerSetting').style.display = 'block';
		document.getElementById('playerEnter').style.display = 'none';
		earlySetting = true;
		// 설정화면의 장치 설정 함수 호출
		setStart();
	});
	// setting에서 취소 버튼 클릭했을때 (이태우)
	document.getElementById('close').addEventListener('click',function(){
		// 입장화면의 장치 설정 함수 호출
		earlySetting = true;
		if(commitRole == 'enter'){
			document.getElementById('playerEnter').style.display = 'block';
			document.getElementById('playerSetting').style.display = 'none';
			// 입장화면의 장치 설정 함수 호출
			entStart();
		}else{
			window.parent.$("#optionScreen").hide();
		}
	});

	// setting에서 적용 버튼 클릭했을때
	document.getElementById('commit').addEventListener('click', function() {
		if ($("#rev1").is(":checked")) {
			videoRev = true;
		} else {
			videoRev = false;
		}
		speakerSelectValue = audioOutputSelect.value;
		audioSelectValue = audioInputSelect.value;
		videoSelectValue = videoSelect.value;
		videoRevValue = videoRev;

		// console.log(commitRole);
		if (commitRole == 'enter') {
			window.parent.$("#optionScreen").show();
			document.getElementById('playerEnter').style.display = 'block';
			document.getElementById('playerSetting').style.display = 'none';
			entStart();
			videoRevMode();
		} else {
			window.parent.settingDeviceSet(speakerSelectValue, audioSelectValue, videoSelectValue, videoRevValue);
		}
		localStorage.setItem("speaker",speakerSelectValue);
		localStorage.setItem("audio",audioSelectValue);
		localStorage.setItem("video",videoSelectValue);
		localStorage.setItem("videoRev",videoRevValue);
	});

	// 입장하기 버튼 클릭했을때
	document.getElementById('enterBtn').addEventListener('click', function() {

		// 카메라 없이 입장 가능하도록 주석 2021-07-21
		// if($("#videoEnter").get(0).paused){
		// 	alert("카메라가 꺼져있습니다. 카메라 장치를 확인해 주세요.");
		// 	return;
		// }
		if(localStorage.length == 0){
			audioOutputValue = speakerSelectValue;
			audioInputValue = audioSelectValue;
			videoSourceValue = videoSelectValue;
			videoRevValue = videoRev;
		}else{
			audioOutputValue = localStorage.getItem("speaker");
			audioInputValue = localStorage.getItem("audio");
			videoSourceValue = localStorage.getItem("video");
			videoRevValue = localStorage.getItem("videoRev");
		}
		commitRole = 'setting';
		// 좌우반전
		$("#playerEnter").empty().remove();
		$("#playerSetting").show();
		
		// 설정안거치고 입장했을때 장치값 default로 설정
		if(audioOutputValue == null){
			audioOutputValue = $("#audio-output:eq(0)").prop("selected", true).val();
		}
		if(audioInputValue == null){
			audioInputValue = $("#audio-input:eq(0)").prop("selected", true).val();
		}
		if(videoSourceValue == null){
			videoSourceValue = $("#video-source:eq(0)").prop("selected", true).val();
		}
		// console.log("입장할때 : " , audioOutputValue , audioInputValue , videoSourceValue , videoRevValue);
		localStorage.setItem("speaker" , audioOutputValue);
		localStorage.setItem("audio" , audioInputValue);
		localStorage.setItem("video" , videoSourceValue);
		localStorage.setItem("videoRev" , videoRevValue);
		//window.parent.enterDeviceSet(audioOutputValue, audioInputValue, videoSourceValue, videoRevValue);

		if (!SERVER_URL) {
			$.ajax({
		    	url: 'https://mdmedia.sobro.co.kr:4000/GetMediaInfo',
		        data: {roomNo: roomNo, userId: userId, managerYn: (userId == managerId) ? "Y" : "N"},
		        type: 'POST',
				dataType: 'json',
				async: false,
		        success: function (data) {
					SERVER_URL = "wss://"+data.DOMAIN+":"+data.PORT+"/janus";
					window.parent.postMessage({
						'type': 'serverUrl',
						'url': SERVER_URL
					}, '*');
		        },
		        error: function (error) {
		             console.error(error)
		        }
			});	
		}

		if (!SERVER_URL){
			// 카운트 처리
			return;
		}
		// 우측 학생 화면에 이름 보여주기
		window.parent.$('#userName').text(userNick);
	});
});

function audioIn(stream) {
	if(!stream){
		return;
	}
	let userStream = stream.clone();

	let videoTrack = userStream.getVideoTracks();
	if (videoTrack.length > 0) {
		userStream.removeTrack(videoTrack[0]);
	}
	let audioInContext = new (window.AudioContext || window.webkitAudioContext)();
	const analyser = audioInContext.createAnalyser();
	const streamNode = audioInContext.createMediaStreamSource(userStream);
	streamNode.connect(analyser);

	inMeter = createAudioMeter(audioInContext);
	streamNode.connect(inMeter);

	inLevelChange();
}

function audioOutVol() {
	let volume = $("#outVol").val();
	volume = (volume / 100).toFixed(2);
	audioElement.volume = volume;
}

function audioOut() {
	let audioOutContext = new (window.AudioContext || window.webkitAudioContext)();
	const analyser = audioOutContext.createAnalyser();
	const captureStream = audioElement.captureStream();
	const streamNode = audioOutContext.createMediaStreamSource(captureStream);
	streamNode.connect(analyser);

	outMeter = createAudioMeter(audioOutContext);
	streamNode.connect(outMeter);

	outLevelChange();
}

// 설정
function getDevices(deviceInfos) {
	// Handles being called several times to update labels. Preserve values.
	const values = selectors.map(select => select.value);
	selectors.forEach(select => {
		while (select.firstChild) {
			select.removeChild(select.firstChild);
		}
	});
	for (let i = 0; i !== deviceInfos.length; ++i) {
		const deviceInfo = deviceInfos[i];
		const option = document.createElement('option');
		option.value = deviceInfo.deviceId;
		if (deviceInfo.kind === 'audioinput') {
			option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
			audioInputSelect.appendChild(option);
		} else if (deviceInfo.kind === 'audiooutput') {
			option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
			audioOutputSelect.appendChild(option);
		} else if (deviceInfo.kind === 'videoinput') {
			option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
			videoSelect.appendChild(option);
		} else {
			//console.log('Some other kind of source/device: ', deviceInfo);
		}
	}
	selectors.forEach((select, selectorIndex) => {
		if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
			select.value = values[selectorIndex];
		}
	});

}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
	if (typeof element.sinkId !== 'undefined') {
		element.setSinkId(sinkId)
			.then(() => {
				//console.log(`Success, audio output device attached: ${sinkId}`);
				if ($("#audio-output-test").hasClass("active")) {
					audioOut();
				}
			})
			.catch(error => {
				let errorMessage = error;
				if (error.name === 'SecurityError') {
					errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
				}
				console.error(errorMessage);
				// Jump back to first output device in the list as it's the default.
				audioOutputSelect.selectedIndex = 0;
			});
	} else {
		//console.warn('Browser does not support output device selection.');
	}
}

function changeAudioDestination() {
	const audioDestination = audioOutputSelect.value;
	attachSinkId(audioElement, audioDestination);
}

// 입장화면의 스트림 설정
function getEntStream(stream) {
	if ($("#audio-input-test").hasClass("active")) {
		audioInTest = true;
		audioIn(stream);
	}
	window.stream = stream; // make stream available to console
	videoEnter.srcObject = stream; // 세팅부분의 video 태그에 스트림 담는다
	// Refresh button list in case labels have become available
	return navigator.mediaDevices.enumerateDevices();
}

// 설정화면의 스트림 설정
function getSetStream(stream) {
	if ($("#audio-input-test").hasClass("active")) {
		audioInTest = true;
		audioIn(stream);
	}
	window.stream = stream; // make stream available to console
	videoSetting.srcObject = stream; // 세팅부분의 video 태그에 스트림 담는다
	myStream = stream;
	// Refresh button list in case labels have become available
	return navigator.mediaDevices.enumerateDevices();
}

// 입장화면의 장치 설정
function entStart() {
	audioInTest = false;
	if (window.stream) {
		window.stream.getTracks().forEach(track => {
			track.stop();
		});
	}
	let constraints;
	if(localStorage.length == 0){
		constraints = {
			speaker: { deviceId: speakerSelectValue ? { exact: speakerSelectValue } : undefined },
			audio: { deviceId: audioSelectValue ? { exact: audioSelectValue } : undefined },
			video: { deviceId: videoSelectValue ? { exact: videoSelectValue } : undefined }
		};
	} else {
		if(userLevel == '1001'){
			constraints = {
				speaker: { deviceId: {exact : localStorage.getItem("speaker")}},
				audio: { deviceId: {exact : localStorage.getItem("audio")}},
				video: { deviceId: {exact : localStorage.getItem("video")},
					width: { min: 640, ideal: 1280, max: 1920 },
					height: { min: 480, ideal: 720, max: 1080 },
					aspectRatio: 16/9
				}
			};
		}else{
			constraints = {
				speaker: { deviceId: {exact : localStorage.getItem("speaker")}},
				audio: { deviceId: {exact : localStorage.getItem("audio")}},
				video: { deviceId: {exact : localStorage.getItem("video")},
					// width: { min: 640, ideal: 640, max: 1920 },
					// height: { min: 360, ideal: 480, max: 1080 }
				}
			};

		}
	}
	console.log('constraints',constraints);
	navigator.mediaDevices.getUserMedia(constraints)
		.then(getEntStream)
		.then(getDevices);
}

// 설정화면의 장치 설정
function setStart() {
	audioInTest = false;
	if (window.stream) {
		window.stream.getTracks().forEach(track => {
			track.stop();
		});
	}
	let speakerSource;
	let audioSource;
	let videoSource;
	if (earlySetting) {
		// 입장화면 설정
		speakerSource = speakerSelectValue;
		audioSource = audioSelectValue;
		videoSource = videoSelectValue;
		earlySetting = false;
		selectSet();
	} else {
		speakerSource = audioOutputSelect.value; // speakerSource는 스피커의 value (처음 입장 런처에서는 default)
		audioSource = audioInputSelect.value; // audioSource는 마이크의 value (처음 입장 런처에서는 default)
		videoSource = videoSelect.value; // videoSource는 비디오의 value
	}

	const constraints = {
		speaker: { deviceId: speakerSource ? { exact: speakerSource } : undefined },
		audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
		video: { deviceId: videoSource ? { exact: videoSource } : undefined }
	};
	// console.log("constraints.video >>> " , constraints.video);
	navigator.mediaDevices.getUserMedia(constraints).then(getSetStream).then(getDevices);
}

function selectSet() {
	if (localStorage.getItem("speaker")) {
		$("#audio-output").val(localStorage.getItem("speaker")).prop("selected", true);
	} else {
		$("#audio-output option:eq(0)").prop("selected", true);
	}
	if (localStorage.getItem("audio")) {
		$("#audio-input").val(localStorage.getItem("audio")).prop("selected", true);
	} else {
		$("#audio-input option:eq(0)").prop("selected", true);
	}
	if (localStorage.getItem("video")) {
		$("#video-source").val(localStorage.getItem("video")).prop("selected", true);
	} else {
		$("#video-source option:eq(0)").prop("selected", true);
	}
	if ((localStorage.getItem("videoRev")==="true")) {
		if (!$("#rev1").is(":checked")) {
			$("#rev1").click();
		}
	} else {
		if ($("#rev1").is(":checked")) {
			$("#rev1").click();
		}
	}
}